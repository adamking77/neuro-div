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
            fontWeight: 400,
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

function splitIntoSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function chunkParagraphs(text: string, sentencesPerParagraph: number) {
  const explicitParagraphs = text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (explicitParagraphs.length > 1) {
    return explicitParagraphs;
  }

  const sentences = splitIntoSentences(text);
  if (sentences.length === 0) {
    return text
      .split(/(?<=,)\s+/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
      .reduce<string[]>((chunks, paragraph) => {
        const current = chunks[chunks.length - 1];
        if (!current || current.length > 180) {
          chunks.push(paragraph);
        } else {
          chunks[chunks.length - 1] = `${current} ${paragraph}`;
        }
        return chunks;
      }, []);
  }

  if (sentences.length <= 2 && text.length < 220) {
    return [text.trim()];
  }

  const paragraphs: string[] = [];
  for (let i = 0; i < sentences.length; i += sentencesPerParagraph) {
    paragraphs.push(sentences.slice(i, i + sentencesPerParagraph).join(" "));
  }

  return paragraphs;
}

function LoadingStep({ label, done, active }: { label: string; done: boolean; active: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 18, height: 18, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {done ? (
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--teal)",
              display: "block",
              opacity: 0.5,
            }}
          />
        ) : active ? (
          <span className="spinner" />
        ) : (
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              border: "1px solid var(--rule)",
              display: "block",
              opacity: 0.4,
            }}
          />
        )}
      </div>
      <span
        style={{
          fontSize: 13,
          fontFamily: "var(--font-mono)",
          color: active ? "var(--ink)" : done ? "var(--ink-muted)" : "var(--ink-muted)",
          opacity: active ? 1 : done ? 0.5 : 0.35,
        }}
      >
        {label}
      </span>
    </div>
  );
}

export function IntelligenceView({ brief, status, error }: Props) {
  if (status === "researching" || status === "drafting") {
    return (
      <div style={{ padding: "48px 0" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 340 }}>
          <LoadingStep
            label="Market research"
            done={status === "drafting"}
            active={status === "researching"}
          />
          <LoadingStep
            label="Writing the brief"
            done={false}
            active={status === "drafting"}
          />
        </div>
        <p style={{ fontSize: 11, color: "var(--ink-muted)", marginTop: 20, opacity: 0.6 }}>
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
            color: "var(--ink)",
            margin: "0 0 6px",
            fontWeight: 500,
          }}
        >
          Nothing here yet
        </p>
        <p style={{ fontSize: 13, color: "var(--ink-muted)", margin: 0, maxWidth: 400, marginInline: "auto", lineHeight: 1.6 }}>
          Generate a brief to see where you actually stand — market position, competitive gaps, where to show up, and a 90-day roadmap.
        </p>
      </div>
    );
  }

  const summaryParagraphs = chunkParagraphs(brief.summary, 2);

  const gradePillStyle = (grade: string): React.CSSProperties => {
    if (grade === "high") {
      return { background: "rgba(91,138,138,0.1)", color: "var(--teal-deep)", border: "1px solid rgba(91,138,138,0.25)" };
    }
    if (grade === "low") {
      return { background: "rgba(180,107,88,0.08)", color: "var(--terracotta)", border: "1px solid rgba(180,107,88,0.2)" };
    }
    return { background: "rgba(196,164,132,0.12)", color: "#966f00", border: "1px solid rgba(196,164,132,0.25)" };
  };

  return (
    <div>
      {/* Executive Summary */}
      <div
        style={{
          background: "var(--cream)",
          border: "1px solid var(--rule)",
          borderLeft: "3px solid var(--teal)",
          padding: "24px 26px",
          marginBottom: 16,
        }}
      >
        <p
          style={{
            fontSize: 10,
            fontWeight: 600,
            fontFamily: "var(--font-mono)",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "var(--teal)",
            margin: "0 0 14px",
          }}
        >
          Executive Summary
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 760 }}>
          {summaryParagraphs.map((paragraph, index) => (
            <p
              key={index}
              style={{
                fontSize: 15,
                color: "var(--ink)",
                lineHeight: 1.75,
                margin: 0,
                overflowWrap: "anywhere",
              }}
            >
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      {/* Key Takeaways */}
      {brief.scorecard.metrics.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 32, alignItems: "center" }}>
          <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--ink-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Key takeaways
          </span>
          {brief.scorecard.metrics.slice(0, 4).map((metric) => (
            <span
              key={metric.label}
              style={{
                fontSize: 10,
                fontFamily: "var(--font-display)",
                fontWeight: 500,
                padding: "3px 10px",
                borderRadius: 999,
                whiteSpace: "nowrap",
                ...gradePillStyle(metric.grade),
              }}
            >
              {metric.label}: {metric.grade}
            </span>
          ))}
        </div>
      )}

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
