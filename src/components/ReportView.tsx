import { motion } from "framer-motion";
import {
  MapPin, Sword, Globe, ClipboardText, ChartBar, TextAa,
  ArrowClockwise, WarningCircle, ArrowUpRight,
} from "@phosphor-icons/react";
import { Skeleton, Chip, Button } from "@heroui/react";
import type { SessionState, PhaseResult } from "../types";
import { PHASES } from "../phases";
import { PublicationTimeline, ScoreDistribution } from "./PhaseCharts";

const PHASE_ICONS = [MapPin, Sword, Globe, ClipboardText, ChartBar, TextAa];

const STATUS_CLASS: Record<string, string> = {
  idle: "", running: "status-running", done: "status-done", error: "status-error",
};

const STATUS_CHIP: Record<string, { color: "accent" | "success" | "danger"; label: string; pulse?: boolean }> = {
  running: { color: "accent",  label: "scanning", pulse: true },
  done:    { color: "success", label: "",          pulse: false },
  error:   { color: "danger",  label: "error",     pulse: false },
};

interface Props {
  session: SessionState;
  onRunPhase: (id: number) => void;
  isRunning: boolean;
}

export function ReportView({ session, onRunPhase, isRunning }: Props) {
  const hasAny = Object.values(session.phases).some((p) => p.status !== "idle");

  if (!hasAny) return (
    <div style={{ padding: "64px 0", textAlign: "center" }}>
      <p style={{ fontSize: 15, color: "var(--ink-muted)", fontFamily: "var(--font-display)" }}>
        Enter a problem above and hit Run.
      </p>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {PHASES.map((phase, i) => {
        const result = session.phases[phase.id];
        return (
          <motion.div
            key={phase.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, type: "spring", stiffness: 220, damping: 28 }}
          >
            <PhaseCard
              phaseId={phase.id}
              name={phase.name}
              description={phase.description}
              Icon={PHASE_ICONS[i]}
              result={result}
              canRerun={!isRunning}
              onRerun={() => onRunPhase(phase.id)}
            />
          </motion.div>
        );
      })}
    </div>
  );
}

