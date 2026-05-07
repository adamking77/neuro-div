'use client';

import { useCallback, useEffect, useRef, useState } from "react";
import { applyNDProfileDefaults, createEmptyStrategyInputs, syncStrategyDirtyState } from "../lib/strategy";
import { buildNDProfileContext, loadNDProfile } from "../lib/nd-profile";
import {
  deleteProject,
  listProjects,
  loadCurrentProjectId,
  loadProject,
  renameProject,
  saveCurrentProjectId,
  saveProject,
  type SavedProject,
} from "../lib/storage";
import type {
  NDProfileContext,
  PhaseResult,
  SessionState,
  StrategyDraft,
  StrategyInputs,
  StrategySectionKey,
} from "../types";
import { PHASES } from "../phases";
import type { ActiveTool } from "../lib/tool-routes";

const emptyPhases = (): Record<number, PhaseResult> =>
  Object.fromEntries(PHASES.map((phase) => [phase.id, { status: "idle", results: [] }]));

function createEmptySession(): SessionState {
  return {
    problem: "",
    knownPlayers: "",
    phases: emptyPhases(),
    strategyInputs: applyNDProfileDefaults(createEmptyStrategyInputs(), loadNDProfile()),
    strategyDraft: null,
    strategyStatus: "idle",
    strategyError: undefined,
    strategyDirty: false,
    strategySourceFingerprint: null,
    intelligenceBrief: null,
    intelligenceStatus: "idle",
    intelligenceError: undefined,
  };
}

function getLiveNDProfileContext(): NDProfileContext | null {
  const profile = loadNDProfile();
  return profile ? buildNDProfileContext(profile) : null;
}

function applyProfileToSession(session: SessionState): SessionState {
  return {
    ...session,
    strategyInputs: applyNDProfileDefaults(session.strategyInputs, loadNDProfile()),
  };
}

export function useProjectSession(activeTool: ActiveTool) {
  const [ndProfileContext, setNdProfileContext] = useState<NDProfileContext | null>(() => getLiveNDProfileContext());
  const [session, setSession] = useState<SessionState>(() => createEmptySession());
  const [projectId, setProjectId] = useState<string | null>(null);
  const [draftHistory, setDraftHistory] = useState<StrategyDraft[]>([]);
  const [projectDrawerOpen, setProjectDrawerOpen] = useState(false);
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mutateSession = useCallback((updater: (current: SessionState) => SessionState) => {
    setSession((current) => syncStrategyDirtyState(updater(current), ndProfileContext));
  }, [ndProfileContext]);

  useEffect(() => {
    const refreshProfileContext = () => setNdProfileContext(getLiveNDProfileContext());

    refreshProfileContext();
    window.addEventListener("focus", refreshProfileContext);
    return () => window.removeEventListener("focus", refreshProfileContext);
  }, []);

  useEffect(() => {
    if (activeTool === "category-scout" || activeTool === "distribution-strategy") {
      const nextContext = getLiveNDProfileContext();
      setNdProfileContext(nextContext);
      setSession((current) => syncStrategyDirtyState(applyProfileToSession(current), nextContext));
    }
  }, [activeTool]);

  useEffect(() => {
    const profileContext = getLiveNDProfileContext();
    const currentId = loadCurrentProjectId();
    if (currentId) {
      const project = loadProject(currentId);
      if (project) {
        setProjectId(project.id);
        setSession(syncStrategyDirtyState(applyProfileToSession(project.session), profileContext));
        setDraftHistory(project.draftHistory);
        setLastSavedAt(project.updatedAt);
        return;
      }
    }

    const empty = createEmptySession();
    setSession(empty);
    const saved = saveProject(empty, []);
    setProjectId(saved.id);
    saveCurrentProjectId(saved.id);
    setLastSavedAt(saved.updatedAt);
  }, []);

  useEffect(() => {
    if (!projectId) return;
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }

    autoSaveTimer.current = setTimeout(() => {
      const saved = saveProject(session, draftHistory, projectId);
      setLastSavedAt(saved.updatedAt);
    }, 5000);

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [draftHistory, projectId, session]);

  useEffect(() => {
    return () => {
      if (projectId) {
        saveProject(session, draftHistory, projectId);
      }
    };
  }, [draftHistory, projectId, session]);

  const refreshProjects = useCallback(() => {
    setProjects(listProjects());
  }, []);

  const createNewProject = useCallback(() => {
    const empty = createEmptySession();
    setSession(empty);
    setDraftHistory([]);
    const saved = saveProject(empty, []);
    setProjectId(saved.id);
    saveCurrentProjectId(saved.id);
    setLastSavedAt(saved.updatedAt);
    refreshProjects();
  }, [refreshProjects]);

  const switchProject = useCallback((id: string) => {
    const project = loadProject(id);
    if (!project) return;
    setProjectId(project.id);
    setSession(syncStrategyDirtyState(applyProfileToSession(project.session), ndProfileContext));
    setDraftHistory(project.draftHistory);
    saveCurrentProjectId(project.id);
    setLastSavedAt(project.updatedAt);
    setProjectDrawerOpen(false);
  }, [ndProfileContext]);

  const handleDeleteProject = useCallback((id: string) => {
    if (!window.confirm("Delete this project? This can't be undone.")) return;
    deleteProject(id);
    refreshProjects();
    if (id === projectId) {
      createNewProject();
    }
  }, [createNewProject, projectId, refreshProjects]);

  const startRenamingProject = useCallback((id: string, name: string) => {
    setEditingProjectId(id);
    setEditName(name);
  }, []);

  const cancelRenamingProject = useCallback(() => {
    setEditingProjectId(null);
    setEditName("");
  }, []);

  const handleRenameProject = useCallback((id: string) => {
    renameProject(id, editName);
    cancelRenamingProject();
    refreshProjects();
    if (id === projectId) {
      const updated = listProjects().find((project) => project.id === id);
      if (updated) {
        setLastSavedAt(updated.updatedAt);
      }
    }
  }, [cancelRenamingProject, editName, projectId, refreshProjects]);

  const updatePhase = useCallback((id: number, update: Partial<PhaseResult>) => {
    mutateSession((current) => ({
      ...current,
      phases: {
        ...current.phases,
        [id]: {
          ...current.phases[id],
          ...update,
        },
      },
    }));
  }, [mutateSession]);

  const updateStrategyInput = useCallback(<K extends keyof StrategyInputs>(key: K, value: StrategyInputs[K]) => {
    mutateSession((current) => ({
      ...current,
      strategyInputs: {
        ...current.strategyInputs,
        [key]: value,
      },
    }));
  }, [mutateSession]);

  const updateStrategySection = useCallback((key: StrategySectionKey, value: string) => {
    mutateSession((current) => {
      if (!current.strategyDraft) {
        return current;
      }

      return {
        ...current,
        strategyDraft: {
          ...current.strategyDraft,
          sections: {
            ...current.strategyDraft.sections,
            [key]: value,
          },
        },
      };
    });
  }, [mutateSession]);

  return {
    ndProfileContext,
    session,
    mutateSession,
    draftHistory,
    setDraftHistory,
    projectId,
    projectDrawerOpen,
    setProjectDrawerOpen,
    projects,
    editingProjectId,
    editName,
    setEditName,
    lastSavedAt,
    refreshProjects,
    createNewProject,
    switchProject,
    handleDeleteProject,
    startRenamingProject,
    handleRenameProject,
    cancelRenamingProject,
    updatePhase,
    updateStrategyInput,
    updateStrategySection,
  };
}
