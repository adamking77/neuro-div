// Force Node.js runtime (not Edge) to avoid Vercel edge auth issues
export const runtime = "nodejs";
export const preferredRegion = "iad1";

import type { ExaResult } from "@/src/types";
import { callKimiWithTool, StrategyRequestError } from "@/api/_lib/strategy-api";

// Health check endpoint
export async function GET() {
  return Response.json({ status: "ok", timestamp: new Date().toISOString() });
}

interface PhaseSynthesisRequest {
  phaseId: number;
  problem: string;
  results: ExaResult[];
}

interface PhaseSynthesisResponse {
  summary: string;
  verdict: string;
  evidence: string;
  implication: string;
}

const PHASE_QUESTIONS: Record<number, string> = {
  1: "Do people describe this problem in customer language (emotional, specific, pre-solution), or is it only discussed in industry/technical terms?",
  2: "What incumbent approach or worldview is being displaced? Who benefits from the status quo?",
  3: "Who is solving adjacent problems? Is the solution space crowded, sparse, or fragmented?",
  4: "What categories or frameworks already exist? Are they newly forming (opportunity), mid-formation, or mature (avoid)?",
  5: "What proof exists that this problem is real, growing, and expensive to ignore?",
  6: "What vocabulary and metaphors do people use before they know a solution exists?",
};

const PHASE_NAMES: Record<number, string> = {
  1: "Problem Cartography",
  2: "Enemy Identification",
  3: "Solution Landscape",
  4: "Category Audit",
  5: "Evidence Mining",
  6: "Language Mining",
};

export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const body = await req.json() as PhaseSynthesisRequest;

    console.info("[phase-synthesis] request received", { phaseId: body.phaseId, resultsCount: body.results?.length });

    if (!body.phaseId || !PHASE_QUESTIONS[body.phaseId]) {
      return Response.json({ error: "Invalid phaseId" }, { status: 400 });
    }

    if (!body.problem?.trim()) {
      return Response.json({ error: "Problem statement is required" }, { status: 400 });
    }

    if (!body.results || body.results.length === 0) {
      return Response.json({ error: "Results are required" }, { status: 400 });
    }

    const apiKey = process.env.KIMI_API_KEY;
    const baseUrl = process.env.KIMI_BASE_URL || "https://api.moonshot.ai/v1";
    const model = process.env.KIMI_MODEL || "kimi-k2.6";

    if (!apiKey) {
      console.error("[phase-synthesis] KIMI_API_KEY not configured");
      return Response.json({ error: "KIMI_API_KEY not configured" }, { status: 500 });
    }

    const prompt = buildPhaseSynthesisPrompt(body.phaseId, body.problem, body.results);

    const synthesis = await callKimiWithTool(
      baseUrl,
      apiKey,
      model,
      prompt,
      PHASE_SYNTHESIS_TOOL,
      120_000,
      { maxTokens: 800 },
    );

    const validated = validatePhaseSynthesis(synthesis);
    console.info("[phase-synthesis] returning synthesis", {
      summaryLength: validated.summary.length,
      verdict: validated.verdict.slice(0, 50),
    });

    return Response.json(validated);
  } catch (error) {
    if (error instanceof StrategyRequestError) {
      console.error("[phase-synthesis] kimi error", { status: error.statusCode, message: error.message });
      return Response.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("[phase-synthesis] unexpected error", error);
    const message = error instanceof Error ? error.message : "Unexpected phase synthesis failure";
    return Response.json({ error: message }, { status: 500 });
  }
}

