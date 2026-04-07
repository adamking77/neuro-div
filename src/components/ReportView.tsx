import { motion } from "framer-motion";
import { ArrowClockwise, WarningCircle, ArrowUpRight } from "@phosphor-icons/react";
import { Skeleton } from "@heroui/react";
import type { SessionState, PhaseResult } from "../types";
import { PHASES } from "../phases";
import { PublicationTimeline, ScoreDistribution } from "./PhaseCharts";

interface Props {
  session: SessionState;
  onRunPhase: (id: number) => void;
  isRunning: boolean;
}

export function ReportView({ session, onRunPhase, isRunning }: Props) {
  const hasAny = Object.values(session.phases).some((p) => p.status !== "idle");

  if (!hasAny) return (
    <div style={{ padding: "64px 0" }}>
      <p style={{ fontSize: 14, color: "var(--ink-muted)", fontFamily: "var(--font-display)", margin: 0 }}>
        Enter a problem above and hit Run.
      </p>
    </div>
  );

  return (
    <div>
      {PHASES.map((phase, i) => {
        const result = session.phases[phase.id];
        return (
          <motion.div
            key={phase.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.04, duration: 0.25 }}
          >
            {i > 0 && <hr className="rule" style={{ margin: "36px 0" }} />}
            <PhaseSection
              phaseId={phase.id}
              name={phase.name}
              description={phase.description}
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

function PhaseSection({ phaseId, name, description, result, canRerun, onRerun }: {
  phaseId: number; name: string; description: string;
  result: PhaseResult; canRerun: boolean; onRerun: () => void;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "36px 1fr", gap: "0 32px" }}>

      {/* Index number */}
      <div style={{ paddingTop: 3 }}>
        <span className="mono" style={{ fontSize: 11, letterSpacing: "0.1em", color: "var(--ink-muted)" }}>
          {String(phaseId).padStart(2, "0")}
        </span>
      </div>

      {/* Content */}
      <div>
        {/* Phase header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ fontSize: 17, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em" }}>
              {name}
            </span>
            {result.status === "running" && <span className="dot dot-running" />}
            {result.status === "done" && <span className="dot dot-done" />}
            {result.status === "error" && <span className="dot dot-error" />}
            {result.status === "done" && result.results.length > 0 && (
              <span className="mono" style={{ fontSize: 10, color: "var(--ink-muted)", letterSpacing: "0.05em" }}>
                {result.results.length}
              </span>
            )}
          </div>

          {(result.status === "done" || result.status === "error") && (
            <button
              onClick={onRerun}
              disabled={!canRerun}
              style={{
                background: "none", border: "none", padding: 0,
                cursor: canRerun ? "pointer" : "not-allowed",
                fontSize: 11, color: "var(--ink-muted)",
                fontFamily: "var(--font-display)",
                display: "flex", alignItems: "center", gap: 4,
                opacity: canRerun ? 1 : 0.4,
              }}
            >
              <ArrowClockwise size={11} />
              Re-run
            </button>
          )}
        </div>

        <p style={{ fontSize: 13, color: "var(--ink-muted)", margin: "0 0 20px", lineHeight: 1.55 }}>
          {description}
        </p>

        {result.status === "running" && <SectionSkeleton />}

        {result.status === "error" && result.error && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <WarningCircle size={13} style={{ color: "var(--terracotta)", flexShrink: 0, marginTop: 1 }} />
            <p className="mono" style={{ fontSize: 12, color: "var(--terracotta)", margin: 0, lineHeight: 1.5 }}>
              {result.error}
            </p>
          </div>
        )}

        {result.status === "done" && result.results.length === 0 && (
          <p style={{ fontSize: 13, color: "var(--ink-muted)", margin: 0 }}>
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
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {[72, 58, 80, 52, 68].map((w, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          <Skeleton className="h-4 rounded" style={{ width: `${w}%` }} />
          <Skeleton className="h-3 rounded" style={{ width: `${w - 14}%` }} animationType="pulse" />
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
        <motion.div key={result.id ?? i}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: i * 0.02, duration: 0.2 }}>
          {i > 0 && <hr className="rule" style={{ margin: "16px 0" }} />}
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
      <a
        href={result.url} target="_blank" rel="noreferrer"
        style={{ textDecoration: "none", display: "inline-flex", alignItems: "flex-start", gap: 5, marginBottom: 5 }}
        className="group"
      >
        <span
          style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", lineHeight: 1.45, transition: "color 0.15s" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--teal)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--ink)")}
        >
          {result.title || result.url}
        </span>
        <ArrowUpRight size={11} style={{ color: "var(--teal)", flexShrink: 0, marginTop: 3, opacity: 0 }}
          className="group-hover:opacity-100 transition-opacity" />
      </a>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span className="mono" style={{ fontSize: 11, color: "var(--ink-muted)" }}>{domain}</span>
        {dateStr && <>
          <span style={{ color: "var(--ink-muted)", fontSize: 9 }}>·</span>
          <span className="mono" style={{ fontSize: 11, color: "var(--ink-muted)" }}>{dateStr}</span>
        </>}
        {result.score != null && <>
          <span style={{ color: "var(--ink-muted)", fontSize: 9 }}>·</span>
          <span className="mono" style={{ fontSize: 11, color: "var(--ink-muted)" }}>
            {(result.score * 100).toFixed(0)}%
          </span>
        </>}
      </div>

      {result.highlights?.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {result.highlights.slice(0, 2).map((h: string, idx: number) => (
            <p key={idx} style={{
              fontSize: 13, lineHeight: 1.65, color: "var(--ink-light)",
              paddingLeft: 12, margin: 0,
              borderLeft: "1.5px solid rgba(26, 26, 24, 0.15)",
            }}>
              {h}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
