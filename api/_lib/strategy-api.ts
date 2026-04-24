import type {
  FounderConstraints,
  StrategyCitation,
  StrategyDraftRequestPayload,
  StrategyDraftResponse,
  StrategySectionKey,
  StrategySections,
} from "../../src/types";

const SECTION_KEYS: StrategySectionKey[] = [
  "positioning",
  "channelPlan",
  "messageAngles",
  "assetIdeas",
  "experiments",
  "thirtyDaySequence",
];

const EXA_DOSSIER_KEYS = [
  "audienceSignals",
  "positioningEdges",
  "lowContactChannels",
  "messagePatterns",
  "assetDirections",
  "experimentLevers",
  "risks",
] as const;

type ExaDossierKey = typeof EXA_DOSSIER_KEYS[number];

interface ExaChannelRecommendation {
  channel: string;
  fit: string;
  evidence: string;
  caution: string;
}

interface ExaExperimentLever {
  experiment: string;
  rationale: string;
  successMetric: string;
}

export interface ExaResearchDossier {
  audienceSignals: string[];
  positioningEdges: string[];
  lowContactChannels: ExaChannelRecommendation[];
  messagePatterns: string[];
  assetDirections: string[];
  experimentLevers: ExaExperimentLever[];
  risks: string[];
}

interface ExaRawCitation {
  url: string;
  title: string;
  snippet?: string;
}

export type ExaResearchCitations = Partial<Record<ExaDossierKey, ExaRawCitation[]>>;

interface ExaCompletedTask {
  researchId: string;
  status: "completed";
  dossier: ExaResearchDossier;
  citations: ExaResearchCitations;
}

interface ExaPendingTask {
  researchId: string;
  status: "pending" | "running";
}

interface ExaTerminalTask {
  researchId: string;
  status: "failed" | "canceled";
  errorMessage?: string;
}

export type ExaTaskResult = ExaCompletedTask | ExaPendingTask | ExaTerminalTask;

export class StrategyRequestError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function getAnthropicConfig(env: Record<string, string | undefined>) {
  const apiKey = env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new StrategyRequestError(500, "ANTHROPIC_API_KEY not configured");
  }

  return {
    apiKey,
    model: env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
  };
}

export function getExaConfig(env: Record<string, string | undefined>) {
  const apiKey = env.EXA_API_KEY;

  if (!apiKey) {
    throw new StrategyRequestError(500, "EXA_API_KEY not configured");
  }

  return {
    apiKey,
    model: env.EXA_RESEARCH_MODEL || "exa-research-pro",
  };
}

export function validateStrategyDraftRequest(input: unknown): StrategyDraftRequestPayload {
  const body = expectRecord(input, "Request body must be an object");
  const problem = expectNonEmptyString(body.problem, "problem is required");
  const knownPlayers = expectOptionalString(body.knownPlayers);
  const audienceLens = expectNonEmptyString(body.audienceLens, "audienceLens is required");
  const founderConstraints = validateFounderConstraints(body.founderConstraints);
  const phaseResearch = validatePhaseResearch(body.phaseResearch);

  if (phaseResearch.length === 0) {
    throw new StrategyRequestError(400, "phaseResearch must contain at least one completed phase");
  }

  return {
    problem,
    knownPlayers,
    audienceLens,
    founderConstraints,
    phaseResearch,
  };
}

export function validateResearchId(input: unknown): string {
  return expectNonEmptyString(input, "researchId is required");
}

export function buildExaResearchRequest(payload: StrategyDraftRequestPayload, model: string) {
  return {
    model,
    instructions: buildExaResearchInstructions(payload),
    outputSchema: getExaResearchSchema(),
  };
}