const PHASE_SYNTHESIS_TOOL = {
  name: "submit_phase_analysis",
  description: "Submit a structured analysis of search results for a category design research phase. Always call this tool — it is the only valid way to respond.",
  parameters: {
    type: "object",
    additionalProperties: false,
    properties: {
      summary: {
        type: "string",
        description: "Exactly 2-3 sentences naming the specific patterns observed across the search results, in plain neurodivergent-friendly language. STOP after 3 sentences. Do NOT include meta-commentary like 'Wait,', 'Let me reconsider,', 'Actually,', 'On reflection,', 'I should also note', 'To clarify', 'In summary'. No hedging like 'seems', 'perhaps', 'might'. No self-correction. Just the analysis, then stop.",
      },
      verdict: {
        type: "string",
        description: "Single sentence. Must start with the literal word 'Yes', 'No', or 'Partially', followed by one short reason. Example: 'Partially — buyers describe the symptom but not the underlying cause.' STOP after one sentence. No meta-commentary, no self-checking.",
      },
      evidence: {
        type: "string",
        description: "1-2 sentences. The single most specific finding from the results, quoting source language when possible (names, numbers, direct phrases). STOP after 2 sentences. No meta-commentary, no 'Let me verify', no 'Wait,'.",
      },
      implication: {
        type: "string",
        description: "1-2 sentences. What the user should conclude or do based on this analysis. Concrete, not abstract. STOP after 2 sentences. No meta-commentary, no 'Wait,', no 'Let me also,', no 'On second thought,', no rules-checking, no self-review.",
      },
    },
    required: ["summary", "verdict", "evidence", "implication"],
  },
};

function buildPhaseSynthesisPrompt(phaseId: number, problem: string, results: ExaResult[]) {
  const phaseName = PHASE_NAMES[phaseId];
  const phaseQuestion = PHASE_QUESTIONS[phaseId];

  const resultsWithHighlights = results.filter((r) => r.highlights && r.highlights.length > 0);

  const topResults = resultsWithHighlights
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 5);

  const resultsText = topResults.map((r, i) => {
    const highlight = r.highlights![0].slice(0, 300);
    return `[${i + 1}] ${r.title || "Untitled"}\n    ${highlight}${r.highlights![0].length > 300 ? "..." : ""}`;
  }).join("\n\n");

  const system = `You are a category design research assistant analyzing search results for a neurodivergent founder. Ground every claim in the provided results. Quote source language where possible. Be honest if results are weak — do not invent evidence. Respond by calling the submit_phase_analysis tool.`;

  const user = `Phase: ${phaseName}
Research question: ${phaseQuestion}
User's problem statement: "${problem}"

Top search results:
${resultsText || "[No results with highlights found]"}

Analyze these results and answer the research question.`;

  return { system, user };
}

function validatePhaseSynthesis(input: unknown): PhaseSynthesisResponse {
  if (!input || typeof input !== "object") {
    throw new StrategyRequestError(502, "Phase analysis was not an object");
  }
  const obj = input as Record<string, unknown>;
  const summary = scrubMeta(typeof obj.summary === "string" ? obj.summary : "");
  const verdict = scrubMeta(typeof obj.verdict === "string" ? obj.verdict : "");
  const evidence = scrubMeta(typeof obj.evidence === "string" ? obj.evidence : "");
  const implication = scrubMeta(typeof obj.implication === "string" ? obj.implication : "");

  if (!summary || !verdict || !evidence || !implication) {
    throw new StrategyRequestError(502, "Phase analysis was missing required fields");
  }

  return { summary, verdict, evidence, implication };
}

const META_MARKERS = [
  "Wait,",
  "Wait —",
  "Let me reconsider",
  "Let me revise",
  "Let me refine",
  "Let me verify",
  "I need to verify",
  "I need to check",
  "Reconsidering,",
  "Check rules",
  "Checking rules",
  "Rules check",
  "Self-check",
  "Self check",
];

function scrubMeta(text: string): string {
  let out = text.trim();
  if (!out) return out;

  for (const marker of META_MARKERS) {
    const lowered = out.toLowerCase();
    const target = marker.toLowerCase();
    let idx = lowered.indexOf(target);
    while (idx !== -1) {
      const isStartOfSentence = idx === 0
        || /[.!?\n]\s*$/.test(out.slice(0, idx))
        || /\n\s*$/.test(out.slice(0, idx));
      if (isStartOfSentence) {
        out = out.slice(0, idx).trim();
        break;
      }
      idx = lowered.indexOf(target, idx + 1);
    }
  }

  out = out.replace(/[\s—\-—:,;]+$/g, "").trim();
  return out;
}
