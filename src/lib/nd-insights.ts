import type { NDProfile } from "../types";
import { ACTIVATION_LABELS, SHUTDOWN_LABELS } from "./nd-profile";

/**
 * Derived insights about how a person works — claims the data supports, not a
 * restatement of what they typed. Each insight is falsifiable: if it's wrong
 * for a given person it reads as "not quite," never as a diagnosis.
 *
 * Discipline: only emit a claim when the underlying conditions are actually
 * present in the profile. No claim is fabricated to fill space.
 */

export interface ProfileInsight {
  /** Short mono eyebrow, e.g. "OPERATING WINDOW". */
  kind: string;
  /** The plain-language claim. Confident, named, specific. */
  claim: string;
  /** The move it implies, i.e. what to actually DO with the insight. Concrete,
   * doable today. This is the prescription, not just the diagnosis. */
  action: string;
  /** A few-word distillation for the end-of-page recap. Not a command, just the
   * essence, so the closing summary digests the insights instead of reprinting
   * the full claim and action. */
  summary: string;
}

/** A single activator vs shutdown axis for the operating-window view. */
export interface OperatingWindow {
  activators: string[];
  shutdowns: string[];
  /** The derived "sweet spot" sentence, present only when both sides exist. */
  sweetSpot: string | null;
}

function has<T>(arr: T[], value: T): boolean {
  return arr.includes(value);
}

export function buildOperatingWindow(profile: NDProfile): OperatingWindow {
  const activators = [
    ...profile.activation.patterns.filter((p) => p !== "other").map((p) => ACTIVATION_LABELS[p]),
    ...(profile.activation.patternOther.trim() ? [profile.activation.patternOther.trim()] : []),
  ];
  const shutdowns = [
    ...profile.shutdown.triggers.filter((t) => t !== "other").map((t) => SHUTDOWN_LABELS[t]),
    ...(profile.shutdown.triggerOther.trim() ? [profile.shutdown.triggerOther.trim()] : []),
  ];

  const a = profile.activation.patterns;
  const s = profile.shutdown.triggers;

  // Derive the sweet spot from the specific tension between what pulls them in
  // and what pushes them out. Most specific match wins.
  let sweetSpot: string | null = null;
  if ((has(a, "deadline") || has(a, "urgency")) && has(s, "being-evaluated")) {
    sweetSpot = "Real deadlines move you, but being watched shuts you down. Your sweet spot is a firm deadline with nobody looking over your shoulder. Finish it first, show it later.";
  } else if (has(a, "deep-interest") && (has(s, "admin-repetitive") || has(s, "open-ended"))) {
    sweetSpot = "You run on genuine interest and stall on admin or open-ended work. Start with the part you care about. Save the rest for one batch, or pass it to someone else, but never open with it.";
  } else if (has(a, "collaboration") && has(s, "live-calls")) {
    sweetSpot = "Working with someone gives you energy, but live calls drain you. Your real form of teamwork is probably side by side in silence, or trading messages, rather than on a call.";
  } else if (has(a, "creative-freedom") && has(s, "open-ended")) {
    sweetSpot = "You need room to do it your way, yet a completely blank page stalls you. A loose brief with one firm edge works far better than total freedom.";
  } else if (activators.length > 0 && shutdowns.length > 0) {
    sweetSpot = `Open with what gets you going (${activators[0].toLowerCase()}), and keep ${shutdowns[0].toLowerCase()} out of the first step.`;
  }

  return { activators, shutdowns, sweetSpot };
}

/** A derived 0-100 axis for the operating-profile radar. */
export interface ProfileAxis {
  key: string;
  label: string;
  value: number;
}

/**
 * Build a six-axis "operating shape" from what the person selected. Each axis
 * is a derived display value (0-100), NOT a clinical score — it reflects how
 * many of the relevant signals they marked, scaled to a readable range. The
 * point is the *shape*, so someone can see at a glance where their weight sits.
 */
