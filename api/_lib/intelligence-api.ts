import type {
  IntelligenceBrief,
  StrategyDraftRequestPayload,
} from "../../src/types";
import {
  StrategyRequestError,
  buildExaSearchRequest,
  getExaConfig,
  getKimiConfig,
  parseExaSearchResponse,
  validateStrategyDraftRequest,
} from "./strategy-api";

interface KimiResponse {
  choices?: Array<{
    message?: {
      role?: string;
      content?: string | null;
    };
    finish_reason?: string;
  }>;
  error?: {
    message?: string;
  };
}

type BriefExaResearch = {
  dossier: {
    audienceSignals: string[];
    positioningEdges: string[];
    lowContactChannels: Array<{ channel: string; fit: string; evidence: string; caution: string }>;
    messagePatterns: string[];
    assetDirections: string[];
    experimentLevers: Array<{ experiment: string; rationale: string; successMetric: string }>;
    risks: string[];
  };
  citations: Record<string, Array<{ url: string; title: string; snippet?: string }>>;
};

type BriefPart1 = Pick<IntelligenceBrief, "summary" | "scorecard" | "landscape">;
type BriefPart2 = Pick<IntelligenceBrief, "positioning" | "channels" | "risks" | "timeline" | "resources">;

const CORE_SYSTEM_INSTRUCTIONS = [
  "You are a strategic intelligence analyst synthesizing research into a comprehensive intelligence brief.",
  "You analyze for neurodivergent founders with PDA (Persistent Demand Avoidance) — deep strategic thinkers who find ongoing social maintenance and direct outreach genuinely aversive. This is a hard constraint.",
  "You may also receive persistent ND profile context. Treat it as high-confidence evidence about the founder's working conditions, triggers, pacing, and communication needs. Use it to interpret founder fit, pacing risk, and channel realism.",
  "Be analytical and evidence-based, not prescriptive. Describe what the situation is, not what to do.",
  "Be honest and direct. Do not sugarcoat risks or inflate opportunities.",
  "Ground every claim in the provided research. Name real competitors and channels where evidence supports it. Write for sophisticated founders.",
];

