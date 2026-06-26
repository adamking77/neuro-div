import { useMemo } from "react";
import { ArrowRight, Check, Copy, DownloadSimple } from "@phosphor-icons/react";
import { MetaLabel } from "../ui";
import type { ProcessMove, ProcessPlan } from "../../types";
import { OutputSection, LeadTakeaway, SectionHeading } from "./OutputSection";
import { OutputActionBar } from "./OutputActionBar";
import { CoverageRing, CoverageBars } from "./OutputCharts";
import { buildProcessBenefits } from "../../lib/process-designer";

/** Parse the high end of an effort string like "45-90 minutes" → 90. */
function effortMinutes(effort: string): number {
  const numbers = effort.match(/\d+/g)?.map(Number) ?? [];
  if (numbers.length === 0) return 0;
  return Math.max(...numbers);
}

/** Bucket a move by the size of working window its effort implies. Display
 * grouping only — not a score, not a measure of the person. */
function effortBand(effort: string): "low" | "normal" | "high" {
  const minutes = effortMinutes(effort);
  if (minutes > 0 && minutes <= 15) return "low";
  if (minutes <= 40) return "normal";
  return "high";
}

/** A boundary as its own labelled block with marked rows, so multiple long
 * items stay scannable instead of running together on one line. Optional accent
 * colours the label and markers (teal = keep, terracotta = avoid). */
