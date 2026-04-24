import type { IntelligenceTimelinePhase } from "../types";

interface Props {
  phases: IntelligenceTimelinePhase[];
}

export function IntelligenceTimeline({ phases }: Props) {
  return (
    <div style={{ position: "relative", paddingLeft: 24 }}>
      {/* Vertical line */}
      <div
        style={{
          position: "absolute",
          left: 7,
          top: 8,
          bottom: 8,
          width: 2,
          background: "var(--rule)",
        }}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        {phases.map((phase, i) => (
          <div key={i} style={{ position: "relative" }}>
            {/* Diamond marker */}
            <div
              style={{
                position: "absolute",
                left: -24,
                top: 2,
                width: 12,
                height: 12,
                background: "var(--teal)",
                transform: "rotate(45deg)",
                border: "2px solid var(--cream)",
                borderRadius: 2,
              }}
            />

            <div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6 }}>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: "var(--font-display)",
                    color: "var(--ink)",
                  }}
                >
                  {phase.name}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontFamily: "var(--font-mono)",
                    color: "var(--ink-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {phase.weeks}
                </span>
              </div>

              <p
                style={{
                  fontSize: 12,
                  color: "var(--ink-light)",
                  lineHeight: 1.6,
                  margin: "0 0 10px",
                }}
              >
                {phase.focus}
              </p>

              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {phase.tasks.map((task, ti) => (
                  <li
                    key={ti}
                    style={{
                      fontSize: 12,
                      color: "var(--ink)",
                      lineHeight: 1.7,
                      paddingLeft: 16,
                      position: "relative",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        left: 0,
                        top: "0.5em",
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background: "var(--ink-muted)",
                      }}
                    />
                    {task}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
