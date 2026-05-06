import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowCounterClockwise, DownloadSimple, Copy, Check, CaretDown, Plus, PencilSimple, Trash, X } from "@phosphor-icons/react";
import { PHASES } from "./phases";
import { ReportView } from "./components/ReportView";
import { StrategyView } from "./components/StrategyView";
import { NDContextBuilder } from "./components/NDContextBuilder";
import { NDProcessDesigner } from "./components/NDProcessDesigner";
import { SkillsLibrary } from "./components/SkillsLibrary";
import { buildNDProfileContext, loadNDProfile } from "./lib/nd-profile";
import {
  applyNDProfileDefaults,
  buildStrategyMarkdown,
  condensePhaseResearch,
  createEmptyStrategyInputs,
  getStrategyFingerprint,
  getStrategyReadiness,
  hasCompleteStrategyDraft,
  syncStrategyDirtyState,
} from "./lib/strategy";
import {
  deleteProject,
  listProjects,
  loadCurrentProjectId,
  loadProject,
  renameProject,
  saveCurrentProjectId,
  saveProject,
  type SavedProject,
} from "./lib/storage";
import type {
  ExaResult,
  IntelligenceBrief,
  NDProfileContext,
  PhaseResult,
  SessionState,
  StrategyDraft,
  StrategyInputs,
  StrategySectionKey,
} from "./types";
import "./index.css";

type ActiveTool = "category-scout" | "distribution-strategy" | "context-builder" | "process-designer" | "skills";

type OpenSection = "research" | "strategy" | null;

interface StrategyDraftErrorResponse {
  error?: string;
}

const CLAUDE_PROMPT = `I'm attaching a Category Scout research file. It contains results from 6 research phases, each with source titles, URLs, publication dates, relevance scores, and direct highlight excerpts pulled from each source.

Produce a category design brief with these sections:

1. The Problem — in customer language, not solution language
2. The Enemy — the worldview or incumbent approach being displaced
3. The Landscape — who's adjacent, what's named, where the edges are
4. The White Space — the unclaimed combination of problem + solution
5. The Evidence Stack — proof the problem is real and growing
6. The Vocabulary Set — candidate words for naming the category
7. The POV Thesis — one paragraph: broken world → enemy → new way

Rules:
- Every claim must be grounded in a specific highlight or source from the file
- Cite sources inline using the format: ([domain.com](URL))
- Quote highlight excerpts directly when they are strong evidence
- Do not introduce information from outside the file
- Be specific and direct — no generic category design filler`;

const emptyPhases = (): Record<number, PhaseResult> =>
  Object.fromEntries(PHASES.map((phase) => [phase.id, { status: "idle", results: [] }]));

const createEmptySession = (): SessionState => ({
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
});

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

