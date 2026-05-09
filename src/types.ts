export interface ExaResult {
  id: string;
  url: string;
  title?: string;
  score?: number;
  publishedDate?: string;
  author?: string;
  highlights?: string[];
}

export type PhaseStatus = "idle" | "running" | "done" | "error";

export interface PhaseSynthesis {
  verdict: string;
  evidence: string;
  implication: string;
}

export interface PhaseResult {
  status: PhaseStatus;
  results: ExaResult[];
  error?: string;
  synthesis?: PhaseSynthesis;
}

export type TeamSize = "solo" | "small-team";

export type BudgetBand = "none" | "low" | "moderate";

export type SocialPostingTolerance = "avoid" | "limited" | "comfortable";

export type OutreachTolerance = "inbound-only" | "warm-intro-ok" | "async-email-ok" | "live-calls-ok";

export type ContentMode = "writing" | "short-video" | "audio" | "design" | "interactive" | "other" | "none";

export interface ExistingAsset {
  name: string;
  url: string;
  description: string;
}

export interface FounderConstraints {
  teamSize: TeamSize;
  budgetBand: BudgetBand;
  weeklyCapacity: string;
  socialPostingTolerance: SocialPostingTolerance;
  channelAvoidances: string;
  outreachTolerance: OutreachTolerance;
  peerCollaborationOk: boolean;
  contentMode: ContentMode[];
  contentModeOther: string;
  existingAssets: ExistingAsset[];
  previousAttempts?: string;
  avoidanceTasks?: string;
  activationWindows?: string;
  unavailablePeriods?: string;
}

export interface StrategyInputs extends FounderConstraints {
  audienceLens: string;
}

export interface NDProfileContext {
  summary: string;
  traitLabels: string[];
  manifestationLabels: string[];
  activationPatterns: string[];
  goodDayDescription: string;
  shutdownTriggers: string[];
  shutdownDescription: string;
  activationWindows: string;
  unavailablePeriods: string;
  triedSystems: string;
  whatWorked: string;
  whatFailed: string;
  infoDensity: string;
  infoFormats: string[];
  supportConditions: string[];
  agentGuidance: string;
}

export type StrategySectionKey =
  | "positioning"
  | "channelPlan"
  | "messageAngles"
  | "assetIdeas"
  | "experiments"
  | "thirtyDaySequence";

export type StrategyEffort = "low" | "medium" | "high";
export type StrategyCalloutType = "insight" | "warning" | "opportunity";

export interface StrategyRecommendation {
  text: string;
  why: string;
  effort: StrategyEffort;
  actionable: boolean;
}

export interface StrategyCallout {
  type: StrategyCalloutType;
  text: string;
}

export interface StrategySectionContent {
  summary: string;
  recommendations: StrategyRecommendation[];
  callouts: StrategyCallout[];
}

export interface StrategyScorecardMetric {
  label: string;
  grade: "high" | "medium" | "low";
  rationale: string;
}

export interface StrategyScorecard {
  metrics: StrategyScorecardMetric[];
}

export interface StrategySectionsProse {
  positioning: string;
  channelPlan: string;
  messageAngles: string;
  assetIdeas: string;
  experiments: string;
  thirtyDaySequence: string;
}

export interface StrategySectionsStructured {
  positioning: StrategySectionContent;
  channelPlan: StrategySectionContent;
  messageAngles: StrategySectionContent;
  assetIdeas: StrategySectionContent;
  experiments: StrategySectionContent;
  thirtyDaySequence: StrategySectionContent;
}

export type StrategySections = StrategySectionsProse | StrategySectionsStructured;

export interface StrategyCitation {
  section: StrategySectionKey;
  title: string;
  url: string;
  note?: string;
}

export interface StrategyDraft {
  sections: StrategySections;
  warnings: string[];
  citations: StrategyCitation[];
  generatedAt: string;
  scorecard?: StrategyScorecard;
}

