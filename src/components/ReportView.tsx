import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowClockwise, ArrowUpRight, CaretDown } from "@phosphor-icons/react";
import { Skeleton } from "@heroui/react";
import type { SessionState, PhaseResult, ExaResult, PhaseSynthesis } from "../types";
import { PHASES } from "../phases";
import { HighlightText } from "./HighlightText";
import { ResearchSynthesis } from "./ResearchSynthesis";
import { SectionNumber, EmptyState, ErrorState, Card, MetaLabel } from "./ui";

interface Props {
  session: SessionState;
  onRunPhase: (id: number) => void;
  isRunning: boolean;
}

export function ReportView({ session, onRunPhase, isRunning }: Props) {
  const hasAny = Object.values(session.phases).some((p) => p.status !== "idle");

  if (!hasAny) return (
    <EmptyState
      title="Enter a problem above and hit Run."
    />
  );

  const hasDoneResults = Object.values(session.phases).some((p) => p.status === "done" && p.results.length > 0);

  return (
    <div>
      {hasDoneResults && <ResearchSynthesis session={session} />}
      {PHASES.map((phase, i) => {
        const result = session.phases[phase.id];
        return (
          <div key={phase.id}>
            {i > 0 && <hr className="rule" style={{ margin: "36px 0" }} />}
            <PhaseSection
              phaseId={phase.id}
              name={phase.name}
              description={phase.description}
              result={result}
              canRerun={!isRunning}
              onRerun={() => onRunPhase(phase.id)}
            />
          </div>
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
      <div style={{ paddingTop: 3, flexShrink: 0 }}>
        <SectionNumber number={String(phaseId).padStart(2, "0")} />
      </div>

      {/* Content */}
      <div style={{ minWidth: 0, overflow: "hidden" }}>
        {/* Phase header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ fontSize: 17, fontWeight: 500, color: "var(--ink)", letterSpacing: 0 }}>
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
                background: "none", border: "none", padding: "6px 8px",
                cursor: canRerun ? "pointer" : "not-allowed",
                fontSize: 11, color: "var(--ink-muted)",
                fontFamily: "var(--font-display)",
                display: "flex", alignItems: "center", gap: 4,
                opacity: canRerun ? 1 : 0.4,
                minHeight: 36,
              }}
            >
              <ArrowClockwise size={11} />
              Re-run
            </button>
          )}
        </div>

        <p style={{ fontSize: 13, color: "var(--ink-muted)", margin: "0 0 16px", lineHeight: 1.55 }}>
          {description}
        </p>

        {result.status === "running" && <SectionSkeleton />}

        {result.status === "error" && result.error && (
          <ErrorState title={result.error} />
        )}

        {result.status === "done" && result.results.length === 0 && (
          <EmptyState title="No results" description="Try refining the problem statement." />
        )}

        {result.status === "done" && result.results.length > 0 && (
          <PhaseResults result={result} />
        )}
      </div>
    </div>
  );
}

function PhaseResults({ result }: { result: PhaseResult }) {
  const { results, synthesis } = result;
  const top3 = [...results]
    .filter((r) => r.score != null)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 3);

  return (
    <div>
      {/* Verdict badge + AI synthesis */}
      <PhaseVerdict results={results} />
      {synthesis && <PhaseSynthesisDisplay synthesis={synthesis} />}

      {/* Top findings */}
      {top3.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <MetaLabel style={{ marginBottom: 10 }}>Top findings</MetaLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {top3.map((r) => (
              <TopResultRow key={r.id ?? r.url} result={r} />
            ))}
          </div>
        </div>
      )}

      {/* Collapsible full list */}
      {results.length > 3 && (
        <CollapsibleResultList results={results} />
      )}

      {results.length > 0 && results.length <= 3 && (
        <div style={{ marginTop: 16 }}>
          <ResultList results={results} />
        </div>
      )}
    </div>
  );
}

function PhaseVerdict({ results }: { results: ExaResult[] }) {
  const scored = results.filter((r) => r.score != null);
  const high = scored.filter((r) => r.score! >= 0.60).length;
  const totalScored = scored.length;
  const highPct = totalScored > 0 ? Math.round((high / totalScored) * 100) : 0;

  const signal =
    results.length >= 6 && highPct >= 50
      ? { label: "Strong signal", color: "var(--teal)", bg: "rgba(91,138,138,0.08)" }
      : results.length >= 3
        ? { label: "Mixed signal", color: "var(--warning-deep)", bg: "var(--warning-bg)" }
        : { label: "Thin evidence", color: "var(--terracotta)", bg: "rgba(180,107,88,0.06)" };

  const domains = Array.from(
    new Set(
      results.map((r) => {
        try {
          return new URL(r.url).hostname.replace(/^www\./, "");
        } catch {
          return null;
        }
      }),
    ),
  ).filter(Boolean) as string[];

  const dates = results.map((r) => r.publishedDate).filter(Boolean) as string[];
  const recentYear = new Date().getFullYear();
  const recentCount = dates.filter((d) => new Date(d).getFullYear() >= recentYear - 2).length;
  const recencyPct = dates.length > 0 ? Math.round((recentCount / dates.length) * 100) : 0;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
        marginBottom: 12,
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: signal.color,
          background: signal.bg,
          padding: "3px 10px",
          borderRadius: 999,
        }}
      >
        {signal.label}
      </span>
      <span className="mono" style={{ fontSize: 10, color: "var(--ink-muted)" }}>
        {results.length} source{results.length !== 1 ? "s" : ""}
        {domains.length > 0 && ` · ${domains.length} domain${domains.length !== 1 ? "s" : ""}`}
        {dates.length > 0 && ` · ${recencyPct}% recent`}
      </span>
    </div>
  );
}

