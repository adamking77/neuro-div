import { Spinner } from "@heroui/react";

interface Props {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  armed?: boolean;
  type?: "button" | "submit";
  icon?: React.ReactNode;
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  loading,
  armed,
  type = "button",
  icon,
}: Props) {
  const canClick = !disabled && !loading;
  return (
    <button
      type={type}
      onClick={canClick ? onClick : undefined}
      disabled={!canClick}
      style={{
        fontFamily: "var(--font-display)",
        fontSize: 15,
        fontWeight: 600,
        letterSpacing: "0.01em",
        padding: "10px 52px",
        border: "none",
        borderRadius: 999,
        cursor: canClick ? "pointer" : "not-allowed",
        background: !canClick
          ? "rgba(91, 138, 138, 0.4)"
          : armed
            ? "var(--ink-light)"
            : "var(--teal)",
        color: "#fff",
        transition: "background 0.15s",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        flexShrink: 0,
      }}
    >
      {loading ? (
        <>
          <Spinner size="sm" color="current" />
          <span>{children}</span>
        </>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
}
