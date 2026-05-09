import type { IntelligenceScorecardMetric } from "../types";
import { MetaLabel, Card } from "./ui";

interface Props {
  metrics: IntelligenceScorecardMetric[];
}

const GRADE_STYLES: Record<string, { border: string; bg: string; pill: string; text: string }> = {
  high: {
    border: "var(--teal)",
    bg: "rgba(91, 138, 138, 0.05)",
    pill: "rgba(91, 138, 138, 0.14)",
    text: "var(--teal)",
  },
  medium: {
    border: "var(--warning)",
    bg: "var(--warning-bg)",
    pill: "var(--warning-pill)",
    text: "var(--warning-deep)",
  },
  low: {
    border: "var(--terracotta)",
    bg: "rgba(180, 107, 88, 0.05)",
    pill: "rgba(180, 107, 88, 0.14)",
    text: "var(--terracotta)",
  },
};

export function IntelligenceScorecard({ metrics }: Props) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: 16,
        alignItems: "stretch",
        maxWidth: 760,
      }}
    >
      {metrics.map((metric) => {
        const s = GRADE_STYLES[metric.grade] ?? GRADE_STYLES.medium;
        const takeaway = metric.takeaway || metric.rationale || "";
        const evidence = metric.evidence;
        return (
          <Card
            key={metric.label}
            background={s.bg}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 12,
              }}
            >
              <MetaLabel style={{ margin: 0 }}>{metric.label}</MetaLabel>
              <span
                style={{
                  display: "inline-block",
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: "var(--font-display)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  padding: "4px 10px",
                  borderRadius: 999,
                  background: s.pill,
                  color: s.text,
                  flexShrink: 0,
                }}
              >
                {metric.grade}
              </span>
            </div>
            <p
              style={{
                fontSize: 13,
                color: "var(--ink)",
                lineHeight: 1.68,
                margin: 0,
                maxWidth: 38 + "ch",
                overflowWrap: "anywhere",
                fontWeight: 500,
              }}
            >
              {takeaway}
            </p>
            {evidence && (
              <p
                style={{
                  fontSize: 12,
                  color: "var(--ink-light)",
                  lineHeight: 1.68,
                  margin: "10px 0 0",
                  maxWidth: 42 + "ch",
                  overflowWrap: "anywhere",
                }}
              >
                {evidence}
              </p>
            )}
          </Card>
        );
      })}
    </div>
  );
}
