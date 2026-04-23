import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton, Spinner } from "@heroui/react";
import { ArrowClockwise, CaretDown, Check, DownloadSimple, WarningCircle } from "@phosphor-icons/react";
import {
  STRATEGY_SECTIONS,
  getCompletedResearchCount,
  getStrategyReadiness,
} from "../lib/strategy";
import type {
  SessionState,
  StrategyCitation,
  StrategyInputs,
  StrategySectionKey,
} from "../types";

interface Props {
  session: SessionState;
  researchRunning: boolean;
  onInputChange: <K extends keyof StrategyInputs>(key: K, value: StrategyInputs[K]) => void;
  onSectionChange: (key: StrategySectionKey, value: string) => void;
  onGenerate: () => void;
  onExport: () => void;
}

const REQUIRED_PHASE_IDS = [1, 3, 5];

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
};

const CONTENT_LABELS: Record<string, string> = {
  writing: "Writing",
  "short-video": "Video",
  audio: "Audio",
  design: "Design",
  none: "No content",
};

export function StrategyView({
  session,
  researchRunning,
  onInputChange,
  onSectionChange,
  onGenerate,
  onExport,
}: Props) {
  const [drawerOpen, setDrawerOpen] = useState(!session.strategyDraft);
  const prevDraftAt = useRef<string | null>(session.strategyDraft?.generatedAt ?? null);

  useEffect(() => {
    const current = session.strategyDraft?.generatedAt ?? null;
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
  const canGenerate = readiness.ready && audienceReady && !researchRunning && !strategyRunning;

  const buttonLabel =
    session.strategyStatus === "researching"
      ? "Researching…"
      : session.strategyStatus === "drafting"
        ? "Drafting…"
        : session.strategyDraft
          ? session.strategyDirty
            ? "Regenerate"
            : "Rebuild"
          : "Generate draft";

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 24,
          marginBottom: 18,
        }}
      >
        <div>
          <p
            style={{
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--ink-muted)",
              margin: "0 0 6px",
              fontFamily: "var(--font-mono)",
            }}
          >
            Distribution Strategy
          </p>
          <p
            style={{
              fontSize: 14,
              color: "var(--ink-light)",
              lineHeight: 1.7,
              maxWidth: 600,
              margin: 0,
            }}
          >
            The research is in. Now build the plan — one that works with how you actually
            operate, not against it. Set your constraints once, generate the draft, edit what
            needs editing.
          </p>
        </div>

        {session.strategyDraft && (
          <button
            className="btn-text"
            onClick={onExport}
            style={{ fontSize: 13, color: "var(--ink-muted)", flexShrink: 0 }}
          >
            <DownloadSimple size={13} />
            Export
          </button>
        )}
      </div>

      <hr className="rule" />

      <ConfigDrawer
        inputs={session.strategyInputs}
        readiness={readiness}
        completedResearch={completedResearch}
        audienceReady={audienceReady}
        strategyRunning={strategyRunning}
        strategyStatus={session.strategyStatus}
        strategyDirty={session.strategyDirty}
        draftExists={!!session.strategyDraft}
        researchRunning={researchRunning}
        error={session.strategyError}
        canGenerate={canGenerate}
        buttonLabel={buttonLabel}
        isOpen={drawerOpen}
        onToggle={() => setDrawerOpen((o) => !o)}
        onInputChange={onInputChange}
        onGenerate={onGenerate}
      />

      <hr className="rule" style={{ marginBottom: 32 }} />

      <StrategyContent
        key={session.strategyDraft?.generatedAt ?? "empty"}
        session={session}
        strategyRunning={strategyRunning}
        readiness={readiness}
        onSectionChange={onSectionChange}
        onGenerate={onGenerate}
      />
    </div>
  );
}

function ConfigDrawer({
  inputs,
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
  isOpen,
  onToggle,
  onInputChange,
  onGenerate,
}: {
  inputs: StrategyInputs;
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
          padding: "13px 0",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
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
            {inputs.contentMode !== "none" && (
              <MiniPill label={CONTENT_LABELS[inputs.contentMode] ?? inputs.contentMode} />
            )}
          </div>
        )}

        <button
          className="btn-text"
          onClick={onToggle}
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

        <GenerateButton
          canGenerate={canGenerate}
          buttonLabel={buttonLabel}
          strategyRunning={strategyRunning}
          onGenerate={onGenerate}
        />
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
            <InputForm inputs={inputs} onInputChange={onInputChange} />
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
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
      {REQUIRED_PHASE_IDS.map((id) => {
        const done = !readiness.missingRequired.includes(id);
        return (
          <div key={id} style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <span
              className="mono"
              style={{ fontSize: 10, color: "var(--ink-muted)", opacity: done ? 1 : 0.4 }}
            >
              {String(id).padStart(2, "0")}
            </span>
            {done ? (
              <Check size={9} weight="bold" style={{ color: "var(--teal)" }} />
            ) : (
              <span
                style={{
                  display: "inline-block",
                  width: 9,
                  height: 1,
                  background: "var(--rule)",
                  marginBottom: 1,
                }}
              />
            )}
          </div>
        );
      })}
      <span
        style={{
          display: "inline-block",
          width: 1,
          height: 10,
          background: "var(--rule)",
          margin: "0 2px",
        }}
      />
      <span className="mono" style={{ fontSize: 10, color: "var(--ink-muted)" }}>
        {completedResearch}/6
      </span>
    </div>
  );
}

