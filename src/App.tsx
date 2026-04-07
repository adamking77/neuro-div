import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button, TextField, Label, Input, TextArea, Chip, Spinner } from "@heroui/react";
import { ArrowCounterClockwise, Notepad } from "@phosphor-icons/react";
import type { ExaResult, PhaseResult, SessionState } from "./types";
import { PHASES } from "./phases";
import { ReportView } from "./components/ReportView";
import { BriefBuilder } from "./components/BriefBuilder";
import "./index.css";

const emptyPhases = (): Record<number, PhaseResult> =>
  Object.fromEntries(PHASES.map((p) => [p.id, { status: "idle", results: [] }]));

export type MainView = "report" | "brief";

export default function App() {
  const [session, setSession] = useState<SessionState>({
    problem: "", knownPlayers: "", phases: emptyPhases(),
  });
  const [view, setView] = useState<MainView>("report");

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

  const isRunning = Object.values(session.phases).some((p) => p.status === "running");
  const hasAnyResults = Object.values(session.phases).some((p) => p.results.length > 0);
  const completedCount = Object.values(session.phases).filter((p) => p.status === "done").length;
  const canRun = !!session.problem.trim() && !isRunning;

  return (
    <>
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "48px 32px 80px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 40 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{ width: 28, height: 22, position: "relative", flexShrink: 0 }}>
                {[0, 8, 16].map((offset, i) => (
                  <div key={i} style={{
                    position: "absolute", top: 0, left: offset,
                    width: 14, height: 14,
                    borderRadius: "50%",
                    border: "1.5px solid var(--teal)",
                    opacity: 1 - i * 0.2,
                  }} />
                ))}
              </div>
              <span style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em" }}>
                Category Scout
              </span>
            </div>
            <p style={{ fontSize: 14, color: "var(--ink-muted)", lineHeight: 1.55, maxWidth: 500, margin: 0 }}>
              Six research phases in parallel — who has the pain, who's solving it,
              how the market is structured, and how people talk about it.
              Powered by Exa's semantic search via a local Rust backend.
            </p>
          </div>

          {hasAnyResults && (
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button
                onClick={() => setView(view === "brief" ? "report" : "brief")}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "7px 14px", borderRadius: 8, fontSize: 13, fontWeight: 500,
                  fontFamily: "var(--font-display)", cursor: "pointer",
                  background: view === "brief" ? "rgba(91, 138, 138, 0.1)" : "rgba(26, 26, 24, 0.05)",
                  border: `1px solid ${view === "brief" ? "rgba(91, 138, 138, 0.3)" : "rgba(26, 26, 24, 0.1)"}`,
                  color: view === "brief" ? "var(--teal-deep)" : "var(--ink-light)",
                }}
              >
                <Notepad size={14} />
                Brief
                {completedCount > 0 && (
                  <Chip size="sm" color="success" variant="soft" className="text-[10px] h-4 px-1.5">
                    {completedCount}/6
                  </Chip>
                )}
              </button>
              <Button onPress={reset} variant="ghost" size="sm"
                style={{ color: "var(--ink-muted)", fontFamily: "var(--font-display)" }}>
                <ArrowCounterClockwise size={13} />
                Reset
              </Button>
            </div>
          )}
        </div>

        {/* Input card */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 28 }}
          className="card"
          style={{ marginBottom: 20 }}
        >
          <div className="card-body" style={{ display: "flex", gap: 20, alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <TextField value={session.problem} onChange={(v) => setSession((s) => ({ ...s, problem: v }))} className="w-full">
                <Label style={{
                  display: "block", fontSize: 11, fontWeight: 500,
                  letterSpacing: "0.1em", textTransform: "uppercase",
                  color: "var(--ink-muted)", marginBottom: 8, fontFamily: "var(--font-display)",
                }}>
                  Problem statement
                </Label>
                <TextArea
                  placeholder="Describe the customer problem in plain language…"
                  rows={4}
                  className="resize-none"
                  style={{ fontSize: 15, fontFamily: "var(--font-display)", color: "var(--ink)" }}
                />
              </TextField>
            </div>

            <div style={{ width: 210, display: "flex", flexDirection: "column", gap: 16 }}>
              <TextField value={session.knownPlayers} onChange={(v) => setSession((s) => ({ ...s, knownPlayers: v }))} className="w-full">
                <Label style={{
                  display: "block", fontSize: 11, fontWeight: 500,
                  letterSpacing: "0.1em", textTransform: "uppercase",
                  color: "var(--ink-muted)", marginBottom: 8, fontFamily: "var(--font-display)",
                }}>
                  Known players <span style={{ opacity: 0.5, textTransform: "none", letterSpacing: 0, fontWeight: 400 }}>— optional</span>
                </Label>
                <Input placeholder="Accenture, McKinsey…"
                  style={{ fontSize: 15, fontFamily: "var(--font-display)", color: "var(--ink)" }} />
              </TextField>

              <Button
                onPress={runAll}
                isDisabled={!canRun}
                size="lg"
                className="w-full"
                style={canRun ? {
                  background: "rgba(91, 138, 138, 0.1)",
                  border: "1px solid rgba(91, 138, 138, 0.35)",
                  color: "var(--teal-deep)",
                  fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15,
                } : { fontFamily: "var(--font-display)", fontSize: 15 }}
              >
                {isRunning
                  ? <><Spinner size="sm" color="current" /><span style={{ marginLeft: 8 }}>Running…</span></>
                  : hasAnyResults ? "Re-run All" : "Run"
                }
              </Button>
            </div>
          </div>
        </motion.div>

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
    </>
  );
}
