import { PHASES } from "../phases";
import type {
  CondensedPhaseResearch,
  ExaResult,
  FounderConstraints,
  PhaseResult,
  SessionState,
  StrategyInputs,
  StrategyDraft,
  StrategySectionKey,
} from "../types";

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
  };
}

export function getCompletedResearchCount(phases: Record<number, PhaseResult>): number {
  return Object.values(phases).filter((phase) => phase.status === "done").length;
}

export function getStrategyReadiness(phases: Record<number, PhaseResult>) {
  const doneCount = getCompletedResearchCount(phases);
  const requiredPhaseIds = [1, 3, 5];
  const missingRequired = requiredPhaseIds.filter((phaseId) => {
    const phase = phases[phaseId];
    return phase?.status !== "done" || phase.results.length === 0;
  });

  const ready = doneCount >= 4 && missingRequired.length === 0;

  return {
    ready,
    doneCount,
    missingRequired,
  };
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
}): string {
  return JSON.stringify({
    problem: args.problem.trim(),
    knownPlayers: args.knownPlayers.trim(),
    strategyInputs: normalizeStrategyInputs(args.strategyInputs),
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
    lines.push(`## ${section.label}`, "", strategyDraft.sections[section.key] || "_Not yet written_", "");
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

export function syncStrategyDirtyState(session: SessionState): SessionState {
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
  });

  return {
    ...session,
    strategyDirty: session.strategySourceFingerprint !== nextFingerprint,
  };
}

export function hasCompleteStrategyDraft(draft: StrategyDraft | null | undefined): draft is StrategyDraft {
  if (!draft) {
    return false;
  }

  return STRATEGY_SECTIONS.every((section) =>
    typeof draft.sections?.[section.key] === "string" && draft.sections[section.key].trim().length > 0,
  );
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
  };
}

export function normalizeStrategyInputs(inputs: StrategyInputs): StrategyInputs {
  return {
    audienceLens: inputs.audienceLens.trim(),
    ...normalizeFounderConstraints(inputs),
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
5. **Integrate with the founder's own system.** The founder already has a working rhythm; map the strategy's execution shape onto that rhythm without imposing a new one.`;

const AGENT_BRIEF_HARD_CONSTRAINTS = `- Low-contact is a hard constraint, not a preference. Do not propose high-touch outreach regardless of perceived opportunity.
- Create-once over do-again. Favor assets that compound without maintenance over recurring tasks.
- No demand stacking. One focus at a time.
- Respect stated channel avoidances without exception.`;

const AGENT_BRIEF_EXECUTION_SHAPE = `How this strategy wants to be *paced*, independent of any specific weekly rhythm:

- **Batched bursts.** Execution work happens in concentrated sessions, not distributed across days. The founder can accomplish several strategy items in one focused sitting; that is preferred over spreading them thin.
- **Ambient quiet between bursts.** Between work sessions, do not surface pending items. Previously-built assets continue working in the background; the founder is not "behind."
- **Invitation register.** All surfacing language should be optional ("there's an X queued — want to start it?"), not imperative.
- **One thing visible at a time.** When the founder is actively engaged with the strategy, show a single move, not a list. The next move comes after the current one is closed (completed, dropped, or deferred).

Map this shape onto the founder's existing operating rhythm. Do not impose a specific cadence.`;

const AGENT_BRIEF_EVOLUTION_PROTOCOL = `When the founder engages with this strategy:

1. **Log outcomes** against specific moves. What was tried, what happened, what was dropped.
2. **Surface staleness** when accumulated outcomes indicate the strategy is drifting. Suggest regeneration from Category Scout rather than attempting to rewrite internally.
3. **Preserve the founder's edits.** If the founder has edited strategy sections inside Category Scout, those represent deliberate decisions. Do not silently replace them when regenerating.`;

export function renderAgentBrief(
  draft: StrategyDraft | null,
  inputs: StrategyInputs,
  problemStatement: string,
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
    lines.push(`## ${section.label}`, "", draft.sections[section.key], "");
  }

  if (draft.warnings.length > 0) {
    lines.push("---", "", "## Warnings surfaced by the planner", "");
    for (const warning of draft.warnings) {
      lines.push(`- ${warning}`);
    }
    lines.push("");
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