export default function App() {
  const [activeTool, setActiveTool] = useState<ActiveTool>("category-scout");
  const [ndProfileContext, setNdProfileContext] = useState<NDProfileContext | null>(() => getLiveNDProfileContext());
  const [session, setSession] = useState<SessionState>(() => createEmptySession());
  const [openSection, setOpenSection] = useState<OpenSection>("research");
  const [promptCopied, setPromptCopied] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [draftHistory, setDraftHistory] = useState<StrategyDraft[]>([]);
  const [projectDrawerOpen, setProjectDrawerOpen] = useState(false);
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

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

  // Load last project on mount
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
    // No saved project — start fresh and immediately save it
    const empty = createEmptySession();
    setSession(empty);
    const saved = saveProject(empty, []);
    setProjectId(saved.id);
    saveCurrentProjectId(saved.id);
    setLastSavedAt(saved.updatedAt);
  }, []);

  // Auto-save every 5 seconds when state changes
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
  }, [session, draftHistory, projectId]);

  const refreshProjects = useCallback(() => {
    setProjects(listProjects());
  }, []);

  const createNewProject = useCallback(() => {
    const empty = createEmptySession();
    setSession(empty);
    setDraftHistory([]);
    setOpenSection(activeTool === "distribution-strategy" ? "strategy" : "research");
    const saved = saveProject(empty, []);
    setProjectId(saved.id);
    saveCurrentProjectId(saved.id);
    setLastSavedAt(saved.updatedAt);
    refreshProjects();
  }, [activeTool, refreshProjects]);

  const switchProject = useCallback((id: string) => {
    const project = loadProject(id);
    if (!project) return;
    setProjectId(project.id);
    setSession(syncStrategyDirtyState(applyProfileToSession(project.session), ndProfileContext));
    setDraftHistory(project.draftHistory);
    setOpenSection(activeTool === "distribution-strategy" ? "strategy" : "research");
    saveCurrentProjectId(project.id);
    setLastSavedAt(project.updatedAt);
    setProjectDrawerOpen(false);
  }, [activeTool, ndProfileContext]);

  const handleDeleteProject = useCallback((id: string) => {
    if (!window.confirm("Delete this project? This can't be undone.")) return;
    deleteProject(id);
    refreshProjects();
    if (id === projectId) {
      createNewProject();
    }
  }, [projectId, refreshProjects, createNewProject]);

  const handleRenameProject = useCallback((id: string) => {
    renameProject(id, editName);
    setEditingProjectId(null);
    setEditName("");
    refreshProjects();
    if (id === projectId) {
      const updated = listProjects().find((p) => p.id === id);
      if (updated) setLastSavedAt(updated.updatedAt);
    }
  }, [editName, projectId, refreshProjects]);

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

  const runPhase = useCallback(async (phaseId: number, startDelay = 0) => {
    const phase = PHASES.find((item) => item.id === phaseId);
    if (!phase || !session.problem.trim()) return;

    if (startDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, startDelay));
    }

    updatePhase(phaseId, { status: "running", results: [], error: undefined });
    const queries = phase.buildQueries(session.problem, session.knownPlayers);
    const allResults: ExaResult[] = [];

    try {
      for (let index = 0; index < queries.length; index += 1) {
        if (index > 0) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }

        const query = queries[index];
        const response = await fetch("/api/exa-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: query.query, phase: phaseId, category: query.category ?? null }),
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }

        const results: ExaResult[] = await response.json();

        for (const result of results) {
          if (!allResults.find((existing) => existing.url === result.url)) {
            allResults.push(result);
          }
        }
      }

      updatePhase(phaseId, { status: "done", results: allResults });
    } catch (error) {
      updatePhase(phaseId, { status: "error", error: String(error) });
    }
  }, [session.problem, session.knownPlayers, updatePhase]);

  const runAll = useCallback(() => {
    if (!session.problem.trim()) return;

    PHASES.forEach((phase, index) => {
      void runPhase(phase.id, index * 400);
    });
  }, [runPhase, session.problem]);

  const reset = useCallback(() => {
    if (!window.confirm("Start fresh? Your current research and drafts will be cleared.")) return;
    createNewProject();
  }, [createNewProject]);

  const downloadBlob = useCallback((contents: string, prefix: string) => {
    const blob = new Blob([contents], { type: "text/markdown" });
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(blob);
    anchor.download = `${prefix}-${Date.now()}.md`;
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  }, []);

  const downloadResearch = useCallback(() => {
    const date = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const lines: string[] = [
      "# Category Scout Research",
      `**Problem:** ${session.problem}`,
      session.knownPlayers ? `**Known Players:** ${session.knownPlayers}` : "",
      `**Date:** ${date}`,
      "",
    ];

    for (const phase of PHASES) {
      const result = session.phases[phase.id];
      if (result.status !== "done" || result.results.length === 0) continue;

      lines.push("---", "", `## Phase ${String(phase.id).padStart(2, "0")} — ${phase.name}`, `*${phase.description}*`, "");

      for (const item of result.results) {
        const domain = (() => {
          try {
            return new URL(item.url).hostname.replace(/^www\./, "");
          } catch {
            return item.url;
          }
        })();
        const publishedDate = item.publishedDate
          ? new Date(item.publishedDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })
          : null;
        const score = item.score != null ? `${(item.score * 100).toFixed(0)}% relevance` : null;

        lines.push(`### [${item.title || item.url}](${item.url})`);
        lines.push(`*${[domain, publishedDate, score].filter(Boolean).join(" · ")}*`, "");

        if (item.highlights?.length) {
          for (const highlight of item.highlights.slice(0, 2)) {
            lines.push(`> ${highlight}`, "");
          }
        }
      }
    }

    downloadBlob(lines.filter(Boolean).join("\n"), "category-scout");
  }, [downloadBlob, session]);

  const downloadStrategy = useCallback(() => {
    const markdown = buildStrategyMarkdown(session);
    if (!markdown) return;
    downloadBlob(markdown, "category-scout-strategy");
  }, [downloadBlob, session]);

  const downloadIntelligenceBrief = useCallback(() => {
    const { buildIntelligenceMarkdown } = require("./lib/intelligence");
    if (!session.intelligenceBrief) return;
    const markdown = buildIntelligenceMarkdown(session.intelligenceBrief);
    const slug = session.problem
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "strategy";
    downloadBlob(markdown, `${slug}-intelligence-brief`);
  }, [downloadBlob, session]);

  const copyPrompt = useCallback(() => {
    navigator.clipboard.writeText(CLAUDE_PROMPT);
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 2000);
  }, []);

  const generateStrategy = useCallback(async () => {
    if (!session.problem.trim()) return;
    if (!session.strategyInputs.audienceLens.trim()) return;
    if (!getStrategyReadiness(session.phases).canGenerate) {
      mutateSession((current) => ({
        ...current,
        strategyStatus: "error",
        strategyError: "Complete at least 2 research phases before generating a strategy draft.",
      }));
      return;
    }

    mutateSession((current) => ({
      ...current,
      strategyStatus: "researching",
      strategyError: undefined,
    }));

    try {
      const draftRequest = {
        problem: session.problem,
        knownPlayers: session.knownPlayers,
        audienceLens: session.strategyInputs.audienceLens,
        founderConstraints: {
          teamSize: session.strategyInputs.teamSize,
          budgetBand: session.strategyInputs.budgetBand,
          weeklyCapacity: session.strategyInputs.weeklyCapacity,
          socialPostingTolerance: session.strategyInputs.socialPostingTolerance,
          channelAvoidances: session.strategyInputs.channelAvoidances,
          outreachTolerance: session.strategyInputs.outreachTolerance,
          peerCollaborationOk: session.strategyInputs.peerCollaborationOk,
          contentMode: session.strategyInputs.contentMode,
          contentModeOther: session.strategyInputs.contentModeOther,
          existingAssets: session.strategyInputs.existingAssets,
          previousAttempts: session.strategyInputs.previousAttempts ?? "",
          avoidanceTasks: session.strategyInputs.avoidanceTasks ?? "",
          activationWindows: session.strategyInputs.activationWindows ?? "",
          unavailablePeriods: session.strategyInputs.unavailablePeriods ?? "",
        },
        ndProfileContext: ndProfileContext ?? undefined,
        phaseResearch: condensePhaseResearch(session.phases),
      };

      const endpoint = "/api/strategy-draft";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draftRequest),
      });

      const rawText = await response.text();
      let payload: StrategyDraft | StrategyDraftErrorResponse;
      try {
        payload = JSON.parse(rawText) as StrategyDraft | StrategyDraftErrorResponse;
      } catch {
        throw new Error(`Server error (${response.status}): ${rawText.slice(0, 200)}`);
      }

      if (!response.ok) {
        throw new Error(typeof payload === "object" && payload && "error" in payload ? payload.error : "Strategy draft failed");
      }

      // Exa search is complete — show the synthesis phase briefly before applying the result.
      mutateSession((current) => ({ ...current, strategyStatus: "drafting" }));
      await new Promise((resolve) => setTimeout(resolve, 700));

      const finalDraft = payload as StrategyDraft;
      if (!hasCompleteStrategyDraft(finalDraft)) {
        throw new Error("Strategy draft returned without section text. Try rebuilding.");
      }

      const fingerprint = getStrategyFingerprint({
        problem: session.problem,
        knownPlayers: session.knownPlayers,
        phases: session.phases,
        strategyInputs: session.strategyInputs,
        ndProfileContext,
      });

      mutateSession((current) => ({
        ...current,
        strategyDraft: finalDraft,
        strategyStatus: "done",
        strategyError: undefined,
        strategyDirty: false,
        strategySourceFingerprint: fingerprint,
      }));

      setDraftHistory((prev) => [...prev, finalDraft]);
      setOpenSection("strategy");
    } catch (error) {
      mutateSession((current) => ({
        ...current,
        strategyDraft: hasCompleteStrategyDraft(current.strategyDraft) ? current.strategyDraft : null,
        strategyStatus: "error",
        strategyError: error instanceof Error ? error.message : "Strategy draft failed",
      }));
    }
  }, [mutateSession, ndProfileContext, session]);

  const generateIntelligenceBrief = useCallback(async () => {
    if (!session.problem.trim()) return;
    if (!session.strategyInputs.audienceLens.trim()) return;
    if (!getStrategyReadiness(session.phases).canGenerate) {
      mutateSession((current) => ({
        ...current,
        intelligenceStatus: "error",
        intelligenceError: "Complete at least 2 research phases before generating an intelligence brief.",
      }));
      return;
    }

    mutateSession((current) => ({
      ...current,
      intelligenceStatus: "researching",
      intelligenceError: undefined,
    }));

    try {
      const draftRequest = {
        problem: session.problem,
        knownPlayers: session.knownPlayers,
        audienceLens: session.strategyInputs.audienceLens,
        founderConstraints: {
          teamSize: session.strategyInputs.teamSize,
          budgetBand: session.strategyInputs.budgetBand,
          weeklyCapacity: session.strategyInputs.weeklyCapacity,
          socialPostingTolerance: session.strategyInputs.socialPostingTolerance,
          channelAvoidances: session.strategyInputs.channelAvoidances,
          outreachTolerance: session.strategyInputs.outreachTolerance,
          peerCollaborationOk: session.strategyInputs.peerCollaborationOk,
          contentMode: session.strategyInputs.contentMode,
          contentModeOther: session.strategyInputs.contentModeOther,
          existingAssets: session.strategyInputs.existingAssets,
          previousAttempts: session.strategyInputs.previousAttempts ?? "",
          avoidanceTasks: session.strategyInputs.avoidanceTasks ?? "",
          activationWindows: session.strategyInputs.activationWindows ?? "",
          unavailablePeriods: session.strategyInputs.unavailablePeriods ?? "",
        },
        ndProfileContext: ndProfileContext ?? undefined,
        phaseResearch: condensePhaseResearch(session.phases),
      };

      const response = await fetch("/api/intelligence-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draftRequest),
      });

      const rawText = await response.text();
      let payload: IntelligenceBrief | StrategyDraftErrorResponse;
      try {
        payload = JSON.parse(rawText) as IntelligenceBrief | StrategyDraftErrorResponse;
      } catch {
        throw new Error(`Server error (${response.status}): ${rawText.slice(0, 200)}`);
      }

      if (!response.ok) {
        throw new Error(typeof payload === "object" && payload && "error" in payload ? payload.error : "Intelligence brief failed");
      }

      mutateSession((current) => ({ ...current, intelligenceStatus: "drafting" }));
      await new Promise((resolve) => setTimeout(resolve, 700));

      const finalBrief = payload as IntelligenceBrief;

      mutateSession((current) => ({
        ...current,
        intelligenceBrief: finalBrief,
        intelligenceStatus: "done",
        intelligenceError: undefined,
      }));

      setOpenSection("strategy");
    } catch (error) {
      mutateSession((current) => ({
        ...current,
        intelligenceBrief: current.intelligenceBrief,
        intelligenceStatus: "error",
        intelligenceError: error instanceof Error ? error.message : "Intelligence brief failed",
      }));
    }
  }, [mutateSession, ndProfileContext, session]);

  const phaseRunning = Object.values(session.phases).some((phase) => phase.status === "running");
  const hasAnyResults = Object.values(session.phases).some((phase) => phase.results.length > 0);
  const canRun = !!session.problem.trim() && !phaseRunning;
  const donePhaseCount = Object.values(session.phases).filter((p) => p.status === "done").length;
  const totalResultCount = Object.values(session.phases).reduce((sum, p) => sum + p.results.length, 0);
  const toolTitle = activeTool === "category-scout"
    ? "Category Scout"
    : activeTool === "distribution-strategy"
      ? "Distribution Strategy"
    : activeTool === "context-builder"
      ? "ND Context Builder"
      : activeTool === "process-designer"
        ? "ND Process Designer"
        : "Skills";
  const usesProjectShell = activeTool === "category-scout" || activeTool === "distribution-strategy";

  return (
    <div className="main-wrap" style={{ maxWidth: 960, margin: "0 auto", padding: "52px 40px 100px" }}>
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 28, height: 14, position: "relative", flexShrink: 0 }}>
              {[0, 8, 16].map((offset, index) => (
                <div
                  key={index}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: offset,
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    border: "1.5px solid var(--teal)",
                    opacity: 1 - index * 0.2,
                  }}
                />
              ))}
            </div>
            <span style={{ fontSize: 22, fontWeight: 500, color: "var(--ink)", letterSpacing: "-0.03em", lineHeight: 1 }}>
              {toolTitle}
            </span>
          </div>
          {usesProjectShell ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                className="btn-text"
                onClick={() => {
                  refreshProjects();
                  setProjectDrawerOpen(true);
                }}
                style={{ fontSize: 12, color: "var(--ink-muted)" }}
              >
                {session.problem ? session.problem.slice(0, 30) + (session.problem.length > 30 ? "…" : "") : "Projects"}
              </button>
              {lastSavedAt && (
                <span className="mono" style={{ fontSize: 9, color: "var(--ink-muted)", opacity: 0.5 }}>
                  Saved {new Date(lastSavedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>
          ) : (
            <span className="mono" style={{ fontSize: 9, color: "var(--ink-muted)", opacity: 0.6 }}>
              {ndProfileContext ? "ND profile loaded" : "No saved ND profile"}
            </span>
          )}
        </div>
      </div>

      <ProjectDrawer
        open={projectDrawerOpen}
        onClose={() => setProjectDrawerOpen(false)}
        projects={projects}
        currentId={projectId}
        onSelect={switchProject}
        onNew={createNewProject}
        onDelete={handleDeleteProject}
        onRenameStart={(id: string, name: string) => {
          setEditingProjectId(id);
          setEditName(name);
        }}
        onRenameSubmit={handleRenameProject}
        onRenameCancel={() => {
          setEditingProjectId(null);
          setEditName("");
        }}
        editingId={editingProjectId}
        editName={editName}
        onEditNameChange={setEditName}
      />

      {/* Tool navigation */}
      <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 32 }}>
        {(
          [
            { id: "category-scout" as ActiveTool, label: "Category Scout" },
            { id: "distribution-strategy" as ActiveTool, label: "Distribution Strategy" },
            { id: "context-builder" as ActiveTool, label: "ND Context Builder" },
            { id: "process-designer" as ActiveTool, label: "ND Process Designer" },
            { id: "skills" as ActiveTool, label: "Skills" },
          ] as { id: ActiveTool; label: string; disabled?: boolean }[]
        ).map(({ id, label, disabled }) => {
          const isActive = activeTool === id;
          return (
            <button
              key={id}
              onClick={() => !disabled && setActiveTool(id)}
              className="btn-text"
              disabled={disabled}
              style={{
                fontSize: 12,
                fontWeight: isActive ? 500 : 400,
                color: disabled ? "var(--ink-muted)" : isActive ? "var(--ink)" : "var(--ink-muted)",
                opacity: disabled ? 0.35 : 1,
                padding: "6px 14px",
                borderBottom: `2px solid ${isActive ? "var(--teal)" : "transparent"}`,
                cursor: disabled ? "default" : "pointer",
                transition: "color 0.12s, border-color 0.12s",
                marginLeft: 0,
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      <hr className="rule" />

      {activeTool === "context-builder" && (
        <div style={{ paddingTop: 40 }}>
          <NDContextBuilder />
        </div>
      )}

      {activeTool === "process-designer" && (
        <div style={{ paddingTop: 40 }}>
          <NDProcessDesigner onOpenContextBuilder={() => setActiveTool("context-builder")} />
        </div>
      )}

      {activeTool === "skills" && (
        <div style={{ paddingTop: 40 }}>
          <SkillsLibrary />
        </div>
      )}

      {activeTool === "category-scout" && (
      <>
      <ToolSection
        number="01"
        label="Category Scout"
        description="Before you commit to a direction, know what you're getting into. Runs six searches across customer pain, competitor gaps, market shape, and whether people are already looking for this."
        statusChip={
          phaseRunning ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <span className="dot dot-running" />
              <span className="mono" style={{ fontSize: 10, color: "var(--ink-muted)" }}>Running</span>
            </span>
          ) : donePhaseCount > 0 ? (
            <span className="mono" style={{ fontSize: 10, color: "var(--ink-muted)", letterSpacing: "0.05em" }}>
              {donePhaseCount}/{PHASES.length} phases · {totalResultCount} results
            </span>
          ) : undefined
        }
        headerActions={
          hasAnyResults ? (
            <button
              className="btn-text"
              onClick={downloadResearch}
              aria-label="Export research as Markdown"
              style={{ fontSize: 11, color: "var(--ink-muted)" }}
            >
              <DownloadSimple size={11} />
              Export
            </button>
          ) : undefined
        }
        isOpen={openSection === "research"}
        onToggle={() => setOpenSection(openSection === "research" ? null : "research")}
      >
        <p style={{ fontSize: 13, color: "var(--ink-muted)", lineHeight: 1.65, margin: "0 0 28px", maxWidth: 560 }}>
          Enter the problem. Hit run. Review what comes back across six angles — read the excerpts, export the file, or hand it to an agent.
        </p>

        <div className="input-grid" style={{ marginBottom: 30 }}>
          <label htmlFor="problem-input" style={{
            display: "block", fontSize: 10, fontWeight: 500, letterSpacing: "0.12em",
            textTransform: "uppercase", color: "var(--ink-muted)", marginBottom: 6,
            fontFamily: "var(--font-mono)",
          }}>
            Problem Statement
          </label>
          <textarea
            id="problem-input"
            value={session.problem}
            onChange={(event) => mutateSession((current) => ({ ...current, problem: event.target.value }))}
            placeholder="Describe the customer problem in plain language…"
            rows={4}
            style={{ marginBottom: 8 }}
          />

          <label htmlFor="known-players-input" style={{
            display: "block", fontSize: 10, fontWeight: 500, letterSpacing: "0.12em",
            textTransform: "uppercase", color: "var(--ink-muted)", marginBottom: 6,
            fontFamily: "var(--font-mono)", marginTop: 8,
          }}>
            Known Players{" "}
            <span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 400, opacity: 0.6 }}>
              — optional
            </span>
          </label>
          <input
            id="known-players-input"
            type="text"
            value={session.knownPlayers}
            onChange={(event) => mutateSession((current) => ({ ...current, knownPlayers: event.target.value }))}
            placeholder="Accenture, McKinsey…"
            style={{ marginBottom: 16 }}
          />

          <RunButton canRun={canRun} isRunning={phaseRunning} hasAnyResults={hasAnyResults} onClick={runAll} />
        </div>

        <ReportView session={session} onRunPhase={runPhase} isRunning={phaseRunning} />
        {hasAnyResults && (
          <>
            <hr className="rule" style={{ margin: "40px 0" }} />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.05 }}
              style={{ padding: "20px 0" }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 32 }}>
                <div>
                  <p style={{
                    fontSize: 10, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase",
                    color: "var(--ink-muted)", margin: "0 0 5px", fontFamily: "var(--font-mono)",
                  }}>
                    Export results
                  </p>
                  <p style={{ fontSize: 13, color: "var(--ink-light)", margin: 0, lineHeight: 1.6 }}>
                    Download the research file, then pass it to any AI agent using the category design brief prompt below.
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0, paddingTop: 2 }}>
                  <button
                    className="btn-text"
                    onClick={downloadResearch}
                    aria-label="Download research as Markdown"
                    style={{ fontSize: 12, color: "var(--ink-muted)" }}
                  >
                    <DownloadSimple size={12} />
                    Download
                  </button>
                  <button
                    className="btn-text"
                    onClick={copyPrompt}
                    aria-label="Copy Claude prompt to clipboard"
                    style={{ fontSize: 12, color: promptCopied ? "var(--teal-deep)" : "var(--ink-muted)", transition: "color 0.15s" }}
                  >
                    {promptCopied ? <Check size={12} /> : <Copy size={12} />}
                    {promptCopied ? "Copied" : "Copy prompt"}
                  </button>
                  <button
                    className="btn-text"
                    onClick={() => setPromptOpen((open) => !open)}
                    aria-expanded={promptOpen}
                    aria-controls="claude-prompt"
                    style={{ fontSize: 12, color: "var(--ink-muted)" }}
                  >
                    <motion.span
                      animate={{ rotate: promptOpen ? 180 : 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      style={{ display: "inline-flex" }}
                    >
                      <CaretDown size={12} />
                    </motion.span>
                    {promptOpen ? "Hide" : "View prompt"}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {promptOpen && (
                  <motion.pre
                    id="claude-prompt"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 28 }}
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      lineHeight: 1.7,
                      color: "var(--ink-light)",
                      margin: "14px 0 0",
                      padding: "14px 16px",
                      border: "1px solid var(--rule)",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      overflow: "hidden",
                    }}
                  >
                    {CLAUDE_PROMPT}
                  </motion.pre>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </ToolSection>

      {hasAnyResults && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, paddingTop: 16, flexWrap: "wrap" }}>
          <button
            className="btn-text"
            onClick={() => setActiveTool("distribution-strategy")}
            style={{ fontSize: 12, color: "var(--teal-deep)" }}
          >
            Open Distribution Strategy
          </button>
          <button className="btn-text" onClick={reset} aria-label="Start fresh" style={{ fontSize: 12, color: "var(--ink-muted)" }}>
            <ArrowCounterClockwise size={12} />
            Reset
          </button>
        </div>
      )}
      </>
      )}

      {activeTool === "distribution-strategy" && (
      <>
      <ToolSection
        number="01"
        label="Distribution Strategy"
        description="Takes the research and turns it into an ND-aware distribution plan, intelligence brief, and receiving-agent handoff."
        statusChip={
          (session.strategyStatus === "researching" || session.strategyStatus === "drafting" ||
           session.intelligenceStatus === "researching" || session.intelligenceStatus === "drafting") ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <span className="dot dot-running" />
              <span className="mono" style={{ fontSize: 10, color: "var(--ink-muted)" }}>Generating</span>
            </span>
          ) : session.strategyDraft ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <span className="mono" style={{ fontSize: 10, color: "var(--ink-muted)", letterSpacing: "0.05em" }}>
                {session.strategyDirty ? "Outdated" : "Draft ready"}
              </span>
              {session.strategyDirty && <span className="dot" style={{ background: "var(--terracotta)" }} />}
            </span>
          ) : session.intelligenceBrief ? (
            <span className="mono" style={{ fontSize: 10, color: "var(--ink-muted)", letterSpacing: "0.05em" }}>
              Brief ready
            </span>
          ) : undefined
        }
        isOpen
        onToggle={() => setOpenSection("strategy")}
      >
        {!hasAnyResults && (
          <div style={{ marginBottom: 28, maxWidth: 600 }}>
            <p style={{ fontSize: 13, color: "var(--ink-light)", lineHeight: 1.65, margin: "0 0 10px" }}>
              This surface expects a research dossier first. Run the research in `Category Scout`, then come back here for synthesis.
            </p>
            <button
              className="btn-text"
              onClick={() => setActiveTool("category-scout")}
              style={{ fontSize: 12, color: "var(--teal-deep)" }}
            >
              Open Category Scout
            </button>
          </div>
        )}

        <StrategyView
          session={session}
          ndProfileContext={ndProfileContext}
          researchRunning={phaseRunning}
          onInputChange={updateStrategyInput}
          onSectionChange={updateStrategySection}
          onGenerate={generateStrategy}
          onGenerateIntelligence={generateIntelligenceBrief}
          onExport={downloadStrategy}
          onExportIntelligence={downloadIntelligenceBrief}
          draftHistory={draftHistory}
        />
      </ToolSection>

      {hasAnyResults && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, paddingTop: 16, flexWrap: "wrap" }}>
          <button
            className="btn-text"
            onClick={() => setActiveTool("category-scout")}
            style={{ fontSize: 12, color: "var(--ink-muted)" }}
          >
            Back to research
          </button>
          <button className="btn-text" onClick={reset} aria-label="Start fresh" style={{ fontSize: 12, color: "var(--ink-muted)" }}>
            <ArrowCounterClockwise size={12} />
            Reset
          </button>
        </div>
      )}
      </>
      )}
    </div>
  );
}

