import type { IntelligenceScorecardMetric } from "../types";

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
    border: "#b8860b",
    bg: "rgba(196, 164, 132, 0.05)",
    pill: "rgba(196, 164, 132, 0.18)",
    text: "#966f00",
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
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: 14,
        alignItems: "stretch",
      }}
    >
      {metrics.map((metric) => {
        const s = GRADE_STYLES[metric.grade] ?? GRADE_STYLES.medium;
        return (
          <div
            key={metric.label}
            style={{
              background: s.bg,
              border: "1px solid var(--rule)",
              padding: "16px 18px",
              minHeight: 0,
            }}
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
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--ink-muted)",
                  margin: 0,
                  fontFamily: "var(--font-mono)",
                }}
              >
                {metric.label}
              </p>
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
                fontSize: 12.5,
                color: "var(--ink-light)",
                lineHeight: 1.72,
                margin: 0,
                maxWidth: 42 + "ch",
              }}
            >
              {metric.rationale}
            </p>
          </div>
        );
      })}
    </div>
  );
}
