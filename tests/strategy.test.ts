import { describe, expect, it } from "vitest";
import { PHASES } from "../src/phases";
import {
  buildExaSearchRequest,
  buildFallbackStrategyDraft,
  buildStrategyDraftPrompt,
  getAnthropicConfig,
  getExaConfig,
  mergeStrategyCitations,
  parseExaSearchResponse,
  parseStrategyDraftInput,
  parseStrategyDraftText,
  parseExaTaskResponse,
  validateStrategyDraftRequest,
} from "../src/lib/strategy-api";
import {
  condensePhaseResearch,
  createEmptyStrategyInputs,
  getStrategyFingerprint,
  getStrategyReadiness,
  hasCompleteStrategyDraft,
} from "../src/lib/strategy";
import type { PhaseResult } from "../src/types";

function createPhases(overrides: Partial<Record<number, PhaseResult>> = {}) {
  return Object.fromEntries(
    PHASES.map((phase) => [
      phase.id,
      overrides[phase.id] ?? { status: "idle", results: [] },
    ]),
  ) as Record<number, PhaseResult>;
}

describe("strategy readiness", () => {
  it("requires four completed phases and phases 1, 3, and 5 with results", () => {
    const phases = createPhases({
      1: { status: "done", results: [{ id: "1", url: "https://a.com", highlights: ["a"] }] },
      2: { status: "done", results: [{ id: "2", url: "https://b.com", highlights: ["b"] }] },
      3: { status: "done", results: [{ id: "3", url: "https://c.com", highlights: ["c"] }] },
      4: { status: "done", results: [{ id: "4", url: "https://d.com", highlights: ["d"] }] },
    });

    expect(getStrategyReadiness(phases)).toEqual({
      ready: false,
      doneCount: 4,
      missingRequired: [5],
    });
  });
});

describe("condensePhaseResearch", () => {
  it("limits each phase to five results and two highlights", () => {
    const phases = createPhases({
      1: {
        status: "done",
        results: Array.from({ length: 6 }, (_, index) => ({
          id: `${index}`,
          url: `https://example.com/${index}`,
          title: `Result ${index}`,
          score: 0.9 - index * 0.01,
          publishedDate: "2026-04-01",
          highlights: ["one", "two", "three"],
        })),
      },
    });

    const condensed = condensePhaseResearch(phases);

    expect(condensed).toHaveLength(1);
    expect(condensed[0].results).toHaveLength(5);
    expect(condensed[0].results[0].highlights).toEqual(["one", "two"]);
  });
});

describe("strategy fingerprinting", () => {
  it("changes when strategy inputs change", () => {
    const phases = createPhases({
      1: { status: "done", results: [{ id: "1", url: "https://a.com", highlights: ["a"] }] },
      3: { status: "done", results: [{ id: "3", url: "https://c.com", highlights: ["c"] }] },
      5: { status: "done", results: [{ id: "5", url: "https://e.com", highlights: ["e"] }] },
      6: { status: "done", results: [{ id: "6", url: "https://f.com", highlights: ["f"] }] },
    });
    const inputs = createEmptyStrategyInputs();

    const first = getStrategyFingerprint({
      problem: "teams struggle to adopt AI tooling",
      knownPlayers: "",
      phases,
      strategyInputs: inputs,
    });

    const second = getStrategyFingerprint({
      problem: "teams struggle to adopt AI tooling",
      knownPlayers: "",
      phases,
      strategyInputs: { ...inputs, audienceLens: "founders avoiding social posting" },
    });

    expect(first).not.toEqual(second);
  });
});

describe("strategy draft completeness", () => {
  it("does not treat citation-only drafts with blank sections as complete", () => {
    expect(hasCompleteStrategyDraft(null)).toBe(false);
    expect(hasCompleteStrategyDraft({
      sections: {
        positioning: "",
        channelPlan: "Channels",
        messageAngles: "Angles",
        assetIdeas: "Assets",
        experiments: "Experiments",
        thirtyDaySequence: "Sequence",
      },
      warnings: ["Warning"],
      citations: [
        {
          section: "positioning",
          title: "Source",
          url: "https://example.com",
        },
      ],
      generatedAt: "2026-04-24T00:00:00.000Z",
    })).toBe(false);
    expect(hasCompleteStrategyDraft({
      sections: {
        positioning: "Positioning",
        channelPlan: "Channels",
        messageAngles: "Angles",
        assetIdeas: "Assets",
        experiments: "Experiments",
        thirtyDaySequence: "Sequence",
      },
      warnings: [],
      citations: [],
      generatedAt: "2026-04-24T00:00:00.000Z",
    })).toBe(true);
  });
});

