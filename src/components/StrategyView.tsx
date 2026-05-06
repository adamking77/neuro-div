import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton, Spinner } from "@heroui/react";
import { ArrowClockwise, CaretDown, Check, DownloadSimple, WarningCircle, X } from "@phosphor-icons/react";
import {
  STRATEGY_SECTIONS,
  getCompletedResearchCount,
  getStrategyReadiness,
  hasCompleteStrategyDraft,
  isStructuredSections,
  renderAgentBrief,
} from "../lib/strategy";
import type {
  NDProfileContext,
  SessionState,
  StrategyCitation,
  StrategyDraft,
  ExistingAsset,
  StrategyInputs,
  StrategySectionKey,
  StrategySectionContent,
} from "../types";
import { IntelligenceView } from "./IntelligenceView";
import { AgentBriefView } from "./AgentBriefView";
import { StrategyScorecard } from "./StrategyScorecard";
import { StrategySectionCard } from "./StrategySectionCard";

interface Props {
  session: SessionState;
  ndProfileContext: NDProfileContext | null;
  researchRunning: boolean;
  onInputChange: <K extends keyof StrategyInputs>(key: K, value: StrategyInputs[K]) => void;
  onSectionChange: (key: StrategySectionKey, value: string) => void;
  onGenerate: () => void;
  onGenerateIntelligence: () => void;
  onExport: () => void;
  onExportIntelligence: () => void;
  draftHistory: StrategyDraft[];
}


const SKELETON_ROWS = [
  [75, 90, 65, 80],
  [85, 70, 90, 60],
  [70, 85, 75, 65],
  [80, 60, 85, 70],
  [65, 80, 70, 90],
  [90, 75, 60, 80],
];

const OUTREACH_LABELS: Record<string, string> = {
  "inbound-only": "Inbound",
  "warm-intro-ok": "Warm intro",
  "async-email-ok": "Async email",
  "live-calls-ok": "Live calls",
};

const CONTENT_LABELS: Record<string, string> = {
  writing: "Writing",
  "short-video": "Video",
  audio: "Audio",
  design: "Design",
  interactive: "Interactive",
  other: "Other",
  none: "No content",
};

type StrategyTab = "draft" | "intelligence" | "agent";

