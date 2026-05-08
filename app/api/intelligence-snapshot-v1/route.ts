import type { IntelligenceBrief, StrategyDraftRequestPayload } from "@/src/types";
import { StrategyRequestError, validateStrategyDraftRequest } from "@/api/_lib/strategy-api";

// Keep this route self-contained. Re-export shims can collapse into identical serverless
// bundles, and Vercel may alias them to the wrong function in production.
export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const payload = validateStrategyDraftRequest(await req.json());
    const brief = buildDeterministicIntelligenceBrief(payload);

    return Response.json(brief, {
      headers: {
        "x-intelligence-handler": "deterministic-v1-snapshot",
      },
    });
  } catch (error) {
    if (error instanceof StrategyRequestError) {
      return Response.json({ error: error.message }, { status: error.statusCode });
    }

    const message = error instanceof Error ? error.message : "Unexpected intelligence snapshot failure";
    return Response.json({ error: message }, { status: 500 });
  }
}

function buildDeterministicIntelligenceBrief(payload: StrategyDraftRequestPayload): IntelligenceBrief {
  const problem = payload.problem.trim();
  const audience = payload.audienceLens.trim() || "the target audience";
  const contentModes = payload.founderConstraints.contentMode.filter((mode) => mode !== "none");
  const contentModeText = contentModes.length > 0 ? contentModes.join(", ") : "no ongoing content cadence";
  const researchHighlights = payload.phaseResearch
    .flatMap((phase) => phase.results.flatMap((result) => result.highlights))
    .map((highlight) => highlight.trim())
    .filter(Boolean)
    .slice(0, 6);
  const evidenceLine = researchHighlights[0] ?? `Buyers are actively trying to solve ${problem} but may not have stable category language for it yet.`;

  return {
    generatedAt: new Date().toISOString(),
    summary: `This intelligence brief analyzes ${problem} for ${audience}. The strongest opportunity is to define the problem more clearly before competitors fix the language in the market. The most viable distribution paths remain low-contact, searchable, and asset-led because the stated constraints point away from social maintenance and direct outreach.`,
    scorecard: {
      metrics: [
        {
          label: "Market Opportunity",
          grade: payload.phaseResearch.length > 0 ? "high" : "medium",
          rationale: evidenceLine,
        },
        {
          label: "Competitive Intensity",
          grade: payload.knownPlayers.trim() ? "medium" : "low",
          rationale: payload.knownPlayers.trim()
            ? `Known alternatives already exist (${payload.knownPlayers.trim()}), but the wedge is still definable.`
            : "No named incumbent set was provided, which suggests room to sharpen the wedge before the field hardens.",
        },
        {
          label: "Timing Window",
          grade: "medium",
          rationale: "The category appears early enough that clearer framing and better problem language can still shape buyer expectations.",
        },
        {
          label: "Founder Fit",
          grade: "medium",
          rationale: `The viable route depends on ${payload.founderConstraints.outreachTolerance} outreach tolerance and a ${contentModeText} creation model.`,
        },
      ],
    },
    landscape: {
      content: [
        `The market around ${problem} is best understood as a language and positioning problem, not just a channel problem. Buyers are already feeling the pain, but they may still describe it in fragmented or pre-category terms.`,
        `That creates an opening for a focused operator to define the frame before larger or broader competitors settle it. The practical upside is that clearer language can improve discovery, differentiation, and conversion at the same time.`,
        `Given the founder constraints in this project, the market should be approached through low-contact discovery systems rather than high-touch sales or social cadence. Searchable resources, partner surfaces, and create-once assets remain the most realistic entry points.`,
      ].join("\n\n"),
      callouts: [
        { type: "insight", text: evidenceLine },
        { type: "opportunity", text: "There is still room to shape how the problem is named and compared." },
        { type: "warning", text: "If the offer stays vague, adjacent competitors will absorb demand and force price-based comparison." },
      ],
    },
    positioning: {
      headers: ["Dimension", "Us", "Competitor A", "Competitor B"],
      rows: [
        { dimension: "Audience", us: audience, competitorA: "Broad generalist", competitorB: "Enterprise-heavy", usSentiment: "positive" },
        { dimension: "Promise", us: "Clarity and category framing", competitorA: "Feature breadth", competitorB: "Process depth", usSentiment: "positive" },
        { dimension: "Acquisition", us: "Async discovery", competitorA: "Sales-led", competitorB: "Community-led", usSentiment: "positive" },
        { dimension: "Workload", us: "Create-once assets", competitorA: "Ongoing outreach", competitorB: "Relationship maintenance", usSentiment: "positive" },
      ],
    },
    channels: {
      headers: ["Channel", "Fit Score", "Effort", "Speed", "Evidence", "Verdict"],
      rows: [
        {
          channel: "Search-led guides and pages",
          fitScore: 5,
          effort: "High upfront",
          speed: "Slow",
          evidence: "Matches problem-aware discovery and low-contact constraints.",
          verdict: "prioritize",
        },
        {
          channel: "Partner and directory surfaces",
          fitScore: 4,
          effort: "Medium",
          speed: "Medium",
          evidence: "Compounds without requiring a posting cadence.",
          verdict: "prioritize",
        },
        {
          channel: "Create-once diagnostics or templates",
          fitScore: 5,
          effort: "High upfront",
          speed: "Medium",
          evidence: "Turns category framing into a discoverable asset.",
          verdict: "prioritize",
        },
        {
          channel: "Newsletter or email nurture",
          fitScore: 3,
          effort: "Medium ongoing",
          speed: "Medium",
          evidence: "Still async, but requires a consistency burden.",
          verdict: "test",
        },
        {
          channel: "Social posting cadence",
          fitScore: 1,
          effort: "High ongoing",
          speed: "Fast",
          evidence: "Directly conflicts with the stated low-contact operating constraints.",
          verdict: "defer",
        },
      ],
    },
    risks: {
      risks: [
        {
          name: "Category confusion",
          impact: "high",
          probability: "medium",
          mitigation: "Tighten the problem framing and repeat it across every asset before expanding channels.",
          level: "watch",
        },
        {
          name: "Slow compounding curve",
          impact: "medium",
          probability: "high",
          mitigation: "Measure learning and discovery signals early instead of expecting immediate conversion volume.",
          level: "watch",
        },
        {
          name: "Founder energy mismatch",
          impact: "medium",
          probability: "medium",
          mitigation: "Favor bounded assets and async channels over any tactic that depends on repeated outreach.",
          level: "managed",
        },
      ],
    },
    timeline: {
      phases: [
        {
          name: "Foundation",
          weeks: "Weeks 1-4",
          focus: "Clarify the wedge and first asset",
          tasks: [
            "Lock the problem statement and positioning contrast.",
            "Choose one primary discovery surface.",
            "Draft one create-once asset tied to the strongest buyer language.",
          ],
        },
        {
          name: "Validation",
          weeks: "Weeks 5-8",
          focus: "Test discovery and resonance",
          tasks: [
            "Publish or place the first asset.",
            "Watch discovery, saves, replies, and qualified inbound.",
            "Refine language based on actual response patterns.",
          ],
        },
        {
          name: "Acceleration",
          weeks: "Weeks 9-12",
          focus: "Double down on signal",
          tasks: [
            "Expand the best-performing framing into a second asset.",
            "Add one secondary low-contact channel.",
            "Document the next 90-day learning loop.",
          ],
        },
      ],
    },
    resources: {
      time: [
        "Expect the first month to be the heaviest deep-work period.",
        "Use concentrated build windows instead of a weekly marketing cadence.",
      ],
      budget: [
        "Keep spend light until one discovery surface shows signal.",
        "Reserve budget for tooling or placement, not high-touch acquisition.",
      ],
      tools: [
        "A site or publishing surface you control.",
        "Basic analytics and conversion tracking.",
        "One creation tool aligned with the preferred content mode.",
      ],
      skills: [
        "Positioning and strategic writing.",
        "Basic SEO and discoverability judgment.",
        "Simple analytics review.",
      ],
      gaps: [
        "A sharper statement of the wedge if the current problem framing is still broad.",
        "A first compounding asset if no reusable resource exists yet.",
      ],
    },
  };
}
