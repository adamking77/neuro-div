import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Spinner } from "@heroui/react";
import { ArrowCounterClockwise, DownloadSimple, Copy, Check, CaretDown, Plus, PencilSimple, Trash, X } from "@phosphor-icons/react";
import { PHASES } from "./phases";
import { ReportView } from "./components/ReportView";
import { StrategyView } from "./components/StrategyView";
import {
  buildStrategyMarkdown,
  condensePhaseResearch,
  createEmptyStrategyInputs,
  getStrategyFingerprint,
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
  PhaseResult,
  SessionState,
  StrategyDraft,
  StrategyInputs,
  StrategySectionKey,
} from "./types";
import "./index.css";

type ActiveView = "research" | "strategy";

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
  strategyInputs: createEmptyStrategyInputs(),
  strategyDraft: null,
  strategyStatus: "idle",
  strategyError: undefined,
  strategyDirty: false,
  strategySourceFingerprint: null,
  intelligenceBrief: null,
  intelligenceStatus: "idle",
  intelligenceError: undefined,
});

export default function App() {
  const [session, setSession] = useState<SessionState>(createEmptySession);
  const [activeView, setActiveView] = useState<ActiveView>("research");
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
    setSession((current) => syncStrategyDirtyState(updater(current)));
  }, []);

  // Load last project on mount
  useEffect(() => {
    const currentId = loadCurrentProjectId();
    if (currentId) {
      const project = loadProject(currentId);
      if (project) {
        setProjectId(project.id);
        setSession(project.session);
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
    setActiveView("research");
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
    setSession(project.session);
    setDraftHistory(project.draftHistory);
    setActiveView("research");
    saveCurrentProjectId(project.id);
    setLastSavedAt(project.updatedAt);
    setProjectDrawerOpen(false);
  }, []);

  const handleDeleteProject = useCallback((id: string) => {
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

    if (hasCompleteStrategyDraft(session.strategyDraft)) {
      const shouldReplace = window.confirm("Regenerating will replace the current strategy draft. Continue?");
      if (!shouldReplace) return;
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
        },
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

      // Exa search is complete — show the Claude drafting phase briefly before applying the result.
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
      setActiveView("strategy");
    } catch (error) {
      mutateSession((current) => ({
        ...current,
        strategyDraft: hasCompleteStrategyDraft(current.strategyDraft) ? current.strategyDraft : null,
        strategyStatus: "error",
        strategyError: error instanceof Error ? error.message : "Strategy draft failed",
      }));
    }
  }, [mutateSession, session]);

  const generateIntelligenceBrief = useCallback(async () => {
    if (!session.problem.trim()) return;
    if (!session.strategyInputs.audienceLens.trim()) return;

    if (session.intelligenceBrief) {
      const shouldReplace = window.confirm("Regenerating will replace the current intelligence brief. Continue?");
      if (!shouldReplace) return;
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
        },
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

      setActiveView("strategy");
    } catch (error) {
      mutateSession((current) => ({
        ...current,
        intelligenceBrief: current.intelligenceBrief,
        intelligenceStatus: "error",
        intelligenceError: error instanceof Error ? error.message : "Intelligence brief failed",
      }));
    }
  }, [mutateSession, session]);

  const phaseRunning = Object.values(session.phases).some((phase) => phase.status === "running");
  const hasAnyResults = Object.values(session.phases).some((phase) => phase.results.length > 0);
  const canRun = !!session.problem.trim() && !phaseRunning;

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
            <span style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.03em", lineHeight: 1 }}>
              Category Scout
            </span>
          </div>
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
        </div>
        <p style={{ fontSize: 13, color: "var(--ink-muted)", lineHeight: 1.6, maxWidth: 560, margin: 0 }}>
          Six research phases in parallel — who has the pain, who's solving it,
          how the market is structured, and how people talk about it.
          Now with a strategy layer for turning evidence into a low-contact distribution plan.
        </p>
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

      <hr className="rule" style={{ marginBottom: 36 }} />

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

      <hr className="rule" />

      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        padding: "16px 0",
        flexWrap: "wrap",
      }}>
        <ViewToggle activeView={activeView} onChange={setActiveView} strategyDirty={session.strategyDirty} />

        {activeView === "research" && hasAnyResults && (
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <button className="btn-text" onClick={downloadResearch} aria-label="Export research as Markdown" style={{ fontSize: 13, color: "var(--ink-muted)" }}>
              <DownloadSimple size={13} />
              Export
            </button>

            <button className="btn-text" onClick={reset} aria-label="Reset session" style={{ fontSize: 13, color: "var(--ink-muted)" }}>
              <ArrowCounterClockwise size={12} />
              Reset
            </button>
          </div>
        )}

        {activeView === "strategy" && (
          <button className="btn-text" onClick={reset} aria-label="Reset session" style={{ fontSize: 13, color: "var(--ink-muted)" }}>
            <ArrowCounterClockwise size={12} />
            Reset
          </button>
        )}
      </div>

      {activeView === "research" ? (
        <>
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
                      Take this to Claude
                    </p>
                    <p style={{ fontSize: 13, color: "var(--ink-light)", margin: 0, lineHeight: 1.6 }}>
                      Export the research, upload to{" "}
                      <a href="https://claude.ai" target="_blank" rel="noreferrer" style={{ color: "var(--teal)", textDecoration: "none" }}>
                        claude.ai
                      </a>
                      , and use this prompt to generate a category design brief.
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0, paddingTop: 2 }}>
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
        </>
      ) : (
        <StrategyView
          session={session}
          researchRunning={phaseRunning}
          onInputChange={updateStrategyInput}
          onSectionChange={updateStrategySection}
          onGenerate={generateStrategy}
          onGenerateIntelligence={generateIntelligenceBrief}
          onExport={downloadStrategy}
          onExportIntelligence={downloadIntelligenceBrief}
          draftHistory={draftHistory}
        />
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
            <Spinner size="sm" color="current" />
            <span>Running…</span>
          </>
        )
        : hasAnyResults ? "Re-run All" : "Run"}
    </button>
  );
}

function ViewToggle({
  activeView,
  onChange,
  strategyDirty,
}: {
  activeView: ActiveView;
  onChange: (view: ActiveView) => void;
  strategyDirty?: boolean;
}) {
  return (
    <div style={{ display: "inline-flex", gap: 6, border: "1px solid var(--rule)", padding: 4, borderRadius: 999 }}>
      <ViewButton label="Research" active={activeView === "research"} onClick={() => onChange("research")} />
      <ViewButton label="Strategy" active={activeView === "strategy"} onClick={() => onChange("strategy")} showDot={strategyDirty} />
    </div>
  );
}

function ViewButton({ label, active, onClick, showDot }: { label: string; active: boolean; onClick: () => void; showDot?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: "none",
        background: active ? "var(--teal)" : "transparent",
        color: active ? "#fff" : "var(--ink-muted)",
        borderRadius: 999,
        padding: "7px 14px",
        cursor: "pointer",
        fontFamily: "var(--font-display)",
        fontSize: 13,
        lineHeight: 1,
        transition: "background 0.15s, color 0.15s",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      {label}
      {showDot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: active ? "#fff" : "var(--terracotta)",
            display: "inline-block",
            flexShrink: 0,
          }}
        />
      )}
    </button>
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
