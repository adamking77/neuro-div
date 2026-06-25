import type { GenerateReportInput } from "../analysis-reports";
import {
  attachServerReportFields,
  normalizeModelReport,
  parseNeuroDivAnalysisReport,
  processAnalysisResponseSchema,
  profileSynthesisResponseSchema,
} from "./analysis-contract";

type ChatMessage = {
  role: "system" | "user";
  content: string;
};

interface DeepSeekChoice {
  message?: {
    content?: string;
  };
}

interface DeepSeekResponse {
  choices?: DeepSeekChoice[];
  error?: {
    message?: string;
  };
}

const DEFAULT_MODEL = "deepseek-v4-flash";
const DEFAULT_BASE_URL = "https://api.deepseek.com";

export class DeepSeekError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DeepSeekError";
  }
}

export function getDeepSeekModel() {
  return process.env.NEURODIV_MODEL || DEFAULT_MODEL;
}

function getDeepSeekEndpoint() {
  const base = process.env.DEEPSEEK_API_BASE_URL || DEFAULT_BASE_URL;
  return `${base.replace(/\/$/, "")}/chat/completions`;
}

function parseJsonContent(content: string): unknown {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return JSON.parse(fenced ? fenced[1] : trimmed);
}

async function createDeepSeekJson(messages: ChatMessage[]): Promise<unknown> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new DeepSeekError("DEEPSEEK_API_KEY is not configured.");
  }

  const response = await fetch(getDeepSeekEndpoint(), {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: getDeepSeekModel(),
      messages,
      temperature: 0.2,
      response_format: { type: "json_object" },
    }),
  });

  const payload = await response.json() as DeepSeekResponse;
  if (!response.ok) {
    throw new DeepSeekError(payload.error?.message || `DeepSeek request failed with ${response.status}.`);
  }

  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new DeepSeekError("DeepSeek returned no message content.");
  }

  try {
    return parseJsonContent(content);
  } catch (error) {
    throw new DeepSeekError(error instanceof Error ? `DeepSeek returned invalid JSON: ${error.message}` : "DeepSeek returned invalid JSON.");
  }
}

function buildReportSystemPrompt() {
  return [
    "You generate NeuroDiv OS operating-context reports.",
    "Return JSON only. No markdown. No prose outside JSON.",
    "Do not diagnose. Do not make medical claims.",
    "Do not moralize inconsistent energy, avoidance, shutdown, or burst work.",
    "Use the supplied profile and process as primary evidence.",
    "Separate observation from inference.",
    "Clearly mark missing information instead of inventing it.",
    "Every recommendation must cite at least one input field or inferred pattern in evidence.",
    "Every risk must include a mitigation.",
    "Include low, normal, and high energy paths.",
    "Avoid generic productivity language such as just be consistent or build discipline.",
  ].join("\n");
}

function buildReportUserPrompt(input: GenerateReportInput) {
  return [
    "Create a NeuroDivAnalysisReport JSON object with this exact top-level shape:",
    JSON.stringify({
      id: "string",
      createdAt: "ISO string",
      updatedAt: "ISO string",
      title: "string",
      profileSnapshot: "object matching supplied input",
      processSnapshot: "object matching supplied input",
      executiveSummary: "string",
      operatingPatternInsights: [{
        title: "string",
        observation: "string",
        inference: "string",
        evidence: ["string"],
        confidence: "low | medium | high",
      }],
      activationMap: [{ label: "string", value: 0, max: 100, group: "optional string", evidence: "optional string" }],
      shutdownRiskMap: [{ label: "string", value: 0, max: 100, group: "optional string", evidence: "optional string" }],
      energyModePlan: [{ label: "Low energy", value: 0, max: 100, group: "energy", evidence: "string" }],
      processFitScore: { label: "string", score: 0, max: 100, rationale: "string", evidence: ["string"] },
      recommendations: [{ title: "string", recommendation: "string", why: "string", evidence: ["string"], energyMode: "low | normal | high" }],
      nextSevenDays: [{ day: "Day 1", title: "string", action: "string", energyMode: "low | normal | high", doneSignal: "string" }],
      rescuePlan: [{ title: "string", trigger: "string", action: "string", mitigation: "string", doneSignal: "string", evidence: ["string"] }],
      agentBrief: "string",
      caveats: ["string"],
      model: { provider: "deepseek", name: getDeepSeekModel() },
    }, null, 2),
    "",
    "Input:",
    JSON.stringify(input, null, 2),
  ].join("\n");
}

export async function generateReportWithDeepSeek(input: GenerateReportInput) {
  const modelName = getDeepSeekModel();
  const raw = await createDeepSeekJson([
    { role: "system", content: buildReportSystemPrompt() },
    { role: "user", content: buildReportUserPrompt(input) },
  ]);

  const candidate = attachServerReportFields(raw, input, modelName);
  return normalizeModelReport(parseNeuroDivAnalysisReport(candidate), input, modelName);
}

export async function synthesizeProfileWithDeepSeek(input: unknown) {
  const raw = await createDeepSeekJson([
    { role: "system", content: buildReportSystemPrompt() },
    {
      role: "user",
      content: [
        "Return JSON only with this exact shape:",
        JSON.stringify({
          summary: "string",
          activationPatterns: ["string"],
          shutdownRisks: ["string"],
          missingContext: ["string"],
          caveats: ["string"],
        }),
        "Use only the supplied profile/context. Do not diagnose.",
        JSON.stringify(input, null, 2),
      ].join("\n"),
    },
  ]);

  return profileSynthesisResponseSchema.parse(raw);
}

export async function analyzeProcessWithDeepSeek(input: unknown) {
  const raw = await createDeepSeekJson([
    { role: "system", content: buildReportSystemPrompt() },
    {
      role: "user",
      content: [
        "Return JSON only with this exact shape:",
        JSON.stringify({
          fitScore: { label: "string", score: 0, max: 100, rationale: "string", evidence: ["string"] },
          risks: [{ title: "string", trigger: "string", action: "string", mitigation: "string", doneSignal: "string", evidence: ["string"] }],
          recommendations: [{ title: "string", recommendation: "string", why: "string", evidence: ["string"], energyMode: "low | normal | high" }],
          caveats: ["string"],
        }),
        "Use the process and profile context as evidence. Include mitigations for risks.",
        JSON.stringify(input, null, 2),
      ].join("\n"),
    },
  ]);

  return processAnalysisResponseSchema.parse(raw);
}
