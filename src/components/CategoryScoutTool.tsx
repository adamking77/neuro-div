'use client';

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowCounterClockwise, CaretDown, Check, Copy, DownloadSimple, WarningCircle } from "@phosphor-icons/react";
import { PHASES } from "../phases";
import { ReportView } from "./ReportView";
import { RunButton, ToolSection } from "./app-shell";
import { MetaLabel } from "./ui";
import type { SessionState } from "../types";

const SOLUTION_WORDS = new Set([
  "platform", "app", "tool", "software", "service", "agency", "firm",
  "help", "helping", "helps", "enable", "empower", "streamline", "optimize",
  "solution", "product", "offering", "program", "system",
]);

const GOOD_EXAMPLES = [
  "Coaches spend 20 hours a week chasing leads and still can't predict their income.",
  "Engineering teams rewrite the same API documentation every sprint because nobody trusts the source of truth.",
  "Parents of kids with ADHD get conflicting advice from every teacher and can't figure out what actually works.",
];

const BAD_EXAMPLES = [
  "I help coaches get more clients through my marketing platform.",
  "We build software that streamlines API documentation for engineering teams.",
  "An app that empowers parents of ADHD kids with personalized advice.",
];

function detectSolutionLanguage(text: string): boolean {
  const words = text.toLowerCase().split(/\s+/);
  return words.some((w) => SOLUTION_WORDS.has(w.replace(/[^a-z]/g, "")));
}

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
  const [guideOpen, setGuideOpen] = useState(false);

  async function handleCopyPrompt() {
    await navigator.clipboard.writeText(prompt);
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 2000);
  }

  const hasSolutionLanguage = detectSolutionLanguage(session.problem);
  const problemLength = session.problem.trim().length;

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
      >
        <p style={{ fontSize: 14, color: "var(--ink-light)", lineHeight: 1.7, margin: "0 0 28px", maxWidth: 560 }}>
          Describe the customer problem. Run research across 6 lenses. Export the dossier and attach it to any AI (Claude, ChatGPT) for category validation — or continue to Distribution Strategy for a go-to-market plan.
        </p>

        {/* Problem statement guide */}
        <div style={{ marginBottom: 20 }}>
          <button
            onClick={() => setGuideOpen((o) => !o)}
            className="flex items-center gap-1.5 transition-colors duration-150"
            style={{ color: "var(--ink-muted)", fontSize: 12, fontFamily: "var(--font-display)" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--ink-light)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--ink-muted)")}
          >
            <motion.span
              animate={{ rotate: guideOpen ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="inline-block"
            >
              <CaretDown size={10} weight="bold" />
            </motion.span>
            How to write a good problem statement
          </button>

          <AnimatePresence initial={false}>
            {guideOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 28 }}
                style={{ overflow: "hidden" }}
              >
                <div
                  style={{
                    marginTop: 10,
                    padding: "14px 16px",
                    border: "1px solid var(--rule)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <div>
                    <MetaLabel style={{ marginBottom: 6, color: "var(--teal)" }}>What works</MetaLabel>
                    {GOOD_EXAMPLES.map((ex, i) => (
                      <p
                        key={i}
                        style={{
                          fontSize: 13,
                          color: "var(--ink-light)",
                          lineHeight: 1.6,
                          margin: "0 0 6px",
                          fontStyle: "italic",
                        }}
                      >
                        "{ex}"
                      </p>
                    ))}
                  </div>
                  <div>
                    <MetaLabel style={{ marginBottom: 6, color: "var(--terracotta)" }}>What doesn't</MetaLabel>
                    {BAD_EXAMPLES.map((ex, i) => (
                      <p
                        key={i}
                        style={{
                          fontSize: 13,
                          color: "var(--ink-muted)",
                          lineHeight: 1.6,
                          margin: "0 0 6px",
                          fontStyle: "italic",
                          textDecoration: "line-through",
                          textDecorationColor: "rgba(196,100,80,0.3)",
                        }}
                      >
                        "{ex}"
                      </p>
                    ))}
                  </div>
                  <p style={{ fontSize: 12, color: "var(--ink-muted)", margin: 0, lineHeight: 1.55 }}>
                    Good problem statements describe a situation that makes someone angry or anxious.
                    Bad ones describe what you build or how you help.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="input-grid" style={{ marginBottom: 30 }}>
          <MetaLabel>
            <label htmlFor="problem-input" style={{ cursor: "pointer" }}>
              Problem Statement
            </label>
          </MetaLabel>
          <textarea
            id="problem-input"
            value={session.problem}
            onChange={(event) => onSessionChange("problem", event.target.value)}
            placeholder="What situation makes your customer angry or anxious? What have they already tried?"
            rows={4}
            style={{ marginBottom: 8 }}
          />

          {/* Inline quality hint */}
          {problemLength > 10 && hasSolutionLanguage && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 10 }}>
              <WarningCircle size={13} style={{ color: "var(--warning)", flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: 12, color: "var(--warning-deep)", margin: 0, lineHeight: 1.5 }}>
                This sounds like solution language. Try describing the situation that makes your customer frustrated, not what you build.
              </p>
            </div>
          )}

          <MetaLabel style={{ marginTop: 8 }}>
            <label htmlFor="known-players-input" style={{ cursor: "pointer" }}>
              Known Players{" "}
              <span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 400, opacity: 0.6 }}>(optional)</span>
            </label>
          </MetaLabel>
          <input
            id="known-players-input"
            type="text"
            value={session.knownPlayers}
            onChange={(event) => onSessionChange("knownPlayers", event.target.value)}
            placeholder="Accenture, McKinsey…"
            style={{ marginBottom: 16 }}
          />

          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <RunButton canRun={canRun} isRunning={phaseRunning} hasAnyResults={hasAnyResults} onClick={onRunAll} />
            {hasAnyResults && (
              <button
                className="btn-text"
                onClick={onDownloadResearch}
                aria-label="Export research as Markdown"
                style={{
                  fontSize: 12,
                  color: "var(--ink-muted)",
                }}
              >
                <DownloadSimple size={12} />
                Export
              </button>
            )}
          </div>
        </div>

        <ReportView session={session} onRunPhase={onRunPhase as (phaseId: number, startDelay?: number) => Promise<void> | void} isRunning={phaseRunning} />
        {hasAnyResults && (
          <>
            <hr className="rule" style={{ margin: "40px 0" }} />
            <div style={{ padding: "20px 0" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 32 }}>
                <div>
                  <MetaLabel style={{ marginBottom: 5 }}>Export results</MetaLabel>
                  <p style={{ fontSize: 14, color: "var(--ink-light)", margin: 0, lineHeight: 1.7 }}>
                    Download includes instructions. Attach it to Claude, ChatGPT, or any AI for a full category assessment — validation, gaps, and whether to proceed. Or continue to Distribution Strategy below.
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
            </div>
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
