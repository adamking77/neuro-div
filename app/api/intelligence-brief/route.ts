import {
  callKimiWithTool,
  createEmptyExaResearch,
  StrategyRequestError,
  buildExaSearchRequest,
  fetchWithTimeout,
  getExaConfig,
  getKimiConfig,
  getUpstreamTimeouts,
  parseExaSearchResponse,
  validateStrategyDraftRequest,
} from "@/api/_lib/strategy-api";
import {
  INTELLIGENCE_BRIEF_PART1_TOOL,
  INTELLIGENCE_BRIEF_PART2_TOOL,
  buildFallbackIntelligenceBriefPart1,
  buildFallbackIntelligenceBriefPart2,
  buildIntelligenceBriefPromptPart1,
  buildIntelligenceBriefPromptPart2,
  mergeIntelligenceBriefParts,
  validateIntelligenceBriefPart1,
  validateIntelligenceBriefPart2,
} from "@/api/_lib/intelligence-api";

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
      console.info("[intelligence-brief] exa completed", { durationMs: Date.now() - exaStartedAt });
    } catch (error) {
      console.warn("[intelligence-brief] exa unavailable, continuing without exa research", {
        durationMs: Date.now() - exaStartedAt,
        reason: error instanceof Error ? error.message : String(error),
      });
    }

    const { apiKey: kimiApiKey, model: kimiModel, baseUrl } = getKimiConfig(process.env);

    const p1Prompt = buildIntelligenceBriefPromptPart1(payload, exaResearch);
    const p2Prompt = buildIntelligenceBriefPromptPart2(payload, exaResearch);

    const kimiStartedAt = Date.now();
    const [r1, r2] = await Promise.allSettled([
      callKimiWithTool(baseUrl, kimiApiKey, kimiModel, p1Prompt, INTELLIGENCE_BRIEF_PART1_TOOL, kimiMs, { maxTokens: 1500 }),
      callKimiWithTool(baseUrl, kimiApiKey, kimiModel, p2Prompt, INTELLIGENCE_BRIEF_PART2_TOOL, kimiMs, { maxTokens: 2000 }),
    ]);
    console.info("[intelligence-brief] kimi settled", {
      durationMs: Date.now() - kimiStartedAt,
      part1: r1.status,
      part2: r2.status,
    });

    if (r1.status === "rejected") {
      console.warn("[intelligence-brief] part1 rejected", { reason: reasonText(r1.reason) });
    }
    if (r2.status === "rejected") {
      console.warn("[intelligence-brief] part2 rejected", { reason: reasonText(r2.reason) });
    }

    const part1 = r1.status === "fulfilled"
      ? safeValidate(() => validateIntelligenceBriefPart1(r1.value), () => buildFallbackIntelligenceBriefPart1(payload), "part1")
      : buildFallbackIntelligenceBriefPart1(payload);
    const part2 = r2.status === "fulfilled"
      ? safeValidate(() => validateIntelligenceBriefPart2(r2.value), () => buildFallbackIntelligenceBriefPart2(payload), "part2")
      : buildFallbackIntelligenceBriefPart2(payload);
    const brief = mergeIntelligenceBriefParts(part1, part2);

    return Response.json(brief);
  } catch (error) {
    if (error instanceof StrategyRequestError) {
      return Response.json({ error: error.message }, { status: error.statusCode });
    }

    const message = error instanceof Error ? error.message : "Unexpected intelligence brief failure";
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
    console.warn(`[intelligence-brief] ${label} validation failed, using fallback`, {
      reason: error instanceof Error ? error.message : String(error),
    });
    return fallback();
  }
}

function reasonText(reason: unknown): string {
  return reason instanceof Error ? reason.message : String(reason);
}