export function buildStrategyDraftPrompt(
  payload: StrategyDraftRequestPayload,
  exaResearch: { dossier: ExaResearchDossier; citations: ExaResearchCitations },
) {
  const system = [
    "You are the distribution strategist for Category Scout, a research tool used by neurodivergent founders — specifically people with PDA (Persistent Demand Avoidance) who do deep strategic thinking well but find ongoing social maintenance, direct outreach, and networking genuinely aversive.",
    "This is a hard constraint, not a soft preference.",
    "These founders have real histories of difficult experiences with high-touch client relationships and direct outreach.",
    "The strategy must work without requiring: ongoing social media presence or content cadence, cold outreach or relationship-maintenance sequences, community management or networking events, or any tactic that demands consistent daily or weekly social energy.",
    "Prioritize in this order: (1) create-once/discovered-many assets — SEO content, templates, tools, searchable resources, diagnostics; (2) async pull channels — directories, partner surfaces, problem-aware search, occasional newsletters; (3) warm referral systems that run without active tending; (4) single, bounded, reversible async experiments.",
    "Flag any recommended tactic that requires ongoing social maintenance, outreach cadence, or relationship energy as a warning.",
    "The research below comes from six category design phases. Use each phase's distinct signal type — Phase 01 Problem Cartography: raw customer language before branding, use for messaging and positioning language; Phase 02 Enemy Identification: incumbent approaches being displaced, use for differentiation and old-way framing; Phase 03 Solution Landscape: adjacent players and what is already named, use for white space and positioning; Phase 04 Category Audit: category maturity signals, use for timing and naming decisions; Phase 05 Evidence Mining: proof the problem is real and growing, use for message angles and credibility claims; Phase 06 Language Mining: vocabulary people reach for before knowing a solution exists, use for hooks, asset titles, and SEO terms.",
    "You are also receiving an Exa research dossier with structured web research. Use it for synthesis depth and grounding.",
    "Only cite URLs that appear in the provided evidence packs.",
    "Return JSON only with this exact shape:",
    "{\"sections\":{\"positioning\":\"\",\"channelPlan\":\"\",\"messageAngles\":\"\",\"assetIdeas\":\"\",\"experiments\":\"\",\"thirtyDaySequence\":\"\"},\"warnings\":[\"\"],\"citations\":[{\"section\":\"positioning\",\"title\":\"\",\"url\":\"\",\"note\":\"\"}]}",
    "Section guidance — positioning: who this is for, what tension matters, how to frame the wedge, drawn from problem language and white space in the research.",
    "channelPlan: specific async and pull channels with evidence of fit; flag any channel requiring ongoing maintenance as a caution; shape recommendations around the founder's outreach tolerance and content mode.",
    "messageAngles: hooks and language patterns drawn directly from the research vocabulary and evidence; prioritize language the audience already uses before they know a solution exists.",
    "assetIdeas: create-once assets — templates, tools, teardowns, guides, diagnostics — that compound over time without a posting cadence; match format to the founder's content creation mode.",
    "experiments: single, bounded, async tests — one at a time, clear success signal, low energy cost, no ongoing commitment required.",
    "thirtyDaySequence: a front-loaded sequence of deep work bursts, not a daily content calendar; designed for someone who works in focused sprints and cannot sustain consistent outreach.",
    "Each section should be concise but specific, use markdown bulleting or short paragraphs where helpful, and ground recommendations in the provided research.",
    "Citations must point to source URLs from the evidence pack. Include only citations you actually used.",
  ].join(" ");

  const founderConstraints = {
    ...payload.founderConstraints,
    audienceLens: payload.audienceLens,
  };

  const user = JSON.stringify(
    {
      task: "Draft a low-contact distribution strategy.",
      problem: payload.problem,
      knownPlayers: payload.knownPlayers,
      founderConstraints,
      phaseResearch: payload.phaseResearch,
      exaResearch,
    },
    null,
    2,
  );

  return { system, user };
}

export function parseStrategyDraftText(text: string): StrategyDraftResponse {
  const parsed = JSON.parse(extractJsonObject(text)) as unknown;
  const body = expectRecord(parsed, "Model output must be a JSON object");
  const sectionsRecord = expectRecord(body.sections, "sections must be an object");

  const sections = SECTION_KEYS.reduce((acc, key) => {
    acc[key] = expectOptionalString(sectionsRecord[key]);
    return acc;
  }, {} as StrategySections);

  const warnings = expectStringArray(body.warnings);
  const citations = validateStrategyCitations(body.citations);

  return {
    sections,
    warnings,
    citations,
    generatedAt: new Date().toISOString(),
  };
}

export function parseExaTaskResponse(input: unknown): ExaTaskResult {
  const body = expectRecord(input, "Exa task response must be an object");
  const researchId = expectNonEmptyString(body.researchId, "Exa task response missing researchId");
  const status = expectEnum(
    body.status,
    ["pending", "running", "completed", "failed", "canceled"],
    "Exa task status is invalid",
  );

  if (status === "pending" || status === "running") {
    return {
      researchId,
      status,
    };
  }

  if (status === "failed" || status === "canceled") {
    return {
      researchId,
      status,
      errorMessage: readTaskError(body),
    };
  }

  return {
    researchId,
    status,
    dossier: validateExaResearchDossier(readExaResearchOutput(body)),
    citations: readExaResearchCitations(body),
  };
}

