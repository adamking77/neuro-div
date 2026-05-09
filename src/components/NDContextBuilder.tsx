import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, DownloadSimple, CaretDown } from "@phosphor-icons/react";
import { MetaLabel, PrimaryButton } from "./ui";
import type {
  NDProfile,
  NDTrait,
  NDTraitManifestation,
  ActivationPattern,
  ShutdownTrigger,
  TimePattern,
  InfoDensity,
  InfoFormat,
  SupportCondition,
} from "../types";
import {
  createEmptyNDProfile,
  loadNDProfile,
  saveNDProfile,
  clearNDProfile,
  buildNDProfileMarkdown,
  TRAIT_LABELS,
  MANIFESTATION_LABELS,
  MANIFESTATIONS_BY_TRAIT,
  ACTIVATION_LABELS,
  SHUTDOWN_LABELS,
  TIME_PATTERN_LABELS,
  INFO_DENSITY_LABELS,
  INFO_FORMAT_LABELS,
  SUPPORT_CONDITION_LABELS,
} from "../lib/nd-profile";

type StepId = "intro" | "traits" | "activation" | "shutdown" | "time" | "history" | "info" | "done";

const STEP_ORDER: StepId[] = ["intro", "traits", "activation", "shutdown", "time", "history", "info", "done"];

const STEP_LABELS: Record<StepId, string> = {
  intro: "Context Builder",
  traits: "Your profile",
  activation: "What activates you",
  shutdown: "What to avoid",
  time: "Time and energy",
  history: "What you've tried",
  info: "How you take in information",
  done: "Your profile is ready",
};

// Reusable checkbox group
function CheckGroup<T extends string>({
  options,
  selected,
  onChange,
}: {
  options: { value: T; label: string }[];
  selected: T[];
  onChange: (value: T, checked: boolean) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {options.map(({ value, label }) => {
        const isChecked = selected.includes(value);
        return (
          <label
            key={value}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              cursor: "pointer",
              padding: "8px 12px",
              border: `1px solid ${isChecked ? "var(--teal)" : "var(--rule)"}`,
              background: isChecked ? "rgba(91, 138, 138, 0.05)" : "transparent",
              transition: "border-color 0.12s, background 0.12s",
            }}
          >
            <span
              style={{
                width: 16,
                height: 16,
                border: `1.5px solid ${isChecked ? "var(--teal)" : "rgba(26,26,24,0.25)"}`,
                borderRadius: 3,
                flexShrink: 0,
                marginTop: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: isChecked ? "var(--teal)" : "transparent",
                transition: "all 0.12s",
              }}
            >
              {isChecked && (
                <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                  <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => onChange(value, e.target.checked)}
              style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
              tabIndex={-1}
            />
            <span style={{ fontSize: 14, color: "var(--ink)", lineHeight: 1.55 }}>{label}</span>
          </label>
        );
      })}
    </div>
  );
}

// Radio group for single-select
function RadioGroup<T extends string>({
  options,
  selected,
  onChange,
}: {
  options: { value: T; label: string }[];
  selected: T | null;
  onChange: (value: T) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {options.map(({ value, label }) => {
        const isChecked = selected === value;
        return (
          <label
            key={value}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              cursor: "pointer",
              padding: "8px 12px",
              border: `1px solid ${isChecked ? "var(--teal)" : "var(--rule)"}`,
              background: isChecked ? "rgba(91, 138, 138, 0.05)" : "transparent",
              transition: "border-color 0.12s, background 0.12s",
            }}
          >
            <span
              style={{
                width: 16,
                height: 16,
                border: `1.5px solid ${isChecked ? "var(--teal)" : "rgba(26,26,24,0.25)"}`,
                borderRadius: "50%",
                flexShrink: 0,
                marginTop: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.12s",
              }}
            >
              {isChecked && (
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "var(--teal)",
                    display: "block",
                  }}
                />
              )}
            </span>
            <input
              type="radio"
              checked={isChecked}
              onChange={() => onChange(value)}
              style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
              tabIndex={-1}
            />
            <span style={{ fontSize: 14, color: "var(--ink)", lineHeight: 1.55 }}>{label}</span>
          </label>
        );
      })}
    </div>
  );
}



function FieldHint({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 12, color: "var(--ink-muted)", margin: "6px 0 0", lineHeight: 1.6 }}>
      {children}
    </p>
  );
}

function Field({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ marginBottom: 32, ...style }}>
      {children}
    </div>
  );
}

