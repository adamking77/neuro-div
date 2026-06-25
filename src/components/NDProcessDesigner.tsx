import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, PencilSimple, Trash } from "@phosphor-icons/react";
import { MetaLabel, PrimaryButton } from "./ui";
import { ProcessArtifactOutput } from "./output/ProcessArtifactOutput";
import type { NDProfileContext, ProcessDesignerInputs, ProcessPlan } from "../types";
import { loadNDProfileContext } from "../lib/nd-profile";
import {
  buildProcessMarkdown,
  buildProcessPlan,
  clearProcessDesignerDraft,
  createEmptyProcessDesignerInputs,
  deleteProcessArtifact,
  listProcessArtifacts,
  loadCurrentProcessArtifactId,
  loadProcessArtifact,
  loadProcessDesignerDraft,
  renameProcessArtifact,
  saveCurrentProcessArtifactId,
  saveProcessArtifact,
  saveProcessDesignerDraft,
  type SavedProcessArtifact,
} from "../lib/process-designer";

type StepId = "intro" | "goal" | "context" | "boundaries" | "done";

const STEP_ORDER: StepId[] = ["intro", "goal", "context", "boundaries", "done"];

const STEP_LABELS: Record<StepId, string> = {
  intro: "Process Designer",
  goal: "The goal",
  context: "What you're working with",
  boundaries: "What to protect",
  done: "Your process is ready",
};

