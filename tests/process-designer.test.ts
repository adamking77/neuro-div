import { describe, expect, it } from "vitest";
import { buildNDProfileContext, createEmptyNDProfile } from "../src/lib/nd-profile";
import { buildProcessMarkdown, buildProcessPlan } from "../src/lib/process-designer";

describe("process designer", () => {
  it("builds a profile-aware process plan", () => {
    const profile = createEmptyNDProfile();
    profile.activation.patterns = ["deep-interest", "clear-bounded"];
    profile.activation.goodDayDescription = "I can focus when the work is clearly scoped.";
    profile.shutdown.triggers = ["blank-page", "waiting"];
    profile.timeEnergy.activationWindows = "Late morning and late evening.";
    profile.timeEnergy.unavailablePeriods = "Post-launch recovery days.";
    profile.infoConditions.supportConditions = ["low-stakes-start", "body-doubling"];

    const plan = buildProcessPlan(
      {
        goal: "Turn scattered workshop notes into a usable offer",
        whyNow: "The material already exists and people keep asking for it.",
        successSignal: "One clean outline and one page I could show someone.",
        existingAssets: "Voice notes, draft slides, a half-written page.",
        frictionPoints: "It gets too open-ended and I disappear.",
        notDoing: "No live launch week\nNo daily posting plan",
      },
      buildNDProfileContext(profile),
    );

    expect(plan.thesis).toContain("This works by your energy, not a schedule.");
    expect(plan.workingWith.join(" ")).toContain("Late morning and late evening.");
    expect(plan.protectedConditions.join(" ")).toContain("Post-launch recovery days.");
    expect(plan.notDoing).toContain("No live launch week");
    expect(plan.blocks).toHaveLength(4);
    expect(plan.agentBrief).toContain("What's actually available today?");
  });

  it("exports markdown with move menu and not-today handling", () => {
    const plan = buildProcessPlan(
      {
        goal: "Ship the first draft of a workshop",
        whyNow: "",
        successSignal: "A draft exists in a form I can revisit.",
        existingAssets: "",
        frictionPoints: "",
        notDoing: "",
      },
      null,
    );

    const markdown = buildProcessMarkdown(
      {
        goal: "Ship the first draft of a workshop",
        whyNow: "",
        successSignal: "A draft exists in a form I can revisit.",
        existingAssets: "",
        frictionPoints: "",
        notDoing: "",
      },
      plan,
    );

    expect(markdown).toContain("## Step menu");
    expect(markdown).toContain("## Rescue steps");
    expect(markdown).toContain("**Not today:**");
    expect(markdown).toContain("## Agent brief");
  });
});
