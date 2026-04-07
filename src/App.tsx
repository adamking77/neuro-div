import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Spinner } from "@heroui/react";
import { ArrowCounterClockwise, Notepad, DownloadSimple, Copy, Check } from "@phosphor-icons/react";
import type { ExaResult, PhaseResult, SessionState } from "./types";
import { PHASES } from "./phases";
import { ReportView } from "./components/ReportView";
import { BriefBuilder } from "./components/BriefBuilder";
import "./index.css";

const emptyPhases = (): Record<number, PhaseResult> =>
  Object.fromEntries(PHASES.map((p) => [p.id, { status: "idle", results: [] }]));

export type MainView = "report" | "brief";

const CLAUDE_PROMPT = `I'm attaching a Category Scout research file covering 6 phases of market research. Please analyze it and produce a category design brief with these sections:

1. The Problem — in customer language, not solution language
2. The Enemy — the worldview or incumbent approach being displaced
3. The Landscape — who's adjacent, what's named, where the edges are
4. The White Space — the unclaimed combination of problem + solution
5. The Evidence Stack — proof the problem is real and growing
6. The Vocabulary Set — candidate words for naming the category
7. The POV Thesis — one paragraph: broken world → enemy → new way

Be specific and direct. Draw only from the research provided.`;

export default function App() {
  const [session, setSession] = useState<SessionState>({
    problem: "", knownPlayers: "", phases: emptyPhases(),
  });
  const [view, setView] = useState<MainView>("report");
  const [promptCopied, setPromptCopied] = useState(false);

  const updatePhase = useCallback((id: number, update: Partial<PhaseResult>) => {
    setSession((s) => ({ ...s, phases: { ...s.phases, [id]: { ...s.phases[id], ...update } } }));
  }, []);

  const runPhase = useCallback(async (phaseId: number) => {
    const phase = PHASES.find((p) => p.id === phaseId);
    if (!phase || !session.problem.trim()) return;
    updatePhase(phaseId, { status: "running", results: [], error: undefined });
    const queries = phase.buildQueries(session.problem, session.knownPlayers);
    const allResults: ExaResult[] = [];
    try {
      for (const q of queries) {
        const res = await fetch("/api/exa-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: q.query, phase: phaseId, category: q.category ?? null }),
        });
        if (!res.ok) throw new Error(await res.text());
        const results: ExaResult[] = await res.json();
        for (const r of results) {
          if (!allResults.find((x) => x.url === r.url)) allResults.push(r);
        }
      }
      updatePhase(phaseId, { status: "done", results: allResults });
    } catch (err) {
      updatePhase(phaseId, { status: "error", error: String(err) });
    }
  }, [session.problem, session.knownPlayers, updatePhase]);

  const runAll = useCallback(() => {
    if (!session.problem.trim()) return;
    setView("report");
    Promise.all(PHASES.map((p) => runPhase(p.id)));
  }, [runPhase, session.problem]);

  const reset = useCallback(() => {
    setSession({ problem: "", knownPlayers: "", phases: emptyPhases() });
    setView("report");
  }, []);

  const downloadResearch = useCallback(() => {
    const date = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const lines: string[] = [
      `# Category Scout Research`,
      `**Problem:** ${session.problem}`,
      session.knownPlayers ? `**Known Players:** ${session.knownPlayers}` : "",
      `**Date:** ${date}`,
      "",
    ];
    for (const phase of PHASES) {
      const result = session.phases[phase.id];
      if (result.status !== "done" || result.results.length === 0) continue;
      lines.push(`---`, ``, `## Phase ${String(phase.id).padStart(2, "0")} — ${phase.name}`, `*${phase.description}*`, ``);
      for (const r of result.results) {
        const domain = (() => { try { return new URL(r.url).hostname.replace(/^www\./, ""); } catch { return r.url; } })();
        const d = r.publishedDate ? new Date(r.publishedDate).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : null;
        const score = r.score != null ? `${(r.score * 100).toFixed(0)}% relevance` : null;
        lines.push(`### [${r.title || r.url}](${r.url})`);
        lines.push(`*${[domain, d, score].filter(Boolean).join(" · ")}*`, ``);
        if (r.highlights?.length) {
          for (const h of r.highlights.slice(0, 2)) lines.push(`> ${h}`, ``);
        }
      }
    }
    const blob = new Blob([lines.filter(Boolean).join("\n")], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `category-scout-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [session]);

  const copyPrompt = useCallback(() => {
    navigator.clipboard.writeText(CLAUDE_PROMPT);
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 2000);
  }, []);

  const isRunning = Object.values(session.phases).some((p) => p.status === "running");
  const hasAnyResults = Object.values(session.phases).some((p) => p.results.length > 0);
  const completedCount = Object.values(session.phases).filter((p) => p.status === "done").length;
  const canRun = !!session.problem.trim() && !isRunning;

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "52px 40px 100px" }}>

      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          {/* Logo — three overlapping outline circles */}
          <div style={{ width: 28, height: 14, position: "relative", flexShrink: 0 }}>
            {[0, 8, 16].map((offset, i) => (
              <div key={i} style={{
                position: "absolute", top: 0, left: offset,
                width: 14, height: 14, borderRadius: "50%",
                border: "1.5px solid var(--teal)",
                opacity: 1 - i * 0.2,
              }} />
            ))}
          </div>
          <span style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em" }}>
            Category Scout
          </span>
        </div>
        <p style={{ fontSize: 13, color: "var(--ink-muted)", lineHeight: 1.6, maxWidth: 480, margin: 0 }}>
          Six research phases — who has the pain, who's solving it,
          how the market is structured, and how people talk about it.
        </p>
      </div>

      <hr className="rule" style={{ marginBottom: 36 }} />

      {/* Input form */}
      <div style={{ marginBottom: 36 }}>
        <label style={{
          display: "block", fontSize: 10, fontWeight: 500, letterSpacing: "0.12em",
          textTransform: "uppercase", color: "var(--ink-muted)", marginBottom: 6,
          fontFamily: "var(--font-mono)",
        }}>
          Problem Statement
        </label>
        <textarea
          value={session.problem}
          onChange={(e) => setSession((s) => ({ ...s, problem: e.target.value }))}
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
          onChange={(e) => setSession((s) => ({ ...s, knownPlayers: e.target.value }))}
          placeholder="Accenture, McKinsey…"
          style={{ marginBottom: 16 }}
        />

        <button
          onClick={runAll}
          disabled={!canRun}
          style={{
            width: "100%",
            fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 600,
            letterSpacing: "0.01em", padding: "13px 0",
            border: "none", borderRadius: 999,
            cursor: canRun ? "pointer" : "not-allowed",
            background: canRun ? "#2C5C93" : "rgba(26,26,24,0.06)",
            color: canRun ? "#fff" : "var(--ink-muted)",
            transition: "background 0.15s, color 0.15s",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          {isRunning
            ? <><Spinner size="sm" color="current" /><span>Running…</span></>
            : hasAnyResults ? "Re-run All" : "Run"
          }
        </button>
      </div>

      <hr className="rule" />

      {/* Action bar */}
      {hasAnyResults && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
            <button
              className="btn-text"
              onClick={() => setView(view === "brief" ? "report" : "brief")}
              style={{
                fontSize: 13, color: view === "brief" ? "var(--ink)" : "var(--ink-muted)",
                fontWeight: view === "brief" ? 600 : 400,
                borderBottom: view === "brief" ? "1px solid var(--ink)" : "1px solid transparent",
                paddingBottom: 1,
              }}
            >
              <Notepad size={13} />
              Brief
              {completedCount > 0 && (
                <span className="mono" style={{ fontSize: 10, marginLeft: 2, opacity: 0.6 }}>
                  {completedCount}/6
                </span>
              )}
            </button>

            <button
              className="btn-text"
              onClick={downloadResearch}
              style={{ fontSize: 13, color: "var(--ink-muted)" }}
            >
              <DownloadSimple size={13} />
              Export
            </button>
          </div>

          <button
            className="btn-text"
            onClick={reset}
            style={{ fontSize: 13, color: "var(--ink-muted)" }}
          >
            <ArrowCounterClockwise size={12} />
            Reset
          </button>
        </motion.div>
      )}

      {/* Claude instructions */}
      {hasAnyResults && (
        <>
          <hr className="rule" />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.05 }}
            style={{
              display: "flex", alignItems: "flex-start", justifyContent: "space-between",
              gap: 32, padding: "18px 0",
            }}
          >
            <div>
              <p style={{
                fontSize: 10, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase",
                color: "var(--ink-muted)", margin: "0 0 6px", fontFamily: "var(--font-mono)",
              }}>
                Take this to Claude
              </p>
              <p style={{ fontSize: 13, color: "var(--ink-light)", margin: 0, lineHeight: 1.6 }}>
                Export the research, upload to{" "}
                <a href="https://claude.ai" target="_blank" rel="noreferrer"
                  style={{ color: "var(--teal)", textDecoration: "none" }}>claude.ai</a>
                , and use this prompt to generate a category design brief.
              </p>
            </div>
            <button
              className="btn-text"
              onClick={copyPrompt}
              style={{
                fontSize: 12, flexShrink: 0, paddingTop: 2,
                color: promptCopied ? "var(--teal-deep)" : "var(--ink-muted)",
                transition: "color 0.15s",
              }}
            >
              {promptCopied ? <Check size={12} /> : <Copy size={12} />}
              {promptCopied ? "Copied" : "Copy prompt"}
            </button>
          </motion.div>
          <hr className="rule" style={{ marginBottom: 40 }} />
        </>
      )}

      {/* Output */}
      <AnimatePresence mode="wait">
        {view === "brief" ? (
          <motion.div key="brief" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            <BriefBuilder phases={session.phases} />
          </motion.div>
        ) : (
          <motion.div key="report" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            <ReportView session={session} onRunPhase={runPhase} isRunning={isRunning} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