export function StrategyView({
  session,
  ndProfileContext,
  researchRunning,
  onInputChange,
  onSectionChange,
  onGenerate,
  onGenerateIntelligence,
  onExport,
  onExportIntelligence,
}: Props) {
  const draft = hasCompleteStrategyDraft(session.strategyDraft) ? session.strategyDraft : null;
  const hasDraft = !!draft;
  const [drawerOpen, setDrawerOpen] = useState(!hasDraft);
  const [activeTab, setActiveTab] = useState<StrategyTab>("draft");
  const prevDraftAt = useRef<string | null>(draft?.generatedAt ?? null);

  useEffect(() => {
    const current = hasCompleteStrategyDraft(session.strategyDraft) ? session.strategyDraft.generatedAt : null;
    if (current && current !== prevDraftAt.current) {
      setDrawerOpen(false);
      prevDraftAt.current = current;
    }
  }, [session.strategyDraft?.generatedAt]);

  const readiness = getStrategyReadiness(session.phases);
  const completedResearch = getCompletedResearchCount(session.phases);
  const audienceReady = session.strategyInputs.audienceLens.trim().length > 0;
  const strategyRunning =
    session.strategyStatus === "researching" || session.strategyStatus === "drafting";
  const intelligenceRunning =
    session.intelligenceStatus === "researching" || session.intelligenceStatus === "drafting";

  const isRunning = activeTab === "intelligence"
    ? intelligenceRunning
    : strategyRunning;
  const canGenerate = readiness.canGenerate && audienceReady && !researchRunning && !isRunning;

  const draftButtonLabel =
    session.strategyStatus === "researching"
      ? "Researching…"
      : session.strategyStatus === "drafting"
        ? "Drafting…"
        : hasDraft
          ? session.strategyDirty
            ? "Regenerate"
            : "Rebuild"
          : "Generate draft";

  const intelligenceButtonLabel =
    session.intelligenceStatus === "researching"
      ? "Researching…"
      : session.intelligenceStatus === "drafting"
        ? "Synthesizing…"
        : session.intelligenceBrief
          ? "Regenerate brief"
          : "Generate intelligence brief";

  const buttonLabel = activeTab === "intelligence"
    ? intelligenceButtonLabel
    : draftButtonLabel;

  const armTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [isArmed, setIsArmed] = useState(false);

  const handleGenerate = () => {
    const alreadyHasDraft = activeTab === "intelligence" ? !!session.intelligenceBrief : hasDraft;
    if (alreadyHasDraft && !isArmed) {
      setIsArmed(true);
      clearTimeout(armTimerRef.current);
      armTimerRef.current = setTimeout(() => setIsArmed(false), 5000);
      return;
    }
    clearTimeout(armTimerRef.current);
    setIsArmed(false);
    if (activeTab === "intelligence") {
      onGenerateIntelligence();
    } else {
      onGenerate();
    }
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 24,
          marginBottom: 28,
        }}
      >
        <div>
          <p
            style={{
              fontSize: 13,
              color: "var(--ink-muted)",
              lineHeight: 1.65,
              maxWidth: 580,
              margin: 0,
            }}
          >
            {activeTab === "draft"
              ? completedResearch > 0
                ? "Research is attached. Set what you can and can't do — the draft uses all of it."
                : "You can generate from founder inputs alone. Research is optional here — it makes the draft more grounded, but it is not required."
              : activeTab === "intelligence"
                ? "A structured read of what the research found — where you stand, who you're up against, where to show up, and what the next 90 days could look like."
                : "Instructions for your agent — not a task list. Sets up a session check-in, surfaces one move at a time matched to what you actually have available, and includes hard limits the agent can't override. Paste it in. Invitations, not assignments."}</p>
        </div>

        {activeTab === "draft" && hasDraft && (
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
            <button
              className="btn-text"
              onClick={onExport}
              style={{ fontSize: 13, color: "var(--ink-muted)" }}
            >
              <DownloadSimple size={13} />
              Export
            </button>
          </div>
        )}
        {activeTab === "intelligence" && session.intelligenceBrief && (
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
            <button
              className="btn-text"
              onClick={onExportIntelligence}
              style={{ fontSize: 13, color: "var(--ink-muted)" }}
            >
              <DownloadSimple size={13} />
              Export
            </button>
          </div>
        )}

      </div>

      {/* Tab Toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{ display: "inline-flex", gap: 2, border: "1px solid var(--rule)", padding: 3, borderRadius: 999 }}>
          <TabPill label="Strategy Draft" active={activeTab === "draft"} onClick={() => setActiveTab("draft")} />
          <TabPill label="Intelligence Brief" active={activeTab === "intelligence"} onClick={() => setActiveTab("intelligence")} />
          <TabPill label="Agent Brief" active={activeTab === "agent"} onClick={() => setActiveTab("agent")} />
        </div>
        {session.intelligenceBrief && activeTab === "intelligence" && (
          <span
            title="Generated by Kimi K2.6"
            style={{
              fontSize: 9,
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--ink-muted)",
              opacity: 0.5,
              cursor: "default",
            }}
          >
            K2.6
          </span>
        )}
      </div>

      <hr className="rule" />

      <ConfigDrawer
        inputs={session.strategyInputs}
        ndProfileContext={ndProfileContext}
        readiness={readiness}
        completedResearch={completedResearch}
        audienceReady={audienceReady}
        strategyRunning={isRunning}
        strategyStatus={activeTab === "draft" ? session.strategyStatus : session.intelligenceStatus}
        strategyDirty={session.strategyDirty}
        draftExists={hasDraft}
        researchRunning={researchRunning}
        error={activeTab === "draft" ? session.strategyError : session.intelligenceError}
        canGenerate={canGenerate}
        buttonLabel={isArmed ? "Replace — confirm?" : buttonLabel}
        isArmed={isArmed}
        isOpen={drawerOpen}
        onToggle={() => setDrawerOpen((o) => !o)}
        onInputChange={onInputChange}
        onGenerate={handleGenerate}
      />

      <hr className="rule" style={{ marginBottom: 32 }} />

      {activeTab === "draft" && (
        <StrategyContent
          key={draft?.generatedAt ?? "empty"}
          session={session}
          strategyRunning={strategyRunning}
          readiness={readiness}
          onSectionChange={onSectionChange}
          onGenerate={handleGenerate}
        />
      )}
      {activeTab === "intelligence" && (
        <IntelligenceView
          brief={session.intelligenceBrief}
          status={session.intelligenceStatus}
          error={session.intelligenceError}
        />
      )}
      {activeTab === "agent" && (
        <AgentBriefView
          markdown={renderAgentBrief(session.strategyDraft, session.strategyInputs, session.problem, ndProfileContext)}
        />
      )}
    </div>
  );
}

function ConfigDrawer({
  inputs,
  ndProfileContext,
  readiness,
  completedResearch,
  audienceReady,
  strategyRunning,
  strategyStatus,
  strategyDirty,
  draftExists,
  researchRunning,
  error,
  canGenerate,
  buttonLabel,
  isArmed,
  isOpen,
  onToggle,
  onInputChange,
  onGenerate,
}: {
  inputs: StrategyInputs;
  ndProfileContext: NDProfileContext | null;
  readiness: ReturnType<typeof getStrategyReadiness>;
  completedResearch: number;
  audienceReady: boolean;
  strategyRunning: boolean;
  strategyStatus: SessionState["strategyStatus"];
  strategyDirty: boolean;
  draftExists: boolean;
  researchRunning: boolean;
  error?: string;
  canGenerate: boolean;
  buttonLabel: string;
  isArmed?: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onInputChange: <K extends keyof StrategyInputs>(key: K, value: StrategyInputs[K]) => void;
  onGenerate: () => void;
}) {
  const audienceSnippet = inputs.audienceLens.trim().slice(0, 52);
  const audienceTruncated =
    inputs.audienceLens.trim().length > 52
      ? `${audienceSnippet}…`
      : audienceSnippet;

  return (
    <div>
      {/* Summary bar */}
      <div
        style={{
          padding: "22px 0",
          display: "flex",
          alignItems: "center",
          gap: 18,
          rowGap: 20,
          flexWrap: "wrap",
        }}
      >
        {completedResearch > 0 && (
          <>
            <ReadinessIndicators readiness={readiness} completedResearch={completedResearch} />
            <span
              style={{
                display: "inline-block",
                width: 1,
                height: 14,
                background: "var(--rule)",
                flexShrink: 0,
              }}
            />
          </>
        )}

        {audienceReady ? (
          <span
            style={{
              fontSize: 13,
              color: "var(--ink-light)",
              fontStyle: "italic",
              flex: 1,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            "{audienceTruncated}"
          </span>
        ) : (
          <span style={{ fontSize: 13, color: "var(--ink-muted)", flex: 1 }}>
            Add your audience and constraints to generate
          </span>
        )}

        {audienceReady && (
          <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
            <MiniPill label={inputs.teamSize === "solo" ? "Solo" : "Small team"} />
            <MiniPill label={OUTREACH_LABELS[inputs.outreachTolerance] ?? inputs.outreachTolerance} />
            {ndProfileContext && <MiniPill label="ND profile" />}
            {inputs.peerCollaborationOk && <MiniPill label="Peer collaboration" />}
            {inputs.contentMode.length > 0 && !inputs.contentMode.includes("none") && (
              <MiniPill label={inputs.contentMode.map((m) => CONTENT_LABELS[m] ?? m).join(", ")} />
            )}
          </div>
        )}

        <button
          className="btn-text"
          onClick={onToggle}
          aria-expanded={isOpen}
          style={{ fontSize: 12, color: "var(--ink-muted)", flexShrink: 0, gap: 4 }}
        >
          <motion.span
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            style={{ display: "inline-flex" }}
          >
            <CaretDown size={11} />
          </motion.span>
          {isOpen ? "Collapse" : "Constraints"}
        </button>

        {!isOpen && (
          <GenerateButton
            canGenerate={canGenerate}
            buttonLabel={buttonLabel}
            isArmed={isArmed}
            strategyRunning={strategyRunning}
            onGenerate={onGenerate}
          />
        )}
      </div>

      {/* Status lines */}
      {draftExists && strategyDirty && (
        <p
          style={{
            fontSize: 12,
            color: "var(--teal-deep)",
            margin: "0 0 6px",
            lineHeight: 1.5,
          }}
        >
          Inputs changed since this draft — regenerate when ready.
        </p>
      )}
      {researchRunning && (
        <p
          style={{
            fontSize: 12,
            color: "var(--ink-muted)",
            margin: "0 0 6px",
            lineHeight: 1.5,
          }}
        >
          Research is still running. Wait for it to settle before drafting.
        </p>
      )}
      {completedResearch === 0 && !researchRunning && (
        <p
          style={{
            fontSize: 12,
            color: "var(--ink-muted)",
            margin: "0 0 6px",
            lineHeight: 1.5,
          }}
        >
          No Category Scout research is attached. You can still generate now; adding Problem Cartography, Solution Landscape, and Evidence Mining later will make the output more specific.
        </p>
      )}
      {error && (
        <p
          style={{
            fontSize: 12,
            color: "var(--terracotta)",
            margin: "0 0 6px",
            lineHeight: 1.5,
          }}
        >
          {error}
        </p>
      )}

      {/* Pipeline indicator */}
      {strategyRunning && <PipelineIndicator status={strategyStatus} />}

      {/* Expanded form */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 30 }}
            style={{ overflow: "hidden" }}
          >
            <InputForm
              inputs={inputs}
              canGenerate={canGenerate}
              buttonLabel={buttonLabel}
              strategyRunning={strategyRunning}
              onInputChange={onInputChange}
              onGenerate={onGenerate}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ReadinessIndicators({
  readiness,
  completedResearch,
}: {
  readiness: ReturnType<typeof getStrategyReadiness>;
  completedResearch: number;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, flexWrap: "wrap" }}>
      {readiness.missingSuggested.map(({ id, label }) => (
        <div
          key={id}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "2px 7px",
            borderRadius: 999,
            border: "1px solid var(--rule)",
            background: "transparent",
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: 6,
              height: 6,
              borderRadius: "50%",
              border: "1px solid var(--ink-muted)",
              opacity: 0.3,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 10,
              fontFamily: "var(--font-display)",
              color: "var(--ink-muted)",
              opacity: 0.5,
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </span>
        </div>
      ))}
      <span
        style={{
          display: "inline-block",
          width: 1,
          height: 12,
          background: "var(--rule)",
          margin: "0 2px",
        }}
      />
      <span className="mono" style={{ fontSize: 10, color: "var(--ink-muted)" }}>
        {completedResearch}/6 phases
      </span>
      <span
        style={{
          fontSize: 10,
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          padding: "2px 7px",
          borderRadius: 999,
          background: readiness.confidence === "strong" ? "rgba(91, 138, 138, 0.12)" : "rgba(196, 164, 132, 0.14)",
          color: readiness.confidence === "strong" ? "var(--teal)" : "#966f00",
        }}
      >
        {readiness.confidence}
      </span>
    </div>
  );
}