export type StrategyStatus = "idle" | "researching" | "drafting" | "done" | "error";

export interface CondensedResearchResult {
  title: string;
  url: string;
  score?: number;
  publishedDate?: string;
  highlights: string[];
}

export interface CondensedPhaseResearch {
  phaseId: number;
  phaseName: string;
  description: string;
  results: CondensedResearchResult[];
}

export interface StrategyDraftRequestPayload {
  problem: string;
  knownPlayers: string;
  audienceLens: string;
  founderConstraints: FounderConstraints;
  ndProfileContext?: NDProfileContext;
  phaseResearch: CondensedPhaseResearch[];
}

export interface StrategyDraftResponse extends StrategyDraft {}

export interface IntelligenceScorecardMetric {
  label: string;
  grade: "high" | "medium" | "low";
  takeaway: string;
  evidence?: string;
  /** Legacy field retained for older saved briefs. */
  rationale?: string;
}

export interface IntelligenceLandscapeCallout {
  type: "insight" | "warning" | "opportunity";
  headline: string;
  support?: string;
  /** Legacy field retained for older saved briefs. */
  text?: string;
}

export interface IntelligenceComparisonRow {
  dimension: string;
  us: string;
  competitorA: string;
  competitorB: string;
  usSentiment: "positive" | "neutral" | "negative";
}

export interface IntelligenceChannelRow {
  channel: string;
  fitScore: number;
  effort: string;
  speed: string;
  evidence: string;
  verdict: "prioritize" | "test" | "defer";
}

export interface IntelligenceRisk {
  name: string;
  impact: "high" | "medium" | "low";
  probability: "high" | "medium" | "low";
  mitigation: string;
  level: "critical" | "watch" | "managed";
}

export interface IntelligenceTimelinePhase {
  name: string;
  weeks: string;
  focus: string;
  tasks: string[];
}

export interface IntelligenceBrief {
  generatedAt: string;
  summary: string;
  scorecard: {
    metrics: IntelligenceScorecardMetric[];
    /** Optional HTML/CSS visualization rendered as a visual gauge/dashboard */
    visualization?: string;
  };
  landscape: {
    content: string;
    callouts: IntelligenceLandscapeCallout[];
    /** Optional HTML narrative layout with editorial styling */
    visualization?: string;
  };
  positioning: {
    headers: string[];
    rows: IntelligenceComparisonRow[];
    /** Optional HTML 2D positioning map */
    visualization?: string;
  };
  channels: {
    headers: string[];
    rows: IntelligenceChannelRow[];
    /** Optional HTML channel funnel/bars */
    visualization?: string;
  };
  risks: {
    risks: IntelligenceRisk[];
    /** Optional HTML risk heatmap/matrix */
    visualization?: string;
  };
  timeline: {
    phases: IntelligenceTimelinePhase[];
    /** Optional HTML visual timeline */
    visualization?: string;
  };
  resources: {
    time: string[];
    budget: string[];
    tools: string[];
    skills: string[];
    gaps: string[];
    /** Optional HTML resource allocation chart */
    visualization?: string;
  };
}

export type IntelligenceStatus = "idle" | "researching" | "drafting" | "done" | "error";

export interface SessionState {
  problem: string;
  knownPlayers: string;
  phases: Record<number, PhaseResult>;
  strategyInputs: StrategyInputs;
  strategyDraft: StrategyDraft | null;
  strategyStatus: StrategyStatus;
  strategyError?: string;
  strategyDirty: boolean;
  strategySourceFingerprint: string | null;
  intelligenceBrief: IntelligenceBrief | null;
  intelligenceStatus: IntelligenceStatus;
  intelligenceError?: string;
}

// ND Profile types

export type NDTrait = "adhd" | "autism" | "pda" | "dyslexia" | "dyscalculia" | "sensory";

