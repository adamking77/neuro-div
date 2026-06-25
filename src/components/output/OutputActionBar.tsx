import type { ReactNode } from "react";
import { PrimaryButton } from "../ui";

export interface OutputAction {
  key: string;
  label: ReactNode;
  icon?: ReactNode;
  onClick: () => void;
  /** Primary actions render as the teal pill; the rest are quiet text buttons. */
  primary?: boolean;
  loading?: boolean;
  /** Override text-button color (e.g. teal-deep for a transient "copied" state). */
  color?: string;
  disabled?: boolean;
}

/**
 * The persistent action row for an output artifact: download / copy / save /
 * generate. Primary actions become teal pills; everything else stays a quiet
 * `.btn-text`. No nesting, no card — it sits directly on the page.
 */
export function OutputActionBar({ actions }: { actions: OutputAction[] }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        flexWrap: "wrap",
      }}
    >
      {actions.map((action) =>
        action.primary ? (
          <PrimaryButton
            key={action.key}
            onClick={action.onClick}
            loading={action.loading}
            disabled={action.disabled}
            icon={action.icon}
          >
            {action.label}
          </PrimaryButton>
        ) : (
          <button
            key={action.key}
            onClick={action.onClick}
            className="btn-text"
            disabled={action.disabled}
            style={{
              fontSize: 12,
              color: action.color ?? "var(--ink-muted)",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            {action.icon}
            {action.label}
          </button>
        ),
      )}
    </div>
  );
}
