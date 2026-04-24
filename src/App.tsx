import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Spinner } from "@heroui/react";
import { ArrowCounterClockwise, DownloadSimple, Copy, Check, CaretDown } from "@phosphor-icons/react";
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
import type {
  ExaResult,
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
});

export default function App() {
  const [session, setSession] = useState<SessionState>(createEmptySession);
  const [activeView, setActiveView] = useState<ActiveView>("research");
  const [promptCopied, setPromptCopied] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);

  const mutateSession = useCallback((updater: (current: SessionState) => SessionState) => {
    setSession((current) => syncStrategyDirtyState(updater(current)));
  }, []);

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
    setActiveView("research");
    setSession(createEmptySession());
  }, []);

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
          contentMode: session.strategyInputs.contentMode,
          contentModeOther: session.strategyInputs.contentModeOther,
          existingAssets: session.strategyInputs.existingAssets,
        },
        phaseResearch: condensePhaseResearch(session.phases),
      };

      const response = await fetch("/api/strategy-draft", {
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

  const phaseRunning = Object.values(session.phases).some((phase) => phase.status === "running");
  const hasAnyResults = Object.values(session.phases).some((phase) => phase.results.length > 0);
  const canRun = !!session.problem.trim() && !phaseRunning;

  return (
    <div className="main-wrap" style={{ maxWidth: 960, margin: "0 auto", padding: "52px 40px 100px" }}>
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
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
        <p style={{ fontSize: 13, color: "var(--ink-muted)", lineHeight: 1.6, maxWidth: 560, margin: 0 }}>
          Six research phases in parallel — who has the pain, who's solving it,
          how the market is structured, and how people talk about it.
          Now with a strategy layer for turning evidence into a low-contact distribution plan.
        </p>
      </div>

      <hr className="rule" style={{ marginBottom: 36 }} />

      <div className="input-grid" style={{ marginBottom: 30 }}>
        <label style={{
          display: "block", fontSize: 10, fontWeight: 500, letterSpacing: "0.12em",
          textTransform: "uppercase", color: "var(--ink-muted)", marginBottom: 6,
          fontFamily: "var(--font-mono)",
        }}>
          Problem Statement
        </label>
        <textarea
          value={session.problem}
          onChange={(event) => mutateSession((current) => ({ ...current, problem: event.target.value }))}
          placeholder="Describe the customer problem in plain language…"
          rows={4}
          style={{ marginBottom: 8 }}
        />

        <label style={{
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
        <ViewToggle activeView={activeView} onChange={setActiveView} />

        {activeView === "research" && hasAnyResults && (
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <button className="btn-text" onClick={downloadResearch} style={{ fontSize: 13, color: "var(--ink-muted)" }}>
              <DownloadSimple size={13} />
              Export
            </button>

            <button className="btn-text" onClick={reset} style={{ fontSize: 13, color: "var(--ink-muted)" }}>
              <ArrowCounterClockwise size={12} />
              Reset
            </button>
          </div>
        )}

        {activeView === "strategy" && (
          <button className="btn-text" onClick={reset} style={{ fontSize: 13, color: "var(--ink-muted)" }}>
            <ArrowCounterClockwise size={12} />
            Reset
          </button>
        )}
      </div>

      {activeView === "research" && hasAnyResults && (
        <>
          <hr className="rule" />
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
                  style={{ fontSize: 12, color: promptCopied ? "var(--teal-deep)" : "var(--ink-muted)", transition: "color 0.15s" }}
                >
                  {promptCopied ? <Check size={12} /> : <Copy size={12} />}
                  {promptCopied ? "Copied" : "Copy prompt"}
                </button>
                <button className="btn-text" onClick={() => setPromptOpen((open) => !open)} style={{ fontSize: 12, color: "var(--ink-muted)" }}>
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
          <hr className="rule" style={{ marginBottom: 40 }} />
        </>
      )}

      {activeView === "research" ? (
        <ReportView session={session} onRunPhase={runPhase} isRunning={phaseRunning} />
      ) : (
        <StrategyView
          session={session}
          researchRunning={phaseRunning}
          onInputChange={updateStrategyInput}
          onSectionChange={updateStrategySection}
          onGenerate={generateStrategy}
          onExport={downloadStrategy}
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
}: {
  activeView: ActiveView;
  onChange: (view: ActiveView) => void;
}) {
  return (
    <div style={{ display: "inline-flex", gap: 6, border: "1px solid var(--rule)", padding: 4, borderRadius: 999 }}>
      <ViewButton label="Research" active={activeView === "research"} onClick={() => onChange("research")} />
      <ViewButton label="Strategy" active={activeView === "strategy"} onClick={() => onChange("strategy")} />
    </div>
  );
}

function ViewButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
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
      }}
    >
      {label}
    </button>
  );
}