function MiniPill({ label }: { label: string }) {
  return (
    <span
      style={{
        fontSize: 9,
        fontFamily: "var(--font-mono)",
        color: "var(--ink-muted)",
        border: "1px solid var(--rule)",
        padding: "1px 6px",
        borderRadius: 999,
        letterSpacing: "0.03em",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

function GenerateButton({
  canGenerate,
  buttonLabel,
  isArmed,
  strategyRunning,
  onGenerate,
}: {
  canGenerate: boolean;
  buttonLabel: string;
  isArmed?: boolean;
  strategyRunning: boolean;
  onGenerate: () => void;
}) {
  return (
    <button
      onClick={canGenerate ? onGenerate : undefined}
      disabled={!canGenerate}
      style={{
        fontFamily: "var(--font-display)",
        fontSize: 15,
        fontWeight: 600,
        letterSpacing: "0.01em",
        padding: "10px 52px",
        border: "none",
        borderRadius: 999,
        cursor: canGenerate ? "pointer" : "not-allowed",
        background: !canGenerate
          ? "rgba(91, 138, 138, 0.4)"
          : isArmed
            ? "var(--ink-light)"
            : "var(--teal)",
        color: "#fff",
        transition: "background 0.15s",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        flexShrink: 0,
      }}
    >
      {strategyRunning ? (
        <>
          <Spinner size="sm" color="current" />
          <span>{buttonLabel}</span>
        </>
      ) : (
        buttonLabel
      )}
    </button>
  );
}

function PipelineIndicator({ status }: { status: SessionState["strategyStatus"] }) {
  const exaDone = status === "drafting";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 12px",
        background: "rgba(91, 138, 138, 0.07)",
        marginBottom: 8,
      }}
    >
      <PipelineStep label="Exa research" active={!exaDone} done={exaDone} />
      <div
        style={{
          flex: 1,
          height: 1,
          background: "var(--rule)",
          opacity: exaDone ? 1 : 0.4,
        }}
      />
      <PipelineStep label="AI synthesis" active={exaDone} done={false} />
    </div>
  );
}

function PipelineStep({
  label,
  active,
  done,
}: {
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
      {done ? (
        <Check size={9} weight="bold" style={{ color: "var(--teal)" }} />
      ) : active ? (
        <span className="dot dot-running" />
      ) : (
        <span
          style={{
            display: "inline-block",
            width: 6,
            height: 6,
            borderRadius: "50%",
            border: "1px solid var(--ink-muted)",
            opacity: 0.3,
          }}
        />
      )}
      <span
        className="mono"
        style={{
          fontSize: 10,
          color: active || done ? "var(--ink)" : "var(--ink-muted)",
          opacity: active || done ? 1 : 0.5,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function InputForm({
  inputs,
  canGenerate,
  buttonLabel,
  strategyRunning,
  onInputChange,
  onGenerate,
}: {
  inputs: StrategyInputs;
  canGenerate: boolean;
  buttonLabel: string;
  strategyRunning: boolean;
  onInputChange: <K extends keyof StrategyInputs>(key: K, value: StrategyInputs[K]) => void;
  onGenerate: () => void;
}) {
  return (
    <div style={{ padding: "10px 0 38px" }}>
      <div style={{ marginBottom: 42 }}>
        <GroupLabel label="Audience" />
        <FieldLabel label="Who are you trying to reach, and what's going on for them when they find you?" required />
        <textarea
          className="strategy-input"
          value={inputs.audienceLens}
          onChange={(e) => onInputChange("audienceLens", e.target.value)}
          rows={3}
          placeholder="What problem are they living with? What have they already tried? What makes them ready to pay attention?"
        />
      </div>

      <GroupLabel label="How you operate" />

      <div
        className="constraints-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          columnGap: 30,
          rowGap: 30,
          marginBottom: 38,
        }}
      >
        <SegmentedControl
          label="Your Team"
          value={inputs.teamSize}
          options={[
            { value: "solo", label: "Solo" },
            { value: "small-team", label: "Small team" },
          ]}
          onChange={(v) => onInputChange("teamSize", v as StrategyInputs["teamSize"])}
        />
        <SegmentedControl
          label="Marketing Budget"
          value={inputs.budgetBand}
          options={[
            { value: "none", label: "None" },
            { value: "low", label: "Low" },
            { value: "moderate", label: "Moderate" },
          ]}
          onChange={(v) => onInputChange("budgetBand", v as StrategyInputs["budgetBand"])}
        />
        <SegmentedControl
          label="Social Posting"
          value={inputs.socialPostingTolerance}
          options={[
            { value: "avoid", label: "Avoid" },
            { value: "limited", label: "Limited" },
            { value: "comfortable", label: "OK" },
          ]}
          onChange={(v) =>
            onInputChange(
              "socialPostingTolerance",
              v as StrategyInputs["socialPostingTolerance"],
            )
          }
        />
        <div>
          <SegmentedControl
            label="Outreach Preferences"
            value={inputs.outreachTolerance}
            options={[
              { value: "inbound-only", label: "Inbound" },
              { value: "warm-intro-ok", label: "Warm intro" },
              { value: "async-email-ok", label: "Async email" },
              { value: "live-calls-ok", label: "Live calls" },
            ]}
            onChange={(v) => onInputChange("outreachTolerance", v as StrategyInputs["outreachTolerance"])}
          />
          <button
            onClick={() => onInputChange("peerCollaborationOk", !inputs.peerCollaborationOk)}
            style={{
              border: `1px solid ${inputs.peerCollaborationOk ? "var(--teal)" : "var(--rule)"}`,
              background: inputs.peerCollaborationOk ? "var(--teal)" : "transparent",
              color: inputs.peerCollaborationOk ? "#fff" : "var(--ink-muted)",
              borderRadius: 999,
              fontSize: 11,
              fontFamily: "var(--font-display)",
              padding: "5px 10px",
              cursor: "pointer",
              transition: "all 0.15s",
              lineHeight: 1.35,
              marginTop: 10,
            }}
          >
            Peer collaboration
          </button>
          <p style={{ fontSize: 11, color: "var(--ink-muted)", lineHeight: 1.55, margin: "8px 0 0" }}>
            Content swaps, podcast guesting, cross-promotion with other operators.
          </p>
        </div>
      </div>

      <div
        className="constraints-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          columnGap: 30,
          rowGap: 30,
          marginBottom: 38,
        }}
      >
        <div>
          <FieldLabel label="Weekly Capacity" />
          <input
            type="text"
            className="strategy-input"
            value={inputs.weeklyCapacity}
            onChange={(e) => onInputChange("weeklyCapacity", e.target.value)}
            placeholder="E.g. 4 focused hours"
          />
        </div>
        <div>
          <FieldLabel label="Formats You'll Produce" />
          <MultiPillSelector
            values={inputs.contentMode}
            options={[
              { value: "writing", label: "Writing" },
              { value: "short-video", label: "Video" },
              { value: "audio", label: "Audio" },
              { value: "design", label: "Design" },
              { value: "interactive", label: "Interactive" },
              { value: "other", label: "Other" },
              { value: "none", label: "None" },
            ]}
            onChange={(next) => onInputChange("contentMode", next as StrategyInputs["contentMode"])}
          />
          {inputs.contentMode.includes("other") && (
            <input
              type="text"
              className="strategy-input"
              value={inputs.contentModeOther}
              onChange={(e) => onInputChange("contentModeOther", e.target.value)}
              placeholder="What format would you rather make?"
              style={{ marginTop: 12 }}
            />
          )}
        </div>
      </div>

      <div style={{ marginBottom: 38 }}>
        <FieldLabel label="Existing Work And Assets" />
        <AssetRowEditor
          assets={inputs.existingAssets}
          onChange={(assets) => onInputChange("existingAssets", assets)}
        />
      </div>

      <div style={{ marginBottom: 38 }}>
        <FieldLabel label="Channel Avoidances" />
        <textarea
          value={inputs.channelAvoidances}
          onChange={(e) => onInputChange("channelAvoidances", e.target.value)}
          rows={3}
          placeholder="What you won't do. E.g. LinkedIn, live events, cold calls."
        />
      </div>

      <div style={{ marginBottom: 38 }}>
        <GroupLabel label="How you work" />
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div>
            <FieldLabel label="What have you already tried to get your work out there?" />
            <textarea
              className="strategy-input"
              value={inputs.previousAttempts ?? ""}
              onChange={(e) => onInputChange("previousAttempts", e.target.value)}
              rows={3}
              placeholder="What happened? What made you stop? Even partial attempts count."
            />
          </div>
          <div>
            <FieldLabel label="What kinds of tasks make you want to disappear?" />
            <textarea
              className="strategy-input"
              value={inputs.avoidanceTasks ?? ""}
              onChange={(e) => onInputChange("avoidanceTasks", e.target.value)}
              rows={2}
              placeholder="Replying to people? Being 'on' for extended periods? Formatting things?"
            />
          </div>
          <div>
            <FieldLabel label="When do you actually feel like working on this?" />
            <textarea
              className="strategy-input"
              value={inputs.activationWindows ?? ""}
              onChange={(e) => onInputChange("activationWindows", e.target.value)}
              rows={2}
              placeholder="Not when you think you should — when you actually sit down and go."
            />
          </div>
          <div>
            <FieldLabel label="When do you know you'll be unavailable?" />
            <textarea
              className="strategy-input"
              value={inputs.unavailablePeriods ?? ""}
              onChange={(e) => onInputChange("unavailablePeriods", e.target.value)}
              rows={2}
              placeholder="Recovery days, burnout periods, times when nothing gets done."
            />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 34 }}>
        <GenerateButton
          canGenerate={canGenerate}
          buttonLabel={buttonLabel}
          strategyRunning={strategyRunning}
          onGenerate={onGenerate}
        />
      </div>
    </div>
  );
}

