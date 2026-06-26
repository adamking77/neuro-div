import { RingChart } from "../charts/ring-chart";
import { Ring } from "../charts/ring";
import { RingCenter } from "../charts/ring-center";
import type { ProfileAxis } from "../../lib/nd-insights";

/**
 * Themed, client-only chart helpers for output artifacts. Bklit-class charts
 * live only inside these React surfaces — never imported into server-rendered
 * Astro.
 *
 * Charts here visualise *shape*, the thing words are slow at: labelled bars
 * show where someone's weight sits; the ring shows at a glance whether a
 * process survives a low-energy day. Neither is a clinical score — both are
 * derived display views of what the person actually selected.
 */

/**
 * Operating-shape bars. Six derived dimensions (0-100) as labelled horizontal
 * bars — each row reads instantly (word + bar), unlike a radar polygon. Calm,
 * static, grows once on mount. Not a score; a picture of where the weight sits.
 */
export function ProfileBars({ axes }: { axes: ProfileAxis[] }) {
  return (
    <div style={{ display: "grid", gap: 18 }}>
      {axes.map((a) => (
        <div key={a.key}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
            <span style={{ fontSize: 15, color: "var(--ink)", lineHeight: 1.35 }}>{a.label}</span>
            <span className="mono" style={{ fontSize: 11, color: "var(--ink-muted)" }}>
              {Math.round(a.value)}%
            </span>
          </div>
          <div style={{ height: 8, background: "rgba(26,26,24,0.07)", overflow: "hidden" }}>
            <div
              style={{
                width: `${Math.max(4, Math.min(100, a.value))}%`,
                height: "100%",
                background: "var(--teal)",
                transition: "width 0.5s ease",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Balance meter: a single split bar showing how many things lift this person up
 * versus pull them down. Not a score and not a verdict — just a picture of where
 * the weight sits, so an even split or a lopsided one is visible at a glance.
 */
export function BalanceMeter({
  activators,
  shutdowns,
}: {
  activators: number;
  shutdowns: number;
}) {
  const total = activators + shutdowns;
  if (total === 0) return null;
  const upPct = Math.round((activators / total) * 100);

  return (
    <div>
      <div style={{ display: "flex", height: 12, overflow: "hidden", borderRadius: 2 }}>
        <div style={{ width: `${upPct}%`, background: "var(--teal)" }} />
        <div style={{ width: `${100 - upPct}%`, background: "var(--terracotta)" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
        <span style={{ fontSize: 15, color: "var(--teal-deep)", lineHeight: 1.35 }}>
          {activators} lift you up
        </span>
        <span style={{ fontSize: 15, color: "var(--terracotta)", lineHeight: 1.35 }}>
          {shutdowns} pull you down
        </span>
      </div>
    </div>
  );
}

export interface CoverageDatum {
  label: string;
  /** Number of moves available at this energy level. */
  value: number;
  tone?: "teal" | "muted";
}

const TONE_COLOR: Record<NonNullable<CoverageDatum["tone"]>, string> = {
  teal: "var(--teal)",
  muted: "var(--ink-muted)",
};

/**
 * Coverage ring: what share of the process is reachable on a low-energy day.
 * One number, one arc — the calmest possible answer to "will this survive a
 * bad day?" The percentage is a share of moves, labelled as such.
 */
export function CoverageRing({
  lowDayMoves,
  totalMoves,
}: {
  lowDayMoves: number;
  totalMoves: number;
}) {
  const pct = totalMoves > 0 ? Math.round((lowDayMoves / totalMoves) * 100) : 0;
  return (
    <div style={{ width: 168, height: 168, flexShrink: 0 }}>
      <RingChart
        size={168}
        strokeWidth={16}
        baseInnerRadius={56}
        ringGap={5}
        data={[{ label: "Low-energy reach", value: pct, maxValue: 100, color: "var(--teal)" }]}
      >
        <Ring index={0} lineCap="round" />
        <RingCenter defaultLabel="bad-day reach" suffix="%" />
      </RingChart>
    </div>
  );
}

/**
 * Energy-coverage bars: moves grouped by the working window each needs. Static,
 * grows once on mount, no hover/tooltip (calm is a feature). Used as the
 * breakdown beneath the ring.
 */
export function CoverageBars({ data }: { data: CoverageDatum[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {data.map((d) => {
        const empty = d.value === 0;
        return (
          <div key={d.label}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 5 }}>
              <span style={{ fontSize: 15, color: empty ? "var(--ink-muted)" : "var(--ink)", lineHeight: 1.35 }}>
                {d.label}
              </span>
              <span className="mono" style={{ fontSize: 10, color: "var(--ink-muted)" }}>
                {d.value} {d.value === 1 ? "move" : "moves"}
              </span>
            </div>
            <div style={{ height: 7, background: "rgba(26,26,24,0.07)", overflow: "hidden" }}>
              <div
                style={{
                  width: empty ? "0%" : `${Math.max(8, Math.min(100, (d.value / max) * 100))}%`,
                  height: "100%",
                  background: TONE_COLOR[d.tone ?? "teal"],
                  transition: "width 0.4s ease",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
