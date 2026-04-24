interface Props {
  time: string[];
  budget: string[];
  tools: string[];
  skills: string[];
  gaps: string[];
}

function ResourceBlock({ label, items }: { label: string; items: string[] }) {
  if (!items || items.length === 0) return null;

  return (
    <div>
      <p
        style={{
          fontSize: 10,
          fontWeight: 600,
          fontFamily: "var(--font-mono)",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "var(--ink-muted)",
          margin: "0 0 8px",
        }}
      >
        {label}
      </p>
      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 5 }}>
        {items.map((item, i) => (
          <li
            key={i}
            style={{
              fontSize: 13,
              color: "var(--ink)",
              lineHeight: 1.6,
              paddingLeft: 16,
              position: "relative",
            }}
          >
            <span
              style={{
                position: "absolute",
                left: 4,
                top: "0.65em",
                width: 4,
                height: 4,
                borderRadius: "50%",
                background: "var(--ink-muted)",
                opacity: 0.4,
              }}
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function IntelligenceResources({ time, budget, tools, skills, gaps }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Time + Budget row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <ResourceBlock label="Time" items={time} />
        <ResourceBlock label="Budget" items={budget} />
      </div>

      {/* Tools + Skills row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <ResourceBlock label="Tools" items={tools} />
        <ResourceBlock label="Skills" items={skills} />
      </div>

      {/* Gaps full width */}
      {gaps && gaps.length > 0 && (
        <div
          style={{
            borderTop: "1px solid var(--rule)",
            paddingTop: 20,
          }}
        >
          <ResourceBlock label="Gaps to close" items={gaps} />
        </div>
      )}
    </div>
  );
}
