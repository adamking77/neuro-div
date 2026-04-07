import { useMemo } from "react";
import type { ExaResult } from "../types";

interface TimelineProps { results: ExaResult[] }

export function PublicationTimeline({ results }: TimelineProps) {
  const data = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of results) {
      if (!r.publishedDate) continue;
      const year = new Date(r.publishedDate).getFullYear();
      if (isNaN(year) || year < 2000 || year > 2030) continue;
      counts[year] = (counts[year] ?? 0) + 1;
    }
    const years = Object.keys(counts).map(Number).sort();
    if (years.length === 0) return [];
    const min = years[0], max = years[years.length - 1];
    const filled = [];
    for (let y = min; y <= max; y++) filled.push({ year: y, count: counts[y] ?? 0 });
    return filled;
  }, [results]);

  if (data.length < 2) return null;

  const recentYear = new Date().getFullYear();
  const recentCount = data.filter((d) => d.year >= recentYear - 2).reduce((s, d) => s + d.count, 0);
  const totalDated = data.reduce((s, d) => s + d.count, 0);
  const recencyPct = totalDated > 0 ? Math.round((recentCount / totalDated) * 100) : 0;
  const trend = recencyPct > 60 ? "accelerating" : recencyPct > 35 ? "steady" : "slowing";
  const trendColor = recencyPct > 60 ? "var(--teal)" : recencyPct > 35 ? "var(--ink-muted)" : "var(--terracotta)";

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const svgH = 40;
  const barW = Math.min(20, Math.floor(320 / data.length) - 2);

  return (
    <div style={{
      marginTop: 16, padding: "16px 16px 14px",
      border: "1px solid var(--rule)",
    }}>
      {/* Question header */}
      <p style={{
        fontSize: 10, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase",
        color: "var(--ink-muted)", margin: "0 0 10px", fontFamily: "var(--font-mono)",
      }}>
        Is this topic gaining traction?
      </p>

      <div style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
        {/* Sparkline */}
        <div style={{ flexShrink: 0 }}>
          <svg
            width={data.length * (barW + 2)}
            height={svgH}
            style={{ display: "block", overflow: "visible" }}
          >
            {data.map((d, i) => {
              const h = Math.max(2, Math.round((d.count / maxCount) * (svgH - 4)));
              const isRecent = d.year >= recentYear - 2;
              return (
                <rect
                  key={d.year}
                  x={i * (barW + 2)}
                  y={svgH - h}
                  width={barW}
                  height={h}
                  rx={1}
                  fill={isRecent ? "var(--teal)" : "rgba(26,26,24,0.12)"}
                />
              );
            })}
          </svg>
          {/* Year labels: first and last */}
          <div style={{
            display: "flex", justifyContent: "space-between",
            marginTop: 4, width: data.length * (barW + 2),
          }}>
            <span style={{ fontSize: 10, color: "var(--ink-muted)", fontFamily: "var(--font-mono)" }}>
              {data[0].year}
            </span>
            <span style={{ fontSize: 10, color: "var(--ink-muted)", fontFamily: "var(--font-mono)" }}>
              {data[data.length - 1].year}
            </span>
          </div>
        </div>

        {/* Interpretation */}
        <div>
          <p style={{
            fontSize: 18, fontWeight: 700, color: trendColor, margin: "0 0 3px",
            fontFamily: "var(--font-mono)", letterSpacing: "-0.02em", lineHeight: 1,
          }}>
            {recencyPct}%
          </p>
          <p style={{ fontSize: 12, color: "var(--ink-light)", margin: "0 0 5px", lineHeight: 1.5 }}>
            of sources published in the last 2 years
          </p>
          <p style={{ fontSize: 11, color: trendColor, margin: 0, fontFamily: "var(--font-mono)" }}>
            {trend === "accelerating" && "Coverage is accelerating — active topic"}
            {trend === "steady" && "Coverage is steady — established topic"}
            {trend === "slowing" && "Coverage is slowing — maturing or fading topic"}
          </p>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: 1, background: "var(--teal)" }} />
          <span style={{ fontSize: 10, color: "var(--ink-muted)", fontFamily: "var(--font-mono)" }}>last 2 years</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: 1, background: "rgba(26,26,24,0.12)" }} />
          <span style={{ fontSize: 10, color: "var(--ink-muted)", fontFamily: "var(--font-mono)" }}>older</span>
        </div>
      </div>
    </div>
  );
}

