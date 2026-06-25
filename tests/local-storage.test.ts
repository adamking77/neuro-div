import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildDeterministicAnalysisReport,
  getAnalysisReport,
  listAnalysisReports,
  renameAnalysisReport,
  saveAnalysisReport,
} from "../src/lib/analysis-reports";
import {
  buildNDProfileContext,
  createEmptyNDProfile,
  loadNDProfile,
  loadNDProfileContext,
  saveNDProfile,
} from "../src/lib/nd-profile";
import {
  buildProcessPlan,
  createEmptyProcessDesignerInputs,
  listProcessArtifacts,
  loadCurrentProcessArtifactId,
  loadProcessArtifact,
  loadProcessDesignerDraft,
  renameProcessArtifact,
  saveCurrentProcessArtifactId,
  saveProcessArtifact,
  saveProcessDesignerDraft,
} from "../src/lib/process-designer";

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.values.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe("localStorage persistence contracts", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-25T12:00:00.000Z"));
    Object.defineProperty(globalThis, "localStorage", {
      value: new MemoryStorage(),
      configurable: true,
      writable: true,
    });
  });

  it("preserves the nd-profile payload shape and derived context", () => {
    const profile = createEmptyNDProfile();
    profile.traits.selected = ["adhd", "autism"];
    profile.activation.patterns = ["deep-interest", "clear-bounded"];
    profile.activation.goodDayDescription = "A good session has a bounded problem and a visible finish line.";
    profile.shutdown.triggers = ["blank-page", "waiting"];
    profile.timeEnergy.activationWindows = "Late morning.";
    profile.infoConditions.supportConditions = ["low-stakes-start"];

    saveNDProfile(profile);

    const raw = localStorage.getItem("nd-profile");
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw as string)).toMatchObject({
      version: 1,
      updatedAt: "2026-06-25T12:00:00.000Z",
      activation: {
        patterns: ["deep-interest", "clear-bounded"],
      },
    });

    expect(loadNDProfile()).toMatchObject({
      traits: { selected: ["adhd", "autism"] },
      shutdown: { triggers: ["blank-page", "waiting"] },
    });

    expect(loadNDProfileContext()).toEqual(buildNDProfileContext(profile));
  });

  it("preserves process draft, artifacts, and current-artifact keys", () => {
    const inputs = {
      ...createEmptyProcessDesignerInputs(),
      goal: "Turn workshop notes into a usable offer",
      successSignal: "One clean outline exists.",
      frictionPoints: "It becomes too open ended.",
      notDoing: "No launch week",
    };
    const plan = buildProcessPlan(inputs, null);

    saveProcessDesignerDraft(inputs, "process-a");
    saveCurrentProcessArtifactId("process-a");
    const saved = saveProcessArtifact(inputs, plan, "process-a");

    expect(saved.id).toBe("process-a");
    expect(localStorage.getItem("nd-process-designer")).not.toBeNull();
    expect(localStorage.getItem("nd-process-designer-artifacts")).not.toBeNull();
    expect(localStorage.getItem("nd-process-designer-current")).toBe("process-a");

    expect(loadProcessDesignerDraft()).toMatchObject({
      currentArtifactId: "process-a",
      inputs: {
        goal: "Turn workshop notes into a usable offer",
      },
    });
    expect(loadCurrentProcessArtifactId()).toBe("process-a");
    expect(loadProcessArtifact("process-a")).toMatchObject({
      id: "process-a",
      inputs: {
        notDoing: "No launch week",
      },
      plan: {
        goal: "Turn workshop notes into a usable offer",
      },
    });

    renameProcessArtifact("process-a", "Offer outline");
    expect(listProcessArtifacts()).toHaveLength(1);
    expect(listProcessArtifacts()[0]).toMatchObject({
      id: "process-a",
      name: "Offer outline",
    });
  });

  it("preserves saved analysis reports under nd-analysis-reports", () => {
    const inputs = {
      ...createEmptyProcessDesignerInputs(),
      goal: "Ship an ND operating brief",
      successSignal: "A report exists.",
    };
    const plan = buildProcessPlan(inputs, null);
    const report = buildDeterministicAnalysisReport({
      profile: null,
      profileContext: null,
      processInputs: inputs,
      processPlan: plan,
    });

    const saved = saveAnalysisReport({ ...report, id: "report-a" });

    expect(saved.id).toBe("report-a");
    expect(localStorage.getItem("nd-analysis-reports")).not.toBeNull();
    expect(getAnalysisReport("report-a")).toMatchObject({
      id: "report-a",
      processSnapshot: {
        inputs: {
          goal: "Ship an ND operating brief",
        },
      },
      model: {
        provider: "deterministic",
      },
    });

    renameAnalysisReport("report-a", "Operating brief report");
    expect(listAnalysisReports()).toHaveLength(1);
    expect(listAnalysisReports()[0].title).toBe("Operating brief report");
  });
});