function PhaseCard({ phaseId, name, description, Icon, result, canRerun, onRerun }: {
  phaseId: number; name: string; description: string; Icon: any;
  result: PhaseResult; canRerun: boolean; onRerun: () => void;
}) {
  const statusClass = STATUS_CLASS[result.status];
  const chip = STATUS_CHIP[result.status];

  return (
    <div className={`card ${statusClass}`} style={{ transition: "border-color 0.3s" }}>

      {/* Header */}
      <div className="card-head">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8, flexShrink: 0,
              background: "rgba(253, 251, 247, 0.05)",
              border: "1px solid rgba(253, 251, 247, 0.08)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon size={15} weight="regular" style={{ color: "var(--ink-muted)" }} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span className="mono" style={{ fontSize: 11, color: "var(--ink-light)" }}>
                  {String(phaseId).padStart(2, "0")}
                </span>
                {result.status === "done" && result.results.length > 0 && (
                  <Chip size="sm" color="success" variant="soft" className="text-[11px] h-5 px-2">
                    {result.results.length} results
                  </Chip>
                )}
                {chip && (
                  <Chip size="sm" color={chip.color} variant="soft"
                    className={`text-[11px] h-5 px-2 ${chip.pulse ? "animate-pulse" : ""}`}>
                    {chip.label || result.results.length + " results"}
                  </Chip>
                )}
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em", fontFamily: "var(--font-display)" }}>
                {name}
              </div>
              <div style={{ fontSize: 13, color: "var(--ink-muted)", marginTop: 2, lineHeight: 1.5, fontFamily: "var(--font-display)" }}>
                {description}
              </div>
            </div>
          </div>

          {(result.status === "done" || result.status === "error") && (
            <Button onPress={onRerun} isDisabled={!canRerun} variant="ghost" size="sm"
              style={{ color: "var(--ink-muted)", flexShrink: 0, fontFamily: "var(--font-display)" }}>
              <ArrowClockwise size={13} />
              Re-run
            </Button>
          )}
        </div>
      </div>

      {/* Body */}
      {result.status !== "idle" && (
        <div className="card-body">
          {result.status === "running" && <SectionSkeleton />}

          {result.status === "error" && result.error && (
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 12,
              padding: "12px 16px", borderRadius: 8,
              background: "rgba(196, 114, 90, 0.08)",
              border: "1px solid rgba(196, 114, 90, 0.25)",
            }}>
              <WarningCircle size={15} style={{ color: "var(--terracotta)", flexShrink: 0, marginTop: 1 }} />
              <p className="mono" style={{ fontSize: 13, color: "var(--ink-light)", margin: 0 }}>{result.error}</p>
            </div>
          )}

          {result.status === "done" && result.results.length === 0 && (
            <p style={{ fontSize: 14, color: "var(--ink-muted)", fontFamily: "var(--font-display)" }}>
              No results — try refining the problem statement.
            </p>
          )}

          {result.status === "done" && result.results.length > 0 && (
            <>
              <ResultList results={result.results} />
              <ScoreDistribution results={result.results} />
              <PublicationTimeline results={result.results} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {[75, 60, 82, 55, 70].map((w, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Skeleton className="h-4 rounded-md" style={{ width: `${w}%` }} />
          <Skeleton className="h-3 rounded" style={{ width: `${w - 15}%` }} animationType="pulse" />
          <Skeleton className="h-3 rounded" animationType="pulse" />
        </div>
      ))}
    </div>
  );
}

function ResultList({ results }: { results: any[] }) {
  return (
    <div>
      {results.map((result, i) => (
        <motion.div key={result.id ?? i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: i * 0.02, duration: 0.2 }}>
          {i > 0 && <div className="divider" />}
          <ResultItem result={result} />
        </motion.div>
      ))}
    </div>
  );
}

function ResultItem({ result }: { result: any }) {
  const domain = (() => {
    try { return new URL(result.url).hostname.replace(/^www\./, ""); }
    catch { return result.url.slice(0, 40); }
  })();

  const dateStr = result.publishedDate
    ? new Date(result.publishedDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : null;

  return (
    <div>
      <a href={result.url} target="_blank" rel="noreferrer"
        style={{ textDecoration: "none", display: "inline-flex", alignItems: "flex-start", gap: 6, marginBottom: 6 }}
        className="group"
      >
        <span
          style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", lineHeight: 1.45,
            fontFamily: "var(--font-display)", transition: "color 0.2s" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--teal)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--ink)")}
        >
          {result.title || result.url}
        </span>
        <ArrowUpRight size={12} style={{ color: "var(--teal)", flexShrink: 0, marginTop: 2, opacity: 0 }}
          className="group-hover:opacity-100 transition-opacity" />
      </a>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <span className="mono" style={{ fontSize: 12, color: "var(--ink-light)" }}>{domain}</span>
        {dateStr && <>
          <span style={{ color: "var(--ink-light)", fontSize: 10 }}>·</span>
          <span className="mono" style={{ fontSize: 12, color: "var(--ink-light)" }}>{dateStr}</span>
        </>}
        {result.score != null && <>
          <span style={{ color: "var(--ink-light)", fontSize: 10 }}>·</span>
          <span className="mono" style={{ fontSize: 12, color: "var(--ink-light)" }}>
            {(result.score * 100).toFixed(0)}%
          </span>
        </>}
      </div>

      {result.highlights?.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {result.highlights.slice(0, 2).map((h: string, idx: number) => (
            <p key={idx} style={{
              fontSize: 13, lineHeight: 1.65, color: "var(--ink-light)",
              paddingLeft: 12, margin: 0,
              borderLeft: "2px solid rgba(91, 138, 138, 0.45)",
              fontFamily: "var(--font-display)",
            }}>
              {h}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
