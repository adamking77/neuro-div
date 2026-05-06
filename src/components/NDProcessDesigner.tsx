import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, DownloadSimple } from "@phosphor-icons/react";
import type { NDProfileContext, ProcessDesignerInputs } from "../types";
import { loadNDProfileContext } from "../lib/nd-profile";
import {
  buildProcessMarkdown,
  buildProcessPlan,
  clearProcessDesignerDraft,
  createEmptyProcessDesignerInputs,
  loadProcessDesignerDraft,
  saveProcessDesignerDraft,
} from "../lib/process-designer";

type StepId = "intro" | "goal" | "context" | "boundaries" | "done";

const STEP_ORDER: StepId[] = ["intro", "goal", "context", "boundaries", "done"];

const STEP_LABELS: Record<StepId, string> = {
  intro: "Welcome",
  goal: "The goal",
  context: "What you're working with",
  boundaries: "What to protect",
  done: "Your process is ready",
};

export function NDProcessDesigner({ onOpenContextBuilder }: { onOpenContextBuilder: () => void }) {
  const savedDraft = loadProcessDesignerDraft();
  const [step, setStep] = useState<StepId>("intro");
  const [profileContext, setProfileContext] = useState<NDProfileContext | null>(() => loadNDProfileContext());
  const [inputs, setInputs] = useState<ProcessDesignerInputs>(() => savedDraft?.inputs ?? createEmptyProcessDesignerInputs());
  const [hasExisting] = useState(() => {
    const next = savedDraft?.inputs ?? createEmptyProcessDesignerInputs();
    return Object.values(next).some((value) => value.trim().length > 0);
  });

  useEffect(() => {
    const refreshProfile = () => setProfileContext(loadNDProfileContext());

    refreshProfile();
    window.addEventListener("focus", refreshProfile);
    return () => window.removeEventListener("focus", refreshProfile);
  }, []);

  useEffect(() => {
    if (step !== "intro") {
      saveProcessDesignerDraft(inputs, buildProcessPlan(inputs, profileContext));
    }
  }, [inputs, profileContext, step]);

  const plan = useMemo(() => buildProcessPlan(inputs, profileContext), [inputs, profileContext]);
  const markdown = useMemo(() => buildProcessMarkdown(inputs, plan), [inputs, plan]);

  const updateInputs = useCallback((update: Partial<ProcessDesignerInputs>) => {
    setInputs((current) => ({ ...current, ...update }));
  }, []);

  function goToStep(id: StepId) {
    setStep(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function next() {
    const currentIndex = STEP_ORDER.indexOf(step);
    if (currentIndex < STEP_ORDER.length - 1) {
      goToStep(STEP_ORDER[currentIndex + 1]);
    }
  }

  function back() {
    const currentIndex = STEP_ORDER.indexOf(step);
    if (currentIndex > 0) {
      goToStep(STEP_ORDER[currentIndex - 1]);
    }
  }

  function handleRestart() {
    if (window.confirm("Start a new process? Your current draft will be cleared.")) {
      clearProcessDesignerDraft();
      setInputs(createEmptyProcessDesignerInputs());
      goToStep("intro");
    }
  }

  const stepIndex = STEP_ORDER.indexOf(step);
  const isFormStep = step !== "intro" && step !== "done";
  const formStepIndex = isFormStep ? STEP_ORDER.indexOf(step) - 1 : null;
  const formStepCount = STEP_ORDER.length - 2;

  return (
    <div>
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 500,
              color: "var(--ink)",
              letterSpacing: "-0.02em",
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {STEP_LABELS[step]}
          </h2>
          {isFormStep && formStepIndex !== null && (
            <span className="mono" style={{ fontSize: 9, color: "var(--ink-muted)", opacity: 0.5 }}>
              {formStepIndex} of {formStepCount}
            </span>
          )}
        </div>
        {step !== "intro" && step !== "done" && (
          <div style={{ display: "flex", gap: 4, marginTop: 10 }}>
            {STEP_ORDER.slice(1, -1).map((s) => {
              const idx = STEP_ORDER.indexOf(s);
              const currentIdx = stepIndex;
              const isDone = idx < currentIdx;
              const isCurrent = idx === currentIdx;
              return (
                <div
                  key={s}
                  style={{
                    height: 2,
                    flex: 1,
                    background: isDone ? "var(--teal)" : isCurrent ? "rgba(91, 138, 138, 0.4)" : "var(--rule)",
                    transition: "background 0.2s",
                  }}
                />
              );
            })}
          </div>
        )}
      </div>

      {step === "intro" && (
        <IntroStep
          onBegin={() => goToStep("goal")}
          onStartFresh={() => {
            clearProcessDesignerDraft();
            setInputs(createEmptyProcessDesignerInputs());
            goToStep("goal");
          }}
          hasExisting={hasExisting}
          hasProfile={!!profileContext}
          onOpenContextBuilder={onOpenContextBuilder}
        />
      )}
      {step === "goal" && (
        <GoalStep inputs={inputs} onChange={updateInputs} onBack={back} onContinue={next} />
      )}
      {step === "context" && (
        <ContextStep
          inputs={inputs}
          onChange={updateInputs}
          onBack={back}
          onContinue={next}
          profileContext={profileContext}
        />
      )}
      {step === "boundaries" && (
        <BoundariesStep inputs={inputs} onChange={updateInputs} onBack={back} onContinue={next} />
      )}
      {step === "done" && (
        <DoneStep markdown={markdown} onRestart={handleRestart} onBack={back} goal={plan.goal} />
      )}
    </div>
  );
}

function IntroStep({
  onBegin,
  onStartFresh,
  hasExisting,
  hasProfile,
  onOpenContextBuilder,
}: {
  onBegin: () => void;
  onStartFresh: () => void;
  hasExisting: boolean;
  hasProfile: boolean;
  onOpenContextBuilder: () => void;
}) {
  return (
    <div style={{ maxWidth: 600 }}>
      <p style={{ fontSize: 15, color: "var(--ink)", lineHeight: 1.75, margin: "0 0 20px" }}>
        This builds a process document you can hand to any AI assistant so it knows how to help you move a goal without turning it into pressure.
      </p>
      <p style={{ fontSize: 14, color: "var(--ink-light)", lineHeight: 1.7, margin: "0 0 20px" }}>
        It turns one goal plus your ND profile into a trigger-based move menu, a not-doing list, a session-start check-in, and an agent brief.
      </p>
      <p style={{ fontSize: 14, color: "var(--ink-light)", lineHeight: 1.7, margin: "0 0 12px" }}>
        Takes about 5 minutes. You can stop at any point and come back, progress is saved automatically. Nothing is required.
      </p>
      <p style={{ fontSize: 13, color: "var(--ink-muted)", lineHeight: 1.6, margin: "0 0 36px" }}>
        {hasProfile
          ? "A saved ND profile is loaded and will shape the process automatically."
          : "No saved ND profile is loaded. You can still continue, or open ND Context Builder first if you want this to be more personalized."}
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <button
          onClick={onBegin}
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "var(--cream)",
            background: "var(--teal)",
            border: "1px solid var(--teal)",
            padding: "10px 24px",
            cursor: "pointer",
            fontFamily: "var(--font-display)",
          }}
        >
          {hasExisting ? "Continue where I left off" : "Begin"}
        </button>
        <button onClick={onOpenContextBuilder} className="btn-text" style={{ fontSize: 12, color: "var(--ink-muted)" }}>
          {hasProfile ? "Update ND profile" : "Open Context Builder first"}
        </button>
        {hasExisting && (
          <button
            onClick={() => {
              if (window.confirm("Start a new process? Your current draft will be cleared.")) {
                onStartFresh();
              }
            }}
            className="btn-text"
            style={{ fontSize: 12, color: "var(--ink-muted)" }}
          >
            Start fresh
          </button>
        )}
      </div>
    </div>
  );
}