interface ScoreProps { results: ExaResult[] }

export function ScoreDistribution({ results }: ScoreProps) {
  const scored = results.filter((r) => r.score != null);
  if (scored.length < 3) return null;

  const high = scored.filter((r) => r.score! >= 0.60).length;
  const mid  = scored.filter((r) => r.score! >= 0.40 && r.score! < 0.60).length;
  const low  = scored.filter((r) => r.score! < 0.40).length;

  const highPct = Math.round((high / scored.length) * 100);
  const qualityLabel = highPct > 60 ? "strong signal" : highPct > 35 ? "mixed signal" : "weak signal";
  const qualityColor = highPct > 60 ? "var(--teal)" : highPct > 35 ? "var(--ink-muted)" : "var(--terracotta)";

  const tiers = [
    { label: "High match", sublabel: "score ≥ 60%", count: high, color: "var(--teal)" },
    { label: "Mid match",  sublabel: "40–59%",       count: mid,  color: "rgba(26,26,24,0.25)" },
    { label: "Low match",  sublabel: "score < 40%",  count: low,  color: "var(--terracotta)" },
  ];
  const maxTier = Math.max(...tiers.map((t) => t.count), 1);

  return (
    <div style={{
      marginTop: 12, padding: "16px 16px 14px",
      border: "1px solid var(--rule)",
    }}>
      {/* Question header */}
      <p style={{
        fontSize: 10, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase",
        color: "var(--ink-muted)", margin: "0 0 10px", fontFamily: "var(--font-mono)",
      }}>
        How useful are these results?
      </p>

      <div style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
        {/* Tier bars */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          {tiers.map(({ label, sublabel, count, color }) => (
            <div key={label}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontSize: 11, color: "var(--ink-light)", fontFamily: "var(--font-mono)" }}>
                  {label}
                  <span style={{ color: "var(--ink-muted)", marginLeft: 5 }}>{sublabel}</span>
                </span>
                <span style={{ fontSize: 11, color: "var(--ink-muted)", fontFamily: "var(--font-mono)", flexShrink: 0, marginLeft: 8 }}>
                  {count}
                </span>
              </div>
              <div style={{ height: 5, background: "rgba(26,26,24,0.06)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 2,
                  width: count === 0 ? "0%" : `${(count / maxTier) * 100}%`,
                  background: count === 0 ? "transparent" : color,
                  transition: "width 0.4s ease",
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* Verdict */}
        <div style={{ flexShrink: 0, textAlign: "right", minWidth: 72 }}>
          <p style={{
            fontSize: 18, fontWeight: 700, color: qualityColor, margin: "0 0 3px",
            fontFamily: "var(--font-mono)", letterSpacing: "-0.02em", lineHeight: 1,
          }}>
            {highPct}%
          </p>
          <p style={{ fontSize: 11, color: qualityColor, margin: 0, fontFamily: "var(--font-mono)" }}>
            {qualityLabel}
          </p>
        </div>
      </div>

      {/* Plain English summary */}
      <p style={{
        fontSize: 12, color: "var(--ink-muted)", margin: "10px 0 0", lineHeight: 1.5,
        borderTop: "1px solid var(--rule)", paddingTop: 10,
      }}>
        {high} of {scored.length} results are high-confidence matches for your query.
        {low > 0 && ` ${low} result${low > 1 ? "s" : ""} may be tangential — review before using.`}
      </p>
    </div>
  );
}