function AssetRowEditor({
  assets,
  onChange,
}: {
  assets: ExistingAsset[];
  onChange: (assets: ExistingAsset[]) => void;
}) {
  const rows = assets.length > 0 ? assets : [{ name: "", url: "", description: "" }];

  const updateAsset = (index: number, key: keyof ExistingAsset, value: string) => {
    onChange(rows.map((asset, assetIndex) =>
      assetIndex === index ? { ...asset, [key]: value } : asset,
    ));
  };

  const addAsset = () => {
    onChange([...rows, { name: "", url: "", description: "" }]);
  };

  const removeAsset = (index: number) => {
    const next = rows.filter((_, assetIndex) => assetIndex !== index);
    onChange(next.length > 0 ? next : [{ name: "", url: "", description: "" }]);
  };

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {rows.map((asset, index) => {
          const isOnlyEmptyRow = rows.length === 1 &&
            !asset.name.trim() &&
            !asset.url.trim() &&
            !asset.description.trim();

          return (
            <div
              key={index}
              className="asset-row-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 2fr 32px",
                gap: 12,
                alignItems: "start",
                position: "relative",
              }}
            >
              <input
                type="text"
                className="strategy-input"
                value={asset.name}
                onChange={(e) => updateAsset(index, "name", e.target.value)}
                placeholder="GenZen Solutions"
                aria-label={`Asset ${index + 1} name`}
              />
              <input
                type="text"
                className="strategy-input"
                value={asset.url}
                onChange={(e) => updateAsset(index, "url", e.target.value)}
                placeholder="genzen.solutions"
                aria-label={`Asset ${index + 1} URL`}
              />
              <input
                type="text"
                className="strategy-input"
                value={asset.description}
                onChange={(e) => updateAsset(index, "description", e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && index === rows.length - 1) {
                    e.preventDefault();
                    addAsset();
                  }
                }}
                placeholder="counter-exploitation agency, 6 years running"
                aria-label={`Asset ${index + 1} description`}
              />
              {!isOnlyEmptyRow && (
                <button
                  className="btn-text asset-row-remove"
                  onClick={() => removeAsset(index)}
                  aria-label={`Remove asset ${index + 1}`}
                  style={{
                    width: 28,
                    height: 28,
                    justifyContent: "center",
                    color: "var(--ink-muted)",
                    border: "1px solid var(--rule)",
                    borderRadius: 999,
                  }}
                >
                  <X size={11} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <button
        className="btn-text"
        onClick={addAsset}
        style={{ fontSize: 12, color: "var(--teal-deep)", marginTop: 14 }}
      >
        + Add asset
      </button>
    </div>
  );
}

function SegmentedControl({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <FieldLabel label={label} />
      <div
        style={{
          display: "flex",
          border: "1px solid var(--rule)",
          borderRadius: 999,
          overflow: "hidden",
          minHeight: 32,
        }}
      >
        {options.map((option, index) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              style={{
                flex: 1,
                border: "none",
                borderRight:
                  index < options.length - 1 ? "1px solid var(--rule)" : "none",
                background: active ? "var(--teal)" : "transparent",
                color: active ? "#fff" : "var(--ink-muted)",
                fontSize: 11,
                fontFamily: "var(--font-display)",
                padding: "6px 8px",
                cursor: "pointer",
                transition: "background 0.15s, color 0.15s",
                lineHeight: 1.25,
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MultiPillSelector({
  values,
  options,
  onChange,
}: {
  values: string[];
  options: Array<{ value: string; label: string }>;
  onChange: (values: string[]) => void;
}) {
  function toggle(value: string) {
    if (value === "none") {
      onChange(values.includes("none") ? [] : ["none"]);
      return;
    }
    const without = values.filter((v) => v !== "none" && v !== value);
    onChange(values.includes(value) ? without : [...without, value]);
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingTop: 5 }}>
      {options.map((option) => {
        const active = values.includes(option.value);
        return (
          <button
            key={option.value}
            onClick={() => toggle(option.value)}
            style={{
              border: `1px solid ${active ? "var(--teal)" : "var(--rule)"}`,
              background: active ? "var(--teal)" : "transparent",
              color: active ? "#fff" : "var(--ink-muted)",
              borderRadius: 999,
              fontSize: 11,
              fontFamily: "var(--font-display)",
              padding: "5px 10px",
              cursor: "pointer",
              transition: "all 0.15s",
              lineHeight: 1.35,
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function StrategyContent({
  session,
  strategyRunning,
  readiness,
  onSectionChange,
  onGenerate,
}: {
  session: SessionState;
  strategyRunning: boolean;
  readiness: ReturnType<typeof getStrategyReadiness>;
  onSectionChange: (key: StrategySectionKey, value: string) => void;
  onGenerate: () => void;
}) {
  const [editedSections, setEditedSections] = useState<Set<StrategySectionKey>>(new Set());

  const handleSectionChange = (key: StrategySectionKey, value: string) => {
    setEditedSections((prev) => new Set(prev).add(key));
    onSectionChange(key, value);
  };

  const draft = hasCompleteStrategyDraft(session.strategyDraft) ? session.strategyDraft : null;
  const structured = draft ? isStructuredSections(draft.sections) : false;

  if (!draft && strategyRunning) {
    return <StrategyLoadingState />;
  }

  if (!draft && !readiness.canGenerate) {
    return (
      <EmptyStrategyState
        title="Complete at least 2 research phases to generate a draft."
        body="Problem Cartography, Solution Landscape, and Evidence Mining produce the strongest output — but you can start from what you have."
      />
    );
  }

  if (!draft && readiness.canGenerate) {
    return (
      <EmptyStrategyState
        title={session.strategyDraft ? "Draft needs to be rebuilt." : "Research is ready."}
        body={
          session.strategyDraft
            ? "The saved draft is missing section text. Generate again to replace it with a complete draft."
            : "Add your audience and constraints above, then generate the draft."
        }
        actionLabel="Generate draft"
        onAction={onGenerate}
      />
    );
  }

  if (!draft) return null;

  return (
    <div>
      {draft.scorecard && <StrategyScorecard scorecard={draft.scorecard} />}

      {draft.warnings.length > 0 && (
        <div
          style={{
            marginBottom: 32,
            background: "rgba(180, 107, 88, 0.04)",
            border: "1px solid rgba(180, 107, 88, 0.18)",
            padding: "14px 16px",
          }}
        >
          <p
            style={{
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--terracotta)",
              margin: "0 0 10px",
              fontFamily: "var(--font-mono)",
            }}
          >
            Warnings
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {draft.warnings.map((warning, index) => (
              <div key={index} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <WarningCircle
                  size={13}
                  style={{ color: "var(--terracotta)", flexShrink: 0, marginTop: 2 }}
                />
                <p style={{ fontSize: 13, color: "var(--ink-light)", lineHeight: 1.6, margin: 0 }}>
                  {warning}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {STRATEGY_SECTIONS.map((section, index) => {
        const sectionCitations = draft.citations.filter((c) => c.section === section.key);
        return (
          <div key={section.key}>
            {structured ? (
              <StrategySectionCard
                section={section}
                index={index}
                content={draft.sections[section.key] as StrategySectionContent}
                citations={sectionCitations}
              />
            ) : (
              <SectionCard
                section={section}
                index={index}
                value={draft.sections[section.key] as string}
                citations={sectionCitations}
                isEdited={editedSections.has(section.key)}
                onEdit={(value) => handleSectionChange(section.key, value)}
              />
            )}
            {index < STRATEGY_SECTIONS.length - 1 && (
              <hr className="rule" style={{ margin: "36px 0" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StrategyLoadingState() {
  return (
    <div>
      {SKELETON_ROWS.map((widths, index) => (
        <div key={index}>
          <StrategySkeletonCard index={index} widths={widths} />
          {index < SKELETON_ROWS.length - 1 && (
            <hr className="rule" style={{ margin: "36px 0" }} />
          )}
        </div>
      ))}
    </div>
  );
}

function StrategySkeletonCard({ index, widths }: { index: number; widths: number[] }) {
  return (
    <div style={{ opacity: 1 - index * 0.07 }}>
      <div
        style={{
          marginBottom: 14,
        }}
      >
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
          <Skeleton className="rounded" style={{ width: 18, height: 8 }} />
          <Skeleton className="rounded" style={{ width: 70 + index * 12, height: 13 }} />
        </div>
        <Skeleton className="rounded" style={{ width: "55%", height: 9 }} animationType="pulse" />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {widths.map((w, j) => (
          <Skeleton
            key={j}
            className="rounded"
            style={{ width: `${w}%`, height: 9 }}
            animationType="pulse"
          />
        ))}
      </div>
    </div>
  );
}

function SectionCard({
  section,
  index,
  value,
  citations,
  isEdited,
  onEdit,
}: {
  section: (typeof STRATEGY_SECTIONS)[number];
  index: number;
  value: string;
  citations: StrategyCitation[];
  isEdited: boolean;
  onEdit: (value: string) => void;
}) {
  const isAnchor = index === 0;
  const isOutput = index === STRATEGY_SECTIONS.length - 1;
  void isEdited;
  void onEdit;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.2 }}
    >
      {/* Section heading */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
            <span
              className="mono"
              style={{ fontSize: 10, color: "var(--ink-muted)", letterSpacing: "0.08em" }}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <span
              style={{
                fontSize: isAnchor ? 16 : 14,
                fontWeight: isAnchor ? 500 : 400,
                color: "var(--ink)",
                letterSpacing: isAnchor ? "-0.02em" : "-0.01em",
              }}
            >
              {section.label}
            </span>
            {isOutput && (
              <span
                style={{
                  fontSize: 9,
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--terracotta)",
                  opacity: 0.7,
                }}
              >
                what to do this month
              </span>
            )}
          </div>
          <p style={{ fontSize: 12, color: "var(--ink-muted)", lineHeight: 1.55, margin: 0 }}>
            {section.hint}
          </p>
        </div>
        <CitationChip citations={citations} />
      </div>

      <FormattedStrategySection value={value} />
      <SectionCitations citations={citations} />
    </motion.div>
  );
}

type StrategyTextBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] };

function FormattedStrategySection({ value }: { value: string }) {
  const blocks = parseStrategyText(value);

  return (
    <div
      style={{
        fontSize: 13,
        lineHeight: 1.65,
        color: "var(--ink-light)",
      }}
    >
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          return (
            <p
              key={index}
              style={{
                fontSize: 11,
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--ink)",
                margin: index === 0 ? "0 0 8px" : "16px 0 8px",
              }}
            >
              {renderInlineText(block.text)}
            </p>
          );
        }

        if (block.type === "list") {
          const ListTag = block.ordered ? "ol" : "ul";
          return (
            <ListTag
              key={index}
              style={{
                margin: index === 0 ? "0 0 10px" : "10px 0",
                paddingLeft: block.ordered ? 20 : 18,
                display: "flex",
                flexDirection: "column",
                gap: 7,
              }}
            >
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} style={{ paddingLeft: 2 }}>
                  {renderInlineText(item)}
                </li>
              ))}
            </ListTag>
          );
        }

        return (
          <p key={index} style={{ margin: index === 0 ? "0 0 10px" : "10px 0" }}>
            {renderInlineText(block.text)}
          </p>
        );
      })}
    </div>
  );
}

function parseStrategyText(value: string): StrategyTextBlock[] {
  const lines = value.replace(/\r/g, "").split("\n");
  const blocks: StrategyTextBlock[] = [];
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    blocks.push({ type: "paragraph", text: paragraph.join(" ") });
    paragraph = [];
  };

  const flushList = () => {
    if (!list) return;
    blocks.push({ type: "list", ordered: list.ordered, items: list.items });
    list = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = line.match(/^#{1,4}\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push({ type: "heading", text: stripMarkdownMarks(heading[1]) });
      continue;
    }

    const bullet = line.match(/^[-*]\s+(.+)$/);
    const numbered = line.match(/^\d+[.)]\s+(.+)$/);
    if (bullet || numbered) {
      flushParagraph();
      const ordered = Boolean(numbered);
      if (!list || list.ordered !== ordered) {
        flushList();
        list = { ordered, items: [] };
      }
      list.items.push(stripMarkdownMarks((bullet?.[1] ?? numbered?.[1] ?? "").trim()));
      continue;
    }

    flushList();
    paragraph.push(stripMarkdownMarks(line));
  }

  flushParagraph();
  flushList();

  return blocks.length > 0 ? blocks : [{ type: "paragraph", text: value.trim() }];
}

function stripMarkdownMarks(value: string): string {
  return value.replace(/^#+\s*/, "").trim();
}

function renderInlineText(value: string) {
  const parts = value.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index} style={{ color: "var(--ink)", fontWeight: 650 }}>{part.slice(2, -2)}</strong>;
    }

    return <span key={index}>{part}</span>;
  });
}

function CitationChip({ citations }: { citations: StrategyCitation[] }) {
  if (citations.length === 0) return null;

  return (
    <span
      style={{
        fontSize: 10,
        color: "var(--ink-muted)",
        border: "1px solid var(--rule)",
        padding: "3px 7px",
        borderRadius: 999,
        fontFamily: "var(--font-mono)",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {citations.length} source{citations.length > 1 ? "s" : ""}
    </span>
  );
}

function SectionCitations({ citations }: { citations: StrategyCitation[] }) {
  const [open, setOpen] = useState(false);

  if (citations.length === 0) return null;

  return (
    <div style={{ marginTop: 10 }}>
      <button
        onClick={() => setOpen((c) => !c)}
        className="btn-text"
        aria-expanded={open}
        style={{ fontSize: 11, color: "var(--ink-muted)" }}
      >
        <motion.span
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          style={{ display: "inline-flex" }}
        >
          <CaretDown size={10} />
        </motion.span>
        Evidence
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 7 }}>
              {citations.map((citation, index) => (
                <a
                  key={`${citation.url}-${index}`}
                  href={citation.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    textDecoration: "none",
                    color: "var(--ink)",
                    borderTop: index === 0 ? "1px solid var(--rule)" : "none",
                    paddingTop: index === 0 ? 8 : 0,
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.45 }}>
                    {citation.title}
                  </span>
                  {citation.note && (
                    <p
                      style={{
                        fontSize: 11,
                        color: "var(--ink-muted)",
                        lineHeight: 1.5,
                        margin: "3px 0 0",
                      }}
                    >
                      {citation.note}
                    </p>
                  )}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EmptyStrategyState({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div style={{ padding: "48px 0" }}>
      <p style={{ fontSize: 15, color: "var(--ink)", margin: "0 0 6px", fontWeight: 500 }}>
        {title}
      </p>
      <p
        style={{
          fontSize: 14,
          color: "var(--ink-muted)",
          lineHeight: 1.7,
          maxWidth: 520,
          margin: 0,
        }}
      >
        {body}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="btn-text"
          style={{ fontSize: 13, color: "var(--teal)", marginTop: 14 }}
        >
          <ArrowClockwise size={12} />
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function GroupLabel({ label }: { label: string }) {
  return (
    <p
      style={{
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "var(--ink-muted)",
        fontFamily: "var(--font-mono)",
        margin: "0 0 22px",
        opacity: 0.65,
      }}
    >
      {label}
    </p>
  );
}

function FieldLabel({ label, required = false }: { label: string; required?: boolean }) {
  return (
    <label
      style={{
        display: "block",
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "var(--ink-muted)",
        marginBottom: 9,
        fontFamily: "var(--font-mono)",
      }}
    >
      {label}
      {required && <span style={{ color: "var(--terracotta)", marginLeft: 4 }}>*</span>}
    </label>
  );
}

function TabPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: "none",
        background: active ? "var(--teal)" : "transparent",
        color: active ? "#fff" : "var(--ink-muted)",
        borderRadius: 999,
        padding: "5px 14px",
        cursor: "pointer",
        fontFamily: "var(--font-display)",
        fontSize: 12,
        fontWeight: active ? 600 : 500,
        letterSpacing: "0.02em",
        lineHeight: 1,
        transition: "background 0.15s, color 0.15s",
      }}
    >
      {label}
    </button>
  );
}