export function buildProfileRadar(profile: NDProfile): ProfileAxis[] {
  const m = profile.traits.manifestations;
  const a = profile.activation.patterns;
  const s = profile.shutdown.triggers;
  const t = profile.timeEnergy.patterns;

  // Each axis: count relevant signals, scale so a couple of hits already reads
  // as present. Capped at 100. Floor of ~12 keeps every axis visible on the web.
  const scale = (hits: number, perHit = 26) => Math.max(12, Math.min(100, hits * perHit));

  const drive = scale(
    a.filter((p) => ["novelty", "deadline", "urgency", "challenge", "deep-interest"].includes(p)).length,
  );
  const focus = scale(
    [
      has(m, "adhd-hyperfocus"),
      has(m, "autism-deep-interests"),
      has(a, "deep-interest"),
      has(a, "creative-freedom"),
    ].filter(Boolean).length,
    30,
  );
  const structure = scale(
    [
      has(t, "needs-external-structure"),
      has(a, "clear-bounded"),
      has(m, "autism-clear-expectations"),
      has(s, "open-ended"),
    ].filter(Boolean).length,
    30,
  );
  const sensory = scale(
    [
      has(profile.traits.selected, "sensory"),
      has(m, "sensory-sound"),
      has(m, "sensory-light"),
      has(m, "sensory-environment"),
      has(m, "autism-sensory"),
    ].filter(Boolean).length,
    26,
  );
  const socialCost = scale(
    s.filter((x) => ["cold-outreach", "live-calls", "being-evaluated", "social-posting"].includes(x)).length,
  );
  const recovery = scale(
    [
      has(t, "recovery-non-negotiable"),
      has(t, "burst-worker"),
      has(t, "peak-windows"),
      profile.timeEnergy.unavailablePeriods.trim().length > 0,
    ].filter(Boolean).length,
    30,
  );

  return [
    { key: "drive", label: "Drive", value: drive },
    { key: "focus", label: "Focus", value: focus },
    { key: "structure", label: "Structure need", value: structure },
    { key: "sensory", label: "Sensory load", value: sensory },
    { key: "social", label: "Social cost", value: socialCost },
    { key: "recovery", label: "Recovery need", value: recovery },
  ];
}

/**
 * The payoff, in the AI's voice-of-action: concrete things an agent will do
 * differently once it has this profile. Derived from what the person selected,
 * phrased as outcomes ("it'll…") rather than self-knowledge, so the handoff
 * promise is felt, not abstract. Capped so it stays scannable.
 */
export function buildAgentBenefits(profile: NDProfile): string[] {
  const traits = profile.traits.selected;
  const m = profile.traits.manifestations;
  const t = profile.timeEnergy.patterns;
  const a = profile.activation.patterns;
  const hasActivators =
    a.some((p) => p !== "other") || profile.activation.patternOther.trim().length > 0;
  const hasShutdowns =
    profile.shutdown.triggers.some((x) => x !== "other") || profile.shutdown.triggerOther.trim().length > 0;

  const out: string[] = [];

  if (has(traits, "pda")) {
    out.push("Offer you choices instead of orders, so tasks don't turn into walls.");
  }

  // The product's core promise — true for everyone, so it always anchors the list.
  out.push("Give you one step at a time, never a pile of tasks at once.");

  if (has(t, "burst-worker") || has(t, "recovery-non-negotiable") || has(t, "peak-windows")) {
    out.push("Plan around your bursts, and treat quiet stretches as rest, not falling behind.");
  }

  if (hasActivators && hasShutdowns) {
    out.push("Steer toward what gets you going and away from what shuts you down.");
  } else if (hasActivators) {
    out.push("Lead with what gets you going.");
  }

  if (has(traits, "autism") || has(m, "autism-needs-why")) {
    out.push("Explain why something matters before telling you how to do it.");
  }

  if (
    (has(m, "adhd-time-blindness") || has(t, "time-blindness")) &&
    (has(a, "deadline") || has(t, "deadline-engine"))
  ) {
    out.push("Give you visible deadlines instead of vague, someday timelines.");
  }

  if (profile.infoConditions.density || profile.infoConditions.formats.some((f) => f !== "any")) {
    out.push("Keep answers at the length and in the format you take in best.");
  }

  return out.slice(0, 4);
}