function buildIntelligenceBriefUserMessage(
  payload: StrategyDraftRequestPayload,
  exaResearch: BriefExaResearch,
): string {
  const contentLabel: Record<string, string> = {
    writing: "written content",
    "short-video": "short video",
    audio: "audio or podcast",
    design: "visual or design assets",
    interactive: "interactive tools or diagnostics",
    other: "other format",
    none: "no content creation",
  };

  const contentModes = payload.founderConstraints.contentMode;
  const selectedContentModes = contentModes.filter((mode) => mode !== "other");
  const otherContentMode = payload.founderConstraints.contentModeOther.trim();
  const contentModeText = contentModes.length === 0 || contentModes.includes("none")
    ? "no content creation preferred"
    : [
      ...selectedContentModes.map((m) => contentLabel[m] ?? m),
      ...(contentModes.includes("other") && otherContentMode ? [`other: ${otherContentMode}`] : []),
    ].join(", ");

  const founderProfile = [
    `Audience lens: ${payload.audienceLens}.`,
    `Team size: ${payload.founderConstraints.teamSize}.`,
    `Budget band: ${payload.founderConstraints.budgetBand}.`,
    payload.founderConstraints.weeklyCapacity
      ? `Weekly capacity: ${payload.founderConstraints.weeklyCapacity}.`
      : "",
    `Social posting tolerance: ${payload.founderConstraints.socialPostingTolerance}.`,
    `Outreach tolerance: ${payload.founderConstraints.outreachTolerance}.`,
    payload.founderConstraints.peerCollaborationOk
      ? "Open to peer collaboration."
      : "Not open to peer collaboration.",
    `Content creation mode: ${contentModeText}.`,
    payload.founderConstraints.existingAssets.length > 0
      ? `Existing assets: ${payload.founderConstraints.existingAssets.map((a) => a.name).filter(Boolean).join(", ")}.`
      : "",
    payload.founderConstraints.channelAvoidances
      ? `Channel avoidances: ${payload.founderConstraints.channelAvoidances}.`
      : "",
    payload.ndProfileContext?.summary
      ? `Persistent ND profile context: ${payload.ndProfileContext.summary}`
      : "",
    payload.ndProfileContext?.activationPatterns.length
      ? `Activation patterns: ${payload.ndProfileContext.activationPatterns.join("; ")}.`
      : "",
    payload.ndProfileContext?.shutdownTriggers.length
      ? `Shutdown or avoidance triggers: ${payload.ndProfileContext.shutdownTriggers.join("; ")}.`
      : "",
    payload.ndProfileContext?.unavailablePeriods
      ? `Protected unavailable periods: ${payload.ndProfileContext.unavailablePeriods}.`
      : "",
  ].filter(Boolean).join(" ");

  const phaseContext = payload.phaseResearch.map((phase) => {
    const results = phase.results.map((r) => {
      const hl = r.highlights.slice(0, 3).map((h) => `    - "${h}"`).join("\n");
      return `  - ${r.title} (${r.url})\n${hl}`;
    }).join("\n");
    return `Phase ${phase.phaseId}: ${phase.phaseName}\n${results}`;
  }).join("\n\n");

  const exaContext = [
    "Audience signals:",
    ...exaResearch.dossier.audienceSignals.map((s) => `  - ${s}`),
    "",
    "Positioning edges:",
    ...exaResearch.dossier.positioningEdges.map((s) => `  - ${s}`),
    "",
    "Low-contact channels:",
    ...exaResearch.dossier.lowContactChannels.map((c) =>
      `  - ${c.channel}: ${c.fit}${c.evidence ? ` | Evidence: ${c.evidence}` : ""}${c.caution ? ` | Caution: ${c.caution}` : ""}`
    ),
    "",
    "Message patterns:",
    ...exaResearch.dossier.messagePatterns.map((s) => `  - ${s}`),
    "",
    "Asset directions:",
    ...exaResearch.dossier.assetDirections.map((s) => `  - ${s}`),
    "",
    "Experiment levers:",
    ...exaResearch.dossier.experimentLevers.map((e) => `  - ${e.experiment}: ${e.rationale} | Success metric: ${e.successMetric}`),
    "",
    "Risks:",
    ...exaResearch.dossier.risks.map((s) => `  - ${s}`),
  ].join("\n");

  return [
    `Problem statement: ${payload.problem}`,
    payload.knownPlayers ? `Known players: ${payload.knownPlayers}` : "",
    `Founder profile: ${founderProfile}`,
    "",
    "Phase research:",
    phaseContext || "No Category Scout phase research provided.",
    "",
    "Exa research dossier:",
    exaContext,
  ].filter(Boolean).join("\n");
}

export function buildIntelligenceBriefPromptPart1(
  payload: StrategyDraftRequestPayload,
  exaResearch: BriefExaResearch,
): { system: string; user: string } {
  const schema = JSON.stringify({
    summary: "1-paragraph executive summary synthesizing the entire brief.",
    scorecard: {
      metrics: [
        { label: "Market Opportunity", grade: "high|medium|low", takeaway: "single sharp verdict, max 18 words", evidence: "single evidence line, max 22 words" },
        { label: "Competitive Intensity", grade: "high|medium|low", takeaway: "single sharp verdict, max 18 words", evidence: "single evidence line, max 22 words" },
        { label: "Timing Window", grade: "high|medium|low", takeaway: "single sharp verdict, max 18 words", evidence: "single evidence line, max 22 words" },
        { label: "Founder Fit", grade: "high|medium|low", takeaway: "single sharp verdict, max 18 words", evidence: "single evidence line, max 22 words" },
      ],
    },
    landscape: {
      content: "3-5 paragraphs synthesizing the market landscape. Use markdown formatting for emphasis.",
      callouts: [
        { type: "insight|warning|opportunity", headline: "single sharp callout, max 18 words", support: "optional evidence sentence, max 22 words" },
      ],
    },
  });

  const system = [
    ...CORE_SYSTEM_INSTRUCTIONS,
    "Hard display limits: scorecard metrics and callouts are compact cards, not analysis sections. Do not put multi-sentence or multi-clause analysis into takeaway, evidence, headline, or support. If a point needs more room, put it in landscape.content instead.",
    `Return ONLY a JSON object with this exact structure. Populate every field with substantive, specific content. No markdown code fences, no text outside the JSON:\n${schema}`,
  ].join("\n\n");

  return { system, user: buildIntelligenceBriefUserMessage(payload, exaResearch) };
}