function BoundaryGroup({ label, items, accent }: { label: string; items: string[]; accent?: string }) {
  if (items.length === 0) return null;
  const dot = accent ?? "var(--ink-muted)";
  return (
    <div>
      <MetaLabel color={accent} style={{ marginBottom: 10 }}>{label}</MetaLabel>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
        {items.map((item) => (
          <li key={item} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span aria-hidden style={{ flexShrink: 0, width: 6, height: 6, marginTop: 8, borderRadius: 999, background: dot }} />
            <span style={{ fontSize: 15, color: "var(--ink-light)", lineHeight: 1.55 }}>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Open treatment — no box, no rule. Moves are separated by generous space so
// each reads as its own unit without walls or dividers.
const moveCardStyle: React.CSSProperties = {};

function MoveCard({ move }: { move: ProcessMove }) {
  const lines = [
    { label: "Trigger", value: move.trigger },
    { label: "Action", value: move.action },
    { label: "Done signal", value: move.doneSignal },
    { label: "Why this fits you", value: move.whyItFits },
  ];
  return (
    <div style={moveCardStyle}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
        <h5 style={{ margin: 0, fontSize: 15, fontWeight: 500, color: "var(--ink)", letterSpacing: 0, lineHeight: 1.25 }}>
          {move.title}
        </h5>
        <span className="mono" style={{ fontSize: 9, color: "var(--ink-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {move.effort}
        </span>
      </div>
      {lines.map((line, i) => (
        <p
          key={line.label}
          style={{ margin: i === lines.length - 1 ? 0 : "0 0 10px", fontSize: 15, color: "var(--ink-light)", lineHeight: 1.7 }}
        >
          <span style={{ color: "var(--ink)", fontWeight: 500 }}>{line.label}:</span> {line.value}
        </p>
      ))}
    </div>
  );
}

export function ProcessArtifactOutput({
  plan,
  copiedBrief,
  onCopyBrief,
  onDownload,
  onSaveAsNew,
  onRestart,
}: {
  plan: ProcessPlan;
  copiedBrief: boolean;
  onCopyBrief: () => void;
  onDownload: () => void;
  onSaveAsNew: () => void;
  onRestart: () => void;
}) {
  const allMoves = useMemo(() => plan.blocks.flatMap((b) => b.moves), [plan.blocks]);

  // Energy coverage: how many moves exist at each working-window size. The
  // question this answers — does this process still have a move on a bad day?
  const coverage = useMemo(() => {
    const counts = { low: 0, normal: 0, high: 0 };
    for (const move of allMoves) counts[effortBand(move.effort)] += 1;
    return counts;
  }, [allMoves]);

  const totalMoves = allMoves.length + plan.rescueMoves.length;
  const lowDayMoves = coverage.low + plan.rescueMoves.length;

  // Breakdown of every move by the size of working window it needs. Rescue moves
  // are all short, so they sit in the low-energy band alongside lowDayMoves.
  const coverageData = [
    { label: "Tiny steps, under 15 minutes", value: coverage.low + plan.rescueMoves.length, tone: "teal" as const },
    { label: "A normal sitting", value: coverage.normal, tone: "teal" as const },
    { label: "A real stretch of time", value: coverage.high, tone: "muted" as const },
  ];

  // Derived finding: easy-way-back guarantee + the bad-day check, plain.
  const coverageFinding =
    lowDayMoves > 0
      ? `On a low-energy day you still have ${lowDayMoves} thing${lowDayMoves === 1 ? "" : "s"} you can do. Getting back in is easy, so stopping never turns into starting over.`
      : "Most of this needs a good chunk of time and energy. On a low day there's not much to reach for. Add one small, easy step so a quiet day doesn't turn into a full stop.";

  const notDoing = plan.notDoing.length > 0 ? plan.notDoing : ["No explicit boundaries set yet."];

  // The payoff: what the AI does once it's running this plan with you.
  const benefits = buildProcessBenefits(plan);

  return (
    <div style={{ display: "grid", gap: 72, minWidth: 0, maxWidth: 720 }}>
      {/* LEAD — the bad-day guarantee + the ring, then the per-energy breakdown. */}
      <div style={{ display: "grid", gap: 32 }}>
        <div style={{ display: "flex", gap: 32, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <LeadTakeaway kind="Built for bad days too">{coverageFinding}</LeadTakeaway>
          </div>
          <CoverageRing lowDayMoves={lowDayMoves} totalMoves={totalMoves} />
        </div>
        <div style={{ paddingTop: 4 }}>
          <MetaLabel style={{ marginBottom: 12 }}>What you can reach, by energy level</MetaLabel>
          <CoverageBars data={coverageData} />
        </div>
      </div>

      {/* GOAL + boundaries — the artifact's anchor, stacked. */}
      <div>
        <h2 style={{ margin: "0 0 12px", fontSize: 22, fontWeight: 500, color: "var(--ink)", letterSpacing: 0, lineHeight: 1.3 }}>
          {plan.goal}
        </h2>
        <p style={{ margin: "0 0 20px", fontSize: 15, color: "var(--ink-light)", lineHeight: 1.7, maxWidth: 680 }}>
          {plan.thesis}
        </p>
        <div style={{ display: "grid", gap: 24, paddingTop: 20, borderTop: "1px solid var(--rule)" }}>
          <BoundaryGroup label="What you've got" items={plan.workingWith} />
          <BoundaryGroup label="Protect" items={plan.protectedConditions} accent="var(--teal-deep)" />
          <BoundaryGroup label="Skip" items={notDoing} accent="var(--terracotta)" />
        </div>
      </div>

      {/* Session start */}
      <OutputSection label="Before you start" subtitle="Ask yourself first: what have I actually got today?">
        <div style={{ display: "grid", gap: 28 }}>
          {plan.checkInModes.map((mode) => (
            <div key={mode.label} style={moveCardStyle}>
              <MetaLabel>{mode.label}</MetaLabel>
              <p style={{ margin: 0, fontSize: 15, color: "var(--ink-light)", lineHeight: 1.7 }}>{mode.guidance}</p>
            </div>
          ))}
        </div>
      </OutputSection>

      {/* Step menu */}
      <OutputSection
        label="Things you can do"
        subtitle="Pick whatever fits your energy today. You don't have to start at the beginning."
      >
        <div style={{ display: "grid", gap: 48 }}>
          {plan.blocks.map((block, index) => (
            <div key={block.id}>
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  alignItems: "baseline",
                  paddingBottom: 18,
                  marginBottom: 28,
                  borderBottom: "1px solid var(--rule)",
                }}
              >
                <span
                  className="mono"
                  style={{
                    flexShrink: 0,
                    minWidth: 26,
                    fontSize: 18,
                    fontWeight: 600,
                    color: "var(--teal)",
                    letterSpacing: "0.02em",
                    lineHeight: 1,
                  }}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div style={{ minWidth: 0 }}>
                  <h4 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 500, color: "var(--ink)", letterSpacing: 0, lineHeight: 1.3 }}>
                    {block.title}
                  </h4>
                  <p style={{ margin: 0, fontSize: 15, color: "var(--ink-muted)", lineHeight: 1.6 }}>{block.summary}</p>
                </div>
              </div>
              <div style={{ display: "grid", gap: 28 }}>
                {block.moves.map((move) => (
                  <MoveCard key={move.title} move={move} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </OutputSection>

      {/* Rescue */}
      <OutputSection
        label="If you've stalled"
        subtitle="When you've stopped and can't find your way back in, start here. Not for when things go wrong, but for when you've just gone quiet."
      >
        <div style={{ display: "grid", gap: 28 }}>
          {plan.rescueMoves.map((move) => (
            <MoveCard key={move.title} move={move} />
          ))}
        </div>
      </OutputSection>

      {/* Measurement */}
      <OutputSection label="How to tell if it's working" subtitle="A few honest questions to check in on, not metrics to hit.">
        <div style={moveCardStyle}>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 12 }}>
            {plan.measures.map((measure) => (
              <li key={measure} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span aria-hidden style={{ flexShrink: 0, width: 6, height: 6, marginTop: 9, borderRadius: 999, background: "var(--teal)" }} />
                <span style={{ fontSize: 15, color: "var(--ink-light)", lineHeight: 1.7 }}>{measure}</span>
              </li>
            ))}
          </ul>
          <p style={{ margin: "18px 0 0", fontSize: 15, color: "var(--ink-light)", lineHeight: 1.7 }}>
            Once a week, ask: {plan.weeklyQuestion}
          </p>
        </div>
      </OutputSection>

      {/* CLOSE — what the AI does once it's running this plan, plus how to use
          it. Mirrors the Context profile close: payoff, then the deliverable,
          then plain instructions. */}
      <div style={{ border: "1px solid rgba(91,138,138,0.25)", background: "rgba(91,138,138,0.06)", padding: "26px 28px" }}>
        <SectionHeading color="var(--teal-deep)" marginBottom={8}>What happens when you hand it over</SectionHeading>
        <p style={{ margin: "0 0 28px", fontSize: 15, color: "var(--ink-light)", lineHeight: 1.6, maxWidth: 600 }}>
          This turns your plan into something an AI can run with you. Tell it how much energy you've got today, and
          it picks the step. No staring at the whole thing, no deciding what to do when you've got nothing left to
          decide with.
        </p>

        {benefits.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <MetaLabel color="var(--teal)" style={{ marginBottom: 12 }}>What it'll do with this</MetaLabel>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 12 }}>
              {benefits.map((b) => (
                <li key={b} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <ArrowRight size={14} color="var(--teal-deep)" weight="bold" style={{ flexShrink: 0, marginTop: 4 }} />
                  <span style={{ fontSize: 15, color: "var(--ink)", lineHeight: 1.6 }}>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <OutputActionBar
          actions={[
            { key: "download", label: "Download process", icon: <DownloadSimple size={14} />, onClick: onDownload, primary: true },
            {
              key: "copy",
              label: copiedBrief ? "Copied" : "Copy instructions",
              icon: copiedBrief ? <Check size={12} /> : <Copy size={12} />,
              onClick: onCopyBrief,
              color: copiedBrief ? "var(--teal-deep)" : undefined,
            },
          ]}
        />

        <div style={{ marginTop: 24, paddingTop: 22, borderTop: "1px solid rgba(91,138,138,0.25)" }}>
          <MetaLabel color="var(--teal)" style={{ marginBottom: 12 }}>How to use it</MetaLabel>
          <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
            {[
              "Copy the instructions above, or download the file.",
              "Open ChatGPT, Claude, or any AI app you use.",
              "When you sit down to work on this goal, paste it in and tell it your energy for the day. Or save it as a project for this goal, so it's ready every time you come back.",
            ].map((stepText, i) => (
              <li key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span
                  aria-hidden
                  style={{
                    flexShrink: 0,
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    color: "var(--teal-deep)",
                    lineHeight: "24px",
                    minWidth: 14,
                  }}
                >
                  {i + 1}
                </span>
                <span style={{ fontSize: 15, color: "var(--ink-light)", lineHeight: 1.6 }}>{stepText}</span>
              </li>
            ))}
          </ol>
          <p style={{ margin: "14px 0 0", fontSize: 15, color: "var(--ink-light)", lineHeight: 1.6, maxWidth: 600 }}>
            From then on it runs the plan with you, one fitting step at a time.
          </p>
        </div>
      </div>

      {/* Quiet footer — admin actions, out of the way. */}
      <div>
        <OutputActionBar
          actions={[
            { key: "save", label: "Save as new", onClick: onSaveAsNew },
            { key: "restart", label: "Start over", onClick: onRestart },
          ]}
        />
      </div>
    </div>
  );
}
