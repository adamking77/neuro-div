import type {
  NDProfileContext,
  ProcessCheckInMode,
  ProcessDesignerInputs,
  ProcessMove,
  ProcessMoveBlock,
  ProcessPlan,
} from "../types";

const PROCESS_DESIGNER_KEY = "nd-process-designer";
const PROCESS_DESIGNER_ARTIFACTS_KEY = "nd-process-designer-artifacts";
const PROCESS_DESIGNER_CURRENT_KEY = "nd-process-designer-current";

interface SavedProcessDesignerDraft {
  inputs: ProcessDesignerInputs;
  currentArtifactId: string | null;
}

export interface SavedProcessArtifact {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  inputs: ProcessDesignerInputs;
  plan: ProcessPlan;
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

export function saveProcessDesignerDraft(inputs: ProcessDesignerInputs, currentArtifactId: string | null): void {
  localStorage.setItem(PROCESS_DESIGNER_KEY, JSON.stringify({ inputs, currentArtifactId }));
}

export function clearProcessDesignerDraft(): void {
  localStorage.removeItem(PROCESS_DESIGNER_KEY);
}

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getDefaultProcessName(inputs: ProcessDesignerInputs): string {
  if (inputs.goal.trim()) {
    const slug = slugify(inputs.goal.slice(0, 48));
    return slug || "Untitled process";
  }
  return "Untitled process";
}

function loadProcessArtifacts(): SavedProcessArtifact[] {
  try {
    const raw = localStorage.getItem(PROCESS_DESIGNER_ARTIFACTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedProcessArtifact[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveProcessArtifacts(artifacts: SavedProcessArtifact[]): void {
  try {
    localStorage.setItem(PROCESS_DESIGNER_ARTIFACTS_KEY, JSON.stringify(artifacts));
  } catch {
    // localStorage full or disabled
  }
}

export function listProcessArtifacts(): SavedProcessArtifact[] {
  return loadProcessArtifacts().sort((a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function loadProcessArtifact(id: string): SavedProcessArtifact | null {
  return loadProcessArtifacts().find((artifact) => artifact.id === id) ?? null;
}

export function saveProcessArtifact(inputs: ProcessDesignerInputs, plan: ProcessPlan, id?: string | null): SavedProcessArtifact {
  const artifacts = loadProcessArtifacts();
  const now = new Date().toISOString();
  const name = getDefaultProcessName(inputs);

  const existingIndex = id ? artifacts.findIndex((artifact) => artifact.id === id) : -1;

  if (existingIndex >= 0) {
    const updated: SavedProcessArtifact = {
      ...artifacts[existingIndex],
      name: artifacts[existingIndex].name === "Untitled process" && inputs.goal.trim()
        ? name
        : artifacts[existingIndex].name,
      updatedAt: now,
      inputs,
      plan,
    };
    artifacts[existingIndex] = updated;
    saveProcessArtifacts(artifacts);
    return updated;
  }

  const artifact: SavedProcessArtifact = {
    id: id || generateId(),
    name,
    createdAt: now,
    updatedAt: now,
    inputs,
    plan,
  };
  artifacts.push(artifact);
  saveProcessArtifacts(artifacts);
  return artifact;
}

export function deleteProcessArtifact(id: string): void {
  const artifacts = loadProcessArtifacts().filter((artifact) => artifact.id !== id);
  saveProcessArtifacts(artifacts);
}

export function renameProcessArtifact(id: string, name: string): void {
  const artifacts = loadProcessArtifacts();
  const index = artifacts.findIndex((artifact) => artifact.id === id);
  if (index >= 0) {
    artifacts[index] = { ...artifacts[index], name, updatedAt: new Date().toISOString() };
    saveProcessArtifacts(artifacts);
  }
}

export function saveCurrentProcessArtifactId(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(PROCESS_DESIGNER_CURRENT_KEY, id);
    } else {
      localStorage.removeItem(PROCESS_DESIGNER_CURRENT_KEY);
    }
  } catch {
    // ignore
  }
}

export function loadCurrentProcessArtifactId(): string | null {
  try {
    return localStorage.getItem(PROCESS_DESIGNER_CURRENT_KEY);
  } catch {
    return null;
  }
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
  const thesis = buildThesis(activationPatterns, shutdownTriggers, successSignal);
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
          "Use one visible next step at a time.",
          "Prefer small, finishable work over open-ended loops.",
          "Treat going quiet as neutral, not as falling behind.",
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

/**
 * The payoff, phrased as what the agent does once it has this plan. Mirrors the
 * Context profile's benefits list, but a process drives the daily decision
 * rather than setting standing context, so these are about running the plan:
 * asking what's available, surfacing one fitting step, honouring "not today".
 * Derived from the plan's own structure so it can't promise what isn't there.
 */
export function buildProcessBenefits(plan: ProcessPlan): string[] {
  const out: string[] = [];

  out.push("Start by asking what you've actually got today, before suggesting anything.");
  out.push("Offer you one step that fits today's energy, never the whole plan at once.");

  if (plan.rescueMoves.length > 0) {
    out.push("When you've stalled, reach for a rescue step instead of pushing you to catch up.");
  }

  out.push("Take \"not today\" as a complete answer, with no guilt and no catch-up.");

  return out.slice(0, 4);
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
    lines.push(`- **${mode.label}:** ${mode.guidance}`);
  }

  lines.push("", "## Step menu", "");
  for (const block of plan.blocks) {
    lines.push(`### ${block.title}`, "", block.summary, "");
    for (const move of block.moves) {
      lines.push(`#### ${move.title}`, "");
      lines.push(`- **Trigger:** ${move.trigger}`);
      lines.push(`- **Action:** ${move.action}`);
      lines.push(`- **Done signal:** ${move.doneSignal}`);
      lines.push(`- **Effort:** ${move.effort}`);
      lines.push(`- **Why this fits you:** ${move.whyItFits}`, "");
    }
  }

  lines.push("## Rescue steps", "");
  for (const move of plan.rescueMoves) {
    lines.push(`### ${move.title}`, "");
    lines.push(`- **Trigger:** ${move.trigger}`);
    lines.push(`- **Action:** ${move.action}`);
    lines.push(`- **Done signal:** ${move.doneSignal}`);
    lines.push(`- **Effort:** ${move.effort}`);
    lines.push(`- **Why this fits you:** ${move.whyItFits}`, "");
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
  if (successSignal) lines.push(`- **What counts as progress:** ${successSignal}`);
  if (existingAssets) lines.push(`- **Already available:** ${existingAssets}`);
  if (frictionPoints) lines.push(`- **Known sticking points:** ${frictionPoints}`);

  return lines.join("\n");
}

function buildThesis(
  activationPatterns: string[],
  shutdownTriggers: string[],
  successSignal: string,
): string {
  const activationText = activationPatterns.length > 0
    ? `Move on it when ${activationPatterns.slice(0, 2).join(" or ").toLowerCase()} shows up`
    : "Move on it when you've got real energy or interest";
  const protectionText = shutdownTriggers.length > 0
    ? `keep ${shutdownTriggers[0].toLowerCase()} out of the way`
    : "keep open-ended pressure out of the way";
  const doneText = successSignal
    ? `You're done when: ${successSignal}.`
    : "Keep the finish line visible so you don't have to guess when you're done.";

  return `This works by your energy, not a schedule. ${activationText}, ${protectionText}, and always leave an easy way back in. ${doneText}`;
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
  const frictionHint = frictionPoints || "the part that usually makes you want to avoid the whole thing";

  return [
    {
      id: "re-entry",
      title: "Low-friction re-entry",
      summary: "For when you want motion without asking for a full performance.",
      moves: [
        {
          title: "Make it smaller",
          trigger: `When you want to work on ${goal} but you've got barely any energy to start`,
          action: `Open the smallest thing you've already started on ${goal}. Work from ${existingHint}. Do just one tidying step: rename a section, list the open questions, cut the scope, or mark the real next step.`,
          doneSignal: "It's clearer than it was, and the next step is easier to see.",
          effort: "10-15 minutes",
          whyItFits: `This takes the pressure off a blank page and leans on ${lowStakesSupport} instead of needing you at full power.`,
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
          title: "Finish one small piece",
          trigger: `When ${activationHint} is here and you've got a real stretch of time`,
          action: `Pick one small, finishable piece of ${goal}: one page, one section, one part of a prototype, one decision, or one tidied-up handover. Keep it narrow enough that you can actually finish it.`,
          doneSignal: successHint,
          effort: "45-90 minutes",
          whyItFits: "This turns a burst of energy into one finished thing instead of scattering it across too many half-starts.",
        },
        {
          title: "Leave yourself a way back in",
          trigger: "Right before you stop a good session",
          action: `Leave a short note to yourself: what changed, what's still rough, and the exact next thing to pick up when you come back to ${goal}.`,
          doneSignal: "Future-you can get back in without piecing it all together again.",
          effort: "5 minutes",
          whyItFits: "It locks in what you got from a good session and makes the next start much shorter.",
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
          doneSignal: "The blocker is named specifically enough to change the next step.",
          effort: "10 minutes",
          whyItFits: "Specific friction is easier to work with than a global sense of avoidance.",
        },
        {
          title: "Remove the dependency",
          trigger: "When you are waiting on someone else or on a perfect condition",
          action: "Either send one quick message to ask, put in a temporary placeholder, or shrink the step so it no longer depends on that missing thing.",
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
          title: "Make one thing you can reuse",
          trigger: `When you don't want a heavy session but you want ${goal} to keep moving later`,
          action: `Turn one piece of work you've already done into something easier to reuse: a cleaner outline, a template, a saved set of snippets, a checklist, or a handover note.`,
          doneSignal: "There's one thing future-you, or an AI, can pick up without rebuilding the whole picture.",
          effort: "20-30 minutes",
          whyItFits: "Something reusable keeps paying off later without needing you to fire up from scratch each time.",
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
  const successHint = successSignal || `one visible sign that ${goal} progressed`;
  return [
    {
      title: "Not today",
      trigger: "When nothing about today makes this available",
      action: `Call it cleanly. Mark ${goal} as not available today, leave one sentence about why if that helps, and stop there.`,
      doneSignal: "It's closed off for the day without leaving things to catch up on.",
      effort: "2 minutes",
      whyItFits: "A clean no stops avoidance from piling up on top of a day that already wasn't going to work.",
    },
    {
      title: "Restart after drift",
      trigger: "When you have been away from the process for a while",
      action: `Re-read the goal and what counts as progress (${successHint}), then pick the smallest step from Low-friction re-entry. Don't try to review everything you missed.`,
      doneSignal: "You're back in the work without having to piece it all together first.",
      effort: "10 minutes",
      whyItFits: "Getting back in falls apart when the first step turns into reviewing everything you've missed.",
    },
    {
      title: "Take the pressure off",
      trigger: `When the work starts feeling like ${shutdownTriggers[0]?.toLowerCase() || "a demand you have to obey"}`,
      action: "Rewrite the step as an invitation. Turn it into one thing you could try, not an order you now have to follow.",
      doneSignal: "The step feels optional enough that you can pick it up again.",
      effort: "5 minutes",
      whyItFits: "The wording is often what decides whether a task stays doable or turns into a wall.",
    },
  ];
}

function buildCheckInModes(goal: string): ProcessCheckInMode[] {
  return [
    {
      label: "Thinking",
      guidance: `Surface one step that helps you understand or shape ${goal} without asking for commitment yet.`,
    },
    {
      label: "Deciding",
      guidance: `Surface one choice that narrows the path on ${goal}, with a clear tradeoff and a clear done signal.`,
    },
    {
      label: "Executing",
      guidance: `Surface one small, finishable step from the menu below and nothing else until it's done or turned down.`,
    },
    {
      label: "Not today",
      guidance: `Respect that ${goal} is not available today. No catch-up talk, no replacement task, no guilt.`,
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
    `You are helping this person with ${goal}.`,
    "",
    "## Operating rules",
    "",
    "- Start every interaction with the question: \"What's actually available today?\"",
    "- Use the four valid modes: Thinking, Deciding, Executing, Not today.",
    "- Offer one relevant step only. Wait for it to be closed, declined, or reshaped before surfacing another.",
    "- Do not use streaks, catch-up language, passive accountability, or anything that implies they are behind.",
    "- Treat silence as neutral unless the user tells you something changed.",
  ];

  if (whyNow) {
    lines.push("", `## Why this matters now`, "", whyNow);
  }

  if (successSignal) {
    lines.push("", "## What counts as real progress", "", successSignal);
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
    lines.push(`- **${mode.label}:** ${mode.guidance}`);
  }

  lines.push("", "## Step menu", "");
  for (const block of blocks) {
    lines.push(`### ${block.title}`, "", block.summary, "");
    for (const move of block.moves) {
      lines.push(`- **${move.title}:** Trigger: ${move.trigger} Action: ${move.action} Done signal: ${move.doneSignal}`);
    }
    lines.push("");
  }

  lines.push("## Rescue steps", "");
  for (const move of rescueMoves) {
    lines.push(`- **${move.title}:** ${move.action}`);
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
