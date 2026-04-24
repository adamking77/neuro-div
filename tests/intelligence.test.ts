import { describe, it, expect } from "vitest";
import { buildIntelligenceMarkdown } from "../src/lib/intelligence";
import type { IntelligenceBrief } from "../src/types";

const mockBrief: IntelligenceBrief = {
  generatedAt: "2026-04-24T12:00:00Z",
  summary: "The market for async project management tools shows strong problem-aware demand among solo operators.",
  scorecard: {
    metrics: [
      { label: "Market Opportunity", grade: "high", rationale: "Problem-aware search demand is growing 40% YoY." },
      { label: "Competitive Intensity", grade: "medium", rationale: "Several players exist but none focus on the PDA-friendly niche." },
      { label: "Timing Window", grade: "high", rationale: "Remote work normalization creates urgency." },
      { label: "Founder Fit", grade: "medium", rationale: "Content creation mode matches founder strengths." },
    ],
  },
  landscape: {
    content: "The project management space is crowded with incumbents like Asana and Notion. However, the solo operator segment remains underserved.\n\nMost tools are built for teams, creating friction for individual users who need simplicity over collaboration features.",
    callouts: [
      { type: "insight", text: "Solo operators are actively searching for simpler alternatives." },
      { type: "warning", text: "Incumbents could pivot to this segment quickly." },
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
      expect(md).toContain(metric.rationale);
    }
  });

  it("includes landscape with callouts", () => {
    const md = buildIntelligenceMarkdown(mockBrief);
    expect(md).toContain("Market Landscape");
    expect(md).toContain(mockBrief.landscape.content);
    expect(md).toContain("INSIGHT");
    expect(md).toContain("WARNING");
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
