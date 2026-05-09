import {
  createEmptyExaResearch,
  StrategyRequestError,
  buildExaSearchRequest,
  buildFallbackStrategyDraftPart1,
  buildFallbackStrategyDraftPart2,
  buildStrategyDraftPromptPart1,
  buildStrategyDraftPromptPart2,
  fetchWithTimeout,
  getExaConfig,
  getKimiConfig,
  getUpstreamTimeouts,
  mergeStrategyCitations,
  mergeStrategyDraftParts,
  mergeStrategyWarnings,
  parseExaSearchResponse,
  parseStrategyDraftPart1Text,
  parseStrategyDraftPart2Text,
  validateStrategyDraftRequest,
  type StrategyDraftPart1,
  type StrategyDraftPart2,
} from "@/api/_lib/strategy-api";

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

export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const payload = validateStrategyDraftRequest(await req.json());
    const { apiKey: exaApiKey, searchType: exaSearchType } = getExaConfig(process.env);
    const { exaMs, kimiMs } = getUpstreamTimeouts(process.env);
    const exaStartedAt = Date.now();
    let exaResearch = createEmptyExaResearch();
    try {
      const exaSearch = await runExaDeepSearch(payload, exaApiKey, exaSearchType, exaMs);
      exaResearch = { dossier: exaSearch.dossier, citations: exaSearch.citations };
      console.info("[strategy-draft] exa completed", { durationMs: Date.now() - exaStartedAt });
    } catch (error) {
      console.warn("[strategy-draft] exa unavailable, continuing without exa research", {
        durationMs: Date.now() - exaStartedAt,
        reason: error instanceof Error ? error.message : String(error),
      });
    }

    const { apiKey: kimiApiKey, model: kimiModel, baseUrl } = getKimiConfig(process.env);

    const [p1Prompt, p2Prompt] = [
      buildStrategyDraftPromptPart1(payload, exaResearch),
      buildStrategyDraftPromptPart2(payload, exaResearch),
    ];

    const kimiStartedAt = Date.now();
    const [r1, r2] = await Promise.allSettled([
      callKimi(baseUrl, kimiApiKey, kimiModel, p1Prompt, kimiMs),
      callKimi(baseUrl, kimiApiKey, kimiModel, p2Prompt, kimiMs),
    ]);
    console.info("[strategy-draft] kimi settled", {
      durationMs: Date.now() - kimiStartedAt,
      part1: r1.status,
      part2: r2.status,
    });

    if (r1.status === "rejected" && r2.status === "rejected") {
      console.warn("[strategy-draft] kimi unavailable, using fallback", {
        reason: getCombinedFailureMessage("Kimi", [r1.reason, r2.reason]),
      });
    }

    const part1 = r1.status === "fulfilled"
      ? parsePart1OrFallback(r1.value, payload, exaResearch)
      : buildFallbackStrategyDraftPart1(payload, exaResearch);
    const part2 = r2.status === "fulfilled"
      ? parsePart2OrFallback(r2.value, payload, exaResearch)
      : buildFallbackStrategyDraftPart2(payload, exaResearch);
    const draft = mergeStrategyDraftParts(part1, part2);

    return Response.json({
      ...draft,
      warnings: mergeStrategyWarnings(draft.warnings, exaResearch.dossier),
      citations: mergeStrategyCitations(draft.citations, exaResearch.citations),
    });
  } catch (error) {
    if (error instanceof StrategyRequestError) {
      return Response.json({ error: error.message }, { status: error.statusCode });
    }

    const message = error instanceof Error ? error.message : "Unexpected strategy draft failure";
    return Response.json({ error: message }, { status: 500 });
  }
}

async function callKimi(
  baseUrl: string,
  apiKey: string,
  model: string,
  prompt: { system: string; user: string },
  timeoutMs: number,
): Promise<KimiResponse> {
  const response = await fetchWithTimeout(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1200,
      temperature: 1,
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

  return response.json() as Promise<KimiResponse>;
}

async function runExaDeepSearch(
  payload: ReturnType<typeof validateStrategyDraftRequest>,
  apiKey: string,
  searchType: string,
  timeoutMs: number,
) {
  const request = buildExaSearchRequest(payload, searchType);
  const response = await fetchWithTimeout("https://api.exa.ai/search", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify(request),
  }, timeoutMs, "Exa Search");

  if (!response.ok) {
    const errorText = await response.text();
    throw new StrategyRequestError(response.status, `Exa Search error ${response.status}: ${errorText}`);
  }

  return parseExaSearchResponse(await response.json());
}

function extractKimiText(data: KimiResponse): string {
  const message = data.choices?.[0]?.message;
  const text = message?.content || message?.reasoning_content;

  if (!text || typeof text !== "string") {
    throw new StrategyRequestError(502, data.error?.message || "Kimi response did not include text output");
  }

  return text.trim();
}

function parsePart1OrFallback(
  data: KimiResponse,
  payload: ReturnType<typeof validateStrategyDraftRequest>,
  exaResearch: Parameters<typeof buildFallbackStrategyDraftPart1>[1],
): StrategyDraftPart1 {
  try {
    return parseStrategyDraftPart1Text(extractKimiText(data));
  } catch {
    return buildFallbackStrategyDraftPart1(payload, exaResearch);
  }
}

function parsePart2OrFallback(
  data: KimiResponse,
  payload: ReturnType<typeof validateStrategyDraftRequest>,
  exaResearch: Parameters<typeof buildFallbackStrategyDraftPart2>[1],
): StrategyDraftPart2 {
  try {
    return parseStrategyDraftPart2Text(extractKimiText(data));
  } catch {
    return buildFallbackStrategyDraftPart2(payload, exaResearch);
  }
}

function getCombinedFailureMessage(label: string, reasons: unknown[]): string {
  const details = reasons
    .map((reason) => reason instanceof Error ? reason.message : String(reason))
    .filter(Boolean)
    .join("; ");

  return details ? `${label} failed: ${details}` : `${label} failed`;
}
