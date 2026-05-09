export function MetaLabel({
  children,
  marginBottom = 8,
  color = "var(--ink-muted)",
  style,
}: {
  children: React.ReactNode;
  marginBottom?: number;
  color?: string;
  style?: React.CSSProperties;
}) {
  return (
    <p
      style={{
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color,
        margin: `0 0 ${marginBottom}px`,
        fontFamily: "var(--font-mono)",
        lineHeight: 1,
        ...style,
      }}
    >
      {children}
    </p>
  );
}