export function mergeStrategyCitations(
  strategyCitations: StrategyCitation[],
  exaCitations: ExaResearchCitations,
): StrategyCitation[] {
  const merged = [...strategyCitations];
  const seen = new Set(merged.map((citation) => `${citation.section}::${citation.url}`));

  for (const [dossierKey, section] of Object.entries(getCitationSectionMap()) as Array<[ExaDossierKey, StrategySectionKey]>) {
    for (const citation of exaCitations[dossierKey] ?? []) {
      const key = `${section}::${citation.url}`;
      if (seen.has(key)) {
        continue;
      }

      merged.push({
        section,
        title: citation.title,
        url: citation.url,
        note: citation.snippet ? trimText(citation.snippet, 180) : undefined,
      });
      seen.add(key);
    }
  }

  return merged;
}

export function mergeStrategyWarnings(warnings: string[], exaDossier: ExaResearchDossier): string[] {
  const merged = [...warnings];
  const seen = new Set(merged.map((warning) => warning.toLowerCase()));

  for (const risk of exaDossier.risks) {
    const key = risk.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    merged.push(risk);
    seen.add(key);
  }

  return merged;
}

function buildExaResearchInstructions(payload: StrategyDraftRequestPayload): string {
  const outreachLabel: Record<string, string> = {
    "inbound-only": "inbound only — no outreach of any kind",
    "warm-intro-ok": "warm introductions only — no cold outreach",
    "async-email-ok": "async cold email acceptable but no calls or social DMs",
  };

  const contentLabel: Record<string, string> = {
    writing: "written content (articles, guides, emails)",
    "short-video": "short video",
    audio: "audio or podcast",
    design: "visual or design assets",
    none: "no content creation preferred",
  };

  const contentModes = payload.founderConstraints.contentMode;
  const contentModeText = contentModes.length === 0 || contentModes.includes("none")
    ? "no content creation preferred"
    : contentModes.map((m) => contentLabel[m] ?? m).join(", ");

  const founderConstraints = [
    `Audience lens: ${payload.audienceLens}.`,
    `Team size: ${payload.founderConstraints.teamSize}.`,
    `Budget band: ${payload.founderConstraints.budgetBand}.`,
    payload.founderConstraints.weeklyCapacity
      ? `Weekly capacity: ${payload.founderConstraints.weeklyCapacity}.`
      : "",
    `Social posting tolerance: ${payload.founderConstraints.socialPostingTolerance}.`,
    `Outreach tolerance: ${outreachLabel[payload.founderConstraints.outreachTolerance] ?? payload.founderConstraints.outreachTolerance}.`,
    `Content creation mode: ${contentModeText}.`,
    payload.founderConstraints.existingCredibility
      ? `Existing credibility assets: ${payload.founderConstraints.existingCredibility}.`
      : "",
    payload.founderConstraints.channelAvoidances
      ? `Avoid these channels or tactics when possible: ${payload.founderConstraints.channelAvoidances}.`
      : "",
  ].filter(Boolean).join(" ");

  const seedContext = buildSeedContext(payload);

  return trimText([
    "Research a grounded low-contact distribution strategy for the company context below.",
    `Problem statement: ${payload.problem}.`,
    payload.knownPlayers ? `Known players or incumbents: ${payload.knownPlayers}.` : "",
    founderConstraints,
    "Use the seed research below as orientation, but independently search the web for stronger evidence, adjacent tactics, and corroborating sources.",
    "Prioritize channels, assets, and experiments that can work for a founder or small team with low tolerance for networking, community dependence, or frequent social posting.",
    "Find evidence about audience behavior, async discovery channels, searchable assets, directories, partner surfaces, newsletters, SEO, problem-aware content, and quiet credibility mechanisms.",
    "Avoid generic high-social advice unless the evidence clearly indicates it and you explicitly mark it as a poor fit or stretch path.",
    "Return structured output that is specific, evidence-grounded, and directly useful for follow-on strategy drafting.",
    `Seed research:\n${seedContext}`,
  ].filter(Boolean).join("\n\n"), 4096);
}