export function buildProfileInsights(profile: NDProfile): ProfileInsight[] {
  const insights: ProfileInsight[] = [];

  const a = profile.activation.patterns;
  const s = profile.shutdown.triggers;
  const t = profile.timeEnergy.patterns;
  const m = profile.traits.manifestations;
  const support = profile.infoConditions.supportConditions;
  const traits = profile.traits.selected;

  // 1. History reframe — failure as fit, not discipline. Strongest claim.
  const burstRhythm =
    has(t, "burst-worker") || has(t, "peak-windows") || has(t, "recovery-non-negotiable");
  const historyMentionsFailure = profile.history.whatFailed.trim().length > 0;
  if (burstRhythm && (historyMentionsFailure || has(t, "needs-external-structure"))) {
    insights.push({
      kind: "Why past systems failed",
      claim:
        "This isn't a discipline problem. You work in bursts and then genuinely need to recover. Daily-streak systems were built for a steady rhythm you don't have.",
      action:
        "Drop anything with streaks or daily check-ins. Plan in work sessions, not days, and let the quiet days stay quiet.",
      summary: "You work in bursts and recover, not in daily streaks.",
    });
  }

  // 2. Body-doubling vs live-calls — name the specific form of support.
  if (has(support, "body-doubling") && has(s, "live-calls")) {
    insights.push({
      kind: "How support works for you",
      claim:
        "Having someone there helps you, but live calls shut you down. What you actually want is company without being put on the spot: someone working alongside you, not a meeting.",
      action:
        "Work next to someone with mics off, or message back and forth, instead of booking a call. When a call gets offered, send a short recording instead.",
      summary: "You want company alongside you, not live calls.",
    });
  }

  // 3. PDA framing — the single highest-leverage instruction for any agent.
  if (has(traits, "pda")) {
    insights.push({
      kind: "What changes everything",
      claim:
        "The wording of a task decides whether you can do it. \"You could\" leaves the door open. \"You should\" slams it shut, even on work you actually want to do.",
      action:
        "When something feels like a wall, rewrite it. Swap \"I have to\" for \"I could.\" Give yourself the choice instead of the order.",
      summary: "Wording decides what's doable: invitations open, orders close.",
    });
  }

  // 4. Time-blindness + deadline engine — the trap and the lever together.
  if (has(t, "time-blindness") && (has(a, "deadline") || has(t, "deadline-engine"))) {
    insights.push({
      kind: "Your timing pattern",
      claim:
        "Deadlines are what get you moving, but you lose track of time, so they stay invisible until they're right on top of you. A countdown you can actually see isn't a nice-to-have for you. It's the thing that makes deadlines work.",
      action:
        "Put a visible countdown on anything that matters. If a task has no real deadline, give it one anyway and treat it as firm.",
      summary: "Deadlines move you, but only when you can see them.",
    });
  }

  // 5. Recovery is structural — protect quiet so it isn't read as drift.
  if (has(t, "recovery-non-negotiable") && profile.timeEnergy.unavailablePeriods.trim()) {
    insights.push({
      kind: "Protected by design",
      claim:
        "Your quiet stretches are planned rest, not slacking off. Any system that treats going quiet as falling behind is working against you.",
      action:
        "Block your recovery time in your calendar like real appointments, and switch off any \"you're behind\" reminders in your apps.",
      summary: "Your quiet stretches are planned rest, not slipping.",
    });
  }

  // The rules below are broader and fire on common single-trait profiles, so the
  // page rarely comes back empty. They're appended after the specific ones above
  // and the whole list is capped, so a sharp match always wins the top slots.

  // 6. Starting is the wall — hard-to-start or blank-page dread.
  if (has(m, "adhd-hard-to-start") || has(s, "blank-page")) {
    insights.push({
      kind: "Where it gets stuck",
      claim:
        "Starting is the hardest part for you, even on things you genuinely want to do. The blank page is the wall, not the work itself.",
      action:
        "Never start from nothing. Open the real file and make it smaller first: cross something out, rename it, or jot the one next question. Lower the bar until it's easy to clear.",
      summary: "Starting is the wall, not the work itself.",
    });
  }

  // 7. Needs the why and a clear finish — autism / vague-is-stressful.
  if (has(traits, "autism") || has(m, "autism-needs-why") || has(m, "autism-clear-expectations")) {
    insights.push({
      kind: "What you need up front",
      claim:
        "Vague instructions aren't just annoying for you, they're genuinely hard to act on. You need to know why something matters and what \"finished\" looks like before you can move on it.",
      action:
        "Before you start anything, write one line on why it's worth doing and one line on how you'll know it's done. If someone hands you vague work, ask them for both.",
      summary: "You need the why and a clear finish before you can move.",
    });
  }

  // 8. Environment is step zero — sensory load.
  if (
    has(traits, "sensory") ||
    has(m, "sensory-sound") ||
    has(m, "sensory-light") ||
    has(m, "sensory-environment") ||
    has(m, "autism-sensory")
  ) {
    insights.push({
      kind: "Your hidden precondition",
      claim:
        "Your surroundings aren't a background detail, they decide whether you can work at all. The wrong room can cost you a whole session before you've even started.",
      action:
        "Sort the space before the task: sound, light, and where you sit. Treat a workable environment as step zero, not a luxury to fix later.",
      summary: "The right environment is step zero, not a luxury.",
    });
  }

  // 9. Takes information in better by ear or picture — dyslexia.
  if (
    has(traits, "dyslexia") ||
    has(m, "dyslexia-oral-better") ||
    has(m, "dyslexia-reading-effort") ||
    has(m, "dyslexia-visual-spatial")
  ) {
    insights.push({
      kind: "How information should reach you",
      claim:
        "Dense text is slow and tiring for you to get through. It isn't about effort, it's just not the way you take information in best.",
      action:
        "Get things by ear or by picture wherever you can: read-aloud tools, a quick diagram, a voice note instead of a wall of text. Ask people to send you the short version.",
      summary: "Information lands better by ear or picture than dense text.",
    });
  }

  // 10. Structure has to come from outside — drift without it.
  if (has(t, "needs-external-structure")) {
    insights.push({
      kind: "Where structure has to come from",
      claim:
        "Left to an open week, you tend to drift. That's not a willpower gap. It just means the structure has to come from outside you, not from inside.",
      action:
        "Borrow structure from the outside: a set time, a person expecting something, a list you can see. Don't rely on remembering or on feeling like it.",
      summary: "Structure has to come from outside, not willpower.",
    });
  }

  // Cap so a busy profile stays readable. Specific rules sit first, so they keep
  // the top slots; the broader ones only fill space that's left.
  return insights.slice(0, 6);
}
