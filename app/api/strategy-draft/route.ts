import {
  StrategyRequestError,
  buildExaSearchRequest,
  buildFallbackStrategyDraftPart1,
  buildFallbackStrategyDraftPart2,
  buildStrategyDraftPromptPart1,
  buildStrategyDraftPromptPart2,
  getExaConfig,
  getKimiConfig,
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
      buildStrategyDraftPromptPart1(payload, exaResearch),
      buildStrategyDraftPromptPart2(payload, exaResearch),
    ];

    const [r1, r2] = await Promise.all([
      callKimi(baseUrl, kimiApiKey, kimiModel, p1Prompt),
      callKimi(baseUrl, kimiApiKey, kimiModel, p2Prompt),
    ]);

    const part1 = parsePart1OrFallback(r1, payload, exaResearch);
    const part2 = parsePart2OrFallback(r2, payload, exaResearch);
    const draft = mergeStrategyDraftParts(part1, part2);

    return Response.json({
      ...draft,
      warnings: mergeStrategyWarnings(draft.warnings, exaSearch.dossier),
      citations: mergeStrategyCitations(draft.citations, exaSearch.citations),
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

function extractKimiText(data: KimiResponse): string {
  const text = data.choices?.[0]?.message?.content;

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