function buildSeedContext(payload: StrategyDraftRequestPayload): string {
  const phaseLines = payload.phaseResearch.map((phase) => {
    const seedResults = phase.results.slice(0, 2).map((result) => {
      const highlight = result.highlights[0] ? ` — highlight: "${trimText(result.highlights[0], 180)}"` : "";
      return `- ${result.title} (${result.url})${highlight}`;
    }).join("\n");

    return `Phase ${String(phase.phaseId).padStart(2, "0")} ${phase.phaseName}\n${seedResults}`;
  });

  return trimText(phaseLines.join("\n\n"), 2200);
}

function getExaResearchSchema() {
  return {
    type: "object",
    required: EXA_DOSSIER_KEYS,
    properties: {
      audienceSignals: {
        type: "array",
        items: { type: "string" },
      },
      positioningEdges: {
        type: "array",
        items: { type: "string" },
      },
      lowContactChannels: {
        type: "array",
        items: {
          type: "object",
          required: ["channel", "fit", "evidence", "caution"],
          properties: {
            channel: { type: "string" },
            fit: { type: "string" },
            evidence: { type: "string" },
            caution: { type: "string" },
          },
          additionalProperties: false,
        },
      },
      messagePatterns: {
        type: "array",
        items: { type: "string" },
      },
      assetDirections: {
        type: "array",
        items: { type: "string" },
      },
      experimentLevers: {
        type: "array",
        items: {
          type: "object",
          required: ["experiment", "rationale", "successMetric"],
          properties: {
            experiment: { type: "string" },
            rationale: { type: "string" },
            successMetric: { type: "string" },
          },
          additionalProperties: false,
        },
      },
      risks: {
        type: "array",
        items: { type: "string" },
      },
    },
    additionalProperties: false,
  };
}

function validateFounderConstraints(input: unknown): FounderConstraints {
  const body = expectRecord(input, "founderConstraints is required");
  const teamSize = expectEnum(body.teamSize, ["solo", "small-team"], "teamSize is invalid");
  const budgetBand = expectEnum(body.budgetBand, ["none", "low", "moderate"], "budgetBand is invalid");
  const weeklyCapacity = expectOptionalString(body.weeklyCapacity);
  const socialPostingTolerance = expectEnum(
    body.socialPostingTolerance,
    ["avoid", "limited", "comfortable"],
    "socialPostingTolerance is invalid",
  );
  const channelAvoidances = expectOptionalString(body.channelAvoidances);
  const outreachTolerance = expectEnum(
    body.outreachTolerance,
    ["inbound-only", "warm-intro-ok", "async-email-ok"],
    "outreachTolerance is invalid",
  );
  const contentMode = expectEnumArray(
    body.contentMode,
    ["writing", "short-video", "audio", "design", "none"] as const,
    "contentMode is invalid",
  );
  const existingCredibility = expectOptionalString(body.existingCredibility);

  return {
    teamSize,
    budgetBand,
    weeklyCapacity,
    socialPostingTolerance,
    channelAvoidances,
    outreachTolerance,
    contentMode,
    existingCredibility,
  };
}

function validatePhaseResearch(input: unknown) {
  if (!Array.isArray(input)) {
    throw new StrategyRequestError(400, "phaseResearch is required");
  }

  return input.map((item, index) => {
    const body = expectRecord(item, `phaseResearch[${index}] must be an object`);
    const resultsInput = body.results;

    if (!Array.isArray(resultsInput) || resultsInput.length === 0) {
      throw new StrategyRequestError(400, `phaseResearch[${index}].results must contain at least one result`);
    }

    return {
      phaseId: expectNumber(body.phaseId, `phaseResearch[${index}].phaseId is required`),
      phaseName: expectNonEmptyString(body.phaseName, `phaseResearch[${index}].phaseName is required`),
      description: expectOptionalString(body.description),
      results: resultsInput.map((result, resultIndex) => {
        const resultBody = expectRecord(result, `phaseResearch[${index}].results[${resultIndex}] must be an object`);
        const highlightsInput = resultBody.highlights;

        if (!Array.isArray(highlightsInput)) {
          throw new StrategyRequestError(
            400,
            `phaseResearch[${index}].results[${resultIndex}].highlights must be an array`,
          );
        }

        return {
          title: expectNonEmptyString(
            resultBody.title,
            `phaseResearch[${index}].results[${resultIndex}].title is required`,
          ),
          url: expectNonEmptyString(
            resultBody.url,
            `phaseResearch[${index}].results[${resultIndex}].url is required`,
          ),
          score: expectOptionalNumber(resultBody.score),
          publishedDate: expectOptionalString(resultBody.publishedDate),
          highlights: highlightsInput.map((highlight, highlightIndex) =>
            expectOptionalString(
              highlight,
              `phaseResearch[${index}].results[${resultIndex}].highlights[${highlightIndex}] must be a string`,
            ),
          ),
        };
      }),
    };
  });
}

