import { Spinner } from "@heroui/react";
import { WarningCircle } from "@phosphor-icons/react";
import type { IntelligenceBrief, IntelligenceStatus } from "../types";
import { IntelligenceScorecard } from "./IntelligenceScorecard";
import { IntelligenceNarrative } from "./IntelligenceNarrative";
import { IntelligenceTable } from "./IntelligenceTable";
import { IntelligenceRiskMatrix } from "./IntelligenceRiskMatrix";
import { IntelligenceTimeline } from "./IntelligenceTimeline";
import { IntelligenceResources } from "./IntelligenceResources";

interface Props {
  brief: IntelligenceBrief | null;
  status: IntelligenceStatus;
  error?: string;
}

interface SectionProps {
  label: string;
  number: string;
  children: React.ReactNode;
}

function Section({ label, number, children }: SectionProps) {
  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            fontFamily: "var(--font-mono)",
            color: "var(--teal)",
            letterSpacing: "0.05em",
          }}
        >
          {number}
        </span>
        <h3
          style={{
            fontSize: 15,
            fontWeight: 600,
            fontFamily: "var(--font-display)",
            color: "var(--ink)",
            margin: 0,
          }}
        >
          {label}
        </h3>
      </div>
      {children}
    </div>
  );
}

export function IntelligenceView({ brief, status, error }: Props) {
  if (status === "researching" || status === "drafting") {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center" }}>
        <Spinner size="md" color="current" />
        <p
          style={{
            fontSize: 13,
            color: "var(--ink-muted)",
            marginTop: 16,
            fontFamily: "var(--font-mono)",
          }}
        >
          {status === "researching" ? "Running market research…" : "Writing the brief…"}
        </p>
        <p style={{ fontSize: 11, color: "var(--ink-muted)", opacity: 0.6, marginTop: 6 }}>
          This takes 60–120 seconds.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: "40px 24px",
          textAlign: "center",
          background: "rgba(180, 107, 88, 0.06)",
          borderRadius: 8,
          border: "1px solid rgba(180, 107, 88, 0.2)",
        }}
      >
        <WarningCircle size={24} color="var(--terracotta)" style={{ marginBottom: 10 }} />
        <p style={{ fontSize: 13, color: "var(--terracotta)", margin: "0 0 6px", fontWeight: 600 }}>
          Intelligence brief failed
        </p>
        <p style={{ fontSize: 12, color: "var(--ink-light)", margin: 0 }}>{error}</p>
      </div>
    );
  }

  if (!brief) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center" }}>
        <p
          style={{
            fontSize: 14,
            color: "var(--ink-muted)",
            margin: "0 0 8px",
            fontFamily: "var(--font-display)",
          }}
        >
          No brief yet
        </p>
        <p style={{ fontSize: 12, color: "var(--ink-muted)", opacity: 0.7, margin: 0, maxWidth: 400, marginInline: "auto" }}>
          Generate a brief to see where you stand in the market, how you compare to competitors, where to show up, and a 90-day plan.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Executive Summary */}
      <div
        style={{
          background: "var(--cream)",
          border: "1px solid var(--rule)",
          borderRadius: 8,
          padding: "20px 24px",
          marginBottom: 32,
        }}
      >
        <p
          style={{
            fontSize: 10,
            fontWeight: 600,
            fontFamily: "var(--font-mono)",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "var(--ink-muted)",
            margin: "0 0 10px",
          }}
        >
          Executive Summary
        </p>
        <p
          style={{
            fontSize: 14,
            color: "var(--ink)",
            lineHeight: 1.7,
            margin: 0,
            fontStyle: "italic",
          }}
        >
          {brief.summary}
        </p>
      </div>

      {/* Scorecard */}
      <Section label="Where You Stand" number="01">
        <IntelligenceScorecard metrics={brief.scorecard.metrics} />
      </Section>

      {/* Landscape */}
      <Section label="The Market" number="02">
        <IntelligenceNarrative content={brief.landscape.content} callouts={brief.landscape.callouts} />
      </Section>

      {/* Positioning */}
      <Section label="How You Compare" number="03">
        <IntelligenceTable
          headers={brief.positioning.headers}
          rows={brief.positioning.rows.map((r) => ({
            dimension: r.dimension,
            us: r.us,
            competitorA: r.competitorA,
            competitorB: r.competitorB,
            usSentiment: r.usSentiment,
          }))}
          sentimentKey="usSentiment"
        />
      </Section>

      {/* Channels */}
      <Section label="Where to Show Up" number="04">
        <IntelligenceTable
          headers={brief.channels.headers}
          rows={brief.channels.rows.map((r) => ({
            channel: r.channel,
            fitScore: r.fitScore,
            effort: r.effort,
            speed: r.speed,
            evidence: r.evidence,
            verdict: r.verdict,
          }))}
        />
      </Section>

      {/* Risks */}
      <Section label="What Could Go Wrong" number="05">
        <IntelligenceRiskMatrix risks={brief.risks.risks} />
      </Section>

      {/* Timeline */}
      <Section label="90-Day Plan" number="06">
        <IntelligenceTimeline phases={brief.timeline.phases} />
      </Section>

      {/* Resources */}
      <Section label="What This Actually Requires" number="07">
        <IntelligenceResources
          time={brief.resources.time}
          budget={brief.resources.budget}
          tools={brief.resources.tools}
          skills={brief.resources.skills}
          gaps={brief.resources.gaps}
        />
      </Section>

      {/* Generated timestamp */}
      <div style={{ textAlign: "center", padding: "20px 0 40px" }}>
        <span
          style={{
            fontSize: 10,
            fontFamily: "var(--font-mono)",
            color: "var(--ink-muted)",
            opacity: 0.5,
          }}
        >
          Generated {new Date(brief.generatedAt).toLocaleString()}
        </span>
      </div>
    </div>
  );
}