function RunButton({
  canRun,
  isRunning,
  hasAnyResults,
  onClick,
}: {
  canRun: boolean;
  isRunning: boolean;
  hasAnyResults: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={canRun ? onClick : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontFamily: "var(--font-display)",
        fontSize: 15,
        fontWeight: 600,
        letterSpacing: "0.01em",
        padding: "10px 52px",
        border: "none",
        borderRadius: 999,
        cursor: canRun ? "pointer" : "not-allowed",
        background: canRun ? (hovered ? "#3D6B6B" : "#5B8A8A") : "rgba(91, 138, 138, 0.4)",
        color: "#fff",
        transition: "background 0.15s",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        userSelect: "none",
      }}
    >
      {isRunning
        ? (
          <>
            <span className="spinner" style={{ width: 14, height: 14 }} />
            <span>Running…</span>
          </>
        )
        : hasAnyResults ? "Re-run All" : "Run"}
    </button>
  );
}

function ToolSection({
  number,
  label,
  description,
  statusChip,
  headerActions,
  isOpen,
  onToggle,
  children,
}: {
  number: string;
  label: string;
  description: string;
  statusChip?: React.ReactNode;
  headerActions?: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <button
          className="btn-text"
          onClick={onToggle}
          aria-expanded={isOpen}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "flex-start",
            gap: 16,
            padding: "28px 0 24px",
            textAlign: "left",
          }}
        >
          <span
            className="mono"
            style={{ fontSize: 10, letterSpacing: "0.1em", color: "var(--ink-muted)", flexShrink: 0, paddingTop: 5 }}
          >
            {number}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 7 }}>
              <span
                style={{
                  fontSize: 19,
                  fontWeight: 500,
                  color: "var(--ink)",
                  letterSpacing: "-0.02em",
                  flex: 1,
                }}
              >
                {label}
              </span>
              {statusChip && <span style={{ flexShrink: 0 }}>{statusChip}</span>}
              <motion.span
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 28 }}
                style={{ display: "inline-flex", color: "var(--ink-muted)", flexShrink: 0 }}
              >
                <CaretDown size={13} />
              </motion.span>
            </div>
            <p style={{ fontSize: 13, color: "var(--ink-muted)", lineHeight: 1.6, margin: 0 }}>
              {description}
            </p>
          </div>
        </button>
        {headerActions && (
          <span style={{ flexShrink: 0, paddingTop: 28 }}>{headerActions}</span>
        )}
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 30 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ paddingBottom: 56 }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <hr className="rule" />
    </div>
  );
}

