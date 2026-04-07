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

export interface SessionState {
  problem: string;
  knownPlayers: string;
  phases: Record<number, PhaseResult>;
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
