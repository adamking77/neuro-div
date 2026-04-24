import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  StrategyRequestError,
  buildExaSearchRequest,
  buildFallbackIntelligenceBriefPart1,
  buildFallbackIntelligenceBriefPart2,
  buildIntelligenceBriefPromptPart1,
  buildIntelligenceBriefPromptPart2,
  getExaConfig,
  getKimiConfig,
  mergeIntelligenceBriefParts,
  parseExaSearchResponse,
  parseIntelligenceBriefPart1,
  parseIntelligenceBriefPart2,
  validateStrategyDraftRequest,
} from "./_lib/intelligence-api.js";

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const payload = validateStrategyDraftRequest(req.body);
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

    return res.status(200).json(brief);
  } catch (error) {
    if (error instanceof StrategyRequestError) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    const message = error instanceof Error ? error.message : "Unexpected intelligence brief failure";
    return res.status(500).json({ error: message });
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
