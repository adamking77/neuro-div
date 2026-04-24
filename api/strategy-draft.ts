import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  StrategyRequestError,
  buildExaSearchRequest,
  buildFallbackStrategyDraft,
  buildStrategyDraftPrompt,
  getExaConfig,
  getKimiConfig,
  mergeStrategyCitations,
  mergeStrategyWarnings,
  parseExaSearchResponse,
  parseStrategyDraftInput,
  parseStrategyDraftText,
  validateStrategyDraftRequest,
} from "./_lib/strategy-api.js";

interface KimiToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

interface KimiResponse {
  choices?: Array<{
    message?: {
      role?: string;
      content?: string | null;
      tool_calls?: KimiToolCall[];
    };
    finish_reason?: string;
  }>;
  error?: {
    message?: string;
  };
}

const STRATEGY_DRAFT_TOOL_NAME = "emit_strategy_draft";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const payload = validateStrategyDraftRequest(req.body);
    const { apiKey: exaApiKey, searchType: exaSearchType } = getExaConfig(process.env);
    const exaSearch = await runExaDeepSearch(payload, exaApiKey, exaSearchType);

    const { apiKey: kimiApiKey, model: kimiModel, baseUrl } = getKimiConfig(process.env);
    const { system, user } = buildStrategyDraftPrompt(payload, {
      dossier: exaSearch.dossier,
      citations: exaSearch.citations,
    });

    const kimiResponse = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${kimiApiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: kimiModel,
        max_tokens: 2200,
        temperature: 1,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (!kimiResponse.ok) {
      const errorText = await kimiResponse.text();
      return res.status(kimiResponse.status).json({
        error: `Kimi API error ${kimiResponse.status}: ${errorText}`,
      });
    }

    const kimiData = await kimiResponse.json() as KimiResponse;
    const draft = parseKimiStrategyDraftOrFallback(kimiData, payload, {
      dossier: exaSearch.dossier,
      citations: exaSearch.citations,
    });

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

function extractKimiText(data: KimiResponse): string {
  const text = data.choices?.[0]?.message?.content;

  if (!text || typeof text !== "string") {
    throw new StrategyRequestError(502, data.error?.message || "Kimi response did not include text output");
  }

  return text.trim();
}

function parseKimiStrategyDraft(data: KimiResponse) {
  const toolCalls = data.choices?.[0]?.message?.tool_calls;
  const toolCall = toolCalls?.find((tc) => tc.function?.name === STRATEGY_DRAFT_TOOL_NAME);

  if (toolCall && toolCall.function.arguments) {
    return parseStrategyDraftInput(JSON.parse(toolCall.function.arguments));
  }

  return parseStrategyDraftText(extractKimiText(data));
}

function parseKimiStrategyDraftOrFallback(
  data: KimiResponse,
  payload: ReturnType<typeof validateStrategyDraftRequest>,
  exaResearch: Parameters<typeof buildFallbackStrategyDraft>[1],
) {
  try {
    return parseKimiStrategyDraft(data);
  } catch (error) {
    if (error instanceof StrategyRequestError) {
      return buildFallbackStrategyDraft(payload, exaResearch);
    }

    throw error;
  }
}

function getStrategyDraftToolSchema() {
  return {
    type: "object" as const,
    required: ["sections", "warnings", "citations"],
    properties: {
      sections: {
        type: "object" as const,
        required: [
          "positioning",
          "channelPlan",
          "messageAngles",
          "assetIdeas",
          "experiments",
          "thirtyDaySequence",
        ],
        properties: {
          positioning: {
            type: "string" as const,
            minLength: 40,
            description: "Substantive positioning strategy text, not a placeholder.",
          },
          channelPlan: {
            type: "string" as const,
            minLength: 40,
            description: "Substantive low-contact channel strategy text, not a placeholder.",
          },
          messageAngles: {
            type: "string" as const,
            minLength: 40,
            description: "Substantive messaging strategy text, not a placeholder.",
          },
          assetIdeas: {
            type: "string" as const,
            minLength: 40,
            description: "Substantive create-once asset recommendations, not a placeholder.",
          },
          experiments: {
            type: "string" as const,
            minLength: 40,
            description: "Substantive bounded experiment recommendations, not a placeholder.",
          },
          thirtyDaySequence: {
            type: "string" as const,
            minLength: 40,
            description: "Substantive 30-day sprint sequence, not a placeholder.",
          },
        },
        additionalProperties: false,
      },
      warnings: {
        type: "array" as const,
        items: { type: "string" as const },
      },
      citations: {
        type: "array" as const,
        items: {
          type: "object" as const,
          required: ["section", "title", "url"],
          properties: {
            section: {
              type: "string" as const,
              enum: [
                "positioning",
                "channelPlan",
                "messageAngles",
                "assetIdeas",
                "experiments",
                "thirtyDaySequence",
              ],
            },
            title: { type: "string" as const },
            url: { type: "string" as const },
            note: { type: "string" as const },
          },
          additionalProperties: false,
        },
      },
    },
    additionalProperties: false,
  };
}