function GoalStep({
  inputs,
  onChange,
  onBack,
  onContinue,
}: {
  inputs: ProcessDesignerInputs;
  onChange: (update: Partial<ProcessDesignerInputs>) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <div>
      <p style={{ fontSize: 15, color: "var(--ink-light)", lineHeight: 1.7, margin: "0 0 32px", maxWidth: 560 }}>
        Start with the actual thing you're trying to move. Keep it plain. No optimization language, no fake ambition.
      </p>

      <Field>
        <FieldLabel>What are you trying to move?</FieldLabel>
        <textarea
          value={inputs.goal}
          onChange={(e) => onChange({ goal: e.target.value })}
          placeholder="The actual goal in plain language"
          rows={4}
          style={{ fontSize: 13 }}
        />
      </Field>

      <Field>
        <FieldLabel>What would count as real movement?</FieldLabel>
        <textarea
          value={inputs.successSignal}
          onChange={(e) => onChange({ successSignal: e.target.value })}
          placeholder="A visible done signal, not a vague feeling"
          rows={3}
          style={{ fontSize: 13 }}
        />
        <FieldHint>This helps the process know when enough is enough.</FieldHint>
      </Field>

      <Field>
        <FieldLabel>Why does this matter right now?</FieldLabel>
        <textarea
          value={inputs.whyNow}
          onChange={(e) => onChange({ whyNow: e.target.value })}
          placeholder="Optional — what makes this matter now?"
          rows={3}
          style={{ fontSize: 13 }}
        />
      </Field>

      <StepNav onBack={onBack} onContinue={onContinue} />
    </div>
  );
}

