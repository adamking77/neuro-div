import type { ReactNode } from "react";
import { MetaLabel } from "../ui";

/**
 * The single highlighted takeaway at the top of an output artifact. Large,
 * set apart with a teal hairline, so the eye lands here first. Use exactly
 * once per page — it's the lead, not a style.
 */
export function LeadTakeaway({ kind, children }: { kind: string; children: ReactNode }) {
  return (
    <div
      style={{
        borderTop: "2px solid var(--teal)",
        paddingTop: 22,
      }}
    >
      <MetaLabel color="var(--teal)" style={{ marginBottom: 14 }}>{kind}</MetaLabel>
      <p
        style={{
          margin: 0,
          fontSize: 26,
          lineHeight: 1.4,
          color: "var(--ink)",
          fontWeight: 500,
          maxWidth: 720,
          letterSpacing: 0,
        }}
      >
        {children}
      </p>
    </div>
  );
}

/** A real, readable section heading (Satoshi ~19px) — not a 10px mono tag.
 * Use for top-level sections so the page is scannable. */
export function SectionHeading({
  children,
  color,
  marginBottom = 16,
}: {
  children: ReactNode;
  color?: string;
  marginBottom?: number;
}) {
  return (
    <h2
      style={{
        margin: `0 0 ${marginBottom}px`,
        fontSize: 19,
        fontWeight: 500,
        lineHeight: 1.3,
        letterSpacing: 0,
        color: color ?? "var(--ink)",
      }}
    >
      {children}
    </h2>
  );
}

/** A quiet, borderless reference row: mono label above, content below. For
 * secondary detail that shouldn't compete with insights. */
export function QuietRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ minWidth: 0 }}>
      <MetaLabel style={{ marginBottom: 8 }}>{label}</MetaLabel>
      {children}
    </div>
  );
}

/**
 * A section: mono eyebrow label, optional header actions, optional subtitle,
 * then content. UNFRAMED by default — structure comes from whitespace and the
 * label, not a border (DESIGN.md: depth = whitespace + hairline, not boxing
 * everything). Pass framed only for a genuinely discrete callout.
 */
export function OutputSection({
  label,
  labelColor,
  subtitle,
  headerActions,
  children,
  framed = false,
  style,
}: {
  label: string;
  labelColor?: string;
  subtitle?: ReactNode;
  headerActions?: ReactNode;
  children: ReactNode;
  /** When true, draws a hairline frame. Default false — most sections are open. */
  framed?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <section
      style={{
        border: framed ? "1px solid var(--rule)" : "none",
        padding: framed ? "20px 22px" : 0,
        // Allow this section to shrink below its content size inside grid/flex
        // parents — without this, grid items default to min-width:auto and
        // force horizontal overflow on narrow viewports.
        minWidth: 0,
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: subtitle ? 8 : 16,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 19,
            fontWeight: 500,
            lineHeight: 1.3,
            letterSpacing: 0,
            color: labelColor ?? "var(--ink)",
          }}
        >
          {label}
        </h2>
        {headerActions}
      </div>
      {subtitle ? (
        <p
          style={{
            margin: "0 0 24px",
            fontSize: 15,
            color: "var(--ink-muted)",
            lineHeight: 1.6,
          }}
        >
          {subtitle}
        </p>
      ) : null}
      {children}
    </section>
  );
}
