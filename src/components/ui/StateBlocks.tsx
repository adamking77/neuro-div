import { WarningCircle } from "@phosphor-icons/react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div style={{ padding: "48px 0", textAlign: "center" as const }}>
      <p
        style={{
          fontSize: 15,
          color: "var(--ink)",
          margin: "0 0 6px",
          fontWeight: 500,
        }}
      >
        {title}
      </p>
      {description && (
        <p
          style={{
            fontSize: 14,
            color: "var(--ink-muted)",
            margin: 0,
            maxWidth: 440,
            marginInline: "auto",
            lineHeight: 1.6,
          }}
        >
          {description}
        </p>
      )}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}

export function ErrorState({ title, message }: { title: string; message?: string }) {
  return (
    <div
      style={{
        padding: "24px",
        background: "rgba(180, 107, 88, 0.06)",
        border: "1px solid rgba(180, 107, 88, 0.2)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <WarningCircle size={16} color="var(--terracotta)" />
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--terracotta)", margin: 0 }}>{title}</p>
      </div>
      {message && (
        <p style={{ fontSize: 12, color: "var(--ink-light)", margin: 0, lineHeight: 1.6 }}>{message}</p>
      )}
    </div>
  );
}

export function LoadingState({ steps }: { steps: { label: string; done: boolean; active: boolean }[] }) {
  return (
    <div style={{ padding: "48px 0", display: "flex", flexDirection: "column", gap: 16 }}>
      {steps.map((step, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 18, height: 18, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {step.done ? (
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "var(--teal)",
                  display: "block",
                  opacity: 0.5,
                }}
              />
            ) : step.active ? (
              <span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} />
            ) : (
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  border: "1px solid var(--rule)",
                  opacity: 0.4,
                  display: "block",
                }}
              />
            )}
          </div>
          <span
            className="mono"
            style={{
              fontSize: 13,
              color: step.active ? "var(--ink)" : "var(--ink-muted)",
              opacity: step.active ? 1 : step.done ? 0.5 : 0.35,
            }}
          >
            {step.label}
          </span>
        </div>
      ))}
    </div>
  );
}
