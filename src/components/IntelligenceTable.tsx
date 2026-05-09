interface TableRow {
  [key: string]: string | number;
}

interface Props {
  headers: string[];
  rows: TableRow[];
  sentimentKey?: string;
}

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "var(--teal)",
  neutral: "var(--warning)",
  negative: "var(--terracotta)",
};

const VERDICT_COLORS: Record<string, { bg: string; text: string }> = {
  prioritize: { bg: "rgba(91, 138, 138, 0.12)", text: "var(--teal)" },
  test: { bg: "var(--warning-pill)", text: "var(--warning)" },
  defer: { bg: "rgba(180, 107, 88, 0.12)", text: "var(--terracotta)" },
};

export function IntelligenceTable({ headers, rows, sentimentKey }: Props) {
  if (rows.length === 0) return null;

  const keys = Object.keys(rows[0]).filter((k) => k !== sentimentKey);

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            {headers.map((header, i) => (
              <th
                key={i}
                style={{
                  textAlign: "left",
                  padding: "10px 12px",
                  borderBottom: "2px solid var(--rule)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--ink-muted)",
                  whiteSpace: "nowrap",
                }}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={ri}
              style={{
                background: ri % 2 === 0 ? "transparent" : "rgba(0,0,0,0.015)",
              }}
            >
              {keys.map((key, ci) => {
                const value = row[key];
                const isVerdict = key === "verdict" && typeof value === "string" && value in VERDICT_COLORS;
                const isFitScore = key === "fitScore" && typeof value === "number";

                return (
                  <td
                    key={ci}
                    style={{
                      padding: "10px 12px",
                      borderBottom: "1px solid var(--rule)",
                      color: "var(--ink)",
                      lineHeight: 1.5,
                      verticalAlign: "top",
                      whiteSpace: key === "evidence" || key === "us" ? "normal" : "nowrap",
                    }}
                  >
                    {isVerdict ? (
                      <span
                        style={{
                          display: "inline-block",
                          fontSize: 10,
                          fontWeight: 600,
                          fontFamily: "var(--font-mono)",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          padding: "2px 8px",
                          borderRadius: 999,
                          background: VERDICT_COLORS[value as string].bg,
                          color: VERDICT_COLORS[value as string].text,
                        }}
                      >
                        {value}
                      </span>
                    ) : isFitScore ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span
                          style={{
                            fontWeight: 700,
                            color: value >= 4 ? "var(--teal)" : value >= 3 ? "var(--warning)" : "var(--terracotta)",
                          }}
                        >
                          {value}
                        </span>
                        <span style={{ color: "var(--ink-muted)", fontSize: 11 }}>/5</span>
                      </div>
                    ) : (
                      <span>
                        {sentimentKey && ci === 1 && row[sentimentKey] ? (
                          <span
                            style={{
                              display: "inline-block",
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              background: SENTIMENT_COLORS[String(row[sentimentKey])] ?? "var(--ink-muted)",
                              marginRight: 8,
                              flexShrink: 0,
                            }}
                          />
                        ) : null}
                        {String(value)}
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
