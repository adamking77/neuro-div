'use client';

import { ArrowCounterClockwise } from "@phosphor-icons/react";
import { StrategyView } from "./StrategyView";
import { ToolSection } from "./app-shell";
import type { NDProfileContext, SessionState, StrategyDraft, StrategyInputs, StrategySectionKey } from "../types";

export function DistributionStrategyTool({
  session,
  ndProfileContext,
  draftHistory,
  phaseRunning,
  hasAnyResults,
  onInputChange,
  onSectionChange,
  onGenerate,
  onGenerateIntelligence,
  onDismissStrategyNotice,
  onDismissIntelligenceNotice,
  onExport,
  onExportIntelligence,
  onReset,
  onBackToResearch,
}: {
  session: SessionState;
  ndProfileContext: NDProfileContext | null;
  draftHistory: StrategyDraft[];
  phaseRunning: boolean;
  hasAnyResults: boolean;
  onInputChange: <K extends keyof StrategyInputs>(key: K, value: StrategyInputs[K]) => void;
  onSectionChange: (key: StrategySectionKey, value: string) => void;
  onGenerate: () => Promise<void>;
  onGenerateIntelligence: () => Promise<void>;
  onDismissStrategyNotice: () => void;
  onDismissIntelligenceNotice: () => void;
  onExport: () => void;
  onExportIntelligence: () => void;
  onReset: () => void;
  onBackToResearch: () => void;
}) {
  return (
    <>
      <ToolSection
        label="Distribution Strategy"
        description="You built something good but typical marketing will burn you out. This builds outreach that fits your energy and avoids the tactics that drain you."
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
      >
        {!hasAnyResults && (
          <div style={{ marginBottom: 28, maxWidth: 600 }}>
            <p style={{ fontSize: 14, color: "var(--ink-light)", lineHeight: 1.7, margin: 0 }}>
              Category Scout research is optional here. You can generate from your audience lens, constraints, and profile alone. If you add research first, the draft gets more grounded and specific.
            </p>
          </div>
        )}

        <StrategyView
          session={session}
          ndProfileContext={ndProfileContext}
          researchRunning={phaseRunning}
          onInputChange={onInputChange}
          onSectionChange={onSectionChange}
          onGenerate={onGenerate}
          onGenerateIntelligence={onGenerateIntelligence}
          onDismissStrategyNotice={onDismissStrategyNotice}
          onDismissIntelligenceNotice={onDismissIntelligenceNotice}
          onExport={onExport}
          onExportIntelligence={onExportIntelligence}
          draftHistory={draftHistory}
        />
      </ToolSection>

      {hasAnyResults && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, paddingTop: 16, flexWrap: "wrap" }}>
          <button className="btn-text" onClick={onBackToResearch} style={{ fontSize: 12, color: "var(--ink-muted)" }}>
            Back to research
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
