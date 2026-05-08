import type { SessionState, StrategyDraft } from "../types";
import { normalizeIntelligenceBrief } from "./intelligence";

const STORAGE_KEY = "category-scout-projects";
const CURRENT_KEY = "category-scout-current";

export interface SavedProject {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  session: SessionState;
  draftHistory: StrategyDraft[];
}

function normalizeTransientStatus(
  status: SessionState["strategyStatus"] | SessionState["intelligenceStatus"],
  hasOutput: boolean,
): "idle" | "done" {
  if (status === "researching" || status === "drafting") {
    return hasOutput ? "done" : "idle";
  }

  return status === "done" ? "done" : "idle";
}

function sanitizeSession(session: SessionState): SessionState {
  const strategyRecovered = session.strategyStatus === "researching" || session.strategyStatus === "drafting";
  const intelligenceRecovered = session.intelligenceStatus === "researching" || session.intelligenceStatus === "drafting";

  return {
    ...session,
    intelligenceBrief: session.intelligenceBrief
      ? normalizeIntelligenceBrief(session.intelligenceBrief)
      : null,
    strategyStatus: normalizeTransientStatus(session.strategyStatus, !!session.strategyDraft),
    strategyError: strategyRecovered
      ? "Previous strategy generation did not finish. Generate again."
      : session.strategyError,
    intelligenceStatus: normalizeTransientStatus(session.intelligenceStatus, !!session.intelligenceBrief),
    intelligenceError: intelligenceRecovered
      ? "Previous intelligence brief generation did not finish. Generate again."
      : session.intelligenceError,
  };
}

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getDefaultProjectName(session: SessionState): string {
  if (session.problem.trim()) {
    const slug = slugify(session.problem.slice(0, 40));
    return slug || "Untitled";
  }
  return "Untitled";
}

function loadProjects(): SavedProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedProject[];
    return Array.isArray(parsed)
      ? parsed.map((project) => ({ ...project, session: sanitizeSession(project.session) }))
      : [];
  } catch {
    return [];
  }
}

function saveProjects(projects: SavedProject[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch {
    // localStorage full or disabled
  }
}

export function listProjects(): SavedProject[] {
  return loadProjects().sort((a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function saveProject(session: SessionState, draftHistory: StrategyDraft[], id?: string): SavedProject {
  const projects = loadProjects();
  const now = new Date().toISOString();
  const sanitizedSession = sanitizeSession(session);
  const name = getDefaultProjectName(session);

  const existingIndex = id ? projects.findIndex((p) => p.id === id) : -1;

  if (existingIndex >= 0) {
    const updated: SavedProject = {
      ...projects[existingIndex],
      name: projects[existingIndex].name === "Untitled" && session.problem.trim()
        ? name
        : projects[existingIndex].name,
      updatedAt: now,
      session: sanitizedSession,
      draftHistory,
    };
    projects[existingIndex] = updated;
    saveProjects(projects);
    return updated;
  }

  const project: SavedProject = {
    id: id || generateId(),
    name,
    createdAt: now,
    updatedAt: now,
    session: sanitizedSession,
    draftHistory,
  };

  projects.push(project);
  saveProjects(projects);
  return project;
}

export function loadProject(id: string): SavedProject | null {
  return loadProjects().find((p) => p.id === id) ?? null;
}

export function deleteProject(id: string): void {
  const projects = loadProjects().filter((p) => p.id !== id);
  saveProjects(projects);
}

export function renameProject(id: string, name: string): void {
  const projects = loadProjects();
  const index = projects.findIndex((p) => p.id === id);
  if (index >= 0) {
    projects[index] = { ...projects[index], name, updatedAt: new Date().toISOString() };
    saveProjects(projects);
  }
}

export function saveCurrentProjectId(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(CURRENT_KEY, id);
    } else {
      localStorage.removeItem(CURRENT_KEY);
    }
  } catch {
    // ignore
  }
}

export function loadCurrentProjectId(): string | null {
  try {
    return localStorage.getItem(CURRENT_KEY);
  } catch {
    return null;
  }
}
