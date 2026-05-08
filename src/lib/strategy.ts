import { PHASES } from "../phases";
import { SHUTDOWN_LABELS } from "./nd-profile";
import type {
  CondensedPhaseResearch,
  ExaResult,
  FounderConstraints,
  NDProfile,
  NDProfileContext,
  PhaseResult,
  SessionState,
  StrategyInputs,
  StrategyDraft,
  StrategySectionKey,
  StrategySections,
  StrategySectionsProse,
  StrategySectionsStructured,
  StrategySectionContent,
} from "../types";

export function isStructuredSections(s: StrategySections): s is StrategySectionsStructured {
  const first = s.positioning;
  return typeof first === "object" && first !== null && "summary" in first;
}

function extractSectionText(val: string | StrategySectionContent): string {
  if (typeof val === "string") return val;
  const recs = val.recommendations
    .map((r) => `- ${r.text}${r.why ? `\n  _${r.why}_` : ""}`)
    .join("\n");
  return val.summary + (recs ? "\n\n" + recs : "");
}

export const STRATEGY_SECTIONS: Array<{
  key: StrategySectionKey;
  label: string;
  hint: string;
}> = [
  {
    key: "positioning",
    label: "Positioning",
    hint: "Who this is for and what you're displacing. The frame everything else hangs on.",
  },
  {
    key: "channelPlan",
    label: "Channel Plan",
    hint: "Where to show up without showing up constantly. Channels that work while you're not watching.",
  },
  {
    key: "messageAngles",
    label: "Message Angles",
    hint: "What you say and how — drawn from how the audience already talks about the problem.",
  },
  {
    key: "assetIdeas",
    label: "Asset Ideas",
    hint: "Things to build once that do the discovery work for you.",
  },
  {
    key: "experiments",
    label: "Experiments",
    hint: "One thing to test. Small, bounded, with a clear signal.",
  },
  {
    key: "thirtyDaySequence",
    label: "30-Day Sequence",
    hint: "What to actually do this month — built for focused sprints, not a daily calendar.",
  },
];

export function createEmptyStrategyInputs(): StrategyInputs {
  return {
    audienceLens: "",
    teamSize: "solo",
    budgetBand: "low",
    weeklyCapacity: "",
    socialPostingTolerance: "avoid",
    channelAvoidances: "",
    outreachTolerance: "inbound-only",
    peerCollaborationOk: false,
    contentMode: ["writing"],
    contentModeOther: "",
    existingAssets: [{ name: "", url: "", description: "" }],
    previousAttempts: "",
    avoidanceTasks: "",
    activationWindows: "",
    unavailablePeriods: "",
  };
}

export function getCompletedResearchCount(phases: Record<number, PhaseResult>): number {
  return Object.values(phases).filter((phase) => phase.status === "done").length;
}

export function getStrategyReadiness(phases: Record<number, PhaseResult>) {
  const doneCount = getCompletedResearchCount(phases);

  const SUGGESTED_PHASES = [
    { id: 1, label: "Problem Cartography", rationale: "Raw customer language — messaging won't sound right without this" },
    { id: 3, label: "Solution Landscape", rationale: "White space context — positioning is guesswork without this" },
    { id: 5, label: "Evidence Mining", rationale: "Proof the problem is real — strengthens every section" },
  ];

  const missingSuggested = SUGGESTED_PHASES.filter((p) => {
    const phase = phases[p.id];
    return phase?.status !== "done" || phase.results.length === 0;
  });

  const canGenerate = true;
  const confidence: "partial" | "strong" = doneCount >= 4 && missingSuggested.length === 0 ? "strong" : "partial";

  return { canGenerate, doneCount, missingSuggested, confidence };
}

export function condensePhaseResearch(
  phases: Record<number, PhaseResult>,
  maxResults = 5,
  maxHighlights = 2,
): CondensedPhaseResearch[] {
  return PHASES.flatMap((phase) => {
    const result = phases[phase.id];

    if (!result || result.status !== "done" || result.results.length === 0) {
      return [];
    }

    return [{
      phaseId: phase.id,
      phaseName: phase.name,
      description: phase.description,
      results: result.results.slice(0, maxResults).map((item) => ({
        title: item.title || item.url,
        url: item.url,
        score: item.score,
        publishedDate: item.publishedDate,
        highlights: (item.highlights ?? []).slice(0, maxHighlights),
      })),
    }];
  });
}

