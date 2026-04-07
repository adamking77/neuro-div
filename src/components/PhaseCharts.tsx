import { useMemo } from "react";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ProgressBar } from "@heroui/react";
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

  return (
    <div
      className="mt-4 px-4 py-3 rounded-xl"
      style={{ background: "oklch(0% 0 0 / 0.03)", border: "1px solid oklch(0% 0 0 / 0.06)", overflow: "hidden" }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-medium uppercase tracking-widest" style={{ color: "oklch(52% 0.008 286)" }}>
          Publication timeline
        </span>
        <span
          className="text-[10px]"
          style={{
            color: recencyPct > 50 ? "#2C5C93" : "oklch(52% 0.008 286)",
            fontFamily: "Geist Mono, monospace",
          }}
        >
          {recencyPct}% in last 2y
        </span>
      </div>
      <ResponsiveContainer width="100%" height={52}>
        <BarChart data={data} barCategoryGap="20%">
          <XAxis
            dataKey="year"
            tick={{ fill: "oklch(55% 0.007 286)", fontSize: 9, fontFamily: "Geist Mono, monospace" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <Tooltip
            cursor={{ fill: "oklch(0% 0 0 / 0.03)" }}
            contentStyle={{
              background: "oklch(99% 0.002 286)",
              border: "1px solid oklch(86% 0.007 286)",
              borderRadius: 8,
              padding: "4px 10px",
              fontSize: 11,
              fontFamily: "Geist Mono, monospace",
              color: "oklch(26% 0.008 286)",
              boxShadow: "0 4px 16px oklch(0% 0 0 / 0.08)",
            }}
            formatter={(v: any) => [`${v} result${v !== 1 ? "s" : ""}`, ""]}
            labelStyle={{ color: "oklch(50% 0.008 286)" }}
          />
          <Bar dataKey="count" radius={[3, 3, 0, 0]} maxBarSize={28}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.count === maxCount ? "#2C5C93" : "oklch(100% 0 0 / 0.12)"}
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
  { label: "80–100%", min: 0.80, color: "success" as const },
  { label: "60–79%",  min: 0.60, color: "accent"  as const },
  { label: "40–59%",  min: 0.40, color: "default" as const },
  { label: "20–39%",  min: 0.20, color: "default" as const },
  { label: "0–19%",   min: 0.00, color: "danger"  as const },
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

  return (
    <div
      className="mt-3 px-4 py-3 rounded-xl"
      style={{ background: "oklch(0% 0 0 / 0.03)", border: "1px solid oklch(0% 0 0 / 0.06)", overflow: "hidden" }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-medium uppercase tracking-widest" style={{ color: "oklch(52% 0.008 286)" }}>
          Match quality
        </span>
        <span
          className="text-[10px]"
          style={{
            color: quality > 60 ? "#2C5C93" : quality > 35 ? "oklch(55% 0.1 254)" : "oklch(60% 0.2 25)",
            fontFamily: "Geist Mono, monospace",
          }}
        >
          {quality}% strong signal
        </span>
      </div>
      <div className="space-y-1.5">
        {BUCKETS.map(({ label, color }, i) => (
          <div key={label} className="flex items-center gap-2.5">
            <span className="w-12 text-right text-[10px] shrink-0" style={{ color: "oklch(54% 0.007 286)", fontFamily: "Geist Mono, monospace" }}>
              {label}
            </span>
            <ProgressBar
              value={(counts[i] / maxCount) * 100}
              color={counts[i] === 0 ? "default" : color}
              size="sm"
              className="flex-1"
              aria-label={label}
            />
            <span className="w-4 text-right text-[10px] shrink-0" style={{ color: "oklch(54% 0.007 286)", fontFamily: "Geist Mono, monospace" }}>
              {counts[i]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