function MiniPill({ label }: { label: string }) {
  return (
    <span
      style={{
        fontSize: 10,
        fontFamily: "var(--font-mono)",
        color: "var(--ink-muted)",
        border: "1px solid var(--rule)",
        padding: "2px 7px",
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
  strategyRunning,
  onGenerate,
}: {
  canGenerate: boolean;
  buttonLabel: string;
  strategyRunning: boolean;
  onGenerate: () => void;
}) {
  return (
    <button
      onClick={canGenerate ? onGenerate : undefined}
      disabled={!canGenerate}
      style={{
        fontFamily: "var(--font-display)",
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: "0.01em",
        padding: "8px 16px",
        border: "none",
        borderRadius: 999,
        cursor: canGenerate ? "pointer" : "not-allowed",
        background: canGenerate ? "var(--teal)" : "rgba(91, 138, 138, 0.4)",
        color: "#fff",
        transition: "background 0.15s",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
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
      <PipelineStep label="Claude draft" active={exaDone} done={false} />
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
  onInputChange,
}: {
  inputs: StrategyInputs;
  onInputChange: <K extends keyof StrategyInputs>(key: K, value: StrategyInputs[K]) => void;
}) {
  return (
    <div style={{ paddingBottom: 20 }}>
      <div style={{ marginBottom: 20 }}>
        <GroupLabel label="Audience" />
        <FieldLabel label="Who you're building for" required />
        <textarea
          value={inputs.audienceLens}
          onChange={(e) => onInputChange("audienceLens", e.target.value)}
          rows={3}
          placeholder="E.g. solo operators who find tools through search, not conferences. Avoid networking-heavy channels."
        />
      </div>

      <GroupLabel label="How you operate" />

      <div className="constraints-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <SegmentedControl
          label="Team Size"
          value={inputs.teamSize}
          options={[
            { value: "solo", label: "Solo" },
            { value: "small-team", label: "Small team" },
          ]}
          onChange={(v) => onInputChange("teamSize", v as StrategyInputs["teamSize"])}
        />
        <SegmentedControl
          label="Budget Band"
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
        <SegmentedControl
          label="Outreach"
          value={inputs.outreachTolerance}
          options={[
            { value: "inbound-only", label: "Inbound" },
            { value: "warm-intro-ok", label: "Warm intro" },
            { value: "async-email-ok", label: "Async email" },
          ]}
          onChange={(v) =>
            onInputChange("outreachTolerance", v as StrategyInputs["outreachTolerance"])
          }
        />
      </div>

      <div className="constraints-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div>
          <FieldLabel label="Weekly Capacity" />
          <input
            type="text"
            value={inputs.weeklyCapacity}
            onChange={(e) => onInputChange("weeklyCapacity", e.target.value)}
            placeholder="E.g. 4 focused hours"
          />
        </div>
        <div>
          <FieldLabel label="Content Mode" />
          <PillSelector
            value={inputs.contentMode}
            options={[
              { value: "writing", label: "Writing" },
              { value: "short-video", label: "Video" },
              { value: "audio", label: "Audio" },
              { value: "design", label: "Design" },
              { value: "none", label: "None" },
            ]}
            onChange={(v) => onInputChange("contentMode", v as StrategyInputs["contentMode"])}
          />
        </div>
      </div>

      <div className="constraints-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <FieldLabel label="Existing Credibility" />
          <textarea
            value={inputs.existingCredibility}
            onChange={(e) => onInputChange("existingCredibility", e.target.value)}
            rows={3}
            placeholder="Writing, tools built, case studies, notable clients."
          />
        </div>
        <div>
          <FieldLabel label="Channel Avoidances" />
          <textarea
            value={inputs.channelAvoidances}
            onChange={(e) => onInputChange("channelAvoidances", e.target.value)}
            rows={3}
            placeholder="What you won't do. E.g. LinkedIn, live events, cold calls."
          />
        </div>
      </div>
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
                padding: "6px 0",
                cursor: "pointer",
                transition: "background 0.15s, color 0.15s",
                lineHeight: 1.2,
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

function PillSelector({
  value,
  options,
  onChange,
}: {
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, paddingTop: 2 }}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            style={{
              border: `1px solid ${active ? "var(--teal)" : "var(--rule)"}`,
              background: active ? "var(--teal)" : "transparent",
              color: active ? "#fff" : "var(--ink-muted)",
              borderRadius: 999,
              fontSize: 11,
              fontFamily: "var(--font-display)",
              padding: "4px 10px",
              cursor: "pointer",
              transition: "all 0.15s",
              lineHeight: 1.4,
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

  if (!session.strategyDraft && strategyRunning) {
    return <StrategyLoadingState />;
  }

  if (!session.strategyDraft && !readiness.ready) {
    return (
      <EmptyStrategyState
        title="Complete enough research to unlock the draft."
        body="Finish at least four phases — including Problem Cartography (01), Solution Landscape (03), and Evidence Mining (05) — then come back here."
      />
    );
  }

  if (!session.strategyDraft && readiness.ready) {
    return (
      <EmptyStrategyState
        title="Research is ready."
        body="Add your audience and constraints above, then generate the draft."
        actionLabel="Generate draft"
        onAction={onGenerate}
      />
    );
  }

  if (!session.strategyDraft) return null;

  const draft = session.strategyDraft;

  return (
    <div>
      {draft.warnings.length > 0 && (
        <div
          style={{
            marginBottom: 24,
            border: "1px solid rgba(196, 114, 90, 0.2)",
            padding: 16,
          }}
        >
          <p
            style={{
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--terracotta)",
              margin: "0 0 8px",
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
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--ink-light)",
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {warning}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        {STRATEGY_SECTIONS.map((section, index) => (
          <SectionCard
            key={section.key}
            section={section}
            index={index}
            value={draft.sections[section.key]}
            citations={draft.citations.filter((c) => c.section === section.key)}
            isEdited={editedSections.has(section.key)}
            onEdit={(value) => handleSectionChange(section.key, value)}
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.2 }}
      style={{
        border: "1px solid var(--rule)",
        borderLeft: isAnchor ? "2px solid var(--teal)" : "1px solid var(--rule)",
        background: isOutput ? "rgba(196, 114, 90, 0.025)" : "transparent",
        padding: 18,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 10,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span
              className="mono"
              style={{ fontSize: 10, color: "var(--ink-muted)", letterSpacing: "0.08em" }}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <span
              style={{
                fontSize: isAnchor ? 16 : 14,
                fontWeight: isAnchor ? 700 : 600,
                color: "var(--ink)",
                letterSpacing: isAnchor ? "-0.02em" : "-0.01em",
              }}
            >
              {section.label}
            </span>
            {isEdited && (
              <span
                style={{
                  fontSize: 9,
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--ink-muted)",
                  border: "1px solid var(--rule)",
                  padding: "1px 5px",
                  borderRadius: 999,
                }}
              >
                edited
              </span>
            )}
            {isOutput && !isEdited && (
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
                action output
              </span>
            )}
          </div>
          <p style={{ fontSize: 12, color: "var(--ink-muted)", lineHeight: 1.55, margin: 0 }}>
            {section.hint}
          </p>
        </div>
        <CitationChip citations={citations} />
      </div>

      <textarea value={value} onChange={(e) => onEdit(e.target.value)} rows={7} style={{ flex: 1 }} />

      <SectionCitations citations={citations} />
    </motion.div>
  );
}

function StrategyLoadingState() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
      {SKELETON_ROWS.map((widths, i) => (
        <div
          key={i}
          style={{
            border: "1px solid var(--rule)",
            borderLeft: i === 0 ? "2px solid var(--teal)" : "1px solid var(--rule)",
            padding: 18,
            opacity: 1 - i * 0.08,
          }}
        >
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
            <Skeleton className="rounded" style={{ width: 18, height: 8 }} />
            <Skeleton className="rounded" style={{ width: 70 + i * 10, height: 13 }} />
          </div>
          <Skeleton
            className="rounded"
            style={{ width: "65%", height: 9, marginBottom: 14 }}
            animationType="pulse"
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
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
      ))}
    </div>
  );
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
      <p style={{ fontSize: 15, color: "var(--ink)", margin: "0 0 6px", fontWeight: 600 }}>
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
        fontSize: 9,
        fontWeight: 500,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: "var(--ink-muted)",
        fontFamily: "var(--font-mono)",
        margin: "0 0 12px",
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
        marginBottom: 6,
        fontFamily: "var(--font-mono)",
      }}
    >
      {label}
      {required && <span style={{ color: "var(--terracotta)", marginLeft: 4 }}>*</span>}
    </label>
  );
}