function StepNav({
  onBack,
  onContinue,
  continueLabel = "Continue",
  showBack = true,
  continueDisabled = false,
}: {
  onBack?: () => void;
  onContinue?: () => void;
  continueLabel?: string;
  showBack?: boolean;
  continueDisabled?: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 40, paddingTop: 32, borderTop: "1px solid var(--rule)" }}>
      {showBack && onBack && (
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
        <PrimaryButton onClick={onContinue} disabled={continueDisabled}>
          {continueLabel}
        </PrimaryButton>
      )}
    </div>
  );
}

// Step: Intro
function IntroStep({ onBegin, hasExisting }: { onBegin: () => void; hasExisting: boolean }) {
  return (
    <div style={{ maxWidth: 600 }}>
      <p style={{ fontSize: 15, color: "var(--ink)", lineHeight: 1.75, margin: "0 0 20px" }}>
        Most AI tools treat everyone the same. This one treats you like you.
      </p>
      <p style={{ fontSize: 14, color: "var(--ink-light)", lineHeight: 1.7, margin: "0 0 20px" }}>
        Answer questions about what energizes you, what shuts you down, and how you take in information. You get a profile file. Paste it into any AI you use. That AI will then respond in ways that match how you work.
      </p>
      <p style={{ fontSize: 14, color: "var(--ink-light)", lineHeight: 1.7, margin: "0 0 36px" }}>
        10 to 15 minutes. Stop whenever. Skip anything you do not want to answer.
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <PrimaryButton onClick={onBegin}>
          {hasExisting ? "Continue where I left off" : "Begin"}
        </PrimaryButton>
        {hasExisting && (
          <button
            onClick={() => {
              if (window.confirm("Start a new profile? Your current one will be cleared.")) {
                clearNDProfile();
                onBegin();
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

// Step: Traits
function TraitsStep({
  profile,
  onChange,
  onBack,
  onContinue,
}: {
  profile: NDProfile;
  onChange: (update: Partial<NDProfile["traits"]>) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const traitOptions = (Object.entries(TRAIT_LABELS) as [NDTrait, string][]).map(([value, label]) => ({ value, label }));
  const selected = profile.traits.selected;

  function toggleTrait(trait: NDTrait, checked: boolean) {
    const next = checked ? [...selected, trait] : selected.filter((t) => t !== trait);
    onChange({ selected: next });
  }

  function toggleManifestation(m: NDTraitManifestation, checked: boolean) {
    const current = profile.traits.manifestations;
    const next = checked ? [...current, m] : current.filter((x) => x !== m);
    onChange({ manifestations: next });
  }

  return (
    <div>
      <p style={{ fontSize: 15, color: "var(--ink-light)", lineHeight: 1.7, margin: "0 0 32px", maxWidth: 560 }}>
        Start with the broad strokes. Which of these apply to you?
      </p>

      <Field>
        <CheckGroup
          options={traitOptions}
          selected={selected}
          onChange={toggleTrait}
        />
        <div style={{ marginTop: 14 }}>
          <input
            type="text"
            value={profile.traits.other}
            onChange={(e) => onChange({ other: e.target.value })}
            placeholder="Something else not listed here"
            style={{ fontSize: 13, padding: "9px 12px" }}
          />
        </div>
      </Field>

      {selected.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <MetaLabel>How do these actually show up for you?</MetaLabel>
          <p style={{ fontSize: 13, color: "var(--ink-muted)", margin: "0 0 16px", lineHeight: 1.6 }}>
            Select what applies. These become the specific instructions in your profile.
          </p>
          {selected.map((trait) => (
            <div key={trait} style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 12, fontWeight: 500, color: "var(--teal-deep)", margin: "0 0 10px", fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}>
                {TRAIT_LABELS[trait].toUpperCase()}
              </p>
              <CheckGroup
                options={MANIFESTATIONS_BY_TRAIT[trait].map((m) => ({ value: m, label: MANIFESTATION_LABELS[m] }))}
                selected={profile.traits.manifestations}
                onChange={toggleManifestation}
              />
            </div>
          ))}
        </div>
      )}

      <Field>
        <MetaLabel>Anything else about how these show up for you?</MetaLabel>
        <textarea
          value={profile.traits.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder="Optional. Your own words, whatever didn't fit the options above"
          rows={3}
          style={{ fontSize: 13 }}
        />
        <FieldHint>This is optional. Skip it if the checkboxes covered it.</FieldHint>
      </Field>

      <StepNav onBack={onBack} onContinue={onContinue} />
    </div>
  );
}

// Step: Activation
function ActivationStep({
  profile,
  onChange,
  onBack,
  onContinue,
}: {
  profile: NDProfile;
  onChange: (update: Partial<NDProfile["activation"]>) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const activationOptions = (Object.entries(ACTIVATION_LABELS) as [ActivationPattern, string][]).map(([value, label]) => ({ value, label }));
  const showOtherField = profile.activation.patterns.includes("other");

  function togglePattern(p: ActivationPattern, checked: boolean) {
    const next = checked
      ? [...profile.activation.patterns, p]
      : profile.activation.patterns.filter((x) => x !== p);
    onChange({ patterns: next });
  }

  return (
    <div>
      <p style={{ fontSize: 15, color: "var(--ink-light)", lineHeight: 1.7, margin: "0 0 32px", maxWidth: 560 }}>
        What actually gets you started? Not what should motivate you. What actually does.
      </p>

      <Field>
        <MetaLabel>What pulls you in</MetaLabel>
        <CheckGroup options={activationOptions} selected={profile.activation.patterns} onChange={togglePattern} />
        {showOtherField && (
          <div style={{ marginTop: 12 }}>
            <input
              type="text"
              value={profile.activation.patternOther}
              onChange={(e) => onChange({ patternOther: e.target.value })}
              placeholder="What else activates you?"
              style={{ fontSize: 13, padding: "9px 12px" }}
            />
          </div>
        )}
      </Field>

      <Field>
        <MetaLabel>What does a good working session feel like?</MetaLabel>
        <textarea
          value={profile.activation.goodDayDescription}
          onChange={(e) => onChange({ goodDayDescription: e.target.value })}
          placeholder="Describe it in your own words. What's different when it's actually going well?"
          rows={4}
          style={{ fontSize: 13 }}
        />
        <FieldHint>This doesn't have to be aspirational. Describe what it's actually like when work clicks for you.</FieldHint>
      </Field>

      <StepNav onBack={onBack} onContinue={onContinue} />
    </div>
  );
}

// Step: Shutdown
function ShutdownStep({
  profile,
  onChange,
  onBack,
  onContinue,
}: {
  profile: NDProfile;
  onChange: (update: Partial<NDProfile["shutdown"]>) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const shutdownOptions = (Object.entries(SHUTDOWN_LABELS) as [ShutdownTrigger, string][]).map(([value, label]) => ({ value, label }));
  const showOtherField = profile.shutdown.triggers.includes("other");

  function toggleTrigger(t: ShutdownTrigger, checked: boolean) {
    const next = checked
      ? [...profile.shutdown.triggers, t]
      : profile.shutdown.triggers.filter((x) => x !== t);
    onChange({ triggers: next });
  }

  return (
    <div>
      <p style={{ fontSize: 15, color: "var(--ink-light)", lineHeight: 1.7, margin: "0 0 32px", maxWidth: 560 }}>
        What makes you want to disappear? This is important. Knowing what to avoid is as useful as knowing what works.
      </p>

      <Field>
        <MetaLabel>Task types that cause avoidance</MetaLabel>
        <CheckGroup options={shutdownOptions} selected={profile.shutdown.triggers} onChange={toggleTrigger} />
        {showOtherField && (
          <div style={{ marginTop: 12 }}>
            <input
              type="text"
              value={profile.shutdown.triggerOther}
              onChange={(e) => onChange({ triggerOther: e.target.value })}
              placeholder="What else triggers avoidance for you?"
              style={{ fontSize: 13, padding: "9px 12px" }}
            />
          </div>
        )}
      </Field>

      <Field>
        <MetaLabel>What does shutdown or avoidance actually look like?</MetaLabel>
        <textarea
          value={profile.shutdown.shutdownDescription}
          onChange={(e) => onChange({ shutdownDescription: e.target.value })}
          placeholder="Not what causes it. What happens when you're in it. Describe your specific pattern."
          rows={4}
          style={{ fontSize: 13 }}
        />
        <FieldHint>Optional but useful. The more specific you are, the more useful this becomes.</FieldHint>
      </Field>

      <StepNav onBack={onBack} onContinue={onContinue} />
    </div>
  );
}

// Step: Time and Energy
function TimeStep({
  profile,
  onChange,
  onBack,
  onContinue,
}: {
  profile: NDProfile;
  onChange: (update: Partial<NDProfile["timeEnergy"]>) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const timeOptions = (Object.entries(TIME_PATTERN_LABELS) as [TimePattern, string][]).map(([value, label]) => ({ value, label }));
  const showOtherField = profile.timeEnergy.patterns.includes("other");

  function togglePattern(p: TimePattern, checked: boolean) {
    const next = checked
      ? [...profile.timeEnergy.patterns, p]
      : profile.timeEnergy.patterns.filter((x) => x !== p);
    onChange({ patterns: next });
  }

  return (
    <div>
      <p style={{ fontSize: 15, color: "var(--ink-light)", lineHeight: 1.7, margin: "0 0 32px", maxWidth: 560 }}>
        How does time and energy actually work for you? Not how you want it to. How it actually does.
      </p>

      <Field>
        <MetaLabel>Which of these sound like you?</MetaLabel>
        <CheckGroup options={timeOptions} selected={profile.timeEnergy.patterns} onChange={togglePattern} />
        {showOtherField && (
          <div style={{ marginTop: 12 }}>
            <input
              type="text"
              value={profile.timeEnergy.patternOther}
              onChange={(e) => onChange({ patternOther: e.target.value })}
              placeholder="Your pattern in your own words"
              style={{ fontSize: 13, padding: "9px 12px" }}
            />
          </div>
        )}
      </Field>

      <Field>
        <MetaLabel>When do you actually tend to sit down and work?</MetaLabel>
        <textarea
          value={profile.timeEnergy.activationWindows}
          onChange={(e) => onChange({ activationWindows: e.target.value })}
          placeholder="Time of day, day of week, conditions. Whatever describes when work actually happens for you"
          rows={3}
          style={{ fontSize: 13 }}
        />
      </Field>

      <Field>
        <MetaLabel>When do you know you'll be unavailable?</MetaLabel>
        <textarea
          value={profile.timeEnergy.unavailablePeriods}
          onChange={(e) => onChange({ unavailablePeriods: e.target.value })}
          placeholder="Burnout periods, recovery days, times when nothing gets done no matter what. Anything predictable"
          rows={3}
          style={{ fontSize: 13 }}
        />
        <FieldHint>These are protected zones. Any process built from your profile will treat silence here as planned rest, not drift.</FieldHint>
      </Field>

      <StepNav onBack={onBack} onContinue={onContinue} />
    </div>
  );
}

// Step: History
function HistoryStep({
  profile,
  onChange,
  onBack,
  onContinue,
}: {
  profile: NDProfile;
  onChange: (update: Partial<NDProfile["history"]>) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <div>
      <p style={{ fontSize: 15, color: "var(--ink-light)", lineHeight: 1.7, margin: "0 0 32px", maxWidth: 560 }}>
        Most neurodivergent people have tried a lot of systems. The history is useful. It stops anything new from recommending something that's already failed.
      </p>

      <Field>
        <MetaLabel>What systems or approaches have you tried?</MetaLabel>
        <textarea
          value={profile.history.triedSystems}
          onChange={(e) => onChange({ triedSystems: e.target.value })}
          placeholder="Apps, methods, structures, routines. Anything you've genuinely tried to stay on track or get things done"
          rows={4}
          style={{ fontSize: 13 }}
        />
      </Field>

      <Field>
        <MetaLabel>What worked, even partially?</MetaLabel>
        <textarea
          value={profile.history.whatWorked}
          onChange={(e) => onChange({ whatWorked: e.target.value })}
          placeholder="It doesn't have to have been sustainable. Just anything that helped for a while"
          rows={3}
          style={{ fontSize: 13 }}
        />
      </Field>

      <Field>
        <MetaLabel>What fell apart?</MetaLabel>
        <textarea
          value={profile.history.whatFailed}
          onChange={(e) => onChange({ whatFailed: e.target.value })}
          placeholder="What specifically caused things to break down? The pattern behind the failures is useful"
          rows={3}
          style={{ fontSize: 13 }}
        />
      </Field>

      <StepNav onBack={onBack} onContinue={onContinue} />
    </div>
  );
}

// Step: Information preferences and support conditions
function InfoStep({
  profile,
  onChange,
  onBack,
  onContinue,
}: {
  profile: NDProfile;
  onChange: (update: Partial<NDProfile["infoConditions"]>) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const densityOptions = (Object.entries(INFO_DENSITY_LABELS) as [InfoDensity, string][]).map(([value, label]) => ({ value, label }));
  const formatOptions = (Object.entries(INFO_FORMAT_LABELS) as [InfoFormat, string][]).map(([value, label]) => ({ value, label }));
  const conditionOptions = (Object.entries(SUPPORT_CONDITION_LABELS) as [SupportCondition, string][]).map(([value, label]) => ({ value, label }));

  const showFormatOther = profile.infoConditions.formats.includes("any");
  const showConditionOther = profile.infoConditions.supportConditions.includes("other");

  function toggleFormat(f: InfoFormat, checked: boolean) {
    const next = checked
      ? [...profile.infoConditions.formats, f]
      : profile.infoConditions.formats.filter((x) => x !== f);
    onChange({ formats: next });
  }

  function toggleCondition(c: SupportCondition, checked: boolean) {
    const next = checked
      ? [...profile.infoConditions.supportConditions, c]
      : profile.infoConditions.supportConditions.filter((x) => x !== c);
    onChange({ supportConditions: next });
  }

  return (
    <div>
      <p style={{ fontSize: 15, color: "var(--ink-light)", lineHeight: 1.7, margin: "0 0 32px", maxWidth: 560 }}>
        Two quick topics. How you prefer information, and what helps you actually work.
      </p>

      <Field>
        <MetaLabel>When taking in information, what works best?</MetaLabel>
        <RadioGroup
          options={densityOptions}
          selected={profile.infoConditions.density}
          onChange={(v) => onChange({ density: v })}
        />
      </Field>

      <Field>
        <MetaLabel>Format that works best for you</MetaLabel>
        <CheckGroup options={formatOptions} selected={profile.infoConditions.formats} onChange={toggleFormat} />
        {showFormatOther && (
          <div style={{ marginTop: 12 }}>
            <input
              type="text"
              value={profile.infoConditions.formatOther}
              onChange={(e) => onChange({ formatOther: e.target.value })}
              placeholder="Anything specific about format?"
              style={{ fontSize: 13, padding: "9px 12px" }}
            />
          </div>
        )}
      </Field>

      <Field>
        <MetaLabel>What conditions help you actually work?</MetaLabel>
        <CheckGroup options={conditionOptions} selected={profile.infoConditions.supportConditions} onChange={toggleCondition} />
        {showConditionOther && (
          <div style={{ marginTop: 12 }}>
            <input
              type="text"
              value={profile.infoConditions.conditionOther}
              onChange={(e) => onChange({ conditionOther: e.target.value })}
              placeholder="What else helps?"
              style={{ fontSize: 13, padding: "9px 12px" }}
            />
          </div>
        )}
      </Field>

      <StepNav onBack={onBack} onContinue={onContinue} continueLabel="Build my profile" />
    </div>
  );
}

// Reusable pill
function ProfilePill({ label, variant = "default" }: { label: string; variant?: "default" | "teal" | "terracotta" }) {
  const styles: Record<string, React.CSSProperties> = {
    default: { background: "rgba(26,26,24,0.04)", color: "var(--ink-light)", border: "1px solid var(--rule)" },
    teal: { background: "rgba(91,138,138,0.1)", color: "var(--teal-deep)", border: "1px solid rgba(91,138,138,0.25)" },
    terracotta: { background: "rgba(196,100,80,0.08)", color: "var(--terracotta)", border: "1px solid rgba(196,100,80,0.2)" },
  };
  return (
    <span
      style={{
        fontSize: 11,
        fontFamily: "var(--font-display)",
        padding: "3px 10px",
        borderRadius: 999,
        whiteSpace: "nowrap",
        ...styles[variant],
      }}
    >
      {label}
    </span>
  );
}

// Summary card component
function SummaryCard({ label, children, variant = "default" }: {
  label: string;
  children: React.ReactNode;
  variant?: "default" | "teal" | "terracotta";
}) {
  const borderColors: Record<string, string> = {
    default: "var(--rule)",
    teal: "rgba(91,138,138,0.25)",
    terracotta: "rgba(196,100,80,0.2)",
  };
  const labelColors: Record<string, string> = {
    default: "var(--ink-muted)",
    teal: "var(--teal)",
    terracotta: "var(--terracotta)",
  };
  return (
    <div style={{ border: `1px solid ${borderColors[variant]}`, padding: "16px 18px" }}>
      <MetaLabel color={labelColors[variant]} style={{ fontWeight: 600, marginBottom: 12 }}>{label}</MetaLabel>
      {children}
    </div>
  );
}

function ProfileSummaryView({ profile }: { profile: NDProfile }) {
  const traits = [
    ...profile.traits.selected.map((t) => TRAIT_LABELS[t]),
    ...(profile.traits.other.trim() ? [profile.traits.other.trim()] : []),
  ];

  const activationPatterns = [
    ...profile.activation.patterns.filter((p) => p !== "other").map((p) => ACTIVATION_LABELS[p]),
    ...(profile.activation.patternOther.trim() ? [profile.activation.patternOther.trim()] : []),
  ];

  const shutdownTriggers = [
    ...profile.shutdown.triggers.filter((t) => t !== "other").map((t) => SHUTDOWN_LABELS[t]),
    ...(profile.shutdown.triggerOther.trim() ? [profile.shutdown.triggerOther.trim()] : []),
  ];

  const timePatterns = [
    ...profile.timeEnergy.patterns.filter((p) => p !== "other").map((p) => TIME_PATTERN_LABELS[p]),
    ...(profile.timeEnergy.patternOther.trim() ? [profile.timeEnergy.patternOther.trim()] : []),
  ];

  const supportConditions = [
    ...profile.infoConditions.supportConditions.filter((c) => c !== "other").map((c) => SUPPORT_CONDITION_LABELS[c]),
    ...(profile.infoConditions.conditionOther.trim() ? [profile.infoConditions.conditionOther.trim()] : []),
  ];

  const infoFormats = [
    ...profile.infoConditions.formats.filter((f) => f !== "any").map((f) => INFO_FORMAT_LABELS[f]),
    ...(profile.infoConditions.formatOther.trim() ? [profile.infoConditions.formatOther.trim()] : []),
  ];

  const hasHistory = profile.history.triedSystems.trim() || profile.history.whatWorked.trim() || profile.history.whatFailed.trim();

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {/* Traits */}
      <SummaryCard label="Your neurotype" variant="teal">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: traits.length > 0 ? 10 : 0 }}>
          {traits.map((t) => (
            <ProfilePill key={t} label={t} variant="teal" />
          ))}
        </div>
        {profile.traits.manifestations.length > 0 && (
          <p style={{ fontSize: 12, color: "var(--ink-light)", lineHeight: 1.6, margin: 0 }}>
            {profile.traits.manifestations.length} specific manifestation{profile.traits.manifestations.length > 1 ? "s" : ""} selected
          </p>
        )}
        {profile.traits.notes.trim() && (
          <p style={{ fontSize: 13, color: "var(--ink-light)", lineHeight: 1.65, margin: "10px 0 0", fontStyle: "italic" }}>
            "{profile.traits.notes.trim()}"
          </p>
        )}
      </SummaryCard>

      {/* Two-column: activation + shutdown */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="constraints-grid">
        <SummaryCard label="What activates you" variant="teal">
          {activationPatterns.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 6 }}>
              {activationPatterns.slice(0, 4).map((p) => (
                <li key={p} style={{ fontSize: 13, color: "var(--ink-light)", lineHeight: 1.55 }}>{p}</li>
              ))}
            </ul>
          ) : (
            <p style={{ fontSize: 13, color: "var(--ink-muted)", margin: 0 }}>No activation patterns selected.</p>
          )}
          {profile.activation.goodDayDescription.trim() && (
            <p style={{ fontSize: 12, color: "var(--ink-light)", lineHeight: 1.6, margin: "10px 0 0", fontStyle: "italic" }}>
              "{profile.activation.goodDayDescription.trim()}"
            </p>
          )}
        </SummaryCard>

        <SummaryCard label="What to avoid" variant="terracotta">
          {shutdownTriggers.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 6 }}>
              {shutdownTriggers.slice(0, 4).map((t) => (
                <li key={t} style={{ fontSize: 13, color: "var(--ink-light)", lineHeight: 1.55 }}>{t}</li>
              ))}
            </ul>
          ) : (
            <p style={{ fontSize: 13, color: "var(--ink-muted)", margin: 0 }}>No avoidance triggers selected.</p>
          )}
          {profile.shutdown.shutdownDescription.trim() && (
            <p style={{ fontSize: 12, color: "var(--ink-light)", lineHeight: 1.6, margin: "10px 0 0", fontStyle: "italic" }}>
              "{profile.shutdown.shutdownDescription.trim()}"
            </p>
          )}
        </SummaryCard>
      </div>

      {/* Time + energy */}
      <SummaryCard label="Time and energy">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
          {timePatterns.map((p) => (
            <ProfilePill key={p} label={p} />
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="constraints-grid">
          {profile.timeEnergy.activationWindows.trim() && (
            <div>
              <p style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--ink-muted)", margin: "0 0 4px" }}>When you work</p>
              <p style={{ fontSize: 13, color: "var(--ink-light)", lineHeight: 1.55, margin: 0 }}>{profile.timeEnergy.activationWindows.trim()}</p>
            </div>
          )}
          {profile.timeEnergy.unavailablePeriods.trim() && (
            <div>
              <p style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--ink-muted)", margin: "0 0 4px" }}>Protected downtime</p>
              <p style={{ fontSize: 13, color: "var(--ink-light)", lineHeight: 1.55, margin: 0 }}>{profile.timeEnergy.unavailablePeriods.trim()}</p>
            </div>
          )}
        </div>
      </SummaryCard>

      {/* Info preferences */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="constraints-grid">
        <SummaryCard label="How you take in information">
          {profile.infoConditions.density && (
            <p style={{ fontSize: 13, color: "var(--ink-light)", lineHeight: 1.55, margin: "0 0 8px" }}>
              <strong style={{ color: "var(--ink)" }}>Density:</strong> {INFO_DENSITY_LABELS[profile.infoConditions.density]}
            </p>
          )}
          {infoFormats.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {infoFormats.map((f) => (
                <ProfilePill key={f} label={f} />
              ))}
            </div>
          )}
        </SummaryCard>

        <SummaryCard label="What helps you work">
          {supportConditions.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {supportConditions.map((c) => (
                <ProfilePill key={c} label={c} />
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: "var(--ink-muted)", margin: 0 }}>No support conditions selected.</p>
          )}
        </SummaryCard>
      </div>

      {/* History — only if filled */}
      {hasHistory && (
        <SummaryCard label="What you've tried">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {profile.history.triedSystems.trim() && (
              <p style={{ fontSize: 13, color: "var(--ink-light)", lineHeight: 1.55, margin: 0 }}>
                <strong style={{ color: "var(--ink)" }}>Tried:</strong> {profile.history.triedSystems.trim()}
              </p>
            )}
            {profile.history.whatWorked.trim() && (
              <p style={{ fontSize: 13, color: "var(--ink-light)", lineHeight: 1.55, margin: 0 }}>
                <strong style={{ color: "var(--ink)" }}>Worked:</strong> {profile.history.whatWorked.trim()}
              </p>
            )}
            {profile.history.whatFailed.trim() && (
              <p style={{ fontSize: 13, color: "var(--ink-light)", lineHeight: 1.55, margin: 0 }}>
                <strong style={{ color: "var(--ink)" }}>Fell apart:</strong> {profile.history.whatFailed.trim()}
              </p>
            )}
          </div>
        </SummaryCard>
      )}

      {/* How to use */}
      <div
        style={{
          background: "rgba(91,138,138,0.06)",
          border: "1px solid rgba(91,138,138,0.2)",
          padding: "16px 18px",
        }}
      >
        <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--teal)", margin: "0 0 10px", fontFamily: "var(--font-mono)" }}>
          How to use this profile
        </p>
        <p style={{ fontSize: 13, color: "var(--ink-light)", lineHeight: 1.65, margin: 0 }}>
          Download the file and paste it into any AI system prompt, Claude Project instructions, or custom GPT context.
          The "For Any Agent Working With Me" section at the bottom is written directly to the AI — it tells the agent how to frame suggestions, what to avoid, and how to match your working style.
        </p>
      </div>
    </div>
  );
}

// Step: Done — profile preview and download
function DoneStep({
  profile,
  onRestart,
  onBack,
}: {
  profile: NDProfile;
  onRestart: () => void;
  onBack: () => void;
}) {
  const markdown = buildNDProfileMarkdown(profile);
  const [showRaw, setShowRaw] = useState(false);

  function downloadProfile() {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(blob);
    anchor.download = `nd-profile-${Date.now()}.md`;
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  }

  const isEmpty = !profile.traits.selected.length && !profile.traits.other.trim();

  return (
    <div>
      {isEmpty ? (
        <p style={{ fontSize: 15, color: "var(--ink-light)", lineHeight: 1.7, margin: "0 0 32px", maxWidth: 560 }}>
          You haven't filled anything in yet. Go back and complete at least the traits section to generate a useful profile.
        </p>
      ) : (
        <>
          <p style={{ fontSize: 15, color: "var(--ink)", lineHeight: 1.75, margin: "0 0 20px", maxWidth: 600, fontWeight: 500 }}>
            Your profile is ready
          </p>

          <ProfileSummaryView profile={profile} />

          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 32, marginBottom: 24, flexWrap: "wrap" }}>
            <PrimaryButton onClick={downloadProfile}>
              <DownloadSimple size={14} />
              Download profile
            </PrimaryButton>
            <button
              onClick={() => setShowRaw((s) => !s)}
              className="btn-text"
              style={{ fontSize: 12, color: "var(--ink-muted)", display: "flex", alignItems: "center", gap: 4 }}
            >
              <motion.span
                animate={{ rotate: showRaw ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                style={{ display: "inline-flex" }}
              >
                <CaretDown size={11} />
              </motion.span>
              {showRaw ? "Hide raw markdown" : "View raw markdown"}
            </button>
            <button
              onClick={onRestart}
              className="btn-text"
              style={{ fontSize: 12, color: "var(--ink-muted)" }}
            >
              Start over
            </button>
          </div>

          <AnimatePresence>
            {showRaw && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 28 }}
                style={{ overflow: "hidden" }}
              >
                <p style={{
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--ink-muted)",
                  margin: "0 0 12px",
                  fontFamily: "var(--font-mono)",
                }}>
                  Raw markdown
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
              </motion.div>
            )}
          </AnimatePresence>
        </>
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

export function NDContextBuilder() {
  const [step, setStep] = useState<StepId>("intro");
  const [profile, setProfile] = useState<NDProfile>(() => loadNDProfile() ?? createEmptyNDProfile());
  const [hasExisting] = useState(() => loadNDProfile() !== null);

  // Auto-save whenever profile changes (not on intro/done steps)
  useEffect(() => {
    if (step !== "intro") {
      saveNDProfile(profile);
    }
  }, [profile, step]);

  const updateTraits = useCallback((update: Partial<NDProfile["traits"]>) => {
    setProfile((p) => ({ ...p, traits: { ...p.traits, ...update } }));
  }, []);

  const updateActivation = useCallback((update: Partial<NDProfile["activation"]>) => {
    setProfile((p) => ({ ...p, activation: { ...p.activation, ...update } }));
  }, []);

  const updateShutdown = useCallback((update: Partial<NDProfile["shutdown"]>) => {
    setProfile((p) => ({ ...p, shutdown: { ...p.shutdown, ...update } }));
  }, []);

  const updateTimeEnergy = useCallback((update: Partial<NDProfile["timeEnergy"]>) => {
    setProfile((p) => ({ ...p, timeEnergy: { ...p.timeEnergy, ...update } }));
  }, []);

  const updateHistory = useCallback((update: Partial<NDProfile["history"]>) => {
    setProfile((p) => ({ ...p, history: { ...p.history, ...update } }));
  }, []);

  const updateInfoConditions = useCallback((update: Partial<NDProfile["infoConditions"]>) => {
    setProfile((p) => ({ ...p, infoConditions: { ...p.infoConditions, ...update } }));
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
    if (window.confirm("Start a new profile? Your current one will be cleared.")) {
      clearNDProfile();
      setProfile(createEmptyNDProfile());
      goToStep("intro");
    }
  }

  const stepIndex = STEP_ORDER.indexOf(step);
  const isFormStep = step !== "intro" && step !== "done";
  const formStepIndex = isFormStep ? STEP_ORDER.indexOf(step) - 1 : null;
  const formStepCount = STEP_ORDER.length - 2; // exclude intro and done

  return (
    <div>
      {step !== "intro" && (
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
            <h2 style={{
              fontSize: 18,
              fontWeight: 500,
              color: "var(--ink)",
              letterSpacing: 0,
              margin: 0,
              lineHeight: 1.2,
            }}>
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
                      background: isDone
                        ? "var(--teal)"
                        : isCurrent
                        ? "rgba(91, 138, 138, 0.4)"
                        : "var(--rule)",
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
        <IntroStep onBegin={() => goToStep("traits")} hasExisting={hasExisting} />
      )}
      {step === "traits" && (
        <TraitsStep profile={profile} onChange={updateTraits} onBack={back} onContinue={next} />
      )}
      {step === "activation" && (
        <ActivationStep profile={profile} onChange={updateActivation} onBack={back} onContinue={next} />
      )}
      {step === "shutdown" && (
        <ShutdownStep profile={profile} onChange={updateShutdown} onBack={back} onContinue={next} />
      )}
      {step === "time" && (
        <TimeStep profile={profile} onChange={updateTimeEnergy} onBack={back} onContinue={next} />
      )}
      {step === "history" && (
        <HistoryStep profile={profile} onChange={updateHistory} onBack={back} onContinue={next} />
      )}
      {step === "info" && (
        <InfoStep profile={profile} onChange={updateInfoConditions} onBack={back} onContinue={next} />
      )}
      {step === "done" && (
        <DoneStep profile={profile} onRestart={handleRestart} onBack={back} />
      )}
    </div>
  );
}
