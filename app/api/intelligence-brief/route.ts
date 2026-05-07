import {
  StrategyRequestError,
  buildExaSearchRequest,
  getExaConfig,
  getKimiConfig,
  parseExaSearchResponse,
  validateStrategyDraftRequest,
} from "@/api/_lib/strategy-api";
import {
  buildFallbackIntelligenceBriefPart1,
  buildFallbackIntelligenceBriefPart2,
  buildIntelligenceBriefPromptPart1,
  buildIntelligenceBriefPromptPart2,
  mergeIntelligenceBriefParts,
  parseIntelligenceBriefPart1,
  parseIntelligenceBriefPart2,
} from "@/api/_lib/intelligence-api";

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

export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const payload = validateStrategyDraftRequest(await req.json());
    const { apiKey: exaApiKey, searchType: exaSearchType } = getExaConfig(process.env);
    const exaSearch = await runExaDeepSearch(payload, exaApiKey, exaSearchType);

    const { apiKey: kimiApiKey, model: kimiModel, baseUrl } = getKimiConfig(process.env);
    const exaResearch = { dossier: exaSearch.dossier, citations: exaSearch.citations };

    const [p1Prompt, p2Prompt] = [
      buildIntelligenceBriefPromptPart1(payload, exaResearch),
      buildIntelligenceBriefPromptPart2(payload, exaResearch),
    ];

    const [r1, r2] = await Promise.all([
      callKimi(baseUrl, kimiApiKey, kimiModel, p1Prompt),
      callKimi(baseUrl, kimiApiKey, kimiModel, p2Prompt),
    ]);

    const part1 = parsePart1OrFallback(r1, payload);
    const part2 = parsePart2OrFallback(r2, payload);
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

async function callKimi(
  baseUrl: string,
  apiKey: string,
  model: string,
  prompt: { system: string; user: string },
): Promise<KimiResponse> {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4000,
      temperature: 1,
      messages: [
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.user },
      ],
    }),
  });

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
) {
  const request = buildExaSearchRequest(payload, searchType);
  const response = await fetch("https://api.exa.ai/search", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new StrategyRequestError(response.status, `Exa Search error ${response.status}: ${errorText}`);
  }

  return parseExaSearchResponse(await response.json());
}

function parsePart1OrFallback(
  data: KimiResponse,
  payload: ReturnType<typeof validateStrategyDraftRequest>,
) {
  try {
    return parseIntelligenceBriefPart1(data);
  } catch {
    return buildFallbackIntelligenceBriefPart1(payload);
  }
}

function parsePart2OrFallback(
  data: KimiResponse,
  payload: ReturnType<typeof validateStrategyDraftRequest>,
) {
  try {
    return parseIntelligenceBriefPart2(data);
  } catch {
    return buildFallbackIntelligenceBriefPart2(payload);
  }
}