describe("strategy API helpers", () => {
  it("rejects missing Anthropic credentials", () => {
    expect(() => getAnthropicConfig({})).toThrow("ANTHROPIC_API_KEY not configured");
  });

  it("rejects missing Exa credentials", () => {
    expect(() => getExaConfig({})).toThrow("EXA_API_KEY not configured");
  });

  it("validates the draft request payload", () => {
    expect(() => validateStrategyDraftRequest({})).toThrow("problem is required");
  });

  it("builds Exa research and Anthropic prompts with low-contact guidance", () => {
    const payload = {
      problem: "manual reporting wastes time",
      knownPlayers: "",
      audienceLens: "operators who avoid networking",
      founderConstraints: {
        teamSize: "solo",
        budgetBand: "low",
        weeklyCapacity: "4 hours",
        socialPostingTolerance: "avoid",
        channelAvoidances: "LinkedIn and live events",
        outreachTolerance: ["inbound-only", "warm-intro-ok"],
        contentMode: ["writing"],
        contentModeOther: "",
        existingAssets: [
          {
            name: "",
            url: "",
            description: "",
          },
        ],
      },
      phaseResearch: [
        {
          phaseId: 1,
          phaseName: "Problem Cartography",
          description: "desc",
          results: [
            {
              title: "Source",
              url: "https://example.com",
              highlights: ["Teams hate manual reporting."],
            },
          ],
        },
      ],
    };

    const exaRequest = buildExaSearchRequest(payload, "deep-reasoning");
    const prompt = buildStrategyDraftPrompt(payload, {
      dossier: {
        audienceSignals: ["Audience avoids networking-heavy channels."],
        positioningEdges: ["Async credibility beats personal brand volume."],
        lowContactChannels: [
          {
            channel: "Search-driven templates",
            fit: "Matches intent without social maintenance.",
            evidence: "Buyers search for fixes asynchronously.",
            caution: "Needs clear conversion path.",
          },
        ],
        messagePatterns: ["Stress relief and predictability outperform hype."],
        assetDirections: ["Create diagnostic checklists and teardown assets."],
        experimentLevers: [
          {
            experiment: "Launch a searchable teardown page",
            rationale: "Captures existing intent",
            successMetric: "Qualified replies",
          },
        ],
        risks: ["Avoid channels that require constant posting to stay visible."],
      },
      citations: {
        lowContactChannels: [
          {
            title: "Source",
            url: "https://example.com",
            snippet: "Teams hate manual reporting.",
          },
        ],
      },
    });

    expect(exaRequest.query).toContain("low-contact");
    expect(exaRequest.type).toBe("deep-reasoning");
    expect(exaRequest.outputSchema.properties.lowContactChannels.items.type).toBe("string");
    expect(prompt.system).toContain("PDA");
    expect(prompt.system).toContain("create-once");
    expect(prompt.user).toContain("operators who avoid networking");
    expect(prompt.user).toContain("warm introductions only");
    expect(prompt.user).not.toContain("Existing Work and Assets");

    const otherPrompt = buildStrategyDraftPrompt({
      ...payload,
      founderConstraints: {
        ...payload.founderConstraints,
        contentMode: ["other"],
        contentModeOther: "interactive calculators and diagnostics",
      },
    }, {
      dossier: {
        audienceSignals: [],
        positioningEdges: [],
        lowContactChannels: [],
        messagePatterns: [],
        assetDirections: [],
        experimentLevers: [],
        risks: [],
      },
      citations: {},
    });

    expect(otherPrompt.user).toContain("interactive calculators and diagnostics");

    const assetPrompt = buildStrategyDraftPrompt({
      ...payload,
      founderConstraints: {
        ...payload.founderConstraints,
        existingAssets: [
          {
            name: "GenZen Solutions",
            url: "genzen.solutions",
            description: "counter-exploitation agency, 6 years running",
          },
          {
            name: "",
            url: "empty-name.example.com",
            description: "should not appear",
          },
        ],
      },
    }, {
      dossier: {
        audienceSignals: [],
        positioningEdges: [],
        lowContactChannels: [],
        messagePatterns: [],
        assetDirections: [],
        experimentLevers: [],
        risks: [],
      },
      citations: {},
    });

    expect(assetPrompt.user).toContain("existingWorkAndAssets");
    expect(assetPrompt.user).toContain("- GenZen Solutions (genzen.solutions) — counter-exploitation agency, 6 years running");
    expect(assetPrompt.user).not.toContain("empty-name.example.com");
  });

  it("parses a completed Exa task and maps fallback citations", () => {
    const task = parseExaTaskResponse({
      researchId: "r_123",
      status: "completed",
      data: {
        audienceSignals: ["Signal"],
        positioningEdges: ["Edge"],
        lowContactChannels: [
          {
            channel: "SEO",
            fit: "Async",
            evidence: "Intent exists",
            caution: "Takes time",
          },
        ],
        messagePatterns: ["Pattern"],
        assetDirections: ["Asset"],
        experimentLevers: [
          {
            experiment: "Experiment",
            rationale: "Because",
            successMetric: "Metric",
          },
        ],
        risks: ["Risk"],
      },
      citations: {
        lowContactChannels: [
          {
            title: "Channel Source",
            url: "https://channel.example.com",
            snippet: "Channel evidence",
          },
        ],
      },
    });

    expect(task.status).toBe("completed");

    if (task.status !== "completed") {
      throw new Error("Expected completed task");
    }

    const merged = mergeStrategyCitations([], task.citations);
    expect(merged).toEqual([
      {
        section: "channelPlan",
        title: "Channel Source",
        url: "https://channel.example.com",
        note: "Channel evidence",
      },
    ]);
  });

  it("parses completed Exa search output with grounding citations", () => {
    const search = parseExaSearchResponse({
      output: {
        content: {
          audienceSignals: ["Signal"],
          positioningEdges: ["Edge"],
          lowContactChannels: ["SEO: Async fit because intent exists; caution that results take time."],
          messagePatterns: ["Pattern"],
          assetDirections: ["Asset"],
          experimentLevers: ["Experiment: run a searchable page test; success metric is qualified replies."],
          risks: ["Risk"],
        },
        grounding: [
          {
            field: "lowContactChannels[0].evidence",
            citations: [
              {
                title: "Grounded Source",
                url: "https://grounding.example.com",
              },
            ],
          },
        ],
      },
    });

    expect(search.status).toBe("completed");
    expect(search.dossier.lowContactChannels[0].channel).toContain("SEO");

    const merged = mergeStrategyCitations([], search.citations);
    expect(merged).toEqual([
      {
        section: "channelPlan",
        title: "Grounded Source",
        url: "https://grounding.example.com",
      },
    ]);
  });

  it("normalizes partial Exa search output instead of failing the draft pipeline", () => {
    const search = parseExaSearchResponse({
      output: {
        content: JSON.stringify({
          audienceSignals: "Buyers search asynchronously before taking calls.",
          lowContactChannels: ["SEO diagnostics"],
          risks: "Avoid channels that require daily posting.",
        }),
      },
    });

    expect(search.dossier.audienceSignals).toEqual(["Buyers search asynchronously before taking calls."]);
    expect(search.dossier.positioningEdges).toEqual([]);
    expect(search.dossier.lowContactChannels[0].channel).toBe("SEO diagnostics");
    expect(search.dossier.risks).toEqual(["Avoid channels that require daily posting."]);
  });

  it("parses valid model JSON and rejects malformed output", () => {
    const draftInput = {
      sections: {
        positioning: "Positioning",
        channelPlan: "Channels",
        messageAngles: "Angles",
        assetIdeas: "Assets",
        experiments: "Experiments",
        thirtyDaySequence: "Sequence",
      },
      warnings: ["Keep posting load low"],
      citations: [
        {
          section: "positioning",
          title: "Source One",
          url: "https://example.com",
          note: "Research support",
        },
      ],
    };

    const toolParsed = parseStrategyDraftInput(draftInput);
    expect(toolParsed.sections.positioning).toBe("Positioning");

    const flatToolParsed = parseStrategyDraftInput({
      positioning: "Flat positioning",
      channelPlan: "Flat channels",
      messageAngles: "Flat angles",
      assetIdeas: "Flat assets",
      experiments: "Flat experiments",
      thirtyDaySequence: "Flat sequence",
      warnings: "Keep posting load low",
      citations: [
        {
          title: "Missing section source",
          url: "https://flat.example.com",
        },
        {
          section: "invalid",
          title: "",
          url: "",
        },
      ],
    });

    expect(flatToolParsed.sections.positioning).toBe("Flat positioning");
    expect(flatToolParsed.warnings).toEqual(["Keep posting load low"]);
    expect(flatToolParsed.citations).toEqual([
      {
        section: "positioning",
        title: "Missing section source",
        url: "https://flat.example.com",
        note: "",
      },
    ]);

    const stringSectionsParsed = parseStrategyDraftInput({
      sections: JSON.stringify(draftInput.sections),
      warnings: [],
      citations: [],
    });
    expect(stringSectionsParsed.sections.channelPlan).toBe("Channels");

    const parsed = parseStrategyDraftText(`{
      "sections": {
        "positioning": "Positioning",
        "channelPlan": "Channels",
        "messageAngles": "Angles",
        "assetIdeas": "Assets",
        "experiments": "Experiments",
        "thirtyDaySequence": "Sequence"
      },
      "warnings": ["Keep posting load low"],
      "citations": [
        {
          "section": "positioning",
          "title": "Source One",
          "url": "https://example.com",
          "note": "Research support"
        }
      ]
    }`);

    expect(parsed.sections.positioning).toBe("Positioning");
    expect(parsed.citations).toHaveLength(1);
    expect(parseStrategyDraftInput({
      sections: {
        "01 Positioning": "Label positioning",
        "Channel Plan": "Label channels",
        "Message Angles": "Label angles",
        "Asset Ideas": "Label assets",
        "05 Experiments": "Label experiments",
        "30-day sequence": "Label sequence",
      },
      warnings: [],
      citations: [],
    }).sections.channelPlan).toBe("Label channels");
    expect(parseStrategyDraftInput({
      sections: [
        { title: "Positioning", content: "Array positioning" },
        { title: "Channel Plan", content: "Array channels" },
        { title: "Message Angles", content: "Array angles" },
        { title: "Asset Ideas", content: "Array assets" },
        { title: "Experiments", content: "Array experiments" },
        { title: "30-Day Sequence", content: "Array sequence" },
      ],
      warnings: [],
      citations: [],
    }).sections.thirtyDaySequence).toBe("Array sequence");
    expect(() => parseStrategyDraftText("not json")).toThrow("Model output did not contain JSON");
    expect(() =>
      parseStrategyDraftInput({
        sections: {
          positioning: "",
          channelPlan: "Channels",
          messageAngles: "Angles",
          assetIdeas: "Assets",
          experiments: "Experiments",
          thirtyDaySequence: "Sequence",
        },
        warnings: [],
        citations: [],
      }),
    ).toThrow("Model output missing positioning section");
  });

  it("builds a complete fallback draft from Exa research when model output is incomplete", () => {
    const fallback = buildFallbackStrategyDraft({
      problem: "manual reporting wastes time",
      knownPlayers: "",
      audienceLens: "operators who avoid networking",
      founderConstraints: {
        teamSize: "solo",
        budgetBand: "low",
        weeklyCapacity: "4 hours",
        socialPostingTolerance: "avoid",
        channelAvoidances: "",
        outreachTolerance: ["inbound-only"],
        contentMode: ["writing"],
        contentModeOther: "",
        existingAssets: [{ name: "", url: "", description: "" }],
      },
      phaseResearch: [
        {
          phaseId: 1,
          phaseName: "Problem Cartography",
          description: "desc",
          results: [
            {
              title: "Source",
              url: "https://example.com",
              highlights: ["Teams hate manual reporting."],
            },
          ],
        },
      ],
    }, {
      dossier: {
        audienceSignals: ["Operators search before taking calls."],
        positioningEdges: ["Low-contact proof beats social volume."],
        lowContactChannels: [
          {
            channel: "SEO diagnostics",
            fit: "Captures async demand",
            evidence: "Search demand exists",
            caution: "Slow ramp",
          },
        ],
        messagePatterns: ["Stop rebuilding reports by hand."],
        assetDirections: ["Diagnostic checklist"],
        experimentLevers: [
          {
            experiment: "Publish one diagnostic page",
            rationale: "Captures intent",
            successMetric: "Qualified inbound replies",
          },
        ],
        risks: ["Avoid daily posting."],
      },
      citations: {},
    });

    expect(Object.values(fallback.sections).every((section) => section.trim().length > 0)).toBe(true);
    expect(fallback.sections.channelPlan).toContain("SEO diagnostics");
    expect(fallback.warnings).toEqual(["Avoid daily posting."]);
  });
});
