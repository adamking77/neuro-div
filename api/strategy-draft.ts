import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  StrategyRequestError,
  buildExaSearchRequest,
  buildFallbackStrategyDraft,
  buildStrategyDraftPrompt,
  getAnthropicConfig,
  getExaConfig,
  mergeStrategyCitations,
  mergeStrategyWarnings,
  parseExaSearchResponse,
  parseStrategyDraftInput,
  parseStrategyDraftText,
  validateStrategyDraftRequest,
} from "./_lib/strategy-api.js";

interface AnthropicResponse {
  content?: Array<{
    type?: string;
    text?: string;
    name?: string;
    input?: unknown;
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
        tools: [
          {
            name: STRATEGY_DRAFT_TOOL_NAME,
            description: "Return the final strategy draft as structured JSON.",
            input_schema: getStrategyDraftToolSchema(),
          },
        ],
        tool_choice: {
          type: "tool",
          name: STRATEGY_DRAFT_TOOL_NAME,
        },
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
    const draft = parseAnthropicStrategyDraftOrFallback(anthropicData, payload, {
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

function parseAnthropicStrategyDraft(data: AnthropicResponse) {
  const toolInput = data.content?.find((item) =>
    item.type === "tool_use" && item.name === STRATEGY_DRAFT_TOOL_NAME && item.input,
  )?.input;

  if (toolInput) {
    return parseStrategyDraftInput(toolInput);
  }

  return parseStrategyDraftText(extractAnthropicText(data));
}

function parseAnthropicStrategyDraftOrFallback(
  data: AnthropicResponse,
  payload: ReturnType<typeof validateStrategyDraftRequest>,
  exaResearch: Parameters<typeof buildFallbackStrategyDraft>[1],
) {
  try {
    return parseAnthropicStrategyDraft(data);
  } catch (error) {
    if (error instanceof StrategyRequestError) {
      return buildFallbackStrategyDraft(payload, exaResearch);
    }

    throw error;
  }
}

function getStrategyDraftToolSchema() {
  return {
    type: "object",
    required: ["sections", "warnings", "citations"],
    properties: {
      sections: {
        type: "object",
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
            type: "string",
            minLength: 40,
            description: "Substantive positioning strategy text, not a placeholder.",
          },
          channelPlan: {
            type: "string",
            minLength: 40,
            description: "Substantive low-contact channel strategy text, not a placeholder.",
          },
          messageAngles: {
            type: "string",
            minLength: 40,
            description: "Substantive messaging strategy text, not a placeholder.",
          },
          assetIdeas: {
            type: "string",
            minLength: 40,
            description: "Substantive create-once asset recommendations, not a placeholder.",
          },
          experiments: {
            type: "string",
            minLength: 40,
            description: "Substantive bounded experiment recommendations, not a placeholder.",
          },
          thirtyDaySequence: {
            type: "string",
            minLength: 40,
            description: "Substantive 30-day sprint sequence, not a placeholder.",
          },
        },
        additionalProperties: false,
      },
      warnings: {
        type: "array",
        items: { type: "string" },
      },
      citations: {
        type: "array",
        items: {
          type: "object",
          required: ["section", "title", "url"],
          properties: {
            section: {
              type: "string",
              enum: [
                "positioning",
                "channelPlan",
                "messageAngles",
                "assetIdeas",
                "experiments",
                "thirtyDaySequence",
              ],
            },
            title: { type: "string" },
            url: { type: "string" },
            note: { type: "string" },
          },
          additionalProperties: false,
        },
      },
    },
    additionalProperties: false,
  };
}