export function getStrategyFingerprint(args: {
  problem: string;
  knownPlayers: string;
  phases: Record<number, PhaseResult>;
  strategyInputs: StrategyInputs;
  ndProfileContext?: NDProfileContext | null;
}): string {
  return JSON.stringify({
    problem: args.problem.trim(),
    knownPlayers: args.knownPlayers.trim(),
    strategyInputs: normalizeStrategyInputs(args.strategyInputs),
    ndProfileContext: args.ndProfileContext ?? null,
    phaseResearch: condensePhaseResearch(args.phases),
  });
}

export function buildStrategyMarkdown(session: SessionState): string {
  const { strategyDraft, strategyInputs } = session;

  if (!hasCompleteStrategyDraft(strategyDraft)) {
    return "";
  }

  const lines = [
    "# Category Scout Distribution Strategy",
    `**Problem:** ${session.problem}`,
    session.knownPlayers ? `**Known Players:** ${session.knownPlayers}` : "",
    `**Audience Lens:** ${strategyInputs.audienceLens || "Not specified"}`,
    `**Team Size:** ${humanizeValue(strategyInputs.teamSize)}`,
    `**Budget Band:** ${humanizeValue(strategyInputs.budgetBand)}`,
    `**Weekly Capacity:** ${strategyInputs.weeklyCapacity || "Not specified"}`,
    `**Social Posting Tolerance:** ${humanizeValue(strategyInputs.socialPostingTolerance)}`,
    strategyInputs.channelAvoidances
      ? `**Channel Avoidances:** ${strategyInputs.channelAvoidances}`
      : "",
    `**Generated:** ${new Date(strategyDraft.generatedAt).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })}`,
    "",
  ];

  if (strategyDraft.warnings.length > 0) {
    lines.push("## Warnings", "");
    for (const warning of strategyDraft.warnings) {
      lines.push(`- ${warning}`);
    }
    lines.push("");
  }

  for (const section of STRATEGY_SECTIONS) {
    const val = strategyDraft.sections[section.key];
    lines.push(`## ${section.label}`, "", extractSectionText(val as string | StrategySectionContent) || "_Not yet written_", "");
  }

  if (strategyDraft.citations.length > 0) {
    lines.push("## Evidence Appendix", "");
    for (const citation of strategyDraft.citations) {
      const label = STRATEGY_SECTIONS.find((section) => section.key === citation.section)?.label ?? citation.section;
      lines.push(
        `- **${label}:** [${citation.title}](${citation.url})${citation.note ? ` - ${citation.note}` : ""}`,
      );
    }
  }

  return lines.filter(Boolean).join("\n");
}

export function syncStrategyDirtyState(session: SessionState, ndProfileContext?: NDProfileContext | null): SessionState {
  if (!hasCompleteStrategyDraft(session.strategyDraft) || !session.strategySourceFingerprint) {
    return {
      ...session,
      strategyDirty: false,
    };
  }

  const nextFingerprint = getStrategyFingerprint({
    problem: session.problem,
    knownPlayers: session.knownPlayers,
    phases: session.phases,
    strategyInputs: session.strategyInputs,
    ndProfileContext,
  });

  return {
    ...session,
    strategyDirty: session.strategySourceFingerprint !== nextFingerprint,
  };
}

