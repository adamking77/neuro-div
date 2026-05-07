'use client';

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowCounterClockwise, CaretDown, Check, Copy, DownloadSimple } from "@phosphor-icons/react";
import { PHASES } from "../phases";
import { ReportView } from "./ReportView";
import { RunButton, ToolSection } from "./app-shell";
import type { SessionState } from "../types";

export function CategoryScoutTool({
  session,
  phaseRunning,
  hasAnyResults,
  donePhaseCount,
  totalResultCount,
  canRun,
  onSessionChange,
  onRunAll,
  onRunPhase,
  onDownloadResearch,
  onReset,
  onOpenDistributionStrategy,
  prompt,
}: {
  session: SessionState;
  phaseRunning: boolean;
  hasAnyResults: boolean;
  donePhaseCount: number;
  totalResultCount: number;
  canRun: boolean;
  onSessionChange: (field: "problem" | "knownPlayers", value: string) => void;
  onRunAll: () => void;
  onRunPhase: (phaseId: number, startDelay?: number) => Promise<void>;
  onDownloadResearch: () => void;
  onReset: () => void;
  onOpenDistributionStrategy: () => void;
  prompt: string;
}) {
  const [promptCopied, setPromptCopied] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);

  async function handleCopyPrompt() {
    await navigator.clipboard.writeText(prompt);
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 2000);
  }

  return (
    <>
      <ToolSection
        label="Category Scout"
        description="You see patterns other people miss. Before you go all-in, check if the market agrees. Category Scout validates your idea against six angles of real evidence."
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
              onClick={onDownloadResearch}
              aria-label="Export research as Markdown"
              style={{ fontSize: 11, color: "var(--ink-muted)" }}
            >
              <DownloadSimple size={11} />
              Export
            </button>
          ) : undefined
        }
      >
        <p style={{ fontSize: 14, color: "var(--ink-light)", lineHeight: 1.7, margin: "0 0 28px", maxWidth: 560 }}>
          Describe the customer problem below. Run the research. Read the excerpts directly, export the full file, or hand it to Distribution Strategy for the next step.
        </p>

        <div className="input-grid" style={{ marginBottom: 30 }}>
          <label
            htmlFor="problem-input"
            style={{
              display: "block",
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--ink-muted)",
              marginBottom: 6,
              fontFamily: "var(--font-mono)",
            }}
          >
            Problem Statement
          </label>
          <textarea
            id="problem-input"
            value={session.problem}
            onChange={(event) => onSessionChange("problem", event.target.value)}
            placeholder="Describe the customer problem in plain language…"
            rows={4}
            style={{ marginBottom: 8 }}
          />

          <label
            htmlFor="known-players-input"
            style={{
              display: "block",
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--ink-muted)",
              marginBottom: 6,
              fontFamily: "var(--font-mono)",
              marginTop: 8,
            }}
          >
            Known Players{" "}
            <span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 400, opacity: 0.6 }}>(optional)</span>
          </label>
          <input
            id="known-players-input"
            type="text"
            value={session.knownPlayers}
            onChange={(event) => onSessionChange("knownPlayers", event.target.value)}
            placeholder="Accenture, McKinsey…"
            style={{ marginBottom: 16 }}
          />

          <RunButton canRun={canRun} isRunning={phaseRunning} hasAnyResults={hasAnyResults} onClick={onRunAll} />
        </div>

        <ReportView session={session} onRunPhase={onRunPhase as (phaseId: number, startDelay?: number) => Promise<void> | void} isRunning={phaseRunning} />
        {hasAnyResults && (
          <>
            <hr className="rule" style={{ margin: "40px 0" }} />
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: 0.05 }} style={{ padding: "20px 0" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 32 }}>
                <div>
                  <p
                    style={{
                      fontSize: 10,
                      fontWeight: 500,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "var(--ink-muted)",
                      margin: "0 0 5px",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    Export results
                  </p>
                  <p style={{ fontSize: 14, color: "var(--ink-light)", margin: 0, lineHeight: 1.7 }}>
                    Download the research file, then pass it to any AI agent using the category design brief prompt below.
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0, paddingTop: 2 }}>
                  <button
                    className="btn-text"
                    onClick={onDownloadResearch}
                    aria-label="Download research as Markdown"
                    style={{ fontSize: 12, color: "var(--ink-muted)" }}
                  >
                    <DownloadSimple size={12} />
                    Download
                  </button>
                  <button
                    className="btn-text"
                    onClick={() => void handleCopyPrompt()}
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
                    {prompt}
                  </motion.pre>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </ToolSection>

      {hasAnyResults && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, paddingTop: 16, flexWrap: "wrap" }}>
          <button className="btn-text" onClick={onOpenDistributionStrategy} style={{ fontSize: 12, color: "var(--teal-deep)" }}>
            Open Distribution Strategy
          </button>
          <button className="btn-text" onClick={onReset} aria-label="Start fresh" style={{ fontSize: 12, color: "var(--ink-muted)" }}>
            <ArrowCounterClockwise size={12} />
            Reset
          </button>
        </div>
      )}
    </>
  );
}
