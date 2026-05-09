import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CaretDown, Check, Info, WarningCircle } from "@phosphor-icons/react";
import { STRATEGY_SECTIONS } from "../lib/strategy";
import type { StrategyCitation, StrategySectionContent } from "../types";

const EFFORT_STYLES: Record<string, { bg: string; text: string }> = {
  low: { bg: "rgba(91, 138, 138, 0.12)", text: "var(--teal)" },
  medium: { bg: "var(--warning-pill)", text: "var(--warning-deep)" },
  high: { bg: "rgba(180, 107, 88, 0.14)", text: "var(--terracotta)" },
};

const CALLOUT_STYLES: Record<string, { border: string; bg: string; icon: React.ReactNode }> = {
  insight: {
    border: "var(--teal)",
    bg: "rgba(91, 138, 138, 0.05)",
    icon: <Info size={13} weight="bold" color="var(--teal)" />,
  },
  warning: {
    border: "var(--terracotta)",
    bg: "rgba(180, 107, 88, 0.05)",
    icon: <WarningCircle size={13} weight="bold" color="var(--terracotta)" />,
  },
  opportunity: {
    border: "var(--warning)",
    bg: "rgba(196, 164, 132, 0.05)",
    icon: <ArrowRight size={13} weight="bold" color="var(--warning-deep)" />,
  },
};

interface Props {
  section: (typeof STRATEGY_SECTIONS)[number];
  index: number;
  content: StrategySectionContent;
  citations: StrategyCitation[];
}

export function StrategySectionCard({ section, index, content, citations }: Props) {
  const isAnchor = index === 0;
  const isOutput = index === STRATEGY_SECTIONS.length - 1;

  return (
    <div>
      {/* Section heading */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
            <span
              className="mono"
              style={{ fontSize: 10, color: "var(--ink-muted)", letterSpacing: "0.08em" }}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <span
              style={{
                fontSize: isAnchor ? 16 : 14,
                fontWeight: isAnchor ? 500 : 400,
                color: "var(--ink)",
                letterSpacing: isAnchor ? "-0.02em" : "-0.01em",
              }}
            >
              {section.label}
            </span>
            {isOutput && (
              <span
                style={{
                  fontSize: 9,
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--terracotta)",
                  opacity: 0.7,
                }}
              >
                what to do next
              </span>
            )}
          </div>
          <p style={{ fontSize: 12, color: "var(--ink-muted)", lineHeight: 1.55, margin: 0 }}>
            {section.hint}
          </p>
        </div>
        <CitationChip citations={citations} />
      </div>

      {/* Summary */}
      {content.summary && (
        <p
          style={{
            fontSize: 14,
            color: "var(--ink-light)",
            lineHeight: 1.7,
            margin: "0 0 16px",
          }}
        >
          {content.summary}
        </p>
      )}

      {/* Recommendations */}
      {content.recommendations.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
          {content.recommendations.map((rec, i) => {
            const effort = EFFORT_STYLES[rec.effort] ?? EFFORT_STYLES.medium;
            return (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ marginTop: 3, flexShrink: 0, color: rec.actionable ? "var(--teal)" : "var(--ink-muted)" }}>
                  {rec.actionable
                    ? <Check size={13} weight="bold" />
                    : <span style={{ fontSize: 16, lineHeight: 1 }}>·</span>}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.55 }}>{rec.text}</span>
                    <span
                      style={{
                        fontSize: 10,
                        fontFamily: "var(--font-mono)",
                        letterSpacing: "0.07em",
                        textTransform: "uppercase",
                        padding: "2px 7px",
                        borderRadius: 999,
                        background: effort.bg,
                        color: effort.text,
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    >
                      {rec.effort}
                    </span>
                  </div>
                  {rec.why && (
                    <p
                      style={{
                        fontSize: 11,
                        color: "var(--ink-muted)",
                        lineHeight: 1.55,
                        margin: "4px 0 0",
                        fontStyle: "italic",
                      }}
                    >
                      {rec.why}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Callouts */}
      {content.callouts.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
          {content.callouts.map((callout, i) => {
            const style = CALLOUT_STYLES[callout.type] ?? CALLOUT_STYLES.insight;
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  padding: "10px 12px",
                  background: style.bg,
                  border: `1px solid ${style.border}`,
                }}
              >
                <span style={{ marginTop: 2, flexShrink: 0 }}>{style.icon}</span>
                <p style={{ fontSize: 12, color: "var(--ink-light)", lineHeight: 1.6, margin: 0 }}>
                  {callout.text}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <SectionCitations citations={citations} />
    </div>
  );
}

function CitationChip({ citations }: { citations: StrategyCitation[] }) {
  if (citations.length === 0) return null;
  return (
    <span
      style={{
        fontSize: 10,
        fontFamily: "var(--font-mono)",
        letterSpacing: "0.06em",
        color: "var(--ink-muted)",
        border: "1px solid var(--rule)",
        padding: "2px 7px",
        borderRadius: 999,
        flexShrink: 0,
      }}
    >
      {citations.length} source{citations.length !== 1 ? "s" : ""}
    </span>
  );
}

function SectionCitations({ citations }: { citations: StrategyCitation[] }) {
  const [open, setOpen] = useState(false);

  if (citations.length === 0) return null;

  return (
    <div style={{ marginTop: 10 }}>
      <button
        onClick={() => setOpen((c) => !c)}
        className="btn-text"
        aria-expanded={open}
        style={{ fontSize: 11, color: "var(--ink-muted)" }}
      >
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          style={{ display: "inline-flex" }}
        >
          <CaretDown size={10} />
        </motion.span>
        Evidence
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 7 }}>
              {citations.map((citation, i) => (
                <a
                  key={`${citation.url}-${i}`}
                  href={citation.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    textDecoration: "none",
                    color: "var(--ink)",
                    borderTop: i === 0 ? "1px solid var(--rule)" : "none",
                    paddingTop: i === 0 ? 8 : 0,
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.45 }}>
                    {citation.title}
                  </span>
                  {citation.note && (
                    <p style={{ fontSize: 11, color: "var(--ink-muted)", lineHeight: 1.5, margin: "3px 0 0" }}>
                      {citation.note}
                    </p>
                  )}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