function PhaseSynthesisDisplay({ synthesis }: { synthesis: PhaseSynthesis }) {
  const verdict = synthesis.verdict;
  const verdictLower = verdict.toLowerCase();
  
  // Color-code the verdict dot
  let dotColor = "var(--warning)";
  if (verdictLower.startsWith("yes")) dotColor = "var(--teal)";
  else if (verdictLower.startsWith("no")) dotColor = "var(--terracotta)";
  
  // Format verdict without the Yes/No/Partially prefix for display
  const verdictText = verdict.replace(/^(Yes|No|Partially)[\s:-]+/i, "").trim();
  const verdictPrefix = verdict.match(/^(Yes|No|Partially)/i)?.[0] || "Partially";

  return (
    <Card padding="sm" style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        {/* Color-coded status dot */}
        <div style={{ paddingTop: 4, flexShrink: 0 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: dotColor,
              display: "inline-block",
            }}
          />
        </div>
        
        <div style={{ minWidth: 0, flex: 1 }}>
          {/* Summary — the main findings description */}
          <p style={{ fontSize: 14, color: "var(--ink)", lineHeight: 1.65, margin: "0 0 12px" }}>
            {synthesis.summary}
          </p>
          
          {/* Verdict line */}
          <div style={{ marginBottom: 8 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: dotColor,
                marginRight: 6,
              }}
            >
              {verdictPrefix}
            </span>
            <span style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", lineHeight: 1.5 }}>
              {verdictText}
            </span>
          </div>
          
          {/* Evidence */}
          <p style={{ fontSize: 13, color: "var(--ink-light)", lineHeight: 1.6, margin: "0 0 8px" }}>
            {synthesis.evidence}
          </p>
          
          {/* Implication */}
          <p style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
            → {synthesis.implication}
          </p>
        </div>
      </div>
    </Card>
  );
}