function ProjectDrawer({
  open,
  onClose,
  projects,
  currentId,
  onSelect,
  onNew,
  onDelete,
  onRenameStart,
  onRenameSubmit,
  onRenameCancel,
  editingId,
  editName,
  onEditNameChange,
}: {
  open: boolean;
  onClose: () => void;
  projects: SavedProject[];
  currentId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onRenameStart: (id: string, name: string) => void;
  onRenameSubmit: (id: string) => void;
  onRenameCancel: () => void;
  editingId: string | null;
  editName: string;
  onEditNameChange: (value: string) => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(26, 26, 24, 0.2)",
              zIndex: 40,
            }}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              width: 320,
              height: "100vh",
              background: "var(--cream)",
              borderLeft: "1px solid var(--rule)",
              zIndex: 50,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 20px 16px",
                borderBottom: "1px solid var(--rule)",
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--ink-muted)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                Projects
              </span>
              <button className="btn-text" onClick={onClose} aria-label="Close projects">
                <X size={14} />
              </button>
            </div>

            <div style={{ padding: "12px 20px" }}>
              <button
                className="btn-text"
                onClick={onNew}
                style={{
                  fontSize: 12,
                  color: "var(--teal-deep)",
                  padding: "6px 0",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <Plus size={12} />
                New project
              </button>
            </div>

            <div style={{ flex: 1, overflow: "auto", padding: "0 20px 20px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {projects.map((project) => {
                  const isCurrent = project.id === currentId;
                  const isEditing = project.id === editingId;

                  return (
                    <div
                      key={project.id}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 6,
                        background: isCurrent ? "rgba(91, 138, 138, 0.07)" : "transparent",
                        border: `1px solid ${isCurrent ? "var(--teal)" : "transparent"}`,
                        cursor: isEditing ? "default" : "pointer",
                      }}
                      onClick={() => !isEditing && onSelect(project.id)}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 8,
                        }}
                      >
                        {isEditing ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => onEditNameChange(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") onRenameSubmit(project.id);
                              if (e.key === "Escape") onRenameCancel();
                            }}
                            onBlur={() => onRenameSubmit(project.id)}
                            autoFocus
                            style={{
                              fontSize: 13,
                              fontFamily: "var(--font-display)",
                              color: "var(--ink)",
                              background: "transparent",
                              border: "1px solid var(--rule)",
                              borderRadius: 4,
                              padding: "3px 6px",
                              flex: 1,
                              outline: "none",
                            }}
                          />
                        ) : (
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: isCurrent ? 600 : 400,
                              color: "var(--ink)",
                              flex: 1,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {project.name}
                          </span>
                        )}

                        {!isEditing && (
                          <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                            <button
                              className="btn-text"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRenameStart(project.id, project.name);
                              }}
                              aria-label={`Rename ${project.name}`}
                              style={{ color: "var(--ink-muted)", padding: 2 }}
                            >
                              <PencilSimple size={11} />
                            </button>
                            <button
                              className="btn-text"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(project.id);
                              }}
                              aria-label={`Delete ${project.name}`}
                              style={{ color: "var(--ink-muted)", padding: 2 }}
                            >
                              <Trash size={11} />
                            </button>
                          </div>
                        )}
                      </div>

                      <span
                        className="mono"
                        style={{
                          fontSize: 9,
                          color: "var(--ink-muted)",
                          opacity: 0.6,
                          marginTop: 3,
                          display: "block",
                        }}
                      >
                        {new Date(project.updatedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
