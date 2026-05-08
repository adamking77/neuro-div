import { describe, it, expect } from "vitest";
import { buildIntelligenceMarkdown, normalizeIntelligenceBrief } from "../src/lib/intelligence";
import { parseIntelligenceBriefPart1 } from "../api/_lib/intelligence-api";
import { POST as postDeterministicAnalysis } from "../app/api/intelligence-analysis/route";
import { POST as postDeterministicSnapshot } from "../app/api/intelligence-snapshot-v1/route";
import type { IntelligenceBrief } from "../src/types";

const mockBrief: IntelligenceBrief = {
  generatedAt: "2026-04-24T12:00:00Z",
  summary: "The market for async project management tools shows strong problem-aware demand among solo operators.",
  scorecard: {
    metrics: [
      { label: "Market Opportunity", grade: "high", takeaway: "Problem-aware demand is clearly present.", evidence: "Search demand is growing 40% YoY." },
      { label: "Competitive Intensity", grade: "medium", takeaway: "Several players exist, but the niche is still open.", evidence: "No incumbent focuses on the PDA-friendly segment." },
      { label: "Timing Window", grade: "high", takeaway: "The timing is favorable for a sharper wedge.", evidence: "Remote work normalization increases urgency." },
      { label: "Founder Fit", grade: "medium", takeaway: "The model fits founder strengths if distribution stays async.", evidence: "Content creation mode aligns better than direct outreach." },
    ],
  },
  landscape: {
    content: "The project management space is crowded with incumbents like Asana and Notion. However, the solo operator segment remains underserved.\n\nMost tools are built for teams, creating friction for individual users who need simplicity over collaboration features.",
    callouts: [
      { type: "insight", headline: "Solo operators are actively searching for simpler alternatives." },
      { type: "warning", headline: "Incumbents could pivot to this segment quickly." },
    ],
  },
  positioning: {
    headers: ["Dimension", "Us", "Competitor A", "Competitor B"],
    rows: [
      { dimension: "Audience", us: "Solo operators", competitorA: "Teams", competitorB: "Enterprise", usSentiment: "positive" },
      { dimension: "Message", us: "Quiet focus", competitorA: "Collaboration", competitorB: "Scale", usSentiment: "positive" },
    ],
  },
  channels: {
    headers: ["Channel", "Fit Score", "Effort", "Speed", "Evidence", "Verdict"],
    rows: [
      { channel: "SEO", fitScore: 5, effort: "High", speed: "Slow", evidence: "Search demand confirmed", verdict: "prioritize" },
      { channel: "Social", fitScore: 1, effort: "High", speed: "Fast", evidence: "Poor fit for constraints", verdict: "defer" },
    ],
  },
  risks: {
    risks: [
      { name: "Incumbent response", impact: "high", probability: "medium", mitigation: "Move fast on positioning.", level: "watch" },
      { name: "Slow traction", impact: "medium", probability: "high", mitigation: "Set realistic expectations.", level: "watch" },
    ],
  },
  timeline: {
    phases: [
      { name: "Foundation", weeks: "Weeks 1-4", focus: "Positioning and first asset", tasks: ["Define wedge", "Draft asset", "Set up analytics"] },
    ],
  },
  resources: {
    time: ["Weeks 1-4: 10-15 hrs/week"],
    budget: ["Tools: ~$50/month"],
    tools: ["Website builder", "Analytics"],
    skills: ["Strategic writing", "Basic SEO"],
    gaps: ["Need first create-once asset"],
  },
};