export type NDTraitManifestation =
  | "adhd-hard-to-start"
  | "adhd-time-blindness"
  | "adhd-hyperfocus"
  | "adhd-transition-hard"
  | "adhd-needs-movement"
  | "adhd-deadline-engine"
  | "adhd-fast-thoughts"
  | "autism-clear-expectations"
  | "autism-sensory"
  | "autism-processing-time"
  | "autism-deep-interests"
  | "autism-social-effort"
  | "autism-needs-why"
  | "pda-demand-avoidance"
  | "pda-framing-matters"
  | "pda-autonomous"
  | "pda-own-goals-trigger"
  | "pda-needs-control"
  | "dyslexia-reading-effort"
  | "dyslexia-oral-better"
  | "dyslexia-visual-spatial"
  | "dyscalculia-numbers"
  | "dyscalculia-time-estimation"
  | "sensory-sound"
  | "sensory-light"
  | "sensory-environment";

export type ActivationPattern =
  | "novelty"
  | "deadline"
  | "urgency"
  | "deep-interest"
  | "challenge"
  | "collaboration"
  | "creative-freedom"
  | "clear-bounded"
  | "other";

export type ShutdownTrigger =
  | "cold-outreach"
  | "live-calls"
  | "open-ended"
  | "admin-repetitive"
  | "being-evaluated"
  | "social-posting"
  | "blank-page"
  | "waiting"
  | "other";

export type TimePattern =
  | "time-blindness"
  | "deadline-engine"
  | "burst-worker"
  | "needs-external-structure"
  | "no-time-pressure"
  | "peak-windows"
  | "recovery-non-negotiable"
  | "other";

export type InfoDensity = "brief" | "medium" | "deep" | "varies";

export type InfoFormat =
  | "bullets"
  | "numbered"
  | "prose"
  | "examples"
  | "headers"
  | "any";

export type SupportCondition =
  | "background-sound"
  | "silence"
  | "body-doubling"
  | "timers"
  | "movement"
  | "routine"
  | "low-stakes-start"
  | "other";

export interface NDProfile {
  version: 1;
  createdAt: string;
  updatedAt: string;
  traits: {
    selected: NDTrait[];
    other: string;
    manifestations: NDTraitManifestation[];
    notes: string;
  };
  activation: {
    patterns: ActivationPattern[];
    patternOther: string;
    goodDayDescription: string;
  };
  shutdown: {
    triggers: ShutdownTrigger[];
    triggerOther: string;
    shutdownDescription: string;
  };
  timeEnergy: {
    patterns: TimePattern[];
    patternOther: string;
    activationWindows: string;
    unavailablePeriods: string;
  };
  history: {
    triedSystems: string;
    whatWorked: string;
    whatFailed: string;
  };
  infoConditions: {
    density: InfoDensity | null;
    formats: InfoFormat[];
    formatOther: string;
    supportConditions: SupportCondition[];
    conditionOther: string;
  };
}

export interface ProcessDesignerInputs {
  goal: string;
  whyNow: string;
  successSignal: string;
  existingAssets: string;
  frictionPoints: string;
  notDoing: string;
}

export interface ProcessMove {
  title: string;
  trigger: string;
  action: string;
  doneSignal: string;
  effort: string;
  whyItFits: string;
}

export interface ProcessMoveBlock {
  id: string;
  title: string;
  summary: string;
  moves: ProcessMove[];
}

export interface ProcessCheckInMode {
  label: string;
  guidance: string;
}

export interface ProcessPlan {
  generatedAt: string;
  goal: string;
  profileSummary: string;
  thesis: string;
  workingWith: string[];
  protectedConditions: string[];
  notDoing: string[];
  measures: string[];
  weeklyQuestion: string;
  checkInPrompt: string;
  checkInModes: ProcessCheckInMode[];
  blocks: ProcessMoveBlock[];
  rescueMoves: ProcessMove[];
  agentBrief: string;
}

export interface PhaseConfig {
  id: number;
  name: string;
  description: string;
  buildQueries: (problem: string, knownPlayers: string) => Array<{
    query: string;
    category?: string;
  }>;
}
