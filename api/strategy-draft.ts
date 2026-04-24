import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  StrategyRequestError,
  buildExaSearchRequest,
  buildStrategyDraftPrompt,
  getAnthropicConfig,
  getExaConfig,
  mergeStrategyCitations,
  mergeStrategyWarnings,
  parseExaSearchResponse,
  parseStrategyDraftText,
  validateStrategyDraftRequest,
} from "./_lib/strategy-api.js";

interface AnthropicResponse {
  content?: Array<{
    type?: string;
    text?: string;
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

    const { apiKey: anthropicApiKey, model: anthropicModel } = getAnthropicConfig(process.env);
    const { system, user } = buildStrategyDraftPrompt(payload, {
      dossier: exaSearch.dossier,
      citations: exaSearch.citations,
    });

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: anthropicModel,
        max_tokens: 2200,
        temperature: 0.5,
        system,
        messages: [
          {
            role: "user",
            content: user,
          },
        ],
      }),
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      return res.status(anthropicResponse.status).json({
        error: `Anthropic API error ${anthropicResponse.status}: ${errorText}`,
      });
    }

    const anthropicData = await anthropicResponse.json() as AnthropicResponse;
    const draft = parseStrategyDraftText(extractAnthropicText(anthropicData));

    return res.status(200).json({
      ...draft,
      warnings: mergeStrategyWarnings(draft.warnings, exaSearch.dossier),
      citations: mergeStrategyCitations(draft.citations, exaSearch.citations),
    });
  } catch (error) {
    if (error instanceof StrategyRequestError) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    const message = error instanceof Error ? error.message : "Unexpected strategy draft failure";
    return res.status(500).json({ error: message });
  }
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

function extractAnthropicText(data: AnthropicResponse): string {
  const text = data.content
    ?.filter((item) => item.type === "text" && typeof item.text === "string")
    .map((item) => item.text)
    .join("\n")
    .trim();

  if (!text) {
    throw new StrategyRequestError(502, data.error?.message || "Anthropic response did not include text output");
  }

  return text;
}