export function buildIntelligenceBriefPromptPart2(
  payload: StrategyDraftRequestPayload,
  exaResearch: BriefExaResearch,
): { system: string; user: string } {
  const schema = JSON.stringify({
    positioning: {
      headers: ["Dimension", "Us", "Competitor A", "Competitor B"],
      rows: [
        { dimension: "...", us: "...", competitorA: "...", competitorB: "...", usSentiment: "positive|neutral|negative" },
      ],
    },
    channels: {
      headers: ["Channel", "Fit Score", "Effort", "Speed", "Evidence", "Verdict"],
      rows: [
        { channel: "...", fitScore: 5, effort: "...", speed: "...", evidence: "...", verdict: "prioritize|test|defer" },
      ],
    },
    risks: {
      risks: [
        { name: "...", impact: "high|medium|low", probability: "high|medium|low", mitigation: "...", level: "critical|watch|managed" },
      ],
    },
    timeline: {
      phases: [
        { name: "...", weeks: "Weeks 1-4", focus: "...", tasks: ["..."] },
      ],
    },
    resources: {
      time: ["..."],
      budget: ["..."],
      tools: ["..."],
      skills: ["..."],
      gaps: ["..."],
    },
  });

  const system = [
    ...CORE_SYSTEM_INSTRUCTIONS,
    `Return ONLY a JSON object with this exact structure. Populate every field with substantive, specific content. No markdown code fences, no text outside the JSON:\n${schema}`,
  ].join("\n\n");

  return { system, user: buildIntelligenceBriefUserMessage(payload, exaResearch) };
}

export function parseIntelligenceBriefPart1(data: KimiResponse): BriefPart1 {
  const message = data.choices?.[0]?.message;
  const text = message?.content || (message as {reasoning_content?: string})?.reasoning_content;
  if (!text || typeof text !== "string") {
    throw new StrategyRequestError(502, data.error?.message || "Kimi response did not include intelligence brief output");
  }

  const parsed = parseIntelligenceJson(text);
  return validateBriefPart1(parsed);
}

export function parseIntelligenceBriefPart2(data: KimiResponse): BriefPart2 {
  const message = data.choices?.[0]?.message;
  const text = message?.content || (message as {reasoning_content?: string})?.reasoning_content;
  if (!text || typeof text !== "string") {
    throw new StrategyRequestError(502, data.error?.message || "Kimi response did not include intelligence brief output");
  }

  const parsed = parseIntelligenceJson(text);
  return validateBriefPart2(parsed);
}

export function mergeIntelligenceBriefParts(part1: BriefPart1, part2: BriefPart2): IntelligenceBrief {
  return {
    generatedAt: new Date().toISOString(),
    summary: part1.summary,
    scorecard: part1.scorecard,
    landscape: part1.landscape,
    positioning: part2.positioning,
    channels: part2.channels,
    risks: part2.risks,
    timeline: part2.timeline,
    resources: part2.resources,
  };
}

export function buildFallbackIntelligenceBriefPart1(
  payload: StrategyDraftRequestPayload,
): BriefPart1 {
  const problem = payload.problem.trim();
  const audience = payload.audienceLens.trim() || "the target audience";

  return {
    summary: `Analysis of ${problem} for ${audience}. The market shows problem-aware demand with several low-contact distribution opportunities. Competitive intensity varies by channel. Founder constraints (team size: ${payload.founderConstraints.teamSize}, budget: ${payload.founderConstraints.budgetBand}) shape viable paths.`,
    scorecard: {
      metrics: [
        { label: "Market Opportunity", grade: "medium", takeaway: `Problem-aware demand exists for ${problem}.`, evidence: "The category is active, but the language is still unsettled." },
        { label: "Competitive Intensity", grade: "medium", takeaway: "Adjacent players exist, but the wedge is still open.", evidence: "Differentiation is possible if the framing stays specific." },
        { label: "Timing Window", grade: "medium", takeaway: "The market is receptive, but urgency is not locked in.", evidence: "Early-mover advantage is available if the category gets named clearly." },
        { label: "Founder Fit", grade: "medium", takeaway: `Feasible channels depend on ${payload.founderConstraints.outreachTolerance} outreach tolerance.`, evidence: `Preferred creation mode is ${payload.founderConstraints.contentMode.join(", ")}.` },
      ],
    },
    landscape: {
      content: `The market for ${problem} is in an early-to-mid formation stage. Problem-aware buyers exist but the category language is not yet settled. This creates an opportunity to define the category narrative before incumbents lock it in.\n\nThe audience (${audience}) is actively searching for solutions but may not have a category name for what they need. This gap between problem awareness and category awareness is the core strategic opportunity.\n\nDistribution channels favor async, discoverable assets over high-touch sales or community-building approaches. Search-led discovery, partner surfaces, and create-once assets align with the founder's constraints and the audience's behavior.`,
      callouts: [
        { type: "insight", headline: `Buyers search for ${problem} using pre-category language.` },
        { type: "opportunity", headline: "Category definition is still available to claim." },
        { type: "warning", headline: "Without a wedge, adjacent offers will force price comparison." },
      ],
    },
  };
}

