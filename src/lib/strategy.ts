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
    contentMode: ["writing"],
    contentModeOther: "",
    existingCredibility: "",
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
    contentMode: constraints.contentMode,
    contentModeOther: constraints.contentModeOther.trim(),
    existingCredibility: constraints.existingCredibility.trim(),
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
