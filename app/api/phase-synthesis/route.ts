// Force Node.js runtime (not Edge) to avoid Vercel edge auth issues
export const runtime = "nodejs";
export const preferredRegion = "iad1";

import type { ExaResult } from "@/src/types";

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

interface KimiResponse {
  choices?: Array<{
    message?: {
      role?: string;
      content?: string | null;
      reasoning_content?: string | null;
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
    const baseUrl = process.env.KIMI_BASE_URL || "https://api.moonshot.cn/v1";
    const model = process.env.KIMI_MODEL || "kimi-k2-6";
    
    console.info("[phase-synthesis] env check", { 
      hasKey: !!apiKey, 
      keyLength: apiKey?.length,
      baseUrl: baseUrl.slice(0, 30),
      model 
    });
    
    if (!apiKey) {
      console.error("[phase-synthesis] KIMI_API_KEY not configured");
      return Response.json({ error: "KIMI_API_KEY not configured" }, { status: 500 });
    }
    
    console.info("[phase-synthesis] calling Kimi", { model, baseUrl: baseUrl.slice(0, 30) });

    const prompt = buildPhaseSynthesisPrompt(body.phaseId, body.problem, body.results);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const requestBody = {
      model,
      max_tokens: 800,
      temperature: 1,
      messages: [
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.user },
      ],
    };
    
    console.info("[phase-synthesis] request details", { 
      url: `${baseUrl}/chat/completions`,
      model,
      messagesCount: requestBody.messages.length
    });
    
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[phase-synthesis] Kimi API error", { 
        status: response.status, 
        statusText: response.statusText,
        error: errorText.slice(0, 500),
        headers: Object.fromEntries(response.headers.entries())
      });
      return Response.json({ error: `Kimi API error ${response.status}: ${errorText.slice(0, 200)}` }, { status: response.status });
    }

    const data = await response.json() as KimiResponse;
    console.info("[phase-synthesis] Kimi response received", { 
      hasChoices: !!data.choices, 
      choicesLength: data.choices?.length,
      hasContent: !!data.choices?.[0]?.message?.content 
    });
    
    const synthesis = parseSynthesisResponse(data);
    console.info("[phase-synthesis] returning synthesis", { 
      summaryLength: synthesis.summary.length,
      verdict: synthesis.verdict.slice(0, 50) 
    });
    
    return Response.json(synthesis);
  } catch (error) {
    console.error("[phase-synthesis] unexpected error", error);
    const message = error instanceof Error ? error.message : "Unexpected phase synthesis failure";
    return Response.json({ error: message }, { status: 500 });
  }
}

function buildPhaseSynthesisPrompt(phaseId: number, problem: string, results: ExaResult[]) {
  const phaseName = PHASE_NAMES[phaseId];
  const phaseQuestion = PHASE_QUESTIONS[phaseId];
  
  const resultsWithHighlights = results.filter((r) => r.highlights && r.highlights.length > 0);
  console.info("[phase-synthesis] results with highlights", { 
    totalResults: results.length, 
    withHighlights: resultsWithHighlights.length 
  });
  
  const topResults = resultsWithHighlights
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
- Be specific: use quotes, names, numbers from the sources

IMPORTANT: After your analysis, output your final answer in the required format above. Do not omit any section.`;

  const user = `Phase: ${phaseName}
Research question: ${phaseQuestion}
User's problem statement: "${problem}"

Top search results:
${resultsText || "[No results with highlights found]"}

Analyze these results and answer the research question.`;

  return { system, user };
}

function parseSynthesisResponse(data: KimiResponse): PhaseSynthesisResponse {
  const message = data.choices?.[0]?.message;
  const content = message?.content?.trim() || message?.reasoning_content?.trim() || "";
  
  const fallback: PhaseSynthesisResponse = {
    summary: "Analysis incomplete — could not generate findings summary from results.",
    verdict: "Partially — analysis incomplete",
    evidence: "Could not extract specific findings from results.",
    implication: "Review the source list below for direct evidence.",
  };
  
  if (!content) return fallback;
  
  const summaryMatch = content.match(/SUMMARY:\s*([\s\S]+?)(?=\s*(?:VERDICT|EVIDENCE|IMPLICATION):|$)/i);
  const verdictMatch = content.match(/VERDICT:\s*([\s\S]+?)(?=\s*(?:SUMMARY|EVIDENCE|IMPLICATION):|$)/i);
  const evidenceMatch = content.match(/EVIDENCE:\s*([\s\S]+?)(?=\s*(?:SUMMARY|VERDICT|IMPLICATION):|$)/i);
  const implicationMatch = content.match(/IMPLICATION:\s*([\s\S]+?)(?=\s*(?:SUMMARY|VERDICT|EVIDENCE):|$)/i);
  
  return {
    summary: summaryMatch?.[1]?.trim() || fallback.summary,
    verdict: verdictMatch?.[1]?.trim() || fallback.verdict,
    evidence: evidenceMatch?.[1]?.trim() || fallback.evidence,
    implication: implicationMatch?.[1]?.trim() || fallback.implication,
  };
}
