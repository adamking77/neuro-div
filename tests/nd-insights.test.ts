import { describe, expect, it } from "vitest";
import { createEmptyNDProfile } from "../src/lib/nd-profile";
import { buildProfileInsights, buildOperatingWindow } from "../src/lib/nd-insights";
import type { NDProfile } from "../src/types";

function profile(overrides: (p: NDProfile) => void): NDProfile {
  const p = createEmptyNDProfile();
  overrides(p);
  return p;
}

describe("buildProfileInsights", () => {
  it("emits nothing for an empty profile (no fabricated claims)", () => {
    expect(buildProfileInsights(createEmptyNDProfile())).toEqual([]);
  });

  it("gives every insight a concrete action (the move, not just the diagnosis)", () => {
    const p = profile((p) => {
      p.traits.selected = ["pda"];
      p.timeEnergy.patterns = ["burst-worker", "recovery-non-negotiable"];
      p.timeEnergy.unavailablePeriods = "Sundays.";
      p.history.whatFailed = "Streak apps collapsed.";
      p.infoConditions.supportConditions = ["body-doubling"];
      p.shutdown.triggers = ["live-calls"];
    });
    const insights = buildProfileInsights(p);
    expect(insights.length).toBeGreaterThan(0);
    for (const i of insights) {
      expect(i.action.trim().length).toBeGreaterThan(0);
    }
  });

  it("reframes failed systems as fit when burst rhythm + reported failure are present", () => {
    const p = profile((p) => {
      p.timeEnergy.patterns = ["burst-worker", "recovery-non-negotiable"];
      p.history.whatFailed = "Streak apps collapsed after one missed day.";
    });
    const insights = buildProfileInsights(p);
    expect(insights.some((i) => i.kind === "Why past systems failed")).toBe(true);
  });

  it("does not reframe history without a burst/recovery rhythm", () => {
    const p = profile((p) => {
      p.history.whatFailed = "I just got bored.";
    });
    expect(buildProfileInsights(p).some((i) => i.kind === "Why past systems failed")).toBe(false);
  });

  it("names PDA framing as the highest-leverage instruction", () => {
    const p = profile((p) => {
      p.traits.selected = ["pda"];
    });
    expect(buildProfileInsights(p).some((i) => i.kind === "What changes everything")).toBe(true);
  });

  it("surfaces async co-working when body-doubling helps but live-calls drain", () => {
    const p = profile((p) => {
      p.infoConditions.supportConditions = ["body-doubling"];
      p.shutdown.triggers = ["live-calls"];
    });
    expect(buildProfileInsights(p).some((i) => i.kind === "How support works for you")).toBe(true);
  });
});

describe("buildOperatingWindow", () => {
  it("derives the deadline-without-audience sweet spot", () => {
    const p = profile((p) => {
      p.activation.patterns = ["deadline"];
      p.shutdown.triggers = ["being-evaluated"];
    });
    const w = buildOperatingWindow(p);
    expect(w.sweetSpot).toContain("nobody looking over your shoulder");
    expect(w.activators.length).toBe(1);
    expect(w.shutdowns.length).toBe(1);
  });

  it("returns no sweet spot when one side is empty", () => {
    const p = profile((p) => {
      p.activation.patterns = ["deadline"];
    });
    expect(buildOperatingWindow(p).sweetSpot).toBeNull();
  });
});
