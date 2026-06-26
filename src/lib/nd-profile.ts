import type {
  NDProfileContext,
  NDProfile,
  NDTrait,
  NDTraitManifestation,
  ActivationPattern,
  ShutdownTrigger,
  TimePattern,
  InfoDensity,
  InfoFormat,
  SupportCondition,
} from "../types";

const ND_PROFILE_KEY = "nd-profile";

export function loadNDProfile(): NDProfile | null {
  try {
    const raw = localStorage.getItem(ND_PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as NDProfile;
  } catch {
    return null;
  }
}

export function loadNDProfileContext(): NDProfileContext | null {
  const profile = loadNDProfile();
  return profile ? buildNDProfileContext(profile) : null;
}

export function saveNDProfile(profile: NDProfile): void {
  const updated = { ...profile, updatedAt: new Date().toISOString() };
  localStorage.setItem(ND_PROFILE_KEY, JSON.stringify(updated));
}

export function clearNDProfile(): void {
  localStorage.removeItem(ND_PROFILE_KEY);
}

export function createEmptyNDProfile(): NDProfile {
  const now = new Date().toISOString();
  return {
    version: 1,
    createdAt: now,
    updatedAt: now,
    traits: { selected: [], other: "", manifestations: [], notes: "" },
    activation: { patterns: [], patternOther: "", goodDayDescription: "" },
    shutdown: { triggers: [], triggerOther: "", shutdownDescription: "" },
    timeEnergy: { patterns: [], patternOther: "", activationWindows: "", unavailablePeriods: "" },
    history: { triedSystems: "", whatWorked: "", whatFailed: "" },
    infoConditions: { density: null, formats: [], formatOther: "", supportConditions: [], conditionOther: "" },
  };
}

// Label maps for display and markdown output

export const TRAIT_LABELS: Record<NDTrait, string> = {
  adhd: "ADHD",
  autism: "Autism / ASD",
  pda: "PDA (Pathological Demand Avoidance)",
  dyslexia: "Dyslexia",
  dyscalculia: "Dyscalculia",
  sensory: "Sensory processing differences",
};

export const MANIFESTATION_LABELS: Record<NDTraitManifestation, string> = {
  "adhd-hard-to-start": "Hard to start tasks even when I want to do them",
  "adhd-time-blindness": "Time blindness: hours pass without me noticing",
  "adhd-hyperfocus": "Hyperfocus: when I'm interested I can lose hours",
  "adhd-transition-hard": "Switching between tasks takes real effort",
  "adhd-needs-movement": "I think better when I'm moving or have background stimulation",
  "adhd-deadline-engine": "Deadlines are my main motivation engine",
  "adhd-fast-thoughts": "Thoughts come faster than I can capture them",
  "autism-clear-expectations": "I need clear expectations: vague is genuinely stressful",
  "autism-sensory": "Sensory sensitivities affect where and how I can work",
  "autism-processing-time": "I need time to process before responding",
  "autism-deep-interests": "Deep interest areas that give me unusual energy",
  "autism-social-effort": "Social interaction takes more energy than it looks like",
  "autism-needs-why": "I need to understand the why before I can engage",
  "pda-demand-avoidance": "Even things I want to do can become blocked when framed as demands",
  "pda-framing-matters": '"You could try this" works; "you should do this" shuts me down',
  "pda-autonomous": "I work better when I'm directing myself, not following instructions",
  "pda-own-goals-trigger": "My own goals and internal deadlines can trigger avoidance too",
  "pda-needs-control": "Real control over how and when I work is non-negotiable",
  "dyslexia-reading-effort": "Reading takes more effort, especially dense or long text",
  "dyslexia-oral-better": "I often understand something better when I hear it",
  "dyslexia-visual-spatial": "I think more visually and spatially than linearly",
  "dyscalculia-numbers": "Numbers and calculations are genuinely hard",
  "dyscalculia-time-estimation": "Estimating how long things take is unreliable for me",
  "sensory-sound": "Sound sensitivity: certain environments are unusable",
  "sensory-light": "Light sensitivity affects my ability to focus",
  "sensory-environment": "I'm particular about my environment in ways others find hard to understand",
};

export const MANIFESTATIONS_BY_TRAIT: Record<NDTrait, NDTraitManifestation[]> = {
  adhd: ["adhd-hard-to-start", "adhd-time-blindness", "adhd-hyperfocus", "adhd-transition-hard", "adhd-needs-movement", "adhd-deadline-engine", "adhd-fast-thoughts"],
  autism: ["autism-clear-expectations", "autism-sensory", "autism-processing-time", "autism-deep-interests", "autism-social-effort", "autism-needs-why"],
  pda: ["pda-demand-avoidance", "pda-framing-matters", "pda-autonomous", "pda-own-goals-trigger", "pda-needs-control"],
  dyslexia: ["dyslexia-reading-effort", "dyslexia-oral-better", "dyslexia-visual-spatial"],
  dyscalculia: ["dyscalculia-numbers", "dyscalculia-time-estimation"],
  sensory: ["sensory-sound", "sensory-light", "sensory-environment"],
};

export const ACTIVATION_LABELS: Record<ActivationPattern, string> = {
  novelty: "Novel problems or ideas I haven't seen before",
  deadline: "A real deadline with actual consequences",
  urgency: "High stakes or urgency: something that actually matters now",
  "deep-interest": "Deep interest or passion: I care about the topic",
  challenge: "A genuine challenge or puzzle",
  collaboration: "Someone else is counting on me, or we're doing it together",
  "creative-freedom": "Room to approach it my own way",
  "clear-bounded": "Clear, bounded tasks with a defined finish",
  other: "Something else",
};

export const SHUTDOWN_LABELS: Record<ShutdownTrigger, string> = {
  "cold-outreach": "Cold outreach: contacting strangers to pitch or ask for something",
  "live-calls": "Live calls or meetings, especially unscheduled ones",
  "open-ended": "Open-ended tasks with no clear finish or success signal",
  "admin-repetitive": "Admin or repetitive tasks",
  "being-evaluated": "Anything involving judgment, feedback, or being evaluated",
  "social-posting": "Posting on social media",
  "blank-page": "Starting from a completely blank page",
  "waiting": "Waiting for someone else to respond before I can proceed",
  other: "Something else",
};

export const TIME_PATTERN_LABELS: Record<TimePattern, string> = {
  "time-blindness": "I lose track of time easily: hours pass without me noticing",
  "deadline-engine": "Deadlines are my main engine: I come alive near the wire",
  "burst-worker": "I work in bursts, not sustained daily blocks",
  "needs-external-structure": "Without external structure I tend to drift",
  "no-time-pressure": "I do better without time pressure",
  "peak-windows": "I have one or two peak working windows; everything else is harder",
  "recovery-non-negotiable": "Recovery time is non-negotiable: I can't just push through",
  other: "Something else",
};

export const INFO_DENSITY_LABELS: Record<InfoDensity, string> = {
  brief: "Brief, just the core point",
  medium: "Medium, enough context to understand the why",
  deep: "Deep, give me everything and I'll sort what matters",
  varies: "Depends on the topic",
};

export const INFO_FORMAT_LABELS: Record<InfoFormat, string> = {
  bullets: "Bullet points",
  numbered: "Numbered steps",
  prose: "Prose",
  examples: "Examples or analogies",
  headers: "Headers and sections",
  any: "Doesn't matter / I'll adapt",
};

export const SUPPORT_CONDITION_LABELS: Record<SupportCondition, string> = {
  "background-sound": "Background music or ambient sound",
  silence: "Silence",
  "body-doubling": "Someone else present, even just on a call (body doubling)",
  timers: "Timers (Pomodoro, countdowns, time limits)",
  movement: "Movement (walking, pacing, fidgeting)",
  routine: "A consistent starting ritual or routine",
  "low-stakes-start": "Starting with something easy or low-stakes to build momentum",
  other: "Something else",
};

function listItems(items: string[]): string {
  return items.map((item) => `- ${item}`).join("\n");
}

function section(title: string, content: string): string {
  if (!content.trim()) return "";
  return `## ${title}\n\n${content.trim()}`;
}

export function buildNDProfileMarkdown(profile: NDProfile): string {
  const date = new Date(profile.createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const parts: string[] = [];

  parts.push(`# ND Profile\n\n*Created: ${date}*`);
  parts.push("---");

  // Traits
  const traitLines: string[] = [];
  const selectedTraits = profile.traits.selected;
  if (selectedTraits.length > 0) {
    const traitNames = selectedTraits.map((t) => TRAIT_LABELS[t]).join(", ");
    traitLines.push(traitNames);
    traitLines.push("");
    const mfLines = profile.traits.manifestations
      .filter((m) => {
        const traitForManifestation = (Object.keys(MANIFESTATIONS_BY_TRAIT) as NDTrait[]).find(
          (t) => MANIFESTATIONS_BY_TRAIT[t].includes(m)
        );
        return traitForManifestation && selectedTraits.includes(traitForManifestation);
      })
      .map((m) => `- ${MANIFESTATION_LABELS[m]}`);
    if (mfLines.length > 0) {
      traitLines.push("**How these show up for me:**");
      traitLines.push(...mfLines);
    }
  }
  if (profile.traits.other.trim()) {
    traitLines.push(`- ${profile.traits.other.trim()}`);
  }
  if (profile.traits.notes.trim()) {
    traitLines.push("");
    traitLines.push(profile.traits.notes.trim());
  }
  const traitsSection = section("My Neurodivergent Profile", traitLines.join("\n"));
  if (traitsSection) parts.push(traitsSection);

  // Activation
  const activationLines: string[] = [];
  const activationPatterns = profile.activation.patterns
    .filter((p) => p !== "other")
    .map((p) => `- ${ACTIVATION_LABELS[p]}`);
  if (activationPatterns.length > 0) {
    activationLines.push("**What pulls me in:**");
    activationLines.push(...activationPatterns);
  }
  if (profile.activation.patternOther.trim()) {
    activationLines.push(`- ${profile.activation.patternOther.trim()}`);
  }
  if (profile.activation.goodDayDescription.trim()) {
    if (activationLines.length > 0) activationLines.push("");
    activationLines.push("**What a good working session feels like:**");
    activationLines.push(profile.activation.goodDayDescription.trim());
  }
  const activationSection = section("What Activates Me", activationLines.join("\n"));
  if (activationSection) parts.push(activationSection);

  // Shutdown
  const shutdownLines: string[] = [];
  const shutdownTriggers = profile.shutdown.triggers
    .filter((t) => t !== "other")
    .map((t) => `- ${SHUTDOWN_LABELS[t]}`);
  if (shutdownTriggers.length > 0) {
    shutdownLines.push("**What I tend to avoid:**");
    shutdownLines.push(...shutdownTriggers);
  }
  if (profile.shutdown.triggerOther.trim()) {
    shutdownLines.push(`- ${profile.shutdown.triggerOther.trim()}`);
  }
  if (profile.shutdown.shutdownDescription.trim()) {
    if (shutdownLines.length > 0) shutdownLines.push("");
    shutdownLines.push("**What shutdown or avoidance actually looks like for me:**");
    shutdownLines.push(profile.shutdown.shutdownDescription.trim());
  }
  const shutdownSection = section("What Causes Shutdown or Avoidance", shutdownLines.join("\n"));
  if (shutdownSection) parts.push(shutdownSection);

  // Time and energy
  const timeLines: string[] = [];
  const timePatterns = profile.timeEnergy.patterns
    .filter((p) => p !== "other")
    .map((p) => `- ${TIME_PATTERN_LABELS[p]}`);
  if (timePatterns.length > 0) {
    timeLines.push("**How time and energy work for me:**");
    timeLines.push(...timePatterns);
  }
  if (profile.timeEnergy.patternOther.trim()) {
    timeLines.push(`- ${profile.timeEnergy.patternOther.trim()}`);
  }
  if (profile.timeEnergy.activationWindows.trim()) {
    if (timeLines.length > 0) timeLines.push("");
    timeLines.push("**When I actually tend to work:**");
    timeLines.push(profile.timeEnergy.activationWindows.trim());
  }
  if (profile.timeEnergy.unavailablePeriods.trim()) {
    if (timeLines.length > 0) timeLines.push("");
    timeLines.push("**When I'll be unavailable:**");
    timeLines.push(profile.timeEnergy.unavailablePeriods.trim());
  }
  const timeSection = section("My Relationship With Time and Energy", timeLines.join("\n"));
  if (timeSection) parts.push(timeSection);

  // History
  const historyLines: string[] = [];
  if (profile.history.triedSystems.trim()) {
    historyLines.push("**What I've tried:**");
    historyLines.push(profile.history.triedSystems.trim());
  }
  if (profile.history.whatWorked.trim()) {
    if (historyLines.length > 0) historyLines.push("");
    historyLines.push("**What worked (even partially):**");
    historyLines.push(profile.history.whatWorked.trim());
  }
  if (profile.history.whatFailed.trim()) {
    if (historyLines.length > 0) historyLines.push("");
    historyLines.push("**What fell apart:**");
    historyLines.push(profile.history.whatFailed.trim());
  }
  const historySection = section("Systems I've Tried", historyLines.join("\n"));
  if (historySection) parts.push(historySection);

  // Info and conditions
  const infoLines: string[] = [];
  if (profile.infoConditions.density) {
    infoLines.push(`**Information density:** ${INFO_DENSITY_LABELS[profile.infoConditions.density]}`);
  }
  const formats = profile.infoConditions.formats
    .filter((f) => f !== "any")
    .map((f) => INFO_FORMAT_LABELS[f]);
  if (formats.length > 0) {
    infoLines.push(`**Format that works best for me:** ${formats.join(", ")}`);
  }
  if (profile.infoConditions.formatOther.trim()) {
    infoLines.push(`**Also:** ${profile.infoConditions.formatOther.trim()}`);
  }
  const infoSection = section("How I Prefer to Receive Information", infoLines.join("\n"));
  if (infoSection) parts.push(infoSection);

  // Support conditions
  const conditionLines: string[] = [];
  const conditions = profile.infoConditions.supportConditions
    .filter((c) => c !== "other")
    .map((c) => `- ${SUPPORT_CONDITION_LABELS[c]}`);
  if (conditions.length > 0) {
    conditionLines.push(...conditions);
  }
  if (profile.infoConditions.conditionOther.trim()) {
    conditionLines.push(`- ${profile.infoConditions.conditionOther.trim()}`);
  }
  const conditionSection = section("What Helps Me Work", conditionLines.join("\n"));
  if (conditionSection) parts.push(conditionSection);

  // Agent instructions
  const agentLines = buildAgentInstructions(profile);
  if (agentLines) {
    parts.push("---");
    parts.push(section("For Any Agent Working With Me", agentLines));
  }

  return parts.filter(Boolean).join("\n\n");
}

function buildAgentInstructions(profile: NDProfile): string {
  const lines: string[] = [];

  const traits = profile.traits.selected;
  const hasPDA = traits.includes("pda");
  const hasADHD = traits.includes("adhd");

  if (traits.length > 0 || profile.traits.other.trim()) {
    const allTraits = [
      ...traits.map((t) => TRAIT_LABELS[t]),
      ...(profile.traits.other.trim() ? [profile.traits.other.trim()] : []),
    ];
    lines.push(`You're working with someone with ${allTraits.join(", ")}.`);
    lines.push("");
  }

  if (hasPDA) {
    lines.push("**Demand framing matters most.** Use invitations, not instructions. \"You could try\" or \"one option is\" lands very differently than \"you should\" or \"your next step is\". Even tasks this person wants to do can become blocked when framed as obligations. Don't create urgency cues, don't imply they're behind, don't pile on tasks.");
    lines.push("");
  }

  lines.push("**One thing at a time.** Surface one relevant option. Wait until it's closed or declined before offering another.");
  lines.push("");

  if (hasADHD || profile.timeEnergy.patterns.includes("burst-worker")) {
    lines.push("**Bursts over schedules.** This person works in focused bursts, not sustained daily blocks. Don't build plans around daily consistency. Build around conditions: when interest is high, when energy is available, when urgency is real.");
    lines.push("");
  }

  const hasRecovery = profile.timeEnergy.patterns.includes("recovery-non-negotiable");
  if (hasRecovery) {
    lines.push("**Silence is planned rest, not failure.** If they go quiet for a while, don't treat it as abandonment or flag it as the process going stale. Recovery time is deliberate.");
    lines.push("");
  }

  if (traits.includes("autism") || profile.traits.manifestations.includes("autism-needs-why")) {
    lines.push("**The why matters before the what.** Include rationale before instructions, not after. This person needs to understand why something is worth doing before they can engage with how.");
    lines.push("");
  }

  // Activation summary
  const activationPatterns = profile.activation.patterns
    .filter((p) => p !== "other")
    .map((p) => ACTIVATION_LABELS[p]);
  if (profile.activation.patternOther.trim()) activationPatterns.push(profile.activation.patternOther.trim());
  if (activationPatterns.length > 0) {
    lines.push(`**What activates them:**\n${listItems(activationPatterns)}`);
    lines.push("");
  }

  // Shutdown summary
  const shutdownTriggers = profile.shutdown.triggers
    .filter((t) => t !== "other")
    .map((t) => SHUTDOWN_LABELS[t]);
  if (profile.shutdown.triggerOther.trim()) shutdownTriggers.push(profile.shutdown.triggerOther.trim());
  if (shutdownTriggers.length > 0) {
    lines.push(`**What to avoid recommending:**\n${listItems(shutdownTriggers)}`);
    lines.push("");
  }

  // Info preferences
  const infoPrefs: string[] = [];
  if (profile.infoConditions.density) {
    infoPrefs.push(`Density: ${INFO_DENSITY_LABELS[profile.infoConditions.density]}`);
  }
  const fmts = profile.infoConditions.formats.filter((f) => f !== "any").map((f) => INFO_FORMAT_LABELS[f]);
  if (fmts.length > 0) {
    infoPrefs.push(`Format: ${fmts.join(", ")}`);
  }
  if (infoPrefs.length > 0) {
    lines.push(`**Information preferences:** ${infoPrefs.join(" · ")}`);
  }

  return lines.join("\n");
}

export function buildNDProfileContext(profile: NDProfile): NDProfileContext {
  const traitLabels = [
    ...profile.traits.selected.map((trait) => TRAIT_LABELS[trait]),
    ...(profile.traits.other.trim() ? [profile.traits.other.trim()] : []),
  ];

  const manifestationLabels = profile.traits.manifestations
    .map((manifestation) => MANIFESTATION_LABELS[manifestation])
    .filter(Boolean);

  const activationPatterns = [
    ...profile.activation.patterns
      .filter((pattern) => pattern !== "other")
      .map((pattern) => ACTIVATION_LABELS[pattern]),
    ...(profile.activation.patternOther.trim() ? [profile.activation.patternOther.trim()] : []),
  ];

  const shutdownTriggers = [
    ...profile.shutdown.triggers
      .filter((trigger) => trigger !== "other")
      .map((trigger) => SHUTDOWN_LABELS[trigger]),
    ...(profile.shutdown.triggerOther.trim() ? [profile.shutdown.triggerOther.trim()] : []),
  ];

  const infoFormats = [
    ...profile.infoConditions.formats
      .filter((format) => format !== "any")
      .map((format) => INFO_FORMAT_LABELS[format]),
    ...(profile.infoConditions.formatOther.trim() ? [profile.infoConditions.formatOther.trim()] : []),
  ];

  const supportConditions = [
    ...profile.infoConditions.supportConditions
      .filter((condition) => condition !== "other")
      .map((condition) => SUPPORT_CONDITION_LABELS[condition]),
    ...(profile.infoConditions.conditionOther.trim() ? [profile.infoConditions.conditionOther.trim()] : []),
  ];

  const summaryParts = [
    traitLabels.length > 0 ? `Neurotype context: ${traitLabels.join(", ")}.` : "",
    activationPatterns.length > 0 ? `What tends to activate them: ${activationPatterns.slice(0, 4).join("; ")}.` : "",
    shutdownTriggers.length > 0 ? `What tends to trigger avoidance or shutdown: ${shutdownTriggers.slice(0, 4).join("; ")}.` : "",
    profile.timeEnergy.activationWindows.trim() ? `Natural working windows: ${profile.timeEnergy.activationWindows.trim()}.` : "",
    profile.timeEnergy.unavailablePeriods.trim() ? `Protected unavailable periods: ${profile.timeEnergy.unavailablePeriods.trim()}.` : "",
    profile.infoConditions.density ? `Preferred information density: ${INFO_DENSITY_LABELS[profile.infoConditions.density]}.` : "",
  ].filter(Boolean);

  return {
    summary: summaryParts.join(" "),
    traitLabels,
    manifestationLabels,
    activationPatterns,
    goodDayDescription: profile.activation.goodDayDescription.trim(),
    shutdownTriggers,
    shutdownDescription: profile.shutdown.shutdownDescription.trim(),
    activationWindows: profile.timeEnergy.activationWindows.trim(),
    unavailablePeriods: profile.timeEnergy.unavailablePeriods.trim(),
    triedSystems: profile.history.triedSystems.trim(),
    whatWorked: profile.history.whatWorked.trim(),
    whatFailed: profile.history.whatFailed.trim(),
    infoDensity: profile.infoConditions.density ? INFO_DENSITY_LABELS[profile.infoConditions.density] : "",
    infoFormats,
    supportConditions,
    agentGuidance: buildAgentInstructions(profile),
  };
}

export { listItems };
