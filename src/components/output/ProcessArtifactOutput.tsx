import { useMemo } from "react";
import { Check, Copy, DownloadSimple } from "@phosphor-icons/react";
import { MetaLabel, SectionNumber } from "../ui";
import type { ProcessMove, ProcessPlan } from "../../types";
import { OutputSection, LeadTakeaway } from "./OutputSection";
import { OutputActionBar } from "./OutputActionBar";
import { CoverageRing } from "./OutputCharts";

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

function BoundaryRow({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 16, flexWrap: "wrap" }}>
      <MetaLabel style={{ whiteSpace: "nowrap", minWidth: 110, flexShrink: 0, margin: 0 }}>{label}</MetaLabel>
      <span style={{ fontSize: 13, color: "var(--ink-light)", lineHeight: 1.55 }}>{items.join(" · ")}</span>
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
          style={{ margin: i === lines.length - 1 ? 0 : "0 0 7px", fontSize: 14, color: "var(--ink-light)", lineHeight: 1.7 }}
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

  // Derived finding: easy-way-back guarantee + the bad-day check, plain.
  const coverageFinding =
    lowDayMoves > 0
      ? `On a low-energy day you still have ${lowDayMoves} thing${lowDayMoves === 1 ? "" : "s"} you can do. Getting back in is easy, so stopping never turns into starting over.`
      : "Most of this needs a good chunk of time and energy. On a low day there's not much to reach for — add one small, easy step so a quiet day doesn't turn into a full stop.";

  const notDoing = plan.notDoing.length > 0 ? plan.notDoing : ["No explicit boundaries set yet."];

  return (
    <div style={{ display: "grid", gap: 80, minWidth: 0, maxWidth: 720 }}>
      {/* LEAD — the bad-day guarantee + the ring, side by side. */}
      <div style={{ display: "flex", gap: 32, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <LeadTakeaway kind="Built for bad days too">{coverageFinding}</LeadTakeaway>
        </div>
        <CoverageRing lowDayMoves={lowDayMoves} totalMoves={totalMoves} />
      </div>

      {/* GOAL + boundaries — the artifact's anchor, stacked. */}
      <div>
        <h2 style={{ margin: "0 0 12px", fontSize: 22, fontWeight: 500, color: "var(--ink)", letterSpacing: 0, lineHeight: 1.3 }}>
          {plan.goal}
        </h2>
        <p style={{ margin: "0 0 20px", fontSize: 15, color: "var(--ink-light)", lineHeight: 1.7, maxWidth: 680 }}>
          {plan.thesis}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 18, borderTop: "1px solid var(--rule)" }}>
          <BoundaryRow label="What you've got" items={plan.workingWith} />
          <BoundaryRow label="Protect" items={plan.protectedConditions} />
          <BoundaryRow label="Skip" items={notDoing} />
        </div>
      </div>

      {/* Session start */}
      <OutputSection label="Before you start" subtitle="Ask yourself first: what have I actually got today?">
        <div style={{ display: "grid", gap: 28 }}>
          {plan.checkInModes.map((mode) => (
            <div key={mode.label} style={moveCardStyle}>
              <MetaLabel>{mode.label}</MetaLabel>
              <p style={{ margin: 0, fontSize: 14, color: "var(--ink-light)", lineHeight: 1.7 }}>{mode.guidance}</p>
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
              <div style={{ display: "grid", gridTemplateColumns: "32px 1fr", gap: 12, marginBottom: 12 }}>
                <div style={{ paddingTop: 2 }}>
                  <SectionNumber number={String(index + 1).padStart(2, "0")} />
                </div>
                <div>
                  <h4 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 500, color: "var(--ink)", letterSpacing: 0 }}>
                    {block.title}
                  </h4>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--ink-muted)", lineHeight: 1.65 }}>{block.summary}</p>
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
        subtitle="When you've stopped and can't find your way back in, start here. Not for when things go wrong — for when you've gone quiet."
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
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {plan.measures.map((measure) => (
              <li key={measure} style={{ fontSize: 14, color: "var(--ink-light)", lineHeight: 1.7, marginBottom: 6 }}>
                {measure}
              </li>
            ))}
          </ul>
          <p style={{ margin: "14px 0 0", fontSize: 14, color: "var(--ink-light)", lineHeight: 1.7 }}>
            Once a week, ask: {plan.weeklyQuestion}
          </p>
        </div>
      </OutputSection>

      {/* HANDOFF — the file you give to an AI. Not for reading; just download. */}
      <div style={{ border: "1px solid rgba(91,138,138,0.25)", background: "rgba(91,138,138,0.06)", padding: "18px 20px" }}>
        <MetaLabel color="var(--teal)" style={{ marginBottom: 8 }}>Hand this to your AI</MetaLabel>
        <p style={{ margin: "0 0 14px", fontSize: 14, color: "var(--ink-light)", lineHeight: 1.6, maxWidth: 620 }}>
          So you don't have to decide what to do when you've got nothing left to decide with. Drop this into ChatGPT,
          Claude, or any AI app, tell it how much energy you have today, and it picks the right step for you — no
          staring at the whole plan, no figuring out where to start. Download keeps a file; copy drops it straight
          into a conversation.
        </p>
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