export function buildFallbackIntelligenceBriefPart2(
  payload: StrategyDraftRequestPayload,
): BriefPart2 {
  const audience = payload.audienceLens.trim() || "the target audience";

  return {
    positioning: {
      headers: ["Dimension", "Us", "Competitor A", "Competitor B"],
      rows: [
        { dimension: "Audience", us: audience, competitorA: "Broad horizontal", competitorB: "Enterprise-focused", usSentiment: "positive" },
        { dimension: "Message", us: "Problem-first, low-contact", competitorA: "Feature-led", competitorB: "Relationship-heavy", usSentiment: "positive" },
        { dimension: "Channel", us: "Async discovery", competitorA: "Sales-led", competitorB: "Community + content", usSentiment: "positive" },
        { dimension: "Pricing", us: "Not specified", competitorA: "Premium", competitorB: "Volume", usSentiment: "neutral" },
        { dimension: "Speed", us: "Asset compounding", competitorA: "Fast if budget", competitorB: "Slow organic", usSentiment: "positive" },
        { dimension: "Credibility", us: "Evidence-led", competitorA: "Brand recognition", competitorB: "Social proof", usSentiment: "neutral" },
      ],
    },
    channels: {
      headers: ["Channel", "Fit Score", "Effort", "Speed", "Evidence", "Verdict"],
      rows: [
        { channel: "SEO / Search-led content", fitScore: 5, effort: "High upfront", speed: "Slow", evidence: "Problem-aware search demand confirmed", verdict: "prioritize" },
        { channel: "Partner / directory surfaces", fitScore: 4, effort: "Medium", speed: "Medium", evidence: "Buyers search directories for solutions", verdict: "prioritize" },
        { channel: "Create-once assets (tools, templates)", fitScore: 5, effort: "High upfront", speed: "Medium", evidence: "Compounding discovery without posting cadence", verdict: "prioritize" },
        { channel: "Newsletter / email", fitScore: 3, effort: "Medium ongoing", speed: "Medium", evidence: "Async but requires consistency", verdict: "test" },
        { channel: "Social media", fitScore: 1, effort: "High ongoing", speed: "Fast", evidence: "Requires daily presence — poor fit for constraints", verdict: "defer" },
        { channel: "Cold outreach", fitScore: 1, effort: "High ongoing", speed: "Fast", evidence: "Directly conflicts with outreach tolerance", verdict: "defer" },
      ],
    },
    risks: {
      risks: [
        { name: "Category confusion", impact: "high", probability: "medium", mitigation: "Invest in clear positioning language early. Define the category before competitors do.", level: "watch" },
        { name: "Slow initial traction", impact: "medium", probability: "high", mitigation: "Set realistic 90-day expectations. Measure learning signals, not just conversions.", level: "watch" },
        { name: "Content creation bottleneck", impact: "medium", probability: "medium", mitigation: "Match asset format to preferred creation mode. Start with one format.", level: "managed" },
        { name: "Competitor response", impact: "high", probability: "low", mitigation: "Move fast on positioning. Build evidence and credibility before incumbents notice.", level: "watch" },
      ],
    },
    timeline: {
      phases: [
        { name: "Foundation", weeks: "Weeks 1-4", focus: "Positioning clarity and first asset", tasks: ["Define audience wedge and positioning language", "Choose primary discovery channel", "Draft first create-once asset", "Set up measurement (analytics, conversion tracking)"] },
        { name: "Validation", weeks: "Weeks 5-8", focus: "Test discovery and messaging", tasks: ["Publish or place first asset", "Monitor search/discovery signals", "Gather feedback from initial inbound", "Refine messaging based on response"] },
        { name: "Acceleration", weeks: "Weeks 9-12", focus: "Double down on what works", tasks: ["Build second asset in proven format", "Expand to secondary channel if first shows signal", "Document learnings for next cycle", "Plan next 90-day phase"] },
      ],
    },
    resources: {
      time: [
        "Weeks 1-4: 10-15 hrs/week (deep work on positioning + asset)",
        "Weeks 5-8: 5-10 hrs/week (monitoring + iteration)",
        "Weeks 9-12: 10-15 hrs/week (second asset + expansion)",
      ],
      budget: [
        "Domain + hosting: ~$50-100/year",
        "Analytics/tools: ~$0-50/month",
        "Design/writing tools: ~$0-30/month",
        "Optional: paid directory listings or partner fees",
      ],
      tools: [
        "Website / landing page builder",
        "Analytics (free tier sufficient)",
        "Content creation tool matching preferred mode",
        "Email capture / newsletter (if testing that channel)",
      ],
      skills: [
        "Strategic writing (positioning, messaging)",
        "Basic SEO / search optimization",
        "Content creation in chosen format",
        "Light analytics interpretation",
      ],
      gaps: [
        "If no existing assets: need to develop first create-once piece",
        "If unfamiliar with SEO: invest 2-3 hours learning basics or use templates",
        "If no measurement setup: prioritize analytics before publishing",
      ],
    },
  };
}

