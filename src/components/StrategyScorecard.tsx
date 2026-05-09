import type { StrategyScorecard as StrategyScorecardType } from "../types";
import { MetaLabel, Card } from "./ui";

interface Props {
  scorecard: StrategyScorecardType;
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
    bg: "rgba(196, 164, 132, 0.05)",
    pill: "rgba(196, 164, 132, 0.18)",
    text: "var(--warning-deep)",
  },
  low: {
    border: "var(--terracotta)",
    bg: "rgba(180, 107, 88, 0.05)",
    pill: "rgba(180, 107, 88, 0.14)",
    text: "var(--terracotta)",
  },
};

export function StrategyScorecard({ scorecard }: Props) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 32 }}>
      {scorecard.metrics.map((metric) => {
        const s = GRADE_STYLES[metric.grade] ?? GRADE_STYLES.medium;
        return (
          <Card
            key={metric.label}
            background={s.bg}
            padding="md"
          >
            <MetaLabel style={{ marginBottom: 10 }}>{metric.label}</MetaLabel>
            <span
              style={{
                display: "inline-block",
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "var(--font-display)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                padding: "3px 10px",
                borderRadius: 999,
                background: s.pill,
                color: s.text,
                marginBottom: 10,
              }}
            >
              {metric.grade}
            </span>
            <p
              style={{
                fontSize: 12,
                color: "var(--ink-light)",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {metric.rationale}
            </p>
          </Card>
        );
      })}
    </div>
  );
}