function TopResultRow({ result }: { result: ExaResult }) {
  const domain = (() => {
    try { return new URL(result.url).hostname.replace(/^www\./, ""); }
    catch { return result.url.slice(0, 40); }
  })();

  const score = result.score ?? 0;
  const scorePct = Math.round(score * 100);
  const scoreColor = score >= 0.60 ? "var(--teal)" : score >= 0.40 ? "var(--warning)" : "var(--terracotta)";
  const scoreBg = score >= 0.60 ? "rgba(91,138,138,0.1)" : score >= 0.40 ? "var(--warning-bg)" : "rgba(180,107,88,0.08)";

  return (
    <Card padding="sm">
      <a
        href={result.url}
        target="_blank"
        rel="noreferrer"
        style={{
          textDecoration: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
        className="group"
      >
        <div style={{ minWidth: 0, display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "var(--ink)",
              lineHeight: 1.45,
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--teal)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--ink)")}
          >
            {result.title || result.url}
          </span>
          <span className="mono" style={{ fontSize: 10, color: "var(--ink-muted)", flexShrink: 0 }}>
            {domain}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              fontFamily: "var(--font-mono)",
              color: scoreColor,
              background: scoreBg,
              padding: "2px 8px",
              borderRadius: 999,
              whiteSpace: "nowrap",
            }}
          >
            {scorePct}%
          </span>
          <ArrowUpRight
            size={12}
            style={{ color: "var(--teal)", opacity: 0, transition: "opacity 0.15s" }}
            className="group-hover:opacity-100"
          />
        </div>
      </a>
    </Card>
  );
}

function CollapsibleResultList({ results }: { results: ExaResult[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ marginTop: 12 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 transition-colors duration-150"
        aria-expanded={open}
        style={{ color: "var(--ink-light)", fontFamily: "var(--font-display)", fontSize: 12 }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--ink-muted)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--ink-light)")}
      >
        <motion.span
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="inline-block"
        >
          <CaretDown size={10} weight="bold" />
        </motion.span>
        <span>
          {open ? "Hide sources" : `Show all ${results.length} sources`}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 28 }}
            style={{ overflow: "hidden", marginTop: 12 }}
          >
            <ResultList results={results} />
          </motion.div>
        )}
      </AnimatePresence>
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

function ResultList({ results }: { results: ExaResult[] }) {
  return (
    <div>
      {results.map((result, i) => (
        <div key={result.id ?? i}>
          {i > 0 && <hr className="rule" style={{ margin: "16px 0" }} />}
          <ResultItem result={result} />
        </div>
      ))}
    </div>
  );
}

function ResultItem({ result }: { result: ExaResult }) {
  const [highlightsOpen, setHighlightsOpen] = useState(false);
  const domain = (() => {
    try { return new URL(result.url).hostname.replace(/^www\./, ""); }
    catch { return result.url.slice(0, 40); }
  })();

  const dateStr = result.publishedDate
    ? new Date(result.publishedDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : null;

  const highlights = result.highlights?.slice(0, 2) ?? [];

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

      {highlights.length > 0 && (
        <div>
          <button
            onClick={() => setHighlightsOpen((open) => !open)}
            className="flex items-center gap-1.5 transition-colors duration-150"
            aria-expanded={highlightsOpen}
            style={{ color: "var(--ink-light)", marginTop: 2 }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.color = "var(--ink-muted)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.color = "var(--ink-light)")
            }
          >
            <motion.span
              animate={{ rotate: highlightsOpen ? 90 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="inline-block"
            >
              <CaretDown size={10} weight="bold" />
            </motion.span>
            <span style={{ fontSize: 11 }}>
              {highlightsOpen
                ? "Hide source excerpts"
                : `${highlights.length} source excerpt${highlights.length > 1 ? "s" : ""}`}
            </span>
          </button>

          <AnimatePresence initial={false}>
            {highlightsOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 240, damping: 28 }}
                style={{
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  marginTop: 12,
                }}
              >
                {highlights.map((h: string, idx: number) => (
                  <HighlightText
                    key={idx}
                    text={h}
                    style={{
                      fontSize: 13,
                      lineHeight: 1.6,
                      color: "var(--ink-light)",
                      paddingLeft: 12,
                      borderLeft: "1.5px solid rgba(26, 26, 24, 0.15)",
                    }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
