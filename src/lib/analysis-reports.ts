import type {
  ActionBlock,
  AnalysisEnergyMode,
  ChartDatum,
  NDProfile,
  NDProfileContext,
  NeuroDivAnalysisReport,
  ProcessDesignerInputs,
  ProcessPlan,
  Recommendation,
  RescueMove,
  ScoreBlock,
} from "../types";
import { loadNDProfile, loadNDProfileContext } from "./nd-profile";
import { buildProcessPlan } from "./process-designer";

const ANALYSIS_REPORTS_KEY = "nd-analysis-reports";

export interface GenerateReportInput {
  profile: NDProfile | null;
  profileContext: NDProfileContext | null;
  processInputs: ProcessDesignerInputs;
  processPlan: ProcessPlan;
}

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function clean(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.map(clean).filter(Boolean)));
}

function readReports(): NeuroDivAnalysisReport[] {
  try {
    const raw = localStorage.getItem(ANALYSIS_REPORTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as NeuroDivAnalysisReport[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeReports(reports: NeuroDivAnalysisReport[]): void {
  localStorage.setItem(ANALYSIS_REPORTS_KEY, JSON.stringify(reports));
}

export function listAnalysisReports(): NeuroDivAnalysisReport[] {
  return readReports().sort((a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function getAnalysisReport(id: string): NeuroDivAnalysisReport | null {
  return readReports().find((report) => report.id === id) ?? null;
}

export function saveAnalysisReport(report: NeuroDivAnalysisReport): NeuroDivAnalysisReport {
  const reports = readReports();
  const index = reports.findIndex((item) => item.id === report.id);
  const updated = { ...report, updatedAt: new Date().toISOString() };

  if (index >= 0) {
    reports[index] = updated;
  } else {
    reports.push(updated);
  }

  writeReports(reports);
  return updated;
}

export function deleteAnalysisReport(id: string): void {
  writeReports(readReports().filter((report) => report.id !== id));
}

export function renameAnalysisReport(id: string, title: string): NeuroDivAnalysisReport | null {
  const report = getAnalysisReport(id);
  if (!report) return null;
  return saveAnalysisReport({ ...report, title: clean(title) || report.title });
}

export function loadReportInputsFromBrowser(processInputs: ProcessDesignerInputs): GenerateReportInput {
  const profile = loadNDProfile();
  const profileContext = loadNDProfileContext();
  const processPlan = buildProcessPlan(processInputs, profileContext);
  return {
    profile,
    profileContext,
    processInputs,
    processPlan,
  };
}

function makeTitle(inputs: ProcessDesignerInputs, plan: ProcessPlan) {
  const source = clean(inputs.goal) || plan.goal || "Current process";
  return `${source.slice(0, 72)} analysis`;
}

function datum(label: string, value: number, evidence?: string, group?: string): ChartDatum {
  return {
    label,
    value: Math.max(0, Math.min(100, Math.round(value))),
    max: 100,
    evidence,
    group,
  };
}

function buildActivationMap(profileContext: NDProfileContext | null, plan: ProcessPlan): ChartDatum[] {
  const profilePatterns = profileContext?.activationPatterns ?? [];
  const conditions = unique([
    ...profilePatterns,
    ...plan.workingWith.slice(0, 3),
    profileContext?.goodDayDescription ?? "",
  ]).slice(0, 6);

  const fallback = [
    "Bounded next step",
    "Visible done signal",
    "Low-stakes start",
  ];

  return (conditions.length > 0 ? conditions : fallback).map((item, index) =>
    datum(item, 88 - index * 8, item),
  );
}

function buildShutdownRiskMap(profileContext: NDProfileContext | null, inputs: ProcessDesignerInputs): ChartDatum[] {
  const triggers = unique([
    ...(profileContext?.shutdownTriggers ?? []),
    clean(inputs.frictionPoints),
    clean(inputs.notDoing),
  ]).slice(0, 6);

  const fallback = [
    "Open-ended scope",
    "Blank-page start",
    "Waiting on others",
  ];

  return (triggers.length > 0 ? triggers : fallback).map((item, index) =>
    datum(item, 82 - index * 7, item),
  );
}

function scoreProcessFit(profileContext: NDProfileContext | null, inputs: ProcessDesignerInputs, plan: ProcessPlan): ScoreBlock {
  let score = 45;
  const evidence: string[] = [];

  if (profileContext) {
    score += 18;
    evidence.push("Saved ND profile was loaded.");
  }
  if (clean(inputs.successSignal)) {
    score += 12;
    evidence.push("The process has a stated success signal.");
  }
  if (clean(inputs.frictionPoints)) {
    score += 10;
    evidence.push("Known friction points are named.");
  }
  if (plan.rescueMoves.length > 0) {
    score += 10;
    evidence.push("The process includes rescue moves.");
  }
  if (plan.notDoing.length > 0) {
    score += 5;
    evidence.push("The process includes protected not-doing boundaries.");
  }

  return {
    label: "Profile/process fit",
    score: Math.min(100, score),
    max: 100,
    rationale: "This score reflects how much usable context, boundary detail, and recovery planning the current process gives the report engine.",
    evidence,
  };
}

function buildEnergyModePlan(plan: ProcessPlan): ChartDatum[] {
  return [
    datum("Low energy", 35, plan.rescueMoves[0]?.action ?? "Use the smallest rescue move.", "energy"),
    datum("Normal energy", 68, plan.blocks[0]?.moves[0]?.action ?? "Work from the first bounded move.", "energy"),
    datum("High energy", 86, plan.blocks[1]?.moves[0]?.action ?? "Use momentum without expanding the scope.", "energy"),
  ];
}

function modeForIndex(index: number): AnalysisEnergyMode {
  return index % 3 === 0 ? "low" : index % 3 === 1 ? "normal" : "high";
}

function buildRecommendations(plan: ProcessPlan, inputs: ProcessDesignerInputs): Recommendation[] {
  const sourceMoves = plan.blocks.flatMap((block) => block.moves).slice(0, 5);
  const recommendations = sourceMoves.map((move, index) => ({
    title: move.title,
    recommendation: move.action,
    why: move.whyItFits,
    evidence: unique([move.trigger, move.doneSignal, clean(inputs.frictionPoints)]),
    energyMode: modeForIndex(index),
  }));

  if (recommendations.length > 0) return recommendations;

  return [{
    title: "Start with the smallest visible move",
    recommendation: `Choose one bounded action for ${plan.goal} and stop at the first visible done signal.`,
    why: "The process has limited structured move data, so the fallback is to reduce scope before adding intensity.",
    evidence: [plan.goal],
    energyMode: "low",
  }];
}

function buildNextSevenDays(plan: ProcessPlan): ActionBlock[] {
  const moves = plan.blocks.flatMap((block) => block.moves);
  const defaults = [
    "Name the next visible output.",
    "Collect the materials already available.",
    "Make one low-stakes version.",
    "Check what caused drag.",
    "Reduce the next move by half.",
    "Use one normal-energy block.",
    "Review what stayed useful.",
  ];

  return defaults.map((fallback, index) => {
    const move = moves[index % Math.max(1, moves.length)];
    return {
      day: `Day ${index + 1}`,
      title: move?.title ?? fallback,
      action: move?.action ?? fallback,
      energyMode: modeForIndex(index),
      doneSignal: move?.doneSignal ?? "A visible note or artifact exists.",
    };
  });
}

function buildRescuePlan(plan: ProcessPlan): RescueMove[] {
  return plan.rescueMoves.slice(0, 4).map((move) => ({
    title: move.title,
    trigger: move.trigger,
    action: move.action,
    mitigation: move.whyItFits,
    doneSignal: move.doneSignal,
    evidence: unique([move.trigger, move.whyItFits]),
  }));
}

export function buildDeterministicAnalysisReport(input: GenerateReportInput): NeuroDivAnalysisReport {
  const now = new Date().toISOString();
  const { profile, profileContext, processInputs, processPlan } = input;
  const fitScore = scoreProcessFit(profileContext, processInputs, processPlan);
  const shutdownEvidence = unique([
    ...(profileContext?.shutdownTriggers ?? []),
    clean(processInputs.frictionPoints),
  ]);

  return {
    id: generateId(),
    createdAt: now,
    updatedAt: now,
    title: makeTitle(processInputs, processPlan),
    profileSnapshot: {
      source: profile ? "saved-profile" : "missing-profile",
      profile,
      context: profileContext,
    },
    processSnapshot: {
      inputs: processInputs,
      plan: processPlan,
    },
    executiveSummary: [
      `This process is organized around "${processPlan.goal}".`,
      profileContext
        ? "It uses the saved ND profile as the operating context."
        : "No saved ND profile was available, so the analysis relies on the process inputs and deterministic defaults.",
      `The strongest current fit signal is: ${fitScore.evidence[0] ?? "the process has a concrete goal"}.`,
    ].join(" "),
    operatingPatternInsights: [
      {
        title: "Activation depends on conditions, not discipline",
        observation: processPlan.workingWith[0] ?? "The process works best when the next move is visible.",
        inference: "The plan should keep entry points small enough to start without negotiating with the whole project.",
        evidence: unique([processPlan.workingWith[0] ?? "", profileContext?.goodDayDescription ?? "", processInputs.successSignal]),
        confidence: profileContext ? "high" : "medium",
      },
      {
        title: "Friction should become a design constraint",
        observation: shutdownEvidence[0] ?? "Open-ended work is a likely risk.",
        inference: "The process should avoid treating shutdown or avoidance as a character issue; it should route around the trigger.",
        evidence: shutdownEvidence.length > 0 ? shutdownEvidence : ["No detailed friction input was provided."],
        confidence: shutdownEvidence.length > 0 ? "high" : "low",
      },
    ],
    activationMap: buildActivationMap(profileContext, processPlan),
    shutdownRiskMap: buildShutdownRiskMap(profileContext, processInputs),
    energyModePlan: buildEnergyModePlan(processPlan),
    processFitScore: fitScore,
    recommendations: buildRecommendations(processPlan, processInputs),
    nextSevenDays: buildNextSevenDays(processPlan),
    rescuePlan: buildRescuePlan(processPlan),
    agentBrief: processPlan.agentBrief,
    caveats: [
      "This is an operating-context analysis, not a diagnosis.",
      "Model or deterministic output should be treated as a draft for the user to accept, edit, or reject.",
      ...(profileContext ? [] : ["A saved ND profile would make the analysis more specific."]),
    ],
    model: {
      provider: "deterministic",
      name: "neurodiv-deterministic-fallback",
    },
  };
}

export function buildAnalysisMarkdown(report: NeuroDivAnalysisReport): string {
  const lines = [
    `# ${report.title}`,
    "",
    `Generated: ${new Date(report.createdAt).toLocaleString()}`,
    "",
    "## Summary",
    "",
    report.executiveSummary,
    "",
    "## What the app noticed",
    "",
    ...report.operatingPatternInsights.flatMap((insight) => [
      `### ${insight.title}`,
      "",
      `**Observation:** ${insight.observation}`,
      "",
      `**Inference:** ${insight.inference}`,
      "",
      `**Evidence:** ${insight.evidence.join("; ")}`,
      "",
    ]),
    "## Activation conditions",
    "",
    ...report.activationMap.map((item) => `- ${item.label}: ${item.value}/${item.max}${item.evidence ? ` - ${item.evidence}` : ""}`),
    "",
    "## Shutdown and friction risks",
    "",
    ...report.shutdownRiskMap.map((item) => `- ${item.label}: ${item.value}/${item.max}${item.evidence ? ` - ${item.evidence}` : ""}`),
    "",
    "## Process fit",
    "",
    `${report.processFitScore.score}/${report.processFitScore.max} - ${report.processFitScore.rationale}`,
    "",
    "## Recommended process changes",
    "",
    ...report.recommendations.map((item) => `- **${item.title}:** ${item.recommendation} (${item.energyMode} energy). ${item.why}`),
    "",
    "## Next seven days",
    "",
    ...report.nextSevenDays.map((item) => `- **${item.day}: ${item.title}** - ${item.action} Done signal: ${item.doneSignal}`),
    "",
    "## Rescue plan",
    "",
    ...report.rescuePlan.map((item) => `- **${item.title}:** ${item.action} Mitigation: ${item.mitigation}`),
    "",
    "## Agent brief",
    "",
    report.agentBrief,
    "",
    "## Source context used",
    "",
    `- Profile: ${report.profileSnapshot.source}`,
    `- Goal: ${report.processSnapshot.plan.goal}`,
    ...report.caveats.map((caveat) => `- ${caveat}`),
    "",
  ];

  return lines.join("\n");
}

export { ANALYSIS_REPORTS_KEY };
