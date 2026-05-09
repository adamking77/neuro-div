export function Card({
  children,
  padding = "md",
  border = "default",
  background,
  style,
}: {
  children: React.ReactNode;
  padding?: "sm" | "md" | "lg";
  border?: "default" | "teal" | "terracotta";
  background?: string;
  style?: React.CSSProperties;
}) {
  const paddingMap: Record<string, string> = {
    sm: "12px 14px",
    md: "16px 18px",
    lg: "22px 24px",
  };

  const borderMap: Record<string, string> = {
    default: "1px solid var(--rule)",
    teal: "1px solid rgba(91,138,138,0.25)",
    terracotta: "1px solid rgba(180,107,88,0.2)",
  };

  return (
    <div
      style={{
        padding: paddingMap[padding],
        border: borderMap[border],
        background: background || "transparent",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
