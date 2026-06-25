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
  /** The move it implies — what to actually DO with the insight. Concrete,
   * doable today. This is the prescription, not just the diagnosis. */
  action: string;
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
    sweetSpot = "Real deadlines move you, but being watched shuts you down. Your sweet spot is a hard deadline with no audience — ship first, show later.";
  } else if (has(a, "deep-interest") && (has(s, "admin-repetitive") || has(s, "open-ended"))) {
    sweetSpot = "You run on genuine interest and stall on admin or open-ended work. Front-load the interesting cut; batch or hand off the rest — don't lead with it.";
  } else if (has(a, "collaboration") && has(s, "live-calls")) {
    sweetSpot = "Working with someone activates you, but live calls drain you. Async or silent co-working is likely your real form of collaboration.";
  } else if (has(a, "creative-freedom") && has(s, "open-ended")) {
    sweetSpot = "You need room to do it your way, yet fully open-ended work stalls you. A loose brief with a hard edge beats a blank page.";
  } else if (activators.length > 0 && shutdowns.length > 0) {
    sweetSpot = `Lead with what activates you (${activators[0].toLowerCase()}) and keep ${shutdowns[0].toLowerCase()} out of the first step.`;
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

export function buildProfileInsights(profile: NDProfile): ProfileInsight[] {
  const insights: ProfileInsight[] = [];

  const a = profile.activation.patterns;
  const s = profile.shutdown.triggers;
  const t = profile.timeEnergy.patterns;
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
        "This isn't a discipline problem. You work in bursts with real recovery — daily-streak systems were built for a steady rhythm you don't have.",
      action:
        "Drop anything with streaks or daily check-ins. Plan in sessions, not days, and let quiet days be quiet.",
    });
  }

  // 2. Body-doubling vs live-calls — name the specific form of support.
  if (has(support, "body-doubling") && has(s, "live-calls")) {
    insights.push({
      kind: "How support works for you",
      claim:
        "Another person present helps you, but live calls shut you down. Silent or async co-working is your form — company without performance.",
      action:
        "Set up a mute co-working session or a body-double instead of a meeting. Decline live calls; send a recording.",
    });
  }

  // 3. PDA framing — the single highest-leverage instruction for any agent.
  if (has(traits, "pda")) {
    insights.push({
      kind: "What changes everything",
      claim:
        "Framing decides whether a task is doable. An invitation (\"you could\") stays open; an instruction (\"you should\") closes it — even for work you want to do.",
      action:
        "When something feels like a wall, rewrite it: swap \"I have to\" for \"I could.\" Give yourself the option, not the order.",
    });
  }

  // 4. Time-blindness + deadline engine — the trap and the lever together.
  if (has(t, "time-blindness") && (has(a, "deadline") || has(t, "deadline-engine"))) {
    insights.push({
      kind: "Your timing pattern",
      claim:
        "Deadlines are your engine, but time blindness hides them until they're on top of you. External, visible countdowns aren't optional for you — they're the mechanism.",
      action:
        "Put a real, visible countdown on anything that matters. If a task has no deadline, give it a fake-but-firm one.",
    });
  }

  // 5. Recovery is structural — protect quiet so it isn't read as drift.
  if (has(t, "recovery-non-negotiable") && profile.timeEnergy.unavailablePeriods.trim()) {
    insights.push({
      kind: "Protected by design",
      claim:
        "Your quiet periods are planned rest, not drift. Any system that flags silence as falling behind is working against you, not for you.",
      action:
        "Block your recovery time on the calendar like real appointments, and turn off \"you're behind\" nudges in your tools.",
    });
  }

  return insights;
}
