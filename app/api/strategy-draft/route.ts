import {
  callKimiWithTool,
  createEmptyExaResearch,
  StrategyRequestError,
  STRATEGY_DRAFT_PART1_TOOL,
  STRATEGY_DRAFT_PART2_TOOL,
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
  parseStrategyDraftPart1Structured,
  parseStrategyDraftPart2Structured,
  validateStrategyDraftRequest,
  type StrategyDraftPart1,
  type StrategyDraftPart2,
} from "@/api/_lib/strategy-api";

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

    const p1Prompt = buildStrategyDraftPromptPart1(payload, exaResearch);
    const p2Prompt = buildStrategyDraftPromptPart2(payload, exaResearch);

    const kimiStartedAt = Date.now();
    const [r1, r2] = await Promise.allSettled([
      callKimiWithTool(baseUrl, kimiApiKey, kimiModel, p1Prompt, STRATEGY_DRAFT_PART1_TOOL, kimiMs, { maxTokens: 2000 }),
      callKimiWithTool(baseUrl, kimiApiKey, kimiModel, p2Prompt, STRATEGY_DRAFT_PART2_TOOL, kimiMs, { maxTokens: 2000 }),
    ]);
    console.info("[strategy-draft] kimi settled", {
      durationMs: Date.now() - kimiStartedAt,
      part1: r1.status,
      part2: r2.status,
    });

    if (r1.status === "rejected") {
      console.warn("[strategy-draft] part1 rejected", { reason: reasonText(r1.reason) });
    }
    if (r2.status === "rejected") {
      console.warn("[strategy-draft] part2 rejected", { reason: reasonText(r2.reason) });
    }

    const part1: StrategyDraftPart1 = r1.status === "fulfilled"
      ? safeValidate(
          () => parseStrategyDraftPart1Structured(r1.value),
          () => buildFallbackStrategyDraftPart1(payload, exaResearch),
          "part1",
        )
      : buildFallbackStrategyDraftPart1(payload, exaResearch);

    const part2: StrategyDraftPart2 = r2.status === "fulfilled"
      ? safeValidate(
          () => parseStrategyDraftPart2Structured(r2.value),
          () => buildFallbackStrategyDraftPart2(payload, exaResearch),
          "part2",
        )
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

function safeValidate<T>(run: () => T, fallback: () => T, label: string): T {
  try {
    return run();
  } catch (error) {
    console.warn(`[strategy-draft] ${label} validation failed, using fallback`, {
      reason: error instanceof Error ? error.message : String(error),
    });
    return fallback();
  }
}

function reasonText(reason: unknown): string {
  return reason instanceof Error ? reason.message : String(reason);
}