const mockStrategyPayload = {
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
    previousAttempts: "",
    avoidanceTasks: "",
    activationWindows: "",
    unavailablePeriods: "",
  },
  ndProfileContext: {
    summary: "",
    traitLabels: [],
    manifestationLabels: [],
    activationPatterns: [],
    goodDayDescription: "",
    shutdownTriggers: [],
    shutdownDescription: "",
    activationWindows: "",
    unavailablePeriods: "",
    triedSystems: "",
    whatWorked: "",
    whatFailed: "",
    infoDensity: "",
    infoFormats: [],
    supportConditions: [],
    agentGuidance: "",
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

describe("buildIntelligenceMarkdown", () => {
  it("includes executive summary", () => {
    const md = buildIntelligenceMarkdown(mockBrief);
    expect(md).toContain("# Strategic Intelligence Brief");
    expect(md).toContain(mockBrief.summary);
  });

  it("includes all scorecard metrics", () => {
    const md = buildIntelligenceMarkdown(mockBrief);
    for (const metric of mockBrief.scorecard.metrics) {
      expect(md).toContain(metric.label);
      expect(md).toContain(metric.grade.toUpperCase());
      expect(md).toContain(metric.takeaway);
      expect(md).toContain(metric.evidence || "");
    }
  });

  it("includes landscape with callouts", () => {
    const md = buildIntelligenceMarkdown(mockBrief);
    expect(md).toContain("Market Landscape");
    expect(md).toContain(mockBrief.landscape.content);
    expect(md).toContain("INSIGHT");
    expect(md).toContain("WARNING");
    expect(md).toContain(mockBrief.landscape.callouts[0].headline);
  });

  it("compacts overlong scorecard and callout fields during parse", () => {
    const parsed = parseIntelligenceBriefPart1({
      choices: [
        {
          message: {
            content: JSON.stringify({
              summary: "Sentence one explains the situation. Sentence two explains why the wedge matters. Sentence three explains the operating constraint.",
              scorecard: {
                metrics: [
                  {
                    label: "Market Opportunity",
                    grade: "high",
                    rationale: "Demand is clear across multiple buyer signals and repeated search patterns. Teams are already describing the pain in fragmented but consistent language. This means the category is active even if the label is not stable.",
                  },
                  {
                    label: "Competitive Intensity",
                    grade: "medium",
                    rationale: "Several adjacent players exist. None owns this specific wedge.",
                  },
                  {
                    label: "Timing Window",
                    grade: "medium",
                    takeaway: "The timing window is still open for a sharper frame.",
                    evidence: "The category language is still unstable, which leaves room to define comparisons.",
                  },
                  {
                    label: "Founder Fit",
                    grade: "low",
                    rationale: "The channel mix will punish a founder who needs low-contact distribution and bounded effort. High-maintenance outreach will not hold.",
                  },
                ],
              },
              landscape: {
                content: "The market is active but fragmented. Buyers can describe the pain, but they cannot reliably name the category. Larger players still speak in adjacent language.",
                callouts: [
                  {
                    type: "insight",
                    text: "Buyers are already looking for a solution, but their language is inconsistent and pre-category. That makes message ownership unusually valuable. It also means the first clear explanation can reset the comparison set.",
                  },
                ],
              },
            }),
          },
        },
      ],
    });

    expect(parsed.scorecard.metrics[0].takeaway.length).toBeLessThanOrEqual(121);
    expect(parsed.scorecard.metrics[0].evidence?.length ?? 0).toBeLessThanOrEqual(151);
    expect(parsed.landscape.callouts[0].headline.length).toBeLessThanOrEqual(111);
    expect(parsed.landscape.callouts[0].support?.length ?? 0).toBeLessThanOrEqual(146);
  });

  it("normalizes legacy saved briefs on the client", () => {
    const normalized = normalizeIntelligenceBrief({
      ...mockBrief,
      scorecard: {
        metrics: [
          {
            label: "Market Opportunity",
            grade: "high",
            rationale:
              "Demand is clear across repeated buyer signals and fragmented search language. Teams keep describing the pain in similar but unstable terms. That makes the wedge more available than it first appears.",
          },
          mockBrief.scorecard.metrics[1],
          mockBrief.scorecard.metrics[2],
          mockBrief.scorecard.metrics[3],
        ],
      },
      landscape: {
        content:
          "The market is active but fragmented. Buyers can describe the pain, but they cannot reliably name the category. Larger players still speak in adjacent language.",
        callouts: [
          {
            type: "insight",
            text:
              "Buyers are already looking for a solution, but their language is inconsistent and pre-category. That makes message ownership unusually valuable. It also means the first clear explanation can reset the comparison set.",
          },
        ],
      },
    });

    expect(normalized.scorecard.metrics[0].takeaway.length).toBeLessThanOrEqual(121);
    expect(normalized.scorecard.metrics[0].evidence?.length ?? 0).toBeLessThanOrEqual(151);
    expect(normalized.landscape.callouts[0].headline.length).toBeLessThanOrEqual(111);
    expect(normalized.landscape.callouts[0].support?.length ?? 0).toBeLessThanOrEqual(146);
  });

  it("includes positioning table as markdown", () => {
    const md = buildIntelligenceMarkdown(mockBrief);
    expect(md).toContain("Competitive Positioning");
    expect(md).toContain("| Dimension | Us | Competitor A | Competitor B |");
    expect(md).toContain("| Solo operators | Teams | Enterprise |");
  });

  it("includes channels table with scores and verdicts", () => {
    const md = buildIntelligenceMarkdown(mockBrief);
    expect(md).toContain("Channel Opportunity Matrix");
    expect(md).toContain("| SEO | 5/5 |");
    expect(md).toContain("PRIORITIZE");
    expect(md).toContain("DEFER");
  });

  it("includes risk assessment with levels", () => {
    const md = buildIntelligenceMarkdown(mockBrief);
    expect(md).toContain("Risk Assessment");
    expect(md).toContain("Incumbent response");
    expect(md).toContain("Mitigation:");
  });

  it("includes timeline phases with tasks", () => {
    const md = buildIntelligenceMarkdown(mockBrief);
    expect(md).toContain("90-Day Roadmap");
    expect(md).toContain("Foundation (Weeks 1-4)");
    expect(md).toContain("Define wedge");
  });

  it("includes all resource sections", () => {
    const md = buildIntelligenceMarkdown(mockBrief);
    expect(md).toContain("Resource Framework");
    expect(md).toContain("### Time");
    expect(md).toContain("### Budget");
    expect(md).toContain("### Tools");
    expect(md).toContain("### Skills");
    expect(md).toContain("### Gaps to Close");
  });

  it("includes generation timestamp", () => {
    const md = buildIntelligenceMarkdown(mockBrief);
    expect(md).toContain("Generated:");
  });
});

describe("deterministic intelligence routes", () => {
  it("keeps the snapshot route distinct from the analysis route", async () => {
    const requestBody = JSON.stringify(mockStrategyPayload);

    const [analysisResponse, snapshotResponse] = await Promise.all([
      postDeterministicAnalysis(new Request("http://localhost/api/intelligence-analysis", {
        method: "POST",
        body: requestBody,
        headers: { "content-type": "application/json" },
      })),
      postDeterministicSnapshot(new Request("http://localhost/api/intelligence-snapshot-v1", {
        method: "POST",
        body: requestBody,
        headers: { "content-type": "application/json" },
      })),
    ]);

    expect(analysisResponse.status).toBe(200);
    expect(snapshotResponse.status).toBe(200);
    expect(analysisResponse.headers.get("x-intelligence-handler")).toBe("deterministic-v1");
    expect(snapshotResponse.headers.get("x-intelligence-handler")).toBe("deterministic-v1-snapshot");
  });
});