export function applyNDProfileDefaults(inputs: StrategyInputs, profile: NDProfile | null): StrategyInputs {
  if (!profile) {
    return inputs;
  }

  const shutdownTriggers = [
    ...profile.shutdown.triggers
      .filter((trigger) => trigger !== "other")
      .map((trigger) => SHUTDOWN_LABELS[trigger]),
    ...(profile.shutdown.triggerOther.trim() ? [profile.shutdown.triggerOther.trim()] : []),
  ];

  const channelAvoidanceHints = shutdownTriggers.filter((trigger) =>
    ["Cold outreach", "Live calls", "Posting on social media"].some((label) => trigger.startsWith(label)),
  );

  const previousAttemptParts = [
    profile.history.triedSystems.trim() ? `Tried: ${profile.history.triedSystems.trim()}` : "",
    profile.history.whatWorked.trim() ? `Worked: ${profile.history.whatWorked.trim()}` : "",
    profile.history.whatFailed.trim() ? `Fell apart: ${profile.history.whatFailed.trim()}` : "",
  ].filter(Boolean);

  const avoidanceParts = [
    shutdownTriggers.length > 0 ? `Known triggers: ${shutdownTriggers.join("; ")}` : "",
    profile.shutdown.shutdownDescription.trim()
      ? `What shutdown looks like: ${profile.shutdown.shutdownDescription.trim()}`
      : "",
  ].filter(Boolean);

  return {
    ...inputs,
    channelAvoidances: inputs.channelAvoidances.trim() || channelAvoidanceHints.join(", "),
    previousAttempts: inputs.previousAttempts?.trim() || previousAttemptParts.join(" "),
    avoidanceTasks: inputs.avoidanceTasks?.trim() || avoidanceParts.join(" "),
    activationWindows: inputs.activationWindows?.trim() || profile.timeEnergy.activationWindows.trim(),
    unavailablePeriods: inputs.unavailablePeriods?.trim() || profile.timeEnergy.unavailablePeriods.trim(),
  };
}

export function hasCompleteStrategyDraft(draft: StrategyDraft | null | undefined): draft is StrategyDraft {
  if (!draft) {
    return false;
  }

  return STRATEGY_SECTIONS.every((section) => {
    const val = draft.sections?.[section.key];
    if (typeof val === "string") return val.trim().length > 0;
    if (typeof val === "object" && val !== null) return typeof (val as StrategySectionContent).summary === "string" && (val as StrategySectionContent).summary.trim().length > 0;
    return false;
  });
}

export function summarizeResultSource(result: ExaResult): string {
  try {
    return new URL(result.url).hostname.replace(/^www\./, "");
  } catch {
    return result.url;
  }
}

export function normalizeFounderConstraints(constraints: FounderConstraints): FounderConstraints {
  return {
    teamSize: constraints.teamSize,
    budgetBand: constraints.budgetBand,
    weeklyCapacity: constraints.weeklyCapacity.trim(),
    socialPostingTolerance: constraints.socialPostingTolerance,
    channelAvoidances: constraints.channelAvoidances.trim(),
    outreachTolerance: constraints.outreachTolerance,
    peerCollaborationOk: constraints.peerCollaborationOk,
    contentMode: constraints.contentMode,
    contentModeOther: constraints.contentModeOther.trim(),
    existingAssets: normalizeExistingAssets(constraints.existingAssets),
    previousAttempts: constraints.previousAttempts?.trim() ?? "",
    avoidanceTasks: constraints.avoidanceTasks?.trim() ?? "",
    activationWindows: constraints.activationWindows?.trim() ?? "",
    unavailablePeriods: constraints.unavailablePeriods?.trim() ?? "",
  };
}