function validateStrategyCitations(input: unknown) {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.map((item, index) => {
    const body = expectRecord(item, `citations[${index}] must be an object`);

    return {
      section: expectEnum(body.section, SECTION_KEYS, `citations[${index}].section is invalid`),
      title: expectNonEmptyString(body.title, `citations[${index}].title is required`),
      url: expectNonEmptyString(body.url, `citations[${index}].url is required`),
      note: expectOptionalString(body.note),
    };
  });
}

function validateExaResearchDossier(input: unknown): ExaResearchDossier {
  const body = expectRecord(input, "Completed Exa task did not include research data");

  return {
    audienceSignals: expectArrayOfStrings(body.audienceSignals, "audienceSignals must be an array of strings"),
    positioningEdges: expectArrayOfStrings(body.positioningEdges, "positioningEdges must be an array of strings"),
    lowContactChannels: expectArray(body.lowContactChannels, "lowContactChannels must be an array").map((item, index) => {
      const channel = expectRecord(item, `lowContactChannels[${index}] must be an object`);
      return {
        channel: expectNonEmptyString(channel.channel, `lowContactChannels[${index}].channel is required`),
        fit: expectNonEmptyString(channel.fit, `lowContactChannels[${index}].fit is required`),
        evidence: expectNonEmptyString(channel.evidence, `lowContactChannels[${index}].evidence is required`),
        caution: expectNonEmptyString(channel.caution, `lowContactChannels[${index}].caution is required`),
      };
    }),
    messagePatterns: expectArrayOfStrings(body.messagePatterns, "messagePatterns must be an array of strings"),
    assetDirections: expectArrayOfStrings(body.assetDirections, "assetDirections must be an array of strings"),
    experimentLevers: expectArray(body.experimentLevers, "experimentLevers must be an array").map((item, index) => {
      const lever = expectRecord(item, `experimentLevers[${index}] must be an object`);
      return {
        experiment: expectNonEmptyString(lever.experiment, `experimentLevers[${index}].experiment is required`),
        rationale: expectNonEmptyString(lever.rationale, `experimentLevers[${index}].rationale is required`),
        successMetric: expectNonEmptyString(lever.successMetric, `experimentLevers[${index}].successMetric is required`),
      };
    }),
    risks: expectArrayOfStrings(body.risks, "risks must be an array of strings"),
  };
}

function validateExaResearchCitations(input: unknown): ExaResearchCitations {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {};
  }

  const body = input as Record<string, unknown>;
  const citations: ExaResearchCitations = {};

  for (const key of EXA_DOSSIER_KEYS) {
    const entry = body[key];
    if (!Array.isArray(entry)) {
      continue;
    }

    citations[key] = entry.map((item, index) => {
      const citation = expectRecord(item, `${key}[${index}] citation must be an object`);
      return {
        url: expectNonEmptyString(citation.url, `${key}[${index}].url is required`),
        title: expectNonEmptyString(citation.title, `${key}[${index}].title is required`),
        snippet: expectOptionalString(citation.snippet),
      };
    });
  }

  return citations;
}

function readExaResearchOutput(body: Record<string, unknown>): unknown {
  if ("data" in body) {
    return body.data;
  }

  const output = body.output;
  if (!output || typeof output !== "object" || Array.isArray(output)) {
    return output;
  }

  const outputRecord = output as Record<string, unknown>;
  return "content" in outputRecord ? outputRecord.content : outputRecord;
}

function readExaResearchCitations(body: Record<string, unknown>): ExaResearchCitations {
  const citations = validateExaResearchCitations(body.citations);
  const groundingCitations = readGroundingCitations(body.output);

  for (const key of EXA_DOSSIER_KEYS) {
    const seen = new Set((citations[key] ?? []).map((citation) => citation.url));
    for (const citation of groundingCitations[key] ?? []) {
      if (seen.has(citation.url)) {
        continue;
      }

      citations[key] = [...(citations[key] ?? []), citation];
      seen.add(citation.url);
    }
  }

  return citations;
}

