import { useMemo } from "react";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
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
    for (let y = min; y <= max; y++) filled.push({ year: String(y), count: counts[y] ?? 0 });
    return filled;
  }, [results]);

  if (data.length < 2) return null;

  const maxCount = Math.max(...data.map((d) => d.count));
  const recentYear = new Date().getFullYear();
  const recentCount = data.filter((d) => Number(d.year) >= recentYear - 2).reduce((s, d) => s + d.count, 0);
  const totalDated = data.reduce((s, d) => s + d.count, 0);
  const recencyPct = totalDated > 0 ? Math.round((recentCount / totalDated) * 100) : 0;
  const trend = recencyPct > 60 ? "accelerating" : recencyPct > 35 ? "steady" : "slowing";
  const trendColor = recencyPct > 60 ? "var(--teal)" : recencyPct > 35 ? "var(--ink-muted)" : "var(--terracotta)";

  return (
    <div style={{
      marginTop: 16, padding: "16px 16px 12px",
      border: "1px solid var(--rule)", overflow: "hidden",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-muted)", margin: "0 0 3px", fontFamily: "var(--font-mono)" }}>
            Publication Timeline
          </p>
          <p style={{ fontSize: 12, color: "var(--ink-muted)", margin: 0 }}>
            When sources were published
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: trendColor, margin: "0 0 2px", fontFamily: "var(--font-mono)", letterSpacing: "-0.02em" }}>
            {recencyPct}%
          </p>
          <p style={{ fontSize: 11, color: trendColor, margin: 0, fontFamily: "var(--font-mono)" }}>
            {trend} · last 2y
          </p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={72}>
        <BarChart data={data} barCategoryGap="25%">
          <XAxis
            dataKey="year"
            tick={{ fill: "var(--ink-muted)", fontSize: 10, fontFamily: "var(--font-mono)" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <Tooltip
            cursor={{ fill: "rgba(26,26,24,0.04)" }}
            contentStyle={{
              background: "var(--cream)",
              border: "1px solid var(--rule)",
              borderRadius: 4,
              padding: "4px 10px",
              fontSize: 12,
              fontFamily: "var(--font-mono)",
              color: "var(--ink)",
              boxShadow: "0 4px 12px rgba(26,26,24,0.08)",
            }}
            formatter={(v: any) => [`${v} result${v !== 1 ? "s" : ""}`, ""]}
            labelStyle={{ color: "var(--ink-muted)" }}
          />
          <Bar dataKey="count" radius={[2, 2, 0, 0]} maxBarSize={32}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.count === maxCount ? "var(--teal)" : "rgba(26,26,24,0.1)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface ScoreProps { results: ExaResult[] }

const BUCKETS = [
  { label: "80–100%", min: 0.80, bar: "var(--teal)" },
  { label: "60–79%",  min: 0.60, bar: "var(--teal-deep)" },
  { label: "40–59%",  min: 0.40, bar: "rgba(26,26,24,0.2)" },
  { label: "20–39%",  min: 0.20, bar: "rgba(26,26,24,0.12)" },
  { label: "0–19%",   min: 0.00, bar: "var(--terracotta)" },
];

export function ScoreDistribution({ results }: ScoreProps) {
  const scored = results.filter((r) => r.score != null);
  if (scored.length < 3) return null;

  const counts = BUCKETS.map(({ min }, i) => {
    const max = i === 0 ? 1.01 : BUCKETS[i - 1].min;
    return scored.filter((r) => r.score! >= min && r.score! < max).length;
  });

  const maxCount = Math.max(...counts, 1);
  const dominated = counts[0] + counts[1];
  const quality = Math.round((dominated / scored.length) * 100);
  const qualityLabel = quality > 60 ? "strong" : quality > 35 ? "mixed" : "weak";
  const qualityColor = quality > 60 ? "var(--teal)" : quality > 35 ? "var(--ink-muted)" : "var(--terracotta)";

  return (
    <div style={{
      marginTop: 12, padding: "16px 16px 14px",
      border: "1px solid var(--rule)", overflow: "hidden",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-muted)", margin: "0 0 3px", fontFamily: "var(--font-mono)" }}>
            Match Quality
          </p>
          <p style={{ fontSize: 12, color: "var(--ink-muted)", margin: 0 }}>
            How relevant results are to your query
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: qualityColor, margin: "0 0 2px", fontFamily: "var(--font-mono)", letterSpacing: "-0.02em" }}>
            {quality}%
          </p>
          <p style={{ fontSize: 11, color: qualityColor, margin: 0, fontFamily: "var(--font-mono)" }}>
            {qualityLabel} signal
          </p>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {BUCKETS.map(({ label, bar }, i) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 44, textAlign: "right", fontSize: 11, flexShrink: 0, color: "var(--ink-muted)", fontFamily: "var(--font-mono)" }}>
              {label}
            </span>
            <div style={{ flex: 1, height: 6, background: "rgba(26,26,24,0.06)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 2,
                width: `${(counts[i] / maxCount) * 100}%`,
                background: counts[i] === 0 ? "transparent" : bar,
                transition: "width 0.4s ease",
              }} />
            </div>
            <span style={{ width: 16, textAlign: "right", fontSize: 11, flexShrink: 0, color: "var(--ink-muted)", fontFamily: "var(--font-mono)" }}>
              {counts[i]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