export function normalizeStrategyInputs(inputs: StrategyInputs): StrategyInputs {
  return {
    audienceLens: inputs.audienceLens.trim(),
    ...normalizeFounderConstraints(inputs),
  };
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

  return normalized ? [normalized] : [];
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
  const normalizedParagraphs = text
    .split(/\n\s*\n/)
    .map((paragraph) => normalizeWhitespace(paragraph))
    .filter(Boolean);

  if (normalizedParagraphs.length >= 2) {
    return normalizedParagraphs
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

function compactSectionSummary(text: string): string {
  const normalizedParagraphs = text
    .split(/\n\s*\n/)
    .map((paragraph) => normalizeWhitespace(paragraph))
    .filter(Boolean);

  if (normalizedParagraphs.length > 0) {
    return truncateAtWord(normalizedParagraphs[0], 220);
  }

  const segments = splitIntoSegments(text);
  if (segments.length === 0) {
    return "";
  }

  return truncateAtWord(segments.slice(0, 2).join(" "), 220);
}

export function normalizeStrategyDraft(draft: StrategyDraft): StrategyDraft {
  const sections = isStructuredSections(draft.sections)
    ? STRATEGY_SECTIONS.reduce((acc, section) => {
      const current = (draft.sections as StrategySectionsStructured)[section.key];
      acc[section.key] = {
        summary: compactSectionSummary(current.summary || ""),
        recommendations: current.recommendations
          .map((recommendation) => ({
            ...recommendation,
            text: compactSingleLine(recommendation.text || "", 170),
            why: recommendation.why ? compactSingleLine(recommendation.why, 170) : "",
          }))
          .filter((recommendation) => recommendation.text),
        callouts: current.callouts
          .map((callout) => ({
            ...callout,
            text: compactSingleLine(callout.text || "", 150),
          }))
          .filter((callout) => callout.text),
      };
      return acc;
    }, {} as StrategySectionsStructured)
    : STRATEGY_SECTIONS.reduce((acc, section) => {
      acc[section.key] = normalizeNarrative((draft.sections as StrategySectionsProse)[section.key] || "");
      return acc;
    }, {} as StrategySectionsProse);

  return {
    ...draft,
    sections,
    warnings: draft.warnings.map((warning) => compactSingleLine(warning, 170)).filter(Boolean),
    scorecard: draft.scorecard
      ? {
        metrics: draft.scorecard.metrics.map((metric) => ({
          ...metric,
          rationale: compactSingleLine(metric.rationale || "", 140),
        })),
      }
      : undefined,
  };
}

function humanizeValue(value: string): string {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeExistingAssets(assets: FounderConstraints["existingAssets"]) {
  return assets.map((asset) => ({
    name: asset.name.trim(),
    url: asset.url.trim(),
    description: asset.description.trim(),
  }));
}

const AGENT_BRIEF_PREAMBLE = `This is a distribution strategy for a PDA-neurodivergent founder. Treat it as a *living plan*, not a one-time execution list.

The founder cannot sustain pushed demands. Surface relevant moves as **invitations, not assignments**. Expect to engage with this strategy across batched work sessions separated by ambient quiet — not as a daily task queue. When the founder returns to distribution work, orient them to where they are in the plan and what's available, rather than presenting a list.

Key expectations of the receiving agent:

1. **Respect hard constraints** (listed below). Do not suggest moves that violate them, even if the strategy evolves.
2. **Surface one thing at a time** during active distribution work. Never present a full sequence as a to-do list.
3. **Track outcomes.** When the founder engages with a move, log what was tried, what happened, what was dropped. Update this brief over time.
4. **Flag staleness.** When accumulated outcomes indicate the strategy is drifting from reality, suggest the founder regenerate from Category Scout with updated context.
5. **Integrate with the founder's own system.** The founder already has a working rhythm; map the strategy's execution shape onto that rhythm without imposing a new one.

**Session check-in — ask at the start of every session, before surfacing anything:**

1. What's actually available today? (not the weekly average — what's genuinely here right now?)
2. What mode are you in? Thinking (exploring options), deciding (ready to choose), executing (ready to act), or Not today (rest is planned, not failure)?
3. What changed since last time? (anything completed, dropped, or shifted?)

Match what you surface to the mode. Thinking → explore one option and its tradeoffs. Deciding → present the single choice that opens the next phase. Executing → surface the one next action. Not today → close the session without pressure. Nothing else until the current move is closed.`;

const AGENT_BRIEF_HARD_CONSTRAINTS = `- Low-contact is a hard constraint, not a preference. Do not propose high-touch outreach regardless of perceived opportunity.
- Create-once over do-again. Favor assets that compound without maintenance over recurring tasks.
- No demand stacking. One focus at a time.
- Respect stated channel avoidances without exception.`;

const AGENT_BRIEF_EXECUTION_SHAPE = `How this strategy wants to be *paced*, independent of any specific weekly rhythm:

- **Batched bursts.** Execution work happens in concentrated sessions, not distributed across days. The founder can accomplish several strategy items in one focused sitting; that is preferred over spreading them thin.
- **Ambient quiet between bursts.** Between work sessions, do not surface pending items. Previously-built assets continue working in the background; the founder is not "behind."
- **Invitation register.** All surfacing language should be optional ("there's an X queued — want to start it?"), not imperative.
- **One thing visible at a time.** When the founder is actively engaged with the strategy, show a single move, not a list. The next move comes after the current one is closed (completed, dropped, or deferred).

Map this shape onto the founder's existing operating rhythm. Do not impose a specific cadence.

If the founder doesn't return for a session or more, treat silence as planned rest — not drift or abandonment. Don't resume with pressure or status checks. Resume where you left off when they return.`;

const AGENT_BRIEF_EVOLUTION_PROTOCOL = `When the founder engages with this strategy:

1. **Log outcomes** against specific moves. What was tried, what happened, what was dropped.
2. **Surface staleness** when accumulated outcomes indicate the strategy is drifting. Suggest regeneration from Category Scout rather than attempting to rewrite internally.
3. **Preserve the founder's edits.** If the founder has edited strategy sections inside Category Scout, those represent deliberate decisions. Do not silently replace them when regenerating.`;

const AGENT_BRIEF_FIRST_SESSION_PROTOCOL = `This brief contains the strategy layer generated by Category Scout. It has not yet been confirmed by the founder.

**Before the first session, audit what you already know.** Check your memory, conversation history, and any prior context you have on this person. The Operating Rhythm and Founder Voice sections below may already be fillable from existing context — fill them before the session starts if you can. Only surface questions for genuine gaps. If you can't determine what's in place, ask the user — one question at a time, not a list.

Then run the activation with the founder:

1. Walk through each major section — Positioning, Channel Plan, Message Angles, Asset Ideas, Experiments, 30-Day Phases, Hard Constraints — and ask: "Does this match how you see it?" Record each as **confirmed**, **modified** (note what changed), or **skipped** (return later).
2. For any gaps in Operating Rhythm not covered by existing context, ask: how does your week or month actually work? When does distribution work fit without forcing a context-switch?
3. For any gaps in Founder Voice not covered by existing context, ask: what have you tried for distribution before? What caused friction or shutdown? What has felt natural?

The brief is not active until the founder has touched every section.`;

const AGENT_BRIEF_OPERATING_RHYTHM = `_[fill from existing context before first session; confirm or ask if unknown]_

What to capture: how the founder's week or month actually works — rotation, build/rest cycle, or other cadence. When within that rhythm distribution work fits without forcing a context-switch. What week or phase they're currently in.`;

const AGENT_BRIEF_FOUNDER_VOICE = `_[fill from existing context before first session; confirm or ask if unknown]_

What to capture: the founder's own language about the problem they solve. Past distribution attempts — what was tried, what caused friction or shutdown, what felt natural or low-resistance.`;

const AGENT_BRIEF_OUTCOMES_LOG = `| Date | Move attempted | What happened | Status |
|------|----------------|---------------|--------|
| — | — | — | — |

Log each move the founder engages with. Update status to: **tried** / **dropped** / **ongoing** / **done**. When the log shows a pattern of drift, surface the staleness signal and suggest regenerating from Category Scout.`;

export function renderAgentBrief(
  draft: StrategyDraft | null,
  inputs: StrategyInputs,
  problemStatement: string,
  ndProfileContext?: NDProfileContext | null,
): string {
  if (!hasCompleteStrategyDraft(draft)) {
    return "";
  }

  const date = new Date(draft.generatedAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const lines: string[] = [
    `# Category Scout Agent Brief`,
    `**Problem:** ${problemStatement || "Not specified"}`,
    `**Generated:** ${date}`,
    "",
    "---",
    "",
    "## For the receiving agent",
    "",
    AGENT_BRIEF_PREAMBLE,
    "",
    "---",
    "",
    "## First-session activation protocol",
    "",
    AGENT_BRIEF_FIRST_SESSION_PROTOCOL,
    "",
    "---",
    "",
    "## Founder profile",
    "",
    `- **Audience lens:** ${inputs.audienceLens || "Not specified"}`,
    `- **Team size:** ${humanizeValue(inputs.teamSize)}`,
    `- **Budget band:** ${humanizeValue(inputs.budgetBand)}`,
    `- **Weekly capacity:** ${inputs.weeklyCapacity || "Not specified"}`,
    `- **Social posting tolerance:** ${humanizeValue(inputs.socialPostingTolerance)}`,
    `- **Outreach preferences:** ${humanizeValue(inputs.outreachTolerance)}`,
    inputs.peerCollaborationOk ? "- **Peer collaboration:** Open to content swaps, podcast guesting, cross-promotion" : "",
    `- **Content formats:** ${formatContentModes(inputs)}`,
    inputs.channelAvoidances ? `- **Channel avoidances:** ${inputs.channelAvoidances}` : "",
    ndProfileContext?.infoDensity ? `- **Preferred information density:** ${ndProfileContext.infoDensity}` : "",
    ndProfileContext?.infoFormats.length ? `- **Preferred formats:** ${ndProfileContext.infoFormats.join(", ")}` : "",
    "",
    "---",
    "",
    ...(ndProfileContext
      ? [
        "## Persistent ND context",
        "",
        ndProfileContext.summary || "No persistent ND profile summary available.",
        "",
        ndProfileContext.activationPatterns.length ? `**Known activation patterns:**\n${ndProfileContext.activationPatterns.map((item) => `- ${item}`).join("\n")}` : "",
        ndProfileContext.goodDayDescription ? `**What a good working session feels like:**\n${ndProfileContext.goodDayDescription}` : "",
        ndProfileContext.shutdownTriggers.length ? `**Known shutdown or avoidance triggers:**\n${ndProfileContext.shutdownTriggers.map((item) => `- ${item}`).join("\n")}` : "",
        ndProfileContext.shutdownDescription ? `**What shutdown looks like:**\n${ndProfileContext.shutdownDescription}` : "",
        ndProfileContext.supportConditions.length ? `**Support conditions that help:**\n${ndProfileContext.supportConditions.map((item) => `- ${item}`).join("\n")}` : "",
        ndProfileContext.agentGuidance ? `**Agent guidance from persistent profile:**\n${ndProfileContext.agentGuidance}` : "",
        "",
        "---",
        "",
      ].filter(Boolean)
      : []),
    "## Operating rhythm",
    "",
    AGENT_BRIEF_OPERATING_RHYTHM,
    "",
    "---",
    "",
    "## Founder voice",
    "",
    AGENT_BRIEF_FOUNDER_VOICE,
    "",
    "---",
    "",
    "## Existing work and assets",
    "",
    renderExistingAssets(inputs.existingAssets),
    "",
    "---",
    "",
    "## Hard constraints",
    "",
    AGENT_BRIEF_HARD_CONSTRAINTS,
    "",
    "---",
    "",
  ];

  for (const section of STRATEGY_SECTIONS) {
    const val = draft.sections[section.key];
    lines.push(`## ${section.label}`, "", extractSectionText(val as string | StrategySectionContent), "");
  }

  if (draft.citations.length > 0) {
    lines.push("---", "", "## Evidence / citations", "");
    const grouped = groupCitationsBySection(draft.citations);
    for (const [sectionLabel, citations] of grouped) {
      lines.push(`### ${sectionLabel}`, "");
      for (const citation of citations) {
        lines.push(`- [${citation.title}](${citation.url})${citation.note ? ` — ${citation.note}` : ""}`);
      }
      lines.push("");
    }
  }

  lines.push(
    "---",
    "",
    "## Execution shape",
    "",
    AGENT_BRIEF_EXECUTION_SHAPE,
    "",
    "---",
    "",
    "## Evolution protocol",
    "",
    AGENT_BRIEF_EVOLUTION_PROTOCOL,
    "",
    "---",
    "",
    "## Outcomes log",
    "",
    AGENT_BRIEF_OUTCOMES_LOG,
    "",
  );

  return lines.filter(Boolean).join("\n");
}

function formatContentModes(inputs: StrategyInputs): string {
  const modeLabels: Record<string, string> = {
    writing: "Writing",
    "short-video": "Video",
    audio: "Audio",
    design: "Design",
    interactive: "Interactive",
    other: inputs.contentModeOther || "Other",
    none: "No content",
  };

  if (inputs.contentMode.length === 0 || inputs.contentMode.includes("none")) {
    return "No content creation preferred";
  }

  return inputs.contentMode.map((m) => modeLabels[m] ?? m).join(", ");
}

function renderExistingAssets(assets: FounderConstraints["existingAssets"]): string {
  const populated = assets.filter((a) => a.name.trim().length > 0);
  if (populated.length === 0) {
    return "none listed";
  }

  return populated
    .map((asset) => {
      let line = `- **${asset.name.trim()}**`;
      if (asset.url.trim()) {
        line += ` (${asset.url.trim()})`;
      }
      if (asset.description.trim()) {
        line += ` — ${asset.description.trim()}`;
      }
      return line;
    })
    .join("\n");
}

function groupCitationsBySection(citations: StrategyDraft["citations"]): Map<string, typeof citations> {
  const map = new Map<string, typeof citations>();
  for (const citation of citations) {
    const label = STRATEGY_SECTIONS.find((s) => s.key === citation.section)?.label ?? citation.section;
    const existing = map.get(label) ?? [];
    existing.push(citation);
    map.set(label, existing);
  }
  return map;
}
