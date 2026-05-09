import type { IntelligenceRisk } from "../types";

interface Props {
  risks: IntelligenceRisk[];
}

const LEVEL_STYLES: Record<string, { bg: string; border: string; dot: string; text: string; label: string }> = {
  critical: {
    bg: "rgba(180, 107, 88, 0.07)",
    border: "rgba(180, 107, 88, 0.25)",
    dot: "var(--terracotta)",
    text: "var(--terracotta)",
    label: "Critical",
  },
  watch: {
    bg: "var(--warning-bg)",
    border: "rgba(196, 164, 132, 0.3)",
    dot: "var(--warning)",
    text: "var(--warning-deep)",
    label: "Watch",
  },
  managed: {
    bg: "rgba(91, 138, 138, 0.05)",
    border: "rgba(91, 138, 138, 0.2)",
    dot: "var(--teal)",
    text: "var(--teal)",
    label: "Managed",
  },
};

const LEVEL_ORDER = ["critical", "watch", "managed"];

export function IntelligenceRiskMatrix({ risks }: Props) {
  const sorted = [...risks].sort(
    (a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level),
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {sorted.map((risk, i) => {
        const s = LEVEL_STYLES[risk.level] ?? LEVEL_STYLES.managed;
        return (
          <div
            key={i}
            style={{
              background: s.bg,
              border: `1px solid ${s.border}`,
              padding: "14px 16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--ink)",
                  flex: 1,
                }}
              >
                {risk.name}
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontFamily: "var(--font-mono)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: s.text,
                  flexShrink: 0,
                }}
              >
                {s.label}
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontFamily: "var(--font-mono)",
                  color: "var(--ink-muted)",
                  flexShrink: 0,
                }}
              >
                {risk.impact} impact · {risk.probability} prob
              </span>
            </div>
            <p
              style={{
                fontSize: 12,
                color: "var(--ink-light)",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              <span style={{ fontWeight: 600, color: "var(--ink-muted)" }}>If this happens: </span>
              {risk.mitigation}
            </p>
          </div>
        );
      })}
    </div>
  );
}
