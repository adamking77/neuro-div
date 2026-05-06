import type { IntelligenceLandscapeCallout } from "../types";

interface Props {
  content: string;
  callouts: IntelligenceLandscapeCallout[];
}

const CALLOUT_STYLES: Record<string, { border: string; bg: string; icon: string }> = {
  insight: { border: "var(--teal)", bg: "rgba(91, 138, 138, 0.06)", icon: "●" },
  warning: { border: "var(--terracotta)", bg: "rgba(180, 107, 88, 0.06)", icon: "▲" },
  opportunity: { border: "#b8860b", bg: "rgba(196, 164, 132, 0.08)", icon: "◆" },
};

export function IntelligenceNarrative({ content, callouts }: Props) {
  const paragraphs = content.split("\n\n").filter(Boolean);

  return (
    <div>
      {paragraphs.map((paragraph, i) => (
        <p
          key={i}
          style={{
            fontSize: 14,
            color: "var(--ink)",
            lineHeight: 1.75,
            margin: "0 0 16px",
          }}
        >
          {paragraph}
        </p>
      ))}

      {callouts.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
          {callouts.map((callout, i) => {
            const style = CALLOUT_STYLES[callout.type] ?? CALLOUT_STYLES.insight;
            return (
              <div
                key={i}
                style={{
                  border: `1px solid ${style.border}`,
                  background: style.bg,
                  padding: "12px 16px",
                }}
              >
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--ink)",
                    lineHeight: 1.6,
                    margin: 0,
                    fontWeight: 500,
                  }}
                >
                  <span style={{ color: style.border, marginRight: 8 }}>{style.icon}</span>
                  {callout.text}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
