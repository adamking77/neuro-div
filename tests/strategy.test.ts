import { describe, expect, it } from "vitest";
import { PHASES } from "../src/phases";
import {
  buildExaSearchRequest,
  buildFallbackStrategyDraft,
  buildStrategyDraftPrompt,
  getExaConfig,
  getKimiConfig,
  getUpstreamTimeouts,
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
  renderAgentBrief,
} from "../src/lib/strategy";
import { buildNDProfileContext, createEmptyNDProfile } from "../src/lib/nd-profile";
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
  it("allows generation with no completed research phases", () => {
    expect(getStrategyReadiness(createPhases())).toEqual({
      canGenerate: true,
      doneCount: 0,
      missingSuggested: [
        {
          id: 1,
          label: "Problem Cartography",
          rationale: "Raw customer language — messaging won't sound right without this",
        },
        {
          id: 3,
          label: "Solution Landscape",
          rationale: "White space context — positioning is guesswork without this",
        },
        {
          id: 5,
          label: "Evidence Mining",
          rationale: "Proof the problem is real — strengthens every section",
        },
      ],
      confidence: "partial",
    });
  });

  it("allows generation after two completed phases and marks missing suggested phases as partial confidence", () => {
    const twoPhases = createPhases({
      1: { status: "done", results: [{ id: "1", url: "https://a.com", highlights: ["a"] }] },
      2: { status: "done", results: [{ id: "2", url: "https://b.com", highlights: ["b"] }] },
    });

    expect(getStrategyReadiness(twoPhases)).toEqual({
      canGenerate: true,
      doneCount: 2,
      missingSuggested: [
        {
          id: 3,
          label: "Solution Landscape",
          rationale: "White space context — positioning is guesswork without this",
        },
        {
          id: 5,
          label: "Evidence Mining",
          rationale: "Proof the problem is real — strengthens every section",
        },
      ],
      confidence: "partial",
    });
  });

  it("keeps confidence partial when one suggested phase is missing", () => {
    const phases = createPhases({
      1: { status: "done", results: [{ id: "1", url: "https://a.com", highlights: ["a"] }] },
      2: { status: "done", results: [{ id: "2", url: "https://b.com", highlights: ["b"] }] },
      3: { status: "done", results: [{ id: "3", url: "https://c.com", highlights: ["c"] }] },
      4: { status: "done", results: [{ id: "4", url: "https://d.com", highlights: ["d"] }] },
    });

    expect(getStrategyReadiness(phases)).toEqual({
      canGenerate: true,
      doneCount: 4,
      missingSuggested: [
        {
          id: 5,
          label: "Evidence Mining",
          rationale: "Proof the problem is real — strengthens every section",
        },
      ],
      confidence: "partial",
    });
  });

  it("marks confidence strong when four phases are complete and all suggested phases are present", () => {
    const phases = createPhases({
      1: { status: "done", results: [{ id: "1", url: "https://a.com", highlights: ["a"] }] },
      3: { status: "done", results: [{ id: "3", url: "https://c.com", highlights: ["c"] }] },
      5: { status: "done", results: [{ id: "5", url: "https://e.com", highlights: ["e"] }] },
      6: { status: "done", results: [{ id: "6", url: "https://f.com", highlights: ["f"] }] },
    });

    expect(getStrategyReadiness(phases)).toEqual({
      canGenerate: true,
      doneCount: 4,
      missingSuggested: [],
      confidence: "strong",
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
  it("rejects missing Exa credentials", () => {
    expect(() => getExaConfig({})).toThrow("EXA_API_KEY not configured");
  });

  it("uses the documented Kimi defaults", () => {
    expect(getKimiConfig({ KIMI_API_KEY: "test-key" })).toEqual({
      apiKey: "test-key",
      model: "kimi-k2-6",
      baseUrl: "https://api.moonshot.cn/v1",
    });
  });

  it("uses sane upstream timeouts by default", () => {
    expect(getUpstreamTimeouts({})).toEqual({
      exaMs: 45000,
      kimiMs: 45000,
    });
  });

  it("validates the draft request payload", () => {
    expect(() => validateStrategyDraftRequest({})).toThrow("problem is required");
  });

  it("accepts requests without phase research", () => {
    expect(validateStrategyDraftRequest({
      problem: "manual reporting wastes time",
      audienceLens: "operators who avoid networking",
      founderConstraints: {
        teamSize: "solo",
        budgetBand: "low",
        weeklyCapacity: "",
        socialPostingTolerance: "avoid",
        channelAvoidances: "",
        outreachTolerance: "inbound-only",
        peerCollaborationOk: false,
        contentMode: ["writing"],
        contentModeOther: "",
        existingAssets: [],
        previousAttempts: "",
        avoidanceTasks: "",
        activationWindows: "",
        unavailablePeriods: "",
      },
    })).toMatchObject({
      problem: "manual reporting wastes time",
      audienceLens: "operators who avoid networking",
      phaseResearch: [],
    });
  });

  it("builds Exa research and Kimi prompts with low-contact guidance", () => {
    const ndProfile = createEmptyNDProfile();
    ndProfile.activation.patterns = ["deep-interest", "challenge"];
    ndProfile.shutdown.triggers = ["cold-outreach", "social-posting"];
    ndProfile.timeEnergy.unavailablePeriods = "burnout recovery weeks";

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
        outreachTolerance: "warm-intro-ok",
        peerCollaborationOk: false,
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
      ndProfileContext: buildNDProfileContext(ndProfile),
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
    expect(prompt.user).not.toContain("peer collaboration");
    expect(prompt.user).not.toContain("Existing Work and Assets");
    expect(prompt.user).toContain("Deep interest or passion");
    expect(prompt.user).toContain("burnout recovery weeks");

    const liveCallsPrompt = buildStrategyDraftPrompt({
      ...payload,
      founderConstraints: {
        ...payload.founderConstraints,
        outreachTolerance: "live-calls-ok",
        peerCollaborationOk: true,
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

    expect(liveCallsPrompt.user).toContain("scheduled 1:1 calls");
    expect(liveCallsPrompt.user).toContain("Open to peer collaboration");

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
        outreachTolerance: "inbound-only",
        peerCollaborationOk: false,
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

describe("renderAgentBrief", () => {
  const baseDraft = {
    sections: {
      positioning: "Positioning text here.",
      channelPlan: "Channel plan text here.",
      messageAngles: "Message angles text here.",
      assetIdeas: "Asset ideas text here.",
      experiments: "Experiments text here.",
      thirtyDaySequence: "30-day sequence text here.",
    },
    warnings: ["Avoid daily posting."],
    citations: [
      {
        section: "positioning" as const,
        title: "Source One",
        url: "https://example.com",
        note: "Research support",
      },
    ],
    generatedAt: "2026-04-24T00:00:00.000Z",
  };

  const baseInputs = createEmptyStrategyInputs();

  it("produces non-empty markdown for a complete draft", () => {
    const brief = renderAgentBrief(baseDraft, baseInputs, "manual reporting wastes time");
    expect(brief.length).toBeGreaterThan(0);
    expect(brief).toContain("# Category Scout Agent Brief");
    expect(brief).toContain("manual reporting wastes time");
  });

  it("includes all six strategy sections with correct headings", () => {
    const brief = renderAgentBrief(baseDraft, baseInputs, "test");
    expect(brief).toContain("## Positioning");
    expect(brief).toContain("## Channel Plan");
    expect(brief).toContain("## Message Angles");
    expect(brief).toContain("## Asset Ideas");
    expect(brief).toContain("## Experiments");
    expect(brief).toContain("## 30-Day Sequence");
  });

  it("renders founder profile from inputs", () => {
    const inputs = {
      ...baseInputs,
      audienceLens: "solo operators",
      teamSize: "small-team" as const,
      budgetBand: "moderate" as const,
      weeklyCapacity: "6 hours",
    };
    const brief = renderAgentBrief(baseDraft, inputs, "test");
    expect(brief).toContain("solo operators");
    expect(brief).toContain("Small Team");
    expect(brief).toContain("Moderate");
    expect(brief).toContain("6 hours");
  });

  it("shows 'none listed' when no assets have names", () => {
    const brief = renderAgentBrief(baseDraft, baseInputs, "test");
    expect(brief).toContain("none listed");
  });

  it("renders existing assets when names are populated", () => {
    const inputs = {
      ...baseInputs,
      existingAssets: [
        { name: "GenZen Solutions", url: "genzen.solutions", description: "counter-exploitation agency" },
        { name: "", url: "", description: "" },
      ],
    };
    const brief = renderAgentBrief(baseDraft, inputs, "test");
    expect(brief).toContain("GenZen Solutions");
    expect(brief).toContain("genzen.solutions");
    expect(brief).toContain("counter-exploitation agency");
    expect(brief).not.toContain("empty-name");
  });

  it("omits warnings section when warnings are empty", () => {
    const draft = { ...baseDraft, warnings: [] };
    const brief = renderAgentBrief(draft, baseInputs, "test");
    expect(brief).not.toContain("## Warnings surfaced by the planner");
  });

  it("does not render a standalone warnings block even when warnings exist", () => {
    const brief = renderAgentBrief(baseDraft, baseInputs, "test");
    expect(brief).not.toContain("## Warnings surfaced by the planner");
  });

  it("omits evidence section when citations are empty", () => {
    const draft = { ...baseDraft, citations: [] };
    const brief = renderAgentBrief(draft, baseInputs, "test");
    expect(brief).not.toContain("## Evidence / citations");
  });

  it("includes evidence section with grouped citations", () => {
    const brief = renderAgentBrief(baseDraft, baseInputs, "test");
    expect(brief).toContain("## Evidence / citations");
    expect(brief).toContain("### Positioning");
    expect(brief).toContain("[Source One](https://example.com)");
  });

  it("appends contentModeOther when 'other' is selected", () => {
    const inputs = {
      ...baseInputs,
      contentMode: ["other"] as const,
      contentModeOther: "interactive calculators",
    };
    const brief = renderAgentBrief(baseDraft, inputs, "test");
    expect(brief).toContain("interactive calculators");
  });

  it("reflects peer collaboration when enabled", () => {
    const inputs = { ...baseInputs, peerCollaborationOk: true };
    const brief = renderAgentBrief(baseDraft, inputs, "test");
    expect(brief).toContain("Peer collaboration");
  });

  it("includes persistent ND profile context when provided", () => {
    const inputs = createEmptyStrategyInputs();
    inputs.audienceLens = "founders with low tolerance for marketing overhead";

    const ndProfile = createEmptyNDProfile();
    ndProfile.traits.selected = ["adhd", "pda"];
    ndProfile.activation.patterns = ["deep-interest", "challenge"];
    ndProfile.shutdown.triggers = ["cold-outreach"];
    ndProfile.infoConditions.density = "brief";

    const markdown = renderAgentBrief({
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
    }, inputs, "Problem statement", buildNDProfileContext(ndProfile));

    expect(markdown).toContain("## Persistent ND context");
    expect(markdown).toContain("ADHD");
    expect(markdown).toContain("Cold outreach");
    expect(markdown).toContain("Brief");
  });

  it("returns empty string for incomplete draft", () => {
    const incomplete = { ...baseDraft, sections: { ...baseDraft.sections, positioning: "" } };
    expect(renderAgentBrief(incomplete, baseInputs, "test")).toBe("");
  });
});