function extractJsonObject(text: string): string {
  const trimmed = text.trim();

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch) {
    return fencedMatch[1].trim();
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  throw new StrategyRequestError(502, "Model output did not contain JSON");
}

function parseIntelligenceJson(text: string): unknown {
  try {
    return JSON.parse(extractJsonObject(text));
  } catch {
    throw new StrategyRequestError(502, "Intelligence brief output was not valid JSON");
  }
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function dedupeSegments(segments: string[]): string[] {
  const seen = new Set<string>();
  return segments.filter((segment) => {
    const key = segment.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function splitIntoSegments(text: string): string[] {
  const normalized = normalizeWhitespace(text);
  if (!normalized) return [];

  const sentenceSegments = dedupeSegments(
    normalized
      .split(/(?<=[.!?])\s+/)
      .map((segment) => segment.trim())
      .filter(Boolean),
  );
  if (sentenceSegments.length > 1) {
    return sentenceSegments;
  }

  const clauseSegments = dedupeSegments(
    normalized
      .split(/(?<=[;:])\s+|(?<=,)\s+(?=[A-Z0-9])/)
      .map((segment) => segment.trim())
      .filter(Boolean),
  );
  if (clauseSegments.length > 1) {
    return clauseSegments;
  }

  if (normalized.length <= 120) {
    return [normalized];
  }

  const words = normalized.split(" ");
  const chunks: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > 110 && current) {
      chunks.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) {
    chunks.push(current);
  }

  return dedupeSegments(chunks);
}

function truncateAtWord(text: string, maxChars: number): string {
  const normalized = normalizeWhitespace(text);
  if (normalized.length <= maxChars) {
    return normalized;
  }

  const truncated = normalized.slice(0, maxChars + 1);
  const lastSpace = truncated.lastIndexOf(" ");
  const base = lastSpace > 40 ? truncated.slice(0, lastSpace) : truncated.slice(0, maxChars);
  return `${base.replace(/[.,;:\s]+$/, "")}…`;
}

function compactSingleLine(text: string, maxChars: number): string {
  const firstSegment = splitIntoSegments(text)[0] ?? normalizeWhitespace(text);
  return truncateAtWord(firstSegment, maxChars);
}

function normalizeNarrative(text: string): string {
  const normalized = text
    .split(/\n\s*\n/)
    .map((paragraph) => normalizeWhitespace(paragraph))
    .filter(Boolean);

  if (normalized.length >= 2) {
    return normalized
      .slice(0, 5)
      .map((paragraph) => truncateAtWord(paragraph, 320))
      .join("\n\n");
  }

  const segments = splitIntoSegments(text);
  if (segments.length === 0) {
    return "";
  }

  const paragraphs: string[] = [];
  for (let i = 0; i < segments.length && paragraphs.length < 5; i += 2) {
    paragraphs.push(truncateAtWord(segments.slice(i, i + 2).join(" "), 320));
  }

  return paragraphs.join("\n\n");
}

function normalizeScorecardMetric(metric: {
  label: BriefPart1["scorecard"]["metrics"][number]["label"];
  grade: BriefPart1["scorecard"]["metrics"][number]["grade"];
  takeaway?: string;
  evidence?: string;
  rationale?: string;
}): BriefPart1["scorecard"]["metrics"][number] {
  const source = normalizeWhitespace(metric.takeaway || metric.rationale || "");
  const sourceSegments = splitIntoSegments(source);
  const evidenceSource = normalizeWhitespace(metric.evidence || sourceSegments.slice(1).join(" "));
  const takeaway = compactSingleLine(sourceSegments[0] || source, 120);
  const evidence = evidenceSource ? compactSingleLine(evidenceSource, 150) : undefined;

  return {
    label: metric.label,
    grade: metric.grade,
    takeaway,
    evidence,
  };
}

function normalizeCallout(callout: {
  type: BriefPart1["landscape"]["callouts"][number]["type"];
  headline?: string;
  support?: string;
  text?: string;
}): BriefPart1["landscape"]["callouts"][number] {
  const source = normalizeWhitespace(callout.headline || callout.text || "");
  const sourceSegments = splitIntoSegments(source);
  const supportSource = normalizeWhitespace(callout.support || sourceSegments.slice(1).join(" "));
  const headline = compactSingleLine(sourceSegments[0] || source, 110);
  const support = supportSource ? compactSingleLine(supportSource, 145) : undefined;

  return {
    type: callout.type,
    headline,
    support,
  };
}

function validateBriefPart1(input: unknown): BriefPart1 {
  const body = expectRecord(input, "Intelligence brief part 1 must be a JSON object");

  const summary = normalizeNarrative(expectString(body.summary, "summary is required"));

  const scorecardInput = expectRecord(body.scorecard, "scorecard is required");
  const metrics = expectArray(scorecardInput.metrics, "scorecard.metrics is required").map((m, i) => {
    const metric = expectRecord(m, `scorecard.metrics[${i}] must be an object`);
    const takeaway = expectOptionalString(metric.takeaway);
    const rationale = expectOptionalString(metric.rationale);
    if (!takeaway && !rationale) {
      throw new StrategyRequestError(400, `scorecard.metrics[${i}] requires takeaway or rationale`);
    }
    return normalizeScorecardMetric({
      label: expectEnum(metric.label, ["Market Opportunity", "Competitive Intensity", "Timing Window", "Founder Fit"], `scorecard.metrics[${i}].label is invalid`),
      grade: expectEnum(metric.grade, ["high", "medium", "low"], `scorecard.metrics[${i}].grade is invalid`),
      takeaway,
      evidence: expectOptionalString(metric.evidence),
      rationale,
    });
  });

  const landscapeInput = expectRecord(body.landscape, "landscape is required");
  const callouts = expectArray(landscapeInput.callouts, "landscape.callouts is required").map((c, i) => {
    const callout = expectRecord(c, `landscape.callouts[${i}] must be an object`);
    const headline = expectOptionalString(callout.headline);
    const text = expectOptionalString(callout.text);
    if (!headline && !text) {
      throw new StrategyRequestError(400, `landscape.callouts[${i}] requires headline or text`);
    }
    return normalizeCallout({
      type: expectEnum(callout.type, ["insight", "warning", "opportunity"], `landscape.callouts[${i}].type is invalid`),
      headline,
      support: expectOptionalString(callout.support),
      text,
    });
  });

  return {
    summary,
    scorecard: { metrics },
    landscape: {
      content: normalizeNarrative(expectString(landscapeInput.content, "landscape.content is required")),
      callouts,
    },
  };
}

function validateBriefPart2(input: unknown): BriefPart2 {
  const body = expectRecord(input, "Intelligence brief part 2 must be a JSON object");

  const positioningInput = expectRecord(body.positioning, "positioning is required");
  const positioningRows = expectArray(positioningInput.rows, "positioning.rows is required").map((r, i) => {
    const row = expectRecord(r, `positioning.rows[${i}] must be an object`);
    return {
      dimension: expectString(row.dimension, `positioning.rows[${i}].dimension is required`),
      us: expectString(row.us, `positioning.rows[${i}].us is required`),
      competitorA: expectString(row.competitorA, `positioning.rows[${i}].competitorA is required`),
      competitorB: expectString(row.competitorB, `positioning.rows[${i}].competitorB is required`),
      usSentiment: expectEnum(row.usSentiment, ["positive", "neutral", "negative"], `positioning.rows[${i}].usSentiment is invalid`),
    };
  });

  const channelsInput = expectRecord(body.channels, "channels is required");
  const channelRows = expectArray(channelsInput.rows, "channels.rows is required").map((r, i) => {
    const row = expectRecord(r, `channels.rows[${i}] must be an object`);
    return {
      channel: expectString(row.channel, `channels.rows[${i}].channel is required`),
      fitScore: expectNumber(row.fitScore, `channels.rows[${i}].fitScore is required`),
      effort: expectString(row.effort, `channels.rows[${i}].effort is required`),
      speed: expectString(row.speed, `channels.rows[${i}].speed is required`),
      evidence: expectString(row.evidence, `channels.rows[${i}].evidence is required`),
      verdict: expectEnum(row.verdict, ["prioritize", "test", "defer"], `channels.rows[${i}].verdict is invalid`),
    };
  });

  const risksInput = expectRecord(body.risks, "risks is required");
  const risks = expectArray(risksInput.risks, "risks.risks is required").map((r, i) => {
    const risk = expectRecord(r, `risks.risks[${i}] must be an object`);
    return {
      name: expectString(risk.name, `risks.risks[${i}].name is required`),
      impact: expectEnum(risk.impact, ["high", "medium", "low"], `risks.risks[${i}].impact is invalid`),
      probability: expectEnum(risk.probability, ["high", "medium", "low"], `risks.risks[${i}].probability is invalid`),
      mitigation: expectString(risk.mitigation, `risks.risks[${i}].mitigation is required`),
      level: expectEnum(risk.level, ["critical", "watch", "managed"], `risks.risks[${i}].level is invalid`),
    };
  });

  const timelineInput = expectRecord(body.timeline, "timeline is required");
  const phases = expectArray(timelineInput.phases, "timeline.phases is required").map((p, i) => {
    const phase = expectRecord(p, `timeline.phases[${i}] must be an object`);
    return {
      name: expectString(phase.name, `timeline.phases[${i}].name is required`),
      weeks: expectString(phase.weeks, `timeline.phases[${i}].weeks is required`),
      focus: expectString(phase.focus, `timeline.phases[${i}].focus is required`),
      tasks: expectStringArray(phase.tasks, `timeline.phases[${i}].tasks is required`),
    };
  });

  const resourcesInput = expectRecord(body.resources, "resources is required");

  return {
    positioning: {
      headers: expectStringArray(positioningInput.headers, "positioning.headers is required"),
      rows: positioningRows,
    },
    channels: {
      headers: expectStringArray(channelsInput.headers, "channels.headers is required"),
      rows: channelRows,
    },
    risks: { risks },
    timeline: { phases },
    resources: {
      time: expectStringArray(resourcesInput.time, "resources.time is required"),
      budget: expectStringArray(resourcesInput.budget, "resources.budget is required"),
      tools: expectStringArray(resourcesInput.tools, "resources.tools is required"),
      skills: expectStringArray(resourcesInput.skills, "resources.skills is required"),
      gaps: expectStringArray(resourcesInput.gaps, "resources.gaps is required"),
    },
  };
}

function expectRecord(input: unknown, message: string): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new StrategyRequestError(400, message);
  }
  return input as Record<string, unknown>;
}

function expectString(input: unknown, message: string): string {
  if (typeof input !== "string") {
    throw new StrategyRequestError(400, message);
  }
  return input.trim();
}

function expectOptionalString(input: unknown): string | undefined {
  if (typeof input !== "string") {
    return undefined;
  }
  const trimmed = input.trim();
  return trimmed ? trimmed : undefined;
}

function expectNumber(input: unknown, message: string): number {
  if (typeof input !== "number" || Number.isNaN(input)) {
    throw new StrategyRequestError(400, message);
  }
  return input;
}

function expectArray(input: unknown, message: string): unknown[] {
  if (!Array.isArray(input)) {
    throw new StrategyRequestError(400, message);
  }
  return input;
}

function expectStringArray(input: unknown, message: string): string[] {
  const arr = expectArray(input, message);
  return arr.map((item, i) => {
    if (typeof item !== "string") {
      throw new StrategyRequestError(400, `${message}[${i}] must be a string`);
    }
    return item.trim();
  });
}

function expectEnum<T extends string>(input: unknown, values: readonly T[], message: string): T {
  if (typeof input !== "string" || !values.includes(input as T)) {
    throw new StrategyRequestError(400, message);
  }
  return input as T;
}

export { buildExaSearchRequest, getExaConfig, getKimiConfig, parseExaSearchResponse, validateStrategyDraftRequest, StrategyRequestError };
