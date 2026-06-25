import { z } from "zod";
import type { GenerateReportInput } from "../analysis-reports";
import type { NeuroDivAnalysisReport } from "../../types";

const stringArraySchema = z.array(z.string());

export const processDesignerInputsSchema = z.object({
  goal: z.string(),
  whyNow: z.string(),
  successSignal: z.string(),
  existingAssets: z.string(),
  frictionPoints: z.string(),
  notDoing: z.string(),
});

export const ndProfileContextSchema = z.object({
  summary: z.string(),
  traitLabels: stringArraySchema,
  manifestationLabels: stringArraySchema,
  activationPatterns: stringArraySchema,
  goodDayDescription: z.string(),
  shutdownTriggers: stringArraySchema,
  shutdownDescription: z.string(),
  activationWindows: z.string(),
  unavailablePeriods: z.string(),
  triedSystems: z.string(),
  whatWorked: z.string(),
  whatFailed: z.string(),
  infoDensity: z.string(),
  infoFormats: stringArraySchema,
  supportConditions: stringArraySchema,
  agentGuidance: z.string(),
});

const processMoveSchema = z.object({
  title: z.string(),
  trigger: z.string(),
  action: z.string(),
  doneSignal: z.string(),
  effort: z.string(),
  whyItFits: z.string(),
});

const processPlanSchema = z.object({
  generatedAt: z.string(),
  goal: z.string(),
  profileSummary: z.string(),
  thesis: z.string(),
  workingWith: stringArraySchema,
  protectedConditions: stringArraySchema,
  notDoing: stringArraySchema,
  measures: stringArraySchema,
  weeklyQuestion: z.string(),
  checkInPrompt: z.string(),
  checkInModes: z.array(z.object({
    label: z.string(),
    guidance: z.string(),
  })),
  blocks: z.array(z.object({
    id: z.string(),
    title: z.string(),
    summary: z.string(),
    moves: z.array(processMoveSchema),
  })),
  rescueMoves: z.array(processMoveSchema),
  agentBrief: z.string(),
});

const profileSnapshotSchema = z.object({
  source: z.enum(["saved-profile", "missing-profile"]),
  profile: z.unknown().nullable(),
  context: ndProfileContextSchema.nullable(),
});

const processSnapshotSchema = z.object({
  inputs: processDesignerInputsSchema,
  plan: processPlanSchema,
});

const insightSchema = z.object({
  title: z.string(),
  observation: z.string(),
  inference: z.string(),
  evidence: stringArraySchema,
  confidence: z.enum(["low", "medium", "high"]),
});

const chartDatumSchema = z.object({
  label: z.string(),
  value: z.number().min(0).max(100),
  max: z.number().positive(),
  group: z.string().optional(),
  evidence: z.string().optional(),
});

const scoreBlockSchema = z.object({
  label: z.string(),
  score: z.number().min(0).max(100),
  max: z.number().positive(),
  rationale: z.string(),
  evidence: stringArraySchema,
});

const recommendationSchema = z.object({
  title: z.string(),
  recommendation: z.string(),
  why: z.string(),
  evidence: stringArraySchema,
  energyMode: z.enum(["low", "normal", "high"]),
});

const actionBlockSchema = z.object({
  day: z.string(),
  title: z.string(),
  action: z.string(),
  energyMode: z.enum(["low", "normal", "high"]),
  doneSignal: z.string(),
});

const rescueMoveSchema = z.object({
  title: z.string(),
  trigger: z.string(),
  action: z.string(),
  mitigation: z.string(),
  doneSignal: z.string(),
  evidence: stringArraySchema,
});

export const neuroDivAnalysisReportSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  title: z.string(),
  profileSnapshot: profileSnapshotSchema,
  processSnapshot: processSnapshotSchema,
  executiveSummary: z.string(),
  operatingPatternInsights: z.array(insightSchema).min(1),
  activationMap: z.array(chartDatumSchema),
  shutdownRiskMap: z.array(chartDatumSchema),
  energyModePlan: z.array(chartDatumSchema),
  processFitScore: scoreBlockSchema,
  recommendations: z.array(recommendationSchema).min(1),
  nextSevenDays: z.array(actionBlockSchema).min(3),
  rescuePlan: z.array(rescueMoveSchema),
  agentBrief: z.string(),
  caveats: stringArraySchema,
  model: z.object({
    provider: z.enum(["deterministic", "deepseek"]),
    name: z.string(),
  }),
});

export const profileSynthesisRequestSchema = z.object({
  profile: z.unknown().nullable(),
  profileContext: ndProfileContextSchema.nullable(),
});

export const profileSynthesisResponseSchema = z.object({
  summary: z.string(),
  activationPatterns: stringArraySchema,
  shutdownRisks: stringArraySchema,
  missingContext: stringArraySchema,
  caveats: stringArraySchema,
});

export const processAnalysisRequestSchema = z.object({
  profileContext: ndProfileContextSchema.nullable(),
  processInputs: processDesignerInputsSchema,
  processPlan: processPlanSchema,
});

export const processAnalysisResponseSchema = z.object({
  fitScore: scoreBlockSchema,
  risks: z.array(rescueMoveSchema),
  recommendations: z.array(recommendationSchema),
  caveats: stringArraySchema,
});

export const generateReportRequestSchema = z.object({
  profile: z.unknown().nullable(),
  profileContext: ndProfileContextSchema.nullable(),
  processInputs: processDesignerInputsSchema,
  processPlan: processPlanSchema,
});

export function parseGenerateReportInput(value: unknown): GenerateReportInput {
  return generateReportRequestSchema.parse(value) as GenerateReportInput;
}

export function parseNeuroDivAnalysisReport(value: unknown): NeuroDivAnalysisReport {
  return neuroDivAnalysisReportSchema.parse(value) as NeuroDivAnalysisReport;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function generatedReportId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function attachServerReportFields(raw: unknown, input: GenerateReportInput, modelName: string): unknown {
  const report = isRecord(raw) ? raw : {};
  const now = new Date().toISOString();

  return {
    ...report,
    id: typeof report.id === "string" && report.id.trim() ? report.id : generatedReportId(),
    createdAt: typeof report.createdAt === "string" && report.createdAt.trim() ? report.createdAt : now,
    updatedAt: now,
    title: typeof report.title === "string" && report.title.trim()
      ? report.title
      : `${(input.processInputs.goal || input.processPlan.goal || "Current process").slice(0, 72)} analysis`,
    profileSnapshot: {
      source: input.profile ? "saved-profile" : "missing-profile",
      profile: input.profile,
      context: input.profileContext,
    },
    processSnapshot: {
      inputs: input.processInputs,
      plan: input.processPlan,
    },
    model: {
      provider: "deepseek",
      name: modelName,
    },
  };
}

export function normalizeModelReport(report: NeuroDivAnalysisReport, input: GenerateReportInput, modelName: string): NeuroDivAnalysisReport {
  const now = new Date().toISOString();

  return {
    ...report,
    id: report.id || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: report.createdAt || now,
    updatedAt: now,
    profileSnapshot: {
      source: input.profile ? "saved-profile" : "missing-profile",
      profile: input.profile,
      context: input.profileContext,
    },
    processSnapshot: {
      inputs: input.processInputs,
      plan: input.processPlan,
    },
    model: {
      provider: "deepseek",
      name: modelName,
    },
  };
}