function ContextStep({
  inputs,
  onChange,
  onBack,
  onContinue,
  profileContext,
}: {
  inputs: ProcessDesignerInputs;
  onChange: (update: Partial<ProcessDesignerInputs>) => void;
  onBack: () => void;
  onContinue: () => void;
  profileContext: NDProfileContext | null;
}) {
  return (
    <div>
      <p style={{ fontSize: 15, color: "var(--ink-light)", lineHeight: 1.7, margin: "0 0 16px", maxWidth: 560 }}>
        Now add the context around the goal. What already exists, and where does this usually start to slide?
      </p>

      {profileContext && (
        <p style={{ fontSize: 13, color: "var(--ink-muted)", lineHeight: 1.6, margin: "0 0 28px", maxWidth: 560 }}>
          Your saved ND profile is already loaded. This step is just the project-specific layer on top of it.
        </p>
      )}

      <Field>
        <FieldLabel>What do you already have to work from?</FieldLabel>
        <textarea
          value={inputs.existingAssets}
          onChange={(e) => onChange({ existingAssets: e.target.value })}
          placeholder="Notes, drafts, recordings, half-finished versions, old systems"
          rows={4}
          style={{ fontSize: 13 }}
        />
      </Field>

      <Field>
        <FieldLabel>Where does this usually get stuck?</FieldLabel>
        <textarea
          value={inputs.frictionPoints}
          onChange={(e) => onChange({ frictionPoints: e.target.value })}
          placeholder="What turns this into a wall? Be specific."
          rows={4}
          style={{ fontSize: 13 }}
        />
        <FieldHint>Waiting, over-scoping, blank-page pressure, social exposure, admin drag, whatever the real pattern is.</FieldHint>
      </Field>

      <StepNav onBack={onBack} onContinue={onContinue} />
    </div>
  );
}

function BoundariesStep({
  inputs,
  onChange,
  onBack,
  onContinue,
}: {
  inputs: ProcessDesignerInputs;
  onChange: (update: Partial<ProcessDesignerInputs>) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <div>
      <p style={{ fontSize: 15, color: "var(--ink-light)", lineHeight: 1.7, margin: "0 0 32px", maxWidth: 560 }}>
        Last step. Make the boundary visible. A useful process is not just what you're doing, it's also what you're not doing.
      </p>

      <Field>
        <FieldLabel>What are you not doing in this process?</FieldLabel>
        <textarea
          value={inputs.notDoing}
          onChange={(e) => onChange({ notDoing: e.target.value })}
          placeholder="One boundary per line works well"
          rows={5}
          style={{ fontSize: 13 }}
        />
        <FieldHint>Examples: no live calls, no daily posting, no giant setup project before starting.</FieldHint>
      </Field>

      <StepNav onBack={onBack} onContinue={onContinue} continueLabel="Build my process" />
    </div>
  );
}