function readGroundingCitations(output: unknown): ExaResearchCitations {
  if (!output || typeof output !== "object" || Array.isArray(output)) {
    return {};
  }

  const grounding = (output as Record<string, unknown>).grounding;
  if (!Array.isArray(grounding)) {
    return {};
  }

  const citations: ExaResearchCitations = {};

  for (const item of grounding) {
    const body = item && typeof item === "object" && !Array.isArray(item)
      ? item as Record<string, unknown>
      : null;
    const key = typeof body?.field === "string" ? getDossierKeyFromGroundingField(body.field) : null;
    if (!key || !Array.isArray(body?.citations)) {
      continue;
    }

    for (const citationInput of body.citations) {
      const citation = readGroundingCitation(citationInput);
      if (!citation) {
        continue;
      }

      citations[key] = [...(citations[key] ?? []), citation];
    }
  }

  return citations;
}

function getDossierKeyFromGroundingField(field: string): ExaDossierKey | null {
  return EXA_DOSSIER_KEYS.find((key) =>
    field === key || field.startsWith(`${key}.`) || field.startsWith(`${key}[`),
  ) ?? null;
}

function readGroundingCitation(input: unknown): ExaRawCitation | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return null;
  }

  const body = input as Record<string, unknown>;
  if (typeof body.url !== "string" || body.url.trim().length === 0) {
    return null;
  }

  const title = typeof body.title === "string" && body.title.trim().length > 0
    ? body.title.trim()
    : body.url.trim();
  const snippet = typeof body.snippet === "string" ? body.snippet.trim() : "";

  return {
    url: body.url.trim(),
    title,
    ...(snippet ? { snippet } : {}),
  };
}

function getCitationSectionMap(): Record<ExaDossierKey, StrategySectionKey> {
  return {
    audienceSignals: "positioning",
    positioningEdges: "positioning",
    lowContactChannels: "channelPlan",
    messagePatterns: "messageAngles",
    assetDirections: "assetIdeas",
    experimentLevers: "experiments",
    risks: "thirtyDaySequence",
  };
}

function readTaskError(body: Record<string, unknown>): string | undefined {
  const error = body.error;

  if (!error || typeof error !== "object" || Array.isArray(error)) {
    return undefined;
  }

  const record = error as Record<string, unknown>;
  const message = record.message;

  return typeof message === "string" ? message : undefined;
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

function expectRecord(input: unknown, message: string): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new StrategyRequestError(400, message);
  }

  return input as Record<string, unknown>;
}

function expectArray(input: unknown, message: string): unknown[] {
  if (!Array.isArray(input)) {
    throw new StrategyRequestError(400, message);
  }

  return input;
}

function expectNonEmptyString(input: unknown, message: string): string {
  if (typeof input !== "string" || input.trim().length === 0) {
    throw new StrategyRequestError(400, message);
  }

  return input.trim();
}

function expectOptionalString(input: unknown, message?: string): string {
  if (input == null) {
    return "";
  }

  if (typeof input !== "string") {
    throw new StrategyRequestError(400, message ?? "Expected string");
  }

  return input.trim();
}

function expectStringArray(input: unknown): string[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.map((item, index) =>
    expectOptionalString(item, `warnings[${index}] must be a string`),
  ).filter(Boolean);
}

function expectArrayOfStrings(input: unknown, message: string): string[] {
  return expectArray(input, message).map((item, index) =>
    expectOptionalString(item, `${message} at index ${index}`),
  ).filter(Boolean);
}

function expectNumber(input: unknown, message: string): number {
  if (typeof input !== "number" || Number.isNaN(input)) {
    throw new StrategyRequestError(400, message);
  }

  return input;
}

function expectOptionalNumber(input: unknown): number | undefined {
  if (input == null) {
    return undefined;
  }

  if (typeof input !== "number" || Number.isNaN(input)) {
    throw new StrategyRequestError(400, "Expected number");
  }

  return input;
}

function expectEnum<T extends string>(input: unknown, values: readonly T[], message: string): T {
  if (typeof input !== "string" || !values.includes(input as T)) {
    throw new StrategyRequestError(400, message);
  }

  return input as T;
}

function expectEnumArray<T extends string>(input: unknown, values: readonly T[], message: string): T[] {
  if (!Array.isArray(input)) {
    throw new StrategyRequestError(400, message);
  }

  return input.map((item) => expectEnum(item, values, message));
}

function trimText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}
