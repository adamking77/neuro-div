import type {
  NDProfileContext,
  ProcessCheckInMode,
  ProcessDesignerInputs,
  ProcessMove,
  ProcessMoveBlock,
  ProcessPlan,
} from "../types";

const PROCESS_DESIGNER_KEY = "nd-process-designer";

interface SavedProcessDesignerDraft {
  inputs: ProcessDesignerInputs;
  plan: ProcessPlan | null;
}

export function createEmptyProcessDesignerInputs(): ProcessDesignerInputs {
  return {
    goal: "",
    whyNow: "",
    successSignal: "",
    existingAssets: "",
    frictionPoints: "",
    notDoing: "",
  };
}

export function loadProcessDesignerDraft(): SavedProcessDesignerDraft | null {
  try {
    const raw = localStorage.getItem(PROCESS_DESIGNER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedProcessDesignerDraft;
  } catch {
    return null;
  }
}

export function saveProcessDesignerDraft(inputs: ProcessDesignerInputs, plan: ProcessPlan | null): void {
  localStorage.setItem(PROCESS_DESIGNER_KEY, JSON.stringify({ inputs, plan }));
}

export function clearProcessDesignerDraft(): void {
  localStorage.removeItem(PROCESS_DESIGNER_KEY);
}

export function buildProcessPlan(
  inputs: ProcessDesignerInputs,
  profileContext: NDProfileContext | null,
): ProcessPlan {
  const goal = clean(inputs.goal) || "the current goal";
  const whyNow = clean(inputs.whyNow);
  const successSignal = clean(inputs.successSignal);
  const existingAssets = clean(inputs.existingAssets);
  const frictionPoints = clean(inputs.frictionPoints);

  const activationPatterns = unique(profileContext?.activationPatterns ?? []);
  const shutdownTriggers = unique(profileContext?.shutdownTriggers ?? []);
  const supportConditions = unique(profileContext?.supportConditions ?? []);

  const workingWith = unique([
    profileContext?.activationWindows ? `Natural working windows: ${profileContext.activationWindows}` : "",
    activationPatterns[0] ? `What tends to pull you in: ${activationPatterns.slice(0, 3).join(", ")}` : "",
    supportConditions[0] ? `Conditions that often help: ${supportConditions.slice(0, 3).join(", ")}` : "",
    profileContext?.goodDayDescription ? `Good session signal: ${profileContext.goodDayDescription}` : "",
    whyNow ? `Why this matters right now: ${whyNow}` : "",
  ]);

  const protectedConditions = unique([
    profileContext?.unavailablePeriods ? `Protected unavailable periods: ${profileContext.unavailablePeriods}` : "",
    shutdownTriggers[0] ? `Avoidance triggers to respect: ${shutdownTriggers.slice(0, 4).join(", ")}` : "",
    frictionPoints ? `Known sticking points: ${frictionPoints}` : "",
  ]);

  const notDoing = unique([
    ...splitList(inputs.notDoing),
    ...shutdownTriggers.map((item) => `Not using ${item.toLowerCase()}`),
  ]).slice(0, 8);

  const blocks = buildMoveBlocks({
    goal,
    successSignal,
    existingAssets,
    frictionPoints,
    activationPatterns,
    shutdownTriggers,
    supportConditions,
  });

  const rescueMoves = buildRescueMoves(goal, shutdownTriggers, successSignal);
  const checkInModes = buildCheckInModes(goal);
  const thesis = buildThesis(goal, activationPatterns, shutdownTriggers, successSignal);
  const agentBrief = buildAgentBrief({
    goal,
    successSignal,
    whyNow,
    existingAssets,
    frictionPoints,
    notDoing,
    profileContext,
    blocks,
    rescueMoves,
    checkInModes,
  });

  return {
    generatedAt: new Date().toISOString(),
    goal,
    profileSummary: profileContext?.summary || "No saved ND profile was loaded, so this process uses lighter defaults and the explicit notes from this session.",
    thesis,
    workingWith: workingWith.length > 0
      ? workingWith
      : [
          "Use one visible next move at a time.",
          "Prefer bounded work over open loops.",
          "Treat silence as neutral, not drift.",
        ],
    protectedConditions: protectedConditions.length > 0
      ? protectedConditions
      : [
          "Avoid open-ended work with no visible done signal.",
          "Do not interpret a quiet patch as failure or abandonment.",
        ],
    notDoing,
    measures: [
      `Of the times you sat down to work on ${goal}, how often did you actually get going?`,
      "Where did you stop, and what was happening right before that?",
      "Did anything you made keep helping without more effort from you?",
      "When you did work on it, did it feel forced or did it happen?",
    ],
    weeklyQuestion: "What happened this week that you did not plan for?",
    checkInPrompt: "What's actually available today?",
    checkInModes,
    blocks,
    rescueMoves,
    agentBrief,
  };
}

export function buildProcessMarkdown(inputs: ProcessDesignerInputs, plan: ProcessPlan): string {
  const lines: string[] = [
    "# ND Process Designer",
    "",
    `**Goal:** ${plan.goal}`,
    `**Generated:** ${formatDate(plan.generatedAt)}`,
    "",
    plan.thesis,
    "",
    "## What you're working with",
    "",
    ...plan.workingWith.map((item) => `- ${item}`),
    "",
    "## Protected conditions",
    "",
    ...plan.protectedConditions.map((item) => `- ${item}`),
  ];

  if (plan.notDoing.length > 0) {
    lines.push("", "## What you're not doing", "", ...plan.notDoing.map((item) => `- ${item}`));
  }

  lines.push("", "## Session start", "", plan.checkInPrompt, "");
  for (const mode of plan.checkInModes) {
    lines.push(`- **${mode.label}** — ${mode.guidance}`);
  }

  lines.push("", "## Move menu", "");
  for (const block of plan.blocks) {
    lines.push(`### ${block.title}`, "", block.summary, "");
    for (const move of block.moves) {
      lines.push(`#### ${move.title}`, "");
      lines.push(`- **Trigger** — ${move.trigger}`);
      lines.push(`- **Action** — ${move.action}`);
      lines.push(`- **Done signal** — ${move.doneSignal}`);
      lines.push(`- **Effort** — ${move.effort}`);
      lines.push(`- **Why this fits you** — ${move.whyItFits}`, "");
    }
  }

  lines.push("## Rescue moves", "");
  for (const move of plan.rescueMoves) {
    lines.push(`### ${move.title}`, "");
    lines.push(`- **Trigger** — ${move.trigger}`);
    lines.push(`- **Action** — ${move.action}`);
    lines.push(`- **Done signal** — ${move.doneSignal}`);
    lines.push(`- **Effort** — ${move.effort}`);
    lines.push(`- **Why this fits you** — ${move.whyItFits}`, "");
  }

  lines.push("## Measurement", "");
  for (const measure of plan.measures) {
    lines.push(`- ${measure}`);
  }

  lines.push("", `**Weekly check-in:** ${plan.weeklyQuestion}`, "", "## Agent brief", "", plan.agentBrief.trim());

  const whyNow = clean(inputs.whyNow);
  const successSignal = clean(inputs.successSignal);
  const existingAssets = clean(inputs.existingAssets);
  const frictionPoints = clean(inputs.frictionPoints);

  lines.push("", "## Source notes", "");
  if (whyNow) lines.push(`- **Why now:** ${whyNow}`);
  if (successSignal) lines.push(`- **What counts as movement:** ${successSignal}`);
  if (existingAssets) lines.push(`- **Already available:** ${existingAssets}`);
  if (frictionPoints) lines.push(`- **Known sticking points:** ${frictionPoints}`);

  return lines.join("\n");
}

function buildThesis(
  goal: string,
  activationPatterns: string[],
  shutdownTriggers: string[],
  successSignal: string,
): string {
  const activationText = activationPatterns.length > 0
    ? `Let progress happen when ${activationPatterns.slice(0, 2).join(" and ").toLowerCase()} are present`
    : "Let progress happen when real energy or interest is available";
  const protectionText = shutdownTriggers.length > 0
    ? `protect against ${shutdownTriggers[0].toLowerCase()} and other known shutdown triggers`
    : "protect against open-ended demand pressure";
  const doneText = successSignal
    ? `Use this signal for real movement: ${successSignal}.`
    : "Keep the done signal visible enough that you do not have to guess when to stop.";

  return `Build ${goal} as a condition-based process, not a schedule. ${activationText}, ${protectionText}, and keep re-entry cheap. ${doneText}`;
}

function buildMoveBlocks({
  goal,
  successSignal,
  existingAssets,
  frictionPoints,
  activationPatterns,
  shutdownTriggers,
  supportConditions,
}: {
  goal: string;
  successSignal: string;
  existingAssets: string;
  frictionPoints: string;
  activationPatterns: string[];
  shutdownTriggers: string[];
  supportConditions: string[];
}): ProcessMoveBlock[] {
  const lowStakesSupport = supportConditions[0]?.toLowerCase() || "a low-stakes start";
  const activationHint = activationPatterns[0]?.toLowerCase() || "interest";
  const shutdownHint = shutdownTriggers[0]?.toLowerCase() || "open-ended work";
  const existingHint = existingAssets || "whatever notes, drafts, or scraps already exist";
  const successHint = successSignal || `one visible step forward on ${goal}`;
  const frictionHint = frictionPoints || "the part that usually turns this into a demand spiral";

  return [
    {
      id: "re-entry",
      title: "Low-friction re-entry",
      summary: "For when you want motion without asking for a full performance.",
      moves: [
        {
          title: "Reduce the edge",
          trigger: `When you want to work on ${goal} but the starting energy is low`,
          action: `Open the smallest live artifact connected to ${goal}. Work from ${existingHint}. Make one clarifying move only: rename a section, list the open questions, cut the scope, or mark the real next edge.`,
          doneSignal: "The artifact is clearer than it was, and the next move is easier to see.",
          effort: "10-15 minutes",
          whyItFits: `This lowers blank-page pressure and uses ${lowStakesSupport} instead of demanding full activation.`,
        },
        {
          title: "Capture without organizing",
          trigger: "When thoughts are moving but structure is not",
          action: `Do a quick bullet dump or voice note about ${goal}. Stop after pulling out one sentence, one decision, or one question worth keeping.`,
          doneSignal: "You leave with one reusable note instead of trying to finish the whole thing.",
          effort: "10-20 minutes",
          whyItFits: "It creates momentum without requiring full coherence on entry.",
        },
      ],
    },
    {
      id: "making-window",
      title: "Making window",
      summary: "For the moments when there is real pull, real energy, or a proper stretch of time.",
      moves: [
        {
          title: "Make one bounded unit",
          trigger: `When ${activationHint} is present and you have a real working window`,
          action: `Choose one bounded unit for ${goal}: one page, one section, one prototype slice, one decision, or one cleaned-up handoff. Keep the edge narrow enough that it can actually close.`,
          doneSignal: successHint,
          effort: "45-90 minutes",
          whyItFits: "This turns activation into a finished unit instead of scattering it across too many starts.",
        },
        {
          title: "Leave the runway visible",
          trigger: "Right before you stop a good session",
          action: `Leave a short re-entry note: what moved, what is rough, and the exact next thing to touch when you come back to ${goal}.`,
          doneSignal: "Future-you can re-enter without reconstructing the whole context.",
          effort: "5 minutes",
          whyItFits: "It preserves the benefit of a good window and shortens the next start.",
        },
      ],
    },
    {
      id: "sticky-moments",
      title: "When it gets sticky",
      summary: "For when the process starts to feel slippery, vague, or blocked by another person.",
      moves: [
        {
          title: "Name the actual blocker",
          trigger: `When ${goal} starts feeling impossible for reasons you cannot quite name`,
          action: `Write one sentence that starts with "This is stuck because..." and finish it plainly. If helpful, name ${frictionHint}. Then choose whether the real issue is scope, clarity, waiting, or emotional load.`,
          doneSignal: "The blocker is named specifically enough to change the next move.",
          effort: "10 minutes",
          whyItFits: "Specific friction is easier to work with than a global sense of avoidance.",
        },
        {
          title: "Remove the dependency",
          trigger: "When you are waiting on someone else or on a perfect condition",
          action: "Either make one async ask, create a temporary placeholder, or shrink the move so it no longer depends on that missing thing.",
          doneSignal: "Progress no longer rests entirely on someone else responding.",
          effort: "10-20 minutes",
          whyItFits: `Waiting often turns into shutdown. This keeps the process moving without fighting ${shutdownHint}.`,
        },
      ],
    },
    {
      id: "background-progress",
      title: "Background progress",
      summary: "For when you want something to keep helping later without staying socially or mentally 'on'.",
      moves: [
        {
          title: "Package one reusable asset",
          trigger: `When you do not want a heavy session but you want ${goal} to keep moving later`,
          action: `Turn one piece of existing work into something easier to reuse: a cleaner outline, a template, a snippet bank, a checklist, or a handoff note.`,
          doneSignal: "There is one asset future-you or an agent can use without rebuilding context.",
          effort: "20-30 minutes",
          whyItFits: "Reusable assets create leverage without requiring repeated activation from scratch.",
        },
        {
          title: "Queue the next easy entry",
          trigger: "When you are done for now but want the next start to be lighter",
          action: `Set up one obvious next entry point for ${goal}: a titled doc, a prepared note, a draft section, or a single parked question.`,
          doneSignal: "The next start no longer begins from zero.",
          effort: "5-10 minutes",
          whyItFits: "Cheap re-entry is often more valuable than squeezing out one more forced step.",
        },
      ],
    },
  ];
}

function buildRescueMoves(goal: string, shutdownTriggers: string[], successSignal: string): ProcessMove[] {
  const successHint = successSignal || `one visible sign that ${goal} moved`;
  return [
    {
      title: "Not today",
      trigger: "When nothing about today makes this available",
      action: `Call it cleanly. Mark ${goal} as not available today, leave one sentence about why if that helps, and stop there.`,
      doneSignal: "The loop is closed without creating catch-up debt.",
      effort: "2 minutes",
      whyItFits: "A dignified no prevents avoidant drag from building on top of an already unavailable day.",
    },
    {
      title: "Restart after drift",
      trigger: "When you have been away from the process for a while",
      action: `Re-read the goal, the success signal (${successHint}), and choose the smallest move from Low-friction re-entry. Do not attempt a full catch-up review.`,
      doneSignal: "You are back inside the work without reconstructing everything.",
      effort: "10 minutes",
      whyItFits: "Re-entry fails when the first move becomes a backlog audit.",
    },
    {
      title: "Demand check",
      trigger: `When the process starts sounding like ${shutdownTriggers[0]?.toLowerCase() || "a demand"}`,
      action: "Rewrite the move in invitation language. Reduce it to one option you could try, not a command you now have to obey.",
      doneSignal: "The move feels optional enough to become available again.",
      effort: "5 minutes",
      whyItFits: "Framing changes whether a task stays workable or turns into a wall.",
    },
  ];
}

function buildCheckInModes(goal: string): ProcessCheckInMode[] {
  return [
    {
      label: "Thinking",
      guidance: `Surface one move that helps you understand or shape ${goal} without asking for commitment yet.`,
    },
    {
      label: "Deciding",
      guidance: `Surface one choice that narrows the path on ${goal}, with a clear tradeoff and a clear done signal.`,
    },
    {
      label: "Executing",
      guidance: `Surface one bounded move from the menu below and nothing else until it is closed or declined.`,
    },
    {
      label: "Not today",
      guidance: `Respect that ${goal} is not available today. No catch-up framing, no replacement task, no guilt dressing.`,
    },
  ];
}

function buildAgentBrief({
  goal,
  successSignal,
  whyNow,
  existingAssets,
  frictionPoints,
  notDoing,
  profileContext,
  blocks,
  rescueMoves,
  checkInModes,
}: {
  goal: string;
  successSignal: string;
  whyNow: string;
  existingAssets: string;
  frictionPoints: string;
  notDoing: string[];
  profileContext: NDProfileContext | null;
  blocks: ProcessMoveBlock[];
  rescueMoves: ProcessMove[];
  checkInModes: ProcessCheckInMode[];
}): string {
  const lines: string[] = [
    `You are helping this person move ${goal}.`,
    "",
    "## Operating rules",
    "",
    "- Start every interaction with the question: \"What's actually available today?\"",
    "- Use the four valid modes: Thinking, Deciding, Executing, Not today.",
    "- Offer one relevant move only. Wait for it to be closed, declined, or reshaped before surfacing another.",
    "- Do not use streaks, catch-up language, passive accountability, or anything that implies they are behind.",
    "- Treat silence as neutral unless the user tells you something changed.",
  ];

  if (whyNow) {
    lines.push("", `## Why this matters now`, "", whyNow);
  }

  if (successSignal) {
    lines.push("", "## What counts as real movement", "", successSignal);
  }

  if (existingAssets) {
    lines.push("", "## What already exists", "", existingAssets);
  }

  if (frictionPoints) {
    lines.push("", "## Known sticking points", "", frictionPoints);
  }

  if (notDoing.length > 0) {
    lines.push("", "## Explicit not-doing list", "", ...notDoing.map((item) => `- ${item}`));
  }

  if (profileContext) {
    lines.push("", "## Persistent ND context", "", profileContext.agentGuidance.trim());
  }

  lines.push("", "## Check-in modes", "");
  for (const mode of checkInModes) {
    lines.push(`- **${mode.label}** — ${mode.guidance}`);
  }

  lines.push("", "## Move menu", "");
  for (const block of blocks) {
    lines.push(`### ${block.title}`, "", block.summary, "");
    for (const move of block.moves) {
      lines.push(`- **${move.title}** — Trigger: ${move.trigger} Action: ${move.action} Done signal: ${move.doneSignal}`);
    }
    lines.push("");
  }

  lines.push("## Rescue moves", "");
  for (const move of rescueMoves) {
    lines.push(`- **${move.title}** — ${move.action}`);
  }

  return lines.join("\n");
}

function splitList(value: string): string[] {
  return unique(
    value
      .split(/\n|,|;/)
      .map((item) => clean(item))
      .filter(Boolean),
  );
}

function unique(items: string[]): string[] {
  return Array.from(new Set(items.filter(Boolean)));
}

function clean(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
