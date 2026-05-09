export function SectionNumber({ number, color = "muted" }: { number: string; color?: "muted" | "teal" }) {
  return (
    <span
      className="mono"
      style={{
        fontSize: 10,
        letterSpacing: "0.1em",
        color: color === "teal" ? "var(--teal)" : "var(--ink-muted)",
        fontFamily: "var(--font-mono)",
        fontWeight: color === "teal" ? 700 : 400,
      }}
    >
      {number}
    </span>
  );
}
