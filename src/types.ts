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

export interface PhaseResult {
  status: PhaseStatus;
  results: ExaResult[];
  error?: string;
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
}

export interface StrategyInputs extends FounderConstraints {
  audienceLens: string;
}

export type StrategySectionKey =
  | "positioning"
  | "channelPlan"
  | "messageAngles"
  | "assetIdeas"
  | "experiments"
  | "thirtyDaySequence";

export interface StrategySections {
  positioning: string;
  channelPlan: string;
  messageAngles: string;
  assetIdeas: string;
  experiments: string;
  thirtyDaySequence: string;
}

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
  phaseResearch: CondensedPhaseResearch[];
}

export interface StrategyDraftResponse extends StrategyDraft {}

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
