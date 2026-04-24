import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  StrategyRequestError,
  buildExaResearchRequest,
  buildStrategyDraftPrompt,
  getAnthropicConfig,
  getExaConfig,
  mergeStrategyCitations,
  mergeStrategyWarnings,
  parseExaTaskResponse,
  parseStrategyDraftText,
  validateResearchId,
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

interface ExaCreateTaskResponse {
  researchId?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const payload = validateStrategyDraftRequest(req.body);
    const researchIdInput = typeof req.body === "object" && req.body ? (req.body as Record<string, unknown>).researchId : undefined;
    const { apiKey: exaApiKey, model: exaModel } = getExaConfig(process.env);

    const exaTask = researchIdInput
      ? await pollExaResearchTask(validateResearchId(researchIdInput), exaApiKey)
      : await createExaResearchTask(payload, exaApiKey, exaModel);

    if (exaTask.status === "pending" || exaTask.status === "running") {
      return res.status(202).json({
        status: "researching",
        researchId: exaTask.researchId,
      });
    }

    if (exaTask.status === "failed" || exaTask.status === "canceled") {
      return res.status(502).json({
        error: exaTask.errorMessage || `Exa research ${exaTask.status}`,
      });
    }

    if (exaTask.status !== "completed") {
      return res.status(502).json({
        error: `Unexpected Exa research status: ${exaTask.status}`,
      });
    }

    const { apiKey: anthropicApiKey, model: anthropicModel } = getAnthropicConfig(process.env);
    const { system, user } = buildStrategyDraftPrompt(payload, {
      dossier: exaTask.dossier,
      citations: exaTask.citations,
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
      warnings: mergeStrategyWarnings(draft.warnings, exaTask.dossier),
      citations: mergeStrategyCitations(draft.citations, exaTask.citations),
      researchId: exaTask.researchId,
    });
  } catch (error) {
    if (error instanceof StrategyRequestError) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    const message = error instanceof Error ? error.message : "Unexpected strategy draft failure";
    return res.status(500).json({ error: message });
  }
}

async function createExaResearchTask(
  payload: ReturnType<typeof validateStrategyDraftRequest>,
  apiKey: string,
  model: string,
) {
  const request = buildExaResearchRequest(payload, model);
  const response = await fetch("https://api.exa.ai/research/v1", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new StrategyRequestError(response.status, `Exa Research create error ${response.status}: ${errorText}`);
  }

  const data = await response.json() as ExaCreateTaskResponse;
  const researchId = validateResearchId(data.researchId);

  return {
    researchId,
    status: "running" as const,
  };
}

async function pollExaResearchTask(researchId: string, apiKey: string) {
  const response = await fetch(`https://api.exa.ai/research/v1/${encodeURIComponent(researchId)}`, {
    method: "GET",
    headers: {
      "x-api-key": apiKey,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new StrategyRequestError(response.status, `Exa Research poll error ${response.status}: ${errorText}`);
  }

  return parseExaTaskResponse(await response.json());
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
