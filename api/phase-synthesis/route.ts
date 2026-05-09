import { getKimiConfig, fetchWithTimeout, StrategyRequestError } from "../_lib/strategy-api";
import type { ExaResult } from "../../src/types";

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

interface KimiResponse {
  choices?: Array<{
    message?: {
      role?: string;
      content?: string | null;
    };
    finish_reason?: string;
  }>;
  error?: {
    message?: string;
  };
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

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json() as PhaseSynthesisRequest;
    
    if (!body.phaseId || !PHASE_QUESTIONS[body.phaseId]) {
      throw new StrategyRequestError(400, "Invalid phaseId");
    }
    
    if (!body.problem?.trim()) {
      throw new StrategyRequestError(400, "Problem statement is required");
    }
    
    if (!body.results || body.results.length === 0) {
      throw new StrategyRequestError(400, "Results are required");
    }

    const { apiKey, model, baseUrl } = getKimiConfig(process.env);
    const timeoutMs = 30_000;

    const prompt = buildPhaseSynthesisPrompt(body.phaseId, body.problem, body.results);
    
    const response = await fetchWithTimeout(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 400,
        temperature: 0.7,
        messages: [
          { role: "system", content: prompt.system },
          { role: "user", content: prompt.user },
        ],
      }),
    }, timeoutMs, "Kimi API");

    if (!response.ok) {
      const errorText = await response.text();
      throw new StrategyRequestError(response.status, `Kimi API error ${response.status}: ${errorText}`);
    }

    const data = await response.json() as KimiResponse;
    const synthesis = parseSynthesisResponse(data);
    
    return Response.json(synthesis);
  } catch (error) {
    if (error instanceof StrategyRequestError) {
      return Response.json({ error: error.message }, { status: error.statusCode });
    }
    
    const message = error instanceof Error ? error.message : "Unexpected phase synthesis failure";
    return Response.json({ error: message }, { status: 500 });
  }
}

function buildPhaseSynthesisPrompt(phaseId: number, problem: string, results: ExaResult[]) {
  const phaseName = PHASE_NAMES[phaseId];
  const phaseQuestion = PHASE_QUESTIONS[phaseId];
  
  // Take top 5 results with their best highlight
  const topResults = results
    .filter((r) => r.highlights && r.highlights.length > 0)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 5);

  const resultsText = topResults.map((r, i) => {
    const highlight = r.highlights![0].slice(0, 300);
    return `[${i + 1}] ${r.title || "Untitled"}\n    ${highlight}${r.highlights![0].length > 300 ? "..." : ""}`;
  }).join("\n\n");

  const system = `You are a category design research assistant. Your job is to analyze search results and summarize what was found for the user.

Be direct, specific, and honest. If the results are thin or don't match what the phase is looking for, say so clearly.

You must respond in exactly this format:

SUMMARY: [2-3 sentences describing what was found across the sources — the patterns, the sources, the specific language or evidence. Be concrete.]
VERDICT: [Yes / No / Partially — followed by a one-sentence reason answering the research question]
EVIDENCE: [The single most specific concrete finding — include a direct quote, named source, or specific detail]
IMPLICATION: [What this means for the user's idea — one sentence telling them what to conclude or do next]

Rules:
- SUMMARY must describe the actual findings: what kinds of sources, what patterns you see, what language or evidence appears
- VERDICT must start with Yes, No, or Partially
- Never use hedging language like "it seems," "perhaps," "might," or "could indicate"
- If results are weak, be honest — don't invent evidence
- Be specific: use quotes, names, numbers from the sources`;

  const user = `Phase: ${phaseName}
Research question: ${phaseQuestion}
User's problem statement: "${problem}"

Top search results:
${resultsText || "[No results with highlights found]"}

Analyze these results and answer the research question.`;

  return { system, user };
}

function parseSynthesisResponse(data: KimiResponse): PhaseSynthesisResponse {
  const content = data.choices?.[0]?.message?.content?.trim() || "";
  
  // Default fallback
  const fallback: PhaseSynthesisResponse = {
    summary: "Analysis incomplete — could not generate findings summary from results.",
    verdict: "Partially — analysis incomplete",
    evidence: "Could not extract specific findings from results.",
    implication: "Review the source list below for direct evidence.",
  };
  
  if (!content) return fallback;
  
  // Parse SUMMARY, VERDICT, EVIDENCE, IMPLICATION lines
  const summaryMatch = content.match(/SUMMARY:\s*(.+?)(?=\n(?:VERDICT|EVIDENCE|IMPLICATION):|$)/is);
  const verdictMatch = content.match(/VERDICT:\s*(.+?)(?=\n(?:SUMMARY|EVIDENCE|IMPLICATION):|$)/i);
  const evidenceMatch = content.match(/EVIDENCE:\s*(.+?)(?=\n(?:SUMMARY|VERDICT|IMPLICATION):|$)/i);
  const implicationMatch = content.match(/IMPLICATION:\s*(.+?)(?=\n(?:SUMMARY|VERDICT|EVIDENCE):|$)/i);
  
  return {
    summary: summaryMatch?.[1]?.trim() || fallback.summary,
    verdict: verdictMatch?.[1]?.trim() || fallback.verdict,
    evidence: evidenceMatch?.[1]?.trim() || fallback.evidence,
    implication: implicationMatch?.[1]?.trim() || fallback.implication,
  };
}