function DoneStep({
  markdown,
  goal,
  onRestart,
  onBack,
}: {
  markdown: string;
  goal: string;
  onRestart: () => void;
  onBack: () => void;
}) {
  function downloadProcess() {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(blob);
    anchor.download = `nd-process-${Date.now()}.md`;
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  }

  const isEmpty = !goal.trim();

  return (
    <div>
      {isEmpty ? (
        <p style={{ fontSize: 15, color: "var(--ink-light)", lineHeight: 1.7, margin: "0 0 32px", maxWidth: 560 }}>
          You haven't filled anything in yet. Go back and complete at least the goal step to generate a useful process.
        </p>
      ) : (
        <>
          <p style={{ fontSize: 15, color: "var(--ink-light)", lineHeight: 1.7, margin: "0 0 24px", maxWidth: 560 }}>
            Your process is ready. Download the file and paste it into any AI system prompt, Claude Project instructions, or agent context.
            It includes the process itself plus the agent brief at the end.
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 36, flexWrap: "wrap" }}>
            <button
              onClick={downloadProcess}
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "var(--cream)",
                background: "var(--teal)",
                border: "1px solid var(--teal)",
                padding: "9px 20px",
                cursor: "pointer",
                fontFamily: "var(--font-display)",
                display: "flex",
                alignItems: "center",
                gap: 7,
              }}
            >
              <DownloadSimple size={14} />
              Download process
            </button>
            <button onClick={onRestart} className="btn-text" style={{ fontSize: 12, color: "var(--ink-muted)" }}>
              Start over
            </button>
          </div>
        </>
      )}

      {!isEmpty && (
        <div>
          <p
            style={{
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--ink-muted)",
              margin: "0 0 12px",
              fontFamily: "var(--font-mono)",
            }}
          >
            Preview
          </p>
          <pre
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              lineHeight: 1.8,
              color: "var(--ink-light)",
              padding: "16px 18px",
              border: "1px solid var(--rule)",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              maxHeight: 480,
              overflowY: "auto",
              margin: 0,
            }}
          >
            {markdown}
          </pre>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 32, paddingTop: 24, borderTop: "1px solid var(--rule)" }}>
        <button
          onClick={onBack}
          className="btn-text"
          style={{ fontSize: 13, color: "var(--ink-muted)", display: "flex", alignItems: "center", gap: 6 }}
        >
          <ArrowLeft size={13} />
          Back
        </button>
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "var(--ink-muted)",
        margin: "0 0 10px",
        fontFamily: "var(--font-mono)",
      }}
    >
      {children}
    </p>
  );
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 12, color: "var(--ink-muted)", margin: "6px 0 0", lineHeight: 1.6 }}>
      {children}
    </p>
  );
}

function Field({ children }: { children: React.ReactNode }) {
  return <div style={{ marginBottom: 32 }}>{children}</div>;
}

function StepNav({
  onBack,
  onContinue,
  continueLabel = "Continue",
}: {
  onBack?: () => void;
  onContinue?: () => void;
  continueLabel?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 40, paddingTop: 32, borderTop: "1px solid var(--rule)" }}>
      {onBack && (
        <button
          onClick={onBack}
          className="btn-text"
          style={{ fontSize: 13, color: "var(--ink-muted)", display: "flex", alignItems: "center", gap: 6 }}
        >
          <ArrowLeft size={13} />
          Back
        </button>
      )}
      {onContinue && (
        <button
          onClick={onContinue}
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "var(--cream)",
            background: "var(--teal)",
            border: "1px solid var(--teal)",
            padding: "9px 20px",
            cursor: "pointer",
            transition: "all 0.12s",
            fontFamily: "var(--font-display)",
          }}
        >
          {continueLabel}
        </button>
      )}
    </div>
  );
}