export function NDProcessDesigner({ onOpenContextBuilder }: { onOpenContextBuilder: () => void }) {
  const savedDraft = loadProcessDesignerDraft();
  const initialArtifactId = loadCurrentProcessArtifactId() ?? savedDraft?.currentArtifactId ?? null;
  const initialArtifact = initialArtifactId ? loadProcessArtifact(initialArtifactId) : null;
  const initialInputs = initialArtifact?.inputs ?? savedDraft?.inputs ?? createEmptyProcessDesignerInputs();

  const [step, setStep] = useState<StepId>("intro");
  const [profileContext, setProfileContext] = useState<NDProfileContext | null>(() => loadNDProfileContext());
  const [inputs, setInputs] = useState<ProcessDesignerInputs>(initialInputs);
  const [currentArtifactId, setCurrentArtifactId] = useState<string | null>(initialArtifact?.id ?? savedDraft?.currentArtifactId ?? null);
  const [artifacts, setArtifacts] = useState<SavedProcessArtifact[]>(() => listProcessArtifacts());
  const [copiedBrief, setCopiedBrief] = useState(false);

  useEffect(() => {
    const refreshProfile = () => setProfileContext(loadNDProfileContext());

    refreshProfile();
    window.addEventListener("focus", refreshProfile);
    return () => window.removeEventListener("focus", refreshProfile);
  }, []);

  useEffect(() => {
    if (step !== "intro") {
      saveProcessDesignerDraft(inputs, currentArtifactId);
    }
  }, [inputs, currentArtifactId, step]);

  const plan = useMemo(() => buildProcessPlan(inputs, profileContext), [inputs, profileContext]);
  const markdown = useMemo(() => buildProcessMarkdown(inputs, plan), [inputs, plan]);

  const hasExistingDraft = Object.values(initialInputs).some((value) => value.trim().length > 0);
  const hasSavedProcesses = artifacts.length > 0;

  const updateInputs = useCallback((update: Partial<ProcessDesignerInputs>) => {
    setInputs((current) => ({ ...current, ...update }));
  }, []);

  const refreshArtifacts = useCallback(() => {
    setArtifacts(listProcessArtifacts());
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

  const handlePersistCurrent = useCallback((nextInputs: ProcessDesignerInputs = inputs) => {
    const builtPlan = buildProcessPlan(nextInputs, profileContext);
    const saved = saveProcessArtifact(nextInputs, builtPlan, currentArtifactId);
    setCurrentArtifactId(saved.id);
    saveCurrentProcessArtifactId(saved.id);
    saveProcessDesignerDraft(nextInputs, saved.id);
    refreshArtifacts();
    return saved;
  }, [currentArtifactId, inputs, profileContext, refreshArtifacts]);

  function finish() {
    handlePersistCurrent(inputs);
    goToStep("done");
  }

  function handleRestart() {
    if (window.confirm("Start a new process? Your current draft will be cleared.")) {
      clearProcessDesignerDraft();
      saveCurrentProcessArtifactId(null);
      setInputs(createEmptyProcessDesignerInputs());
      setCurrentArtifactId(null);
      goToStep("intro");
    }
  }

  function handleStartFresh() {
    clearProcessDesignerDraft();
    saveCurrentProcessArtifactId(null);
    setInputs(createEmptyProcessDesignerInputs());
    setCurrentArtifactId(null);
    goToStep("goal");
  }

  function handleOpenArtifact(id: string) {
    const artifact = loadProcessArtifact(id);
    if (!artifact) return;
    setInputs(artifact.inputs);
    setCurrentArtifactId(artifact.id);
    saveCurrentProcessArtifactId(artifact.id);
    saveProcessDesignerDraft(artifact.inputs, artifact.id);
    goToStep("done");
  }

  function handleDeleteArtifact(id: string) {
    if (!window.confirm("Delete this saved process? This can't be undone.")) return;
    deleteProcessArtifact(id);
    if (id === currentArtifactId) {
      saveCurrentProcessArtifactId(null);
      setCurrentArtifactId(null);
    }
    refreshArtifacts();
  }

  function handleRenameArtifact(id: string, currentName: string) {
    const nextName = window.prompt("Rename this saved process", currentName)?.trim();
    if (!nextName || nextName === currentName) return;
    renameProcessArtifact(id, nextName);
    refreshArtifacts();
  }

  function handleSaveAsNew() {
    const saved = saveProcessArtifact(inputs, buildProcessPlan(inputs, profileContext), null);
    setCurrentArtifactId(saved.id);
    saveCurrentProcessArtifactId(saved.id);
    saveProcessDesignerDraft(inputs, saved.id);
    refreshArtifacts();
  }

  async function handleCopyBrief() {
    await navigator.clipboard.writeText(plan.agentBrief);
    setCopiedBrief(true);
    setTimeout(() => setCopiedBrief(false), 2000);
  }

  const stepIndex = STEP_ORDER.indexOf(step);
  const isFormStep = step !== "intro" && step !== "done";
  const formStepIndex = isFormStep ? STEP_ORDER.indexOf(step) - 1 : null;
  const formStepCount = STEP_ORDER.length - 2;

  return (
    <div>
      {step !== "intro" && (
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 500,
                color: "var(--ink)",
                letterSpacing: 0,
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
          {step !== "done" && (
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
      )}

      {step === "intro" && (
        <IntroStep
          onBegin={() => goToStep("goal")}
          onStartFresh={handleStartFresh}
          hasExisting={hasExistingDraft}
          hasProfile={!!profileContext}
          hasSavedProcesses={hasSavedProcesses}
          onOpenContextBuilder={onOpenContextBuilder}
          artifacts={artifacts}
          onOpenArtifact={handleOpenArtifact}
          onRenameArtifact={handleRenameArtifact}
          onDeleteArtifact={handleDeleteArtifact}
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
        <BoundariesStep inputs={inputs} onChange={updateInputs} onBack={back} onContinue={finish} />
      )}
      {step === "done" && (
        <DoneStep
          plan={plan}
          copiedBrief={copiedBrief}
          onCopyBrief={handleCopyBrief}
          onDownload={() => {
            const blob = new Blob([markdown], { type: "text/markdown" });
            const anchor = document.createElement("a");
            anchor.href = URL.createObjectURL(blob);
            anchor.download = `nd-process-${Date.now()}.md`;
            anchor.click();
            URL.revokeObjectURL(anchor.href);
          }}
          onSaveAsNew={handleSaveAsNew}
          onRestart={handleRestart}
          onBack={back}
          artifacts={artifacts}
          currentArtifactId={currentArtifactId}
          onOpenArtifact={handleOpenArtifact}
          onRenameArtifact={handleRenameArtifact}
          onDeleteArtifact={handleDeleteArtifact}
        />
      )}
    </div>
  );
}

function IntroStep({
  onBegin,
  onStartFresh,
  hasExisting,
  hasProfile,
  hasSavedProcesses,
  onOpenContextBuilder,
  artifacts,
  onOpenArtifact,
  onRenameArtifact,
  onDeleteArtifact,
}: {
  onBegin: () => void;
  onStartFresh: () => void;
  hasExisting: boolean;
  hasProfile: boolean;
  hasSavedProcesses: boolean;
  onOpenContextBuilder: () => void;
  artifacts: SavedProcessArtifact[];
  onOpenArtifact: (id: string) => void;
  onRenameArtifact: (id: string, name: string) => void;
  onDeleteArtifact: (id: string) => void;
}) {
  return (
    <div style={{ maxWidth: 680 }}>
      <p style={{ fontSize: 15, color: "var(--ink)", lineHeight: 1.75, margin: "0 0 20px" }}>
        Most planning systems assume you will do tomorrow what you decided today. If your energy shifts day to day, that assumption breaks fast.
      </p>
      <p style={{ fontSize: 14, color: "var(--ink-light)", lineHeight: 1.7, margin: "0 0 20px" }}>
        Give this tool one goal and your profile. It builds a set of options you can pick from based on how you feel. You get a document any AI can read and run.
      </p>
      <p style={{ fontSize: 14, color: "var(--ink-light)", lineHeight: 1.7, margin: "0 0 12px" }}>
        About 5 minutes. Stop whenever.
      </p>
      <p style={{ fontSize: 13, color: "var(--ink-muted)", lineHeight: 1.6, margin: "0 0 36px" }}>
        {hasProfile
          ? "Your profile is loaded. The process will match how you work."
          : "No profile found. This will still work. It will ask a few extra questions to fill the gap. Build your profile first if you want the process shaped around you from the start."}
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: hasSavedProcesses ? 40 : 0 }}>
        <PrimaryButton onClick={onBegin}>
          {hasExisting ? "Continue where I left off" : "Begin"}
        </PrimaryButton>
        <button onClick={onOpenContextBuilder} className="btn-text" style={{ fontSize: 12, color: "var(--ink-muted)" }}>
          {hasProfile ? "Update profile" : "Open Context Builder first"}
        </button>
        {hasExisting && (
          <button onClick={onStartFresh} className="btn-text" style={{ fontSize: 12, color: "var(--ink-muted)" }}>
            Start fresh
          </button>
        )}
      </div>

      {hasSavedProcesses && (
        <SavedProcessesSection
          artifacts={artifacts}
          currentArtifactId={null}
          onOpenArtifact={onOpenArtifact}
          onRenameArtifact={onRenameArtifact}
          onDeleteArtifact={onDeleteArtifact}
        />
      )}
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
        Start with the actual thing you're trying to make happen. Keep it plain. No optimization language, no fake ambition.
      </p>

      <Field>
        <FieldLabel>What are you trying to make happen?</FieldLabel>
        <textarea
          value={inputs.goal}
          onChange={(e) => onChange({ goal: e.target.value })}
          placeholder="The actual goal in plain language"
          rows={4}
          style={{ fontSize: 13 }}
        />
      </Field>

      <Field>
        <FieldLabel>What would count as real progress?</FieldLabel>
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
          placeholder="Optional. What makes this matter now?"
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
          Your saved profile is already loaded. This step is just the project-specific layer on top of it.
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
        Last step. Make the boundary visible. A useful process includes what you are doing and what you are not doing.
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
  plan,
  copiedBrief,
  onCopyBrief,
  onDownload,
  onSaveAsNew,
  onRestart,
  onBack,
  artifacts,
  currentArtifactId,
  onOpenArtifact,
  onRenameArtifact,
  onDeleteArtifact,
}: {
  plan: ProcessPlan;
  copiedBrief: boolean;
  onCopyBrief: () => void;
  onDownload: () => void;
  onSaveAsNew: () => void;
  onRestart: () => void;
  onBack: () => void;
  artifacts: SavedProcessArtifact[];
  currentArtifactId: string | null;
  onOpenArtifact: (id: string) => void;
  onRenameArtifact: (id: string, name: string) => void;
  onDeleteArtifact: (id: string) => void;
}) {
  return (
    <div>
      <ProcessArtifactOutput
        plan={plan}
        copiedBrief={copiedBrief}
        onCopyBrief={onCopyBrief}
        onDownload={onDownload}
        onSaveAsNew={onSaveAsNew}
        onRestart={onRestart}
      />

      <SavedProcessesSection
        artifacts={artifacts}
        currentArtifactId={currentArtifactId}
        onOpenArtifact={onOpenArtifact}
        onRenameArtifact={onRenameArtifact}
        onDeleteArtifact={onDeleteArtifact}
      />

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


function SavedProcessesSection({
  artifacts,
  currentArtifactId,
  onOpenArtifact,
  onRenameArtifact,
  onDeleteArtifact,
}: {
  artifacts: SavedProcessArtifact[];
  currentArtifactId: string | null;
  onOpenArtifact: (id: string) => void;
  onRenameArtifact: (id: string, name: string) => void;
  onDeleteArtifact: (id: string) => void;
}) {
  if (artifacts.length === 0) return null;

  return (
    <div style={{ marginTop: 40 }}>
      <MetaLabel>Saved processes</MetaLabel>
      <div style={{ display: "grid", gap: 12 }}>
        {artifacts.map((artifact) => {
          const isCurrent = artifact.id === currentArtifactId;
          return (
            <div key={artifact.id} style={{ border: "1px solid var(--rule)", padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                <div>
                  <p style={{ fontSize: 14, color: "var(--ink)", margin: "0 0 5px", lineHeight: 1.5 }}>
                    {artifact.name}
                    {isCurrent ? " (current)" : ""}
                  </p>
                  <p className="mono" style={{ fontSize: 9, color: "var(--ink-muted)", opacity: 0.6, margin: 0 }}>
                    Updated {new Date(artifact.updatedAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <button className="btn-text" onClick={() => onOpenArtifact(artifact.id)} style={{ fontSize: 12, color: "var(--ink-muted)" }}>
                    Open
                  </button>
                  <button className="btn-text" onClick={() => onRenameArtifact(artifact.id, artifact.name)} style={{ fontSize: 12, color: "var(--ink-muted)" }}>
                    <PencilSimple size={12} />
                    Rename
                  </button>
                  <button className="btn-text" onClick={() => onDeleteArtifact(artifact.id)} style={{ fontSize: 12, color: "var(--ink-muted)" }}>
                    <Trash size={12} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


function FieldLabel({ children }: { children: React.ReactNode }) {
  return <MetaLabel style={{ marginBottom: 10 }}>{children}</MetaLabel>;
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
        <PrimaryButton onClick={onContinue}>
          {continueLabel}
        </PrimaryButton>
      )}
    </div>
  );
}

