import { useMemo, useState } from "react";
import { DownloadSimple, Copy, Check } from "@phosphor-icons/react";
import { MetaLabel } from "../ui";
import type { NDProfile } from "../../types";
import {
  buildNDProfileMarkdown,
  buildNDProfileContext,
  TRAIT_LABELS,
  TIME_PATTERN_LABELS,
  INFO_DENSITY_LABELS,
  INFO_FORMAT_LABELS,
  SUPPORT_CONDITION_LABELS,
} from "../../lib/nd-profile";
import {
  buildProfileInsights,
  buildOperatingWindow,
  buildProfileRadar,
} from "../../lib/nd-insights";
import { LeadTakeaway, QuietRow, SectionHeading } from "./OutputSection";
import { OutputActionBar } from "./OutputActionBar";
import { ProfileBars } from "./OutputCharts";

function Pill({ label, tone = "default" }: { label: string; tone?: "default" | "teal" | "terracotta" }) {
  const styles: Record<string, React.CSSProperties> = {
    default: { background: "rgba(26,26,24,0.04)", color: "var(--ink-light)", border: "1px solid var(--rule)" },
    teal: { background: "rgba(91,138,138,0.1)", color: "var(--teal-deep)", border: "1px solid rgba(91,138,138,0.25)" },
    terracotta: { background: "rgba(196,114,90,0.08)", color: "var(--terracotta)", border: "1px solid rgba(196,114,90,0.2)" },
  };
  return (
    <span
      style={{
        fontSize: 11,
        fontFamily: "var(--font-display)",
        padding: "3px 10px",
        borderRadius: 999,
        whiteSpace: "nowrap",
        lineHeight: 1.4,
        ...styles[tone],
      }}
    >
      {label}
    </span>
  );
}

function PillRow({ items, tone }: { items: string[]; tone?: "default" | "teal" | "terracotta" }) {
  if (items.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {items.map((item) => (
        <Pill key={item} label={item} tone={tone} />
      ))}
    </div>
  );
}

/** A stacked insight: eyebrow, the claim (diagnosis), then the move it implies
 * (what to actually DO). The action line is the point — emphasised, not muted. */
function InsightRow({ kind, claim, action }: { kind: string; claim: string; action: string }) {
  return (
    <div style={{ minWidth: 0 }}>
      <MetaLabel color="var(--teal)" style={{ marginBottom: 6 }}>{kind}</MetaLabel>
      <p style={{ margin: 0, fontSize: 15, color: "var(--ink-light)", lineHeight: 1.6 }}>{claim}</p>
      <p style={{ margin: "10px 0 0", fontSize: 15, color: "var(--ink)", lineHeight: 1.6 }}>
        <span style={{ color: "var(--teal-deep)", fontWeight: 600 }}>Do this — </span>
        <span style={{ fontWeight: 500 }}>{action}</span>
      </p>
    </div>
  );
}

/** A labelled line list (e.g. "Pulls you in") with a colored marker. */
function MarkedList({ label, color, items }: { label: string; color: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <MetaLabel color={color} style={{ marginBottom: 8 }}>{label}</MetaLabel>
      <ul style={{ margin: 0, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map((p) => (
          <li key={p} style={{ fontSize: 14, color: "var(--ink-light)", lineHeight: 1.55 }}>{p}</li>
        ))}
      </ul>
    </div>
  );
}

export function ContextProfileOutput({
  profile,
  onDownload,
}: {
  profile: NDProfile;
  onDownload?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const markdown = useMemo(() => buildNDProfileMarkdown(profile), [profile]);
  const context = useMemo(() => buildNDProfileContext(profile), [profile]);
  const insights = useMemo(() => buildProfileInsights(profile), [profile]);
  const window = useMemo(() => buildOperatingWindow(profile), [profile]);
  const radar = useMemo(() => buildProfileRadar(profile), [profile]);

  const traits = [
    ...profile.traits.selected.map((t) => TRAIT_LABELS[t]),
    ...(profile.traits.other.trim() ? [profile.traits.other.trim()] : []),
  ];
  const timePatterns = [
    ...profile.timeEnergy.patterns.filter((p) => p !== "other").map((p) => TIME_PATTERN_LABELS[p]),
    ...(profile.timeEnergy.patternOther.trim() ? [profile.timeEnergy.patternOther.trim()] : []),
  ];
  const supportConditions = [
    ...profile.infoConditions.supportConditions.filter((c) => c !== "other").map((c) => SUPPORT_CONDITION_LABELS[c]),
    ...(profile.infoConditions.conditionOther.trim() ? [profile.infoConditions.conditionOther.trim()] : []),
  ];
  const infoFormats = [
    ...profile.infoConditions.formats.filter((f) => f !== "any").map((f) => INFO_FORMAT_LABELS[f]),
    ...(profile.infoConditions.formatOther.trim() ? [profile.infoConditions.formatOther.trim()] : []),
  ];

  const hasHistory =
    profile.history.triedSystems.trim() ||
    profile.history.whatWorked.trim() ||
    profile.history.whatFailed.trim();

  const agentBrief = context.agentGuidance.trim();

  // The lead: prefer the sweet-spot verdict, else the strongest insight.
  const lead = window.sweetSpot
    ? { kind: "The takeaway", text: window.sweetSpot }
    : insights[0]
      ? { kind: insights[0].kind, text: `${insights[0].claim} Do this — ${insights[0].action}` }
      : null;
  // Supporting insights = everything except whichever became the lead.
  const supporting = window.sweetSpot ? insights : insights.slice(1);

  // Actionable summary — every concrete move from the page, gathered. Thorough
  // (nothing dropped) and accurate (same source as the insights above, so it
  // can't drift). The sweet-spot verdict leads if present.
  const allActions = [
    ...(window.sweetSpot ? [window.sweetSpot] : []),
    ...insights.map((i) => i.action),
  ];

  function handleDownload() {
    if (onDownload) {
      onDownload();
      return;
    }
    const blob = new Blob([markdown], { type: "text/markdown" });
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(blob);
    anchor.download = `nd-profile-${Date.now()}.md`;
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  }

  async function handleCopyBrief() {
    await navigator.clipboard.writeText(agentBrief);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ display: "grid", gap: 80, minWidth: 0, maxWidth: 720 }}>
      <OutputActionBar
        actions={[
          { key: "download", label: "Download profile", icon: <DownloadSimple size={14} />, onClick: handleDownload, primary: true },
          {
            key: "copy-brief",
            label: copied ? "Copied" : "Copy AI instructions",
            icon: copied ? <Check size={12} /> : <Copy size={12} />,
            onClick: () => void handleCopyBrief(),
            color: copied ? "var(--teal-deep)" : undefined,
            disabled: !agentBrief,
          },
        ]}
      />

      {/* LEAD — the one thing to take away. */}
      {lead && <LeadTakeaway kind={lead.kind}>{lead.text}</LeadTakeaway>}

      {/* SHAPE — the radar of how they're wired. */}
      <div>
        <SectionHeading marginBottom={6}>How you're wired</SectionHeading>
        <p style={{ margin: "0 0 24px", fontSize: 14, color: "var(--ink-muted)", lineHeight: 1.6 }}>
          A quick picture of where your strengths and needs sit, built from what you chose.
        </p>
        <ProfileBars axes={radar} />
      </div>

      {/* SUPPORTING INSIGHTS — stacked, even, breathing room. */}
      {supporting.length > 0 && (
        <div>
          <SectionHeading marginBottom={28}>What this says about how you work</SectionHeading>
          <div style={{ display: "grid", gap: 40 }}>
            {supporting.map((insight) => (
              <InsightRow key={insight.kind} {...insight} />
            ))}
          </div>
        </div>
      )}

      {/* WINDOW — what works / what to avoid, stacked. */}
      {(window.activators.length > 0 || window.shutdowns.length > 0) && (
        <div>
          <SectionHeading marginBottom={28}>What works for you, what to avoid</SectionHeading>
          <div style={{ display: "grid", gap: 32 }}>
            <MarkedList label="What gets you going" color="var(--teal)" items={window.activators} />
            <MarkedList label="What shuts you down" color="var(--terracotta)" items={window.shutdowns} />
          </div>
        </div>
      )}

      {/* HANDOFF — the file you give to an AI. Not for reading; just download. */}
      {agentBrief && (
        <div style={{ border: "1px solid rgba(91,138,138,0.25)", background: "rgba(91,138,138,0.06)", padding: "18px 20px" }}>
          <MetaLabel color="var(--teal)" style={{ marginBottom: 8 }}>Hand this to your AI</MetaLabel>
          <p style={{ margin: "0 0 14px", fontSize: 14, color: "var(--ink-light)", lineHeight: 1.6, maxWidth: 620 }}>
            So you never have to explain how you work again. Drop this into ChatGPT, Claude, or any AI app and it
            starts off already knowing your rhythm, what helps, and what to avoid — no preamble, no re-teaching it
            every chat. Download keeps a file; copy drops it straight into a conversation.
          </p>
          <OutputActionBar
            actions={[
              { key: "dl", label: "Download profile", icon: <DownloadSimple size={14} />, onClick: handleDownload, primary: true },
              {
                key: "copy",
                label: copied ? "Copied" : "Copy instructions",
                icon: copied ? <Check size={12} /> : <Copy size={12} />,
                onClick: () => void handleCopyBrief(),
                color: copied ? "var(--teal-deep)" : undefined,
              },
            ]}
          />
        </div>
      )}

      {/* REFERENCE — quiet, secondary, stacked. Set apart by space alone. */}
      <div style={{ display: "grid", gap: 36 }}>
        <QuietRow label="Your neurotype">
          {traits.length > 0 ? <PillRow items={traits} tone="teal" /> : (
            <p style={{ margin: 0, fontSize: 13, color: "var(--ink-muted)" }}>No neurotype selected.</p>
          )}
          {profile.traits.manifestations.length > 0 && (
            <p style={{ fontSize: 12, color: "var(--ink-light)", lineHeight: 1.6, margin: "10px 0 0" }}>
              {profile.traits.manifestations.length} detail
              {profile.traits.manifestations.length > 1 ? "s" : ""} about how these show up for you
            </p>
          )}
        </QuietRow>

        {(timePatterns.length > 0 ||
          profile.timeEnergy.activationWindows.trim() ||
          profile.timeEnergy.unavailablePeriods.trim()) && (
          <QuietRow label="Time and energy">
            {timePatterns.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <PillRow items={timePatterns} />
              </div>
            )}
            {profile.timeEnergy.activationWindows.trim() && (
              <p style={{ fontSize: 13, color: "var(--ink-light)", lineHeight: 1.55, margin: "0 0 6px" }}>
                <strong style={{ color: "var(--ink)" }}>When you work:</strong> {profile.timeEnergy.activationWindows.trim()}
              </p>
            )}
            {profile.timeEnergy.unavailablePeriods.trim() && (
              <p style={{ fontSize: 13, color: "var(--ink-light)", lineHeight: 1.55, margin: 0 }}>
                <strong style={{ color: "var(--ink)" }}>Protected downtime:</strong> {profile.timeEnergy.unavailablePeriods.trim()}
              </p>
            )}
          </QuietRow>
        )}

        <QuietRow label="How you take in information">
          {profile.infoConditions.density && (
            <p style={{ fontSize: 13, color: "var(--ink-light)", lineHeight: 1.55, margin: "0 0 8px" }}>
              <strong style={{ color: "var(--ink)" }}>Density:</strong> {INFO_DENSITY_LABELS[profile.infoConditions.density]}
            </p>
          )}
          <PillRow items={infoFormats} />
          {!profile.infoConditions.density && infoFormats.length === 0 && (
            <p style={{ fontSize: 13, color: "var(--ink-muted)", margin: 0 }}>No information preferences set.</p>
          )}
        </QuietRow>

        <QuietRow label="What helps you work">
          {supportConditions.length > 0 ? (
            <PillRow items={supportConditions} />
          ) : (
            <p style={{ fontSize: 13, color: "var(--ink-muted)", margin: 0 }}>No support conditions selected.</p>
          )}
        </QuietRow>

        {hasHistory && (
          <QuietRow label="What you've tried">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {profile.history.triedSystems.trim() && (
                <p style={{ fontSize: 13, color: "var(--ink-light)", lineHeight: 1.55, margin: 0 }}>
                  <strong style={{ color: "var(--ink)" }}>Tried:</strong> {profile.history.triedSystems.trim()}
                </p>
              )}
              {profile.history.whatWorked.trim() && (
                <p style={{ fontSize: 13, color: "var(--ink-light)", lineHeight: 1.55, margin: 0 }}>
                  <strong style={{ color: "var(--ink)" }}>Worked:</strong> {profile.history.whatWorked.trim()}
                </p>
              )}
              {profile.history.whatFailed.trim() && (
                <p style={{ fontSize: 13, color: "var(--ink-light)", lineHeight: 1.55, margin: 0 }}>
                  <strong style={{ color: "var(--ink)" }}>Fell apart:</strong> {profile.history.whatFailed.trim()}
                </p>
              )}
            </div>
          </QuietRow>
        )}
      </div>

      {/* ACTIONABLE SUMMARY — every move from the page, in one checklist. */}
      {allActions.length > 0 && (
        <div style={{ border: "1px solid rgba(91,138,138,0.25)", background: "rgba(91,138,138,0.06)", padding: "26px 28px" }}>
          <SectionHeading color="var(--teal-deep)" marginBottom={8}>Your action list</SectionHeading>
          <p style={{ margin: "0 0 22px", fontSize: 14, color: "var(--ink-light)", lineHeight: 1.6, maxWidth: 600 }}>
            Everything this profile points to, in one place. Change what you can yourself — and hand the rest to your
            AI so it stops working against your wiring. Download or copy below, and you'll never have to explain how
            you work again.
          </p>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 16 }}>
            {allActions.map((action) => (
              <li key={action} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span
                  aria-hidden
                  style={{
                    flexShrink: 0,
                    width: 16,
                    height: 16,
                    marginTop: 3,
                    border: "1.5px solid var(--teal)",
                    borderRadius: 4,
                  }}
                />
                <span style={{ fontSize: 15, color: "var(--ink)", lineHeight: 1.6 }}>{action}</span>
              </li>
            ))}
          </ul>
          <div style={{ marginTop: 24 }}>
            <OutputActionBar
              actions={[
                { key: "dl", label: "Download profile", icon: <DownloadSimple size={14} />, onClick: handleDownload, primary: true },
                {
                  key: "copy",
                  label: copied ? "Copied" : "Copy AI instructions",
                  icon: copied ? <Check size={12} /> : <Copy size={12} />,
                  onClick: () => void handleCopyBrief(),
                  color: copied ? "var(--teal-deep)" : undefined,
                  disabled: !agentBrief,
                },
              ]}
            />
          </div>
        </div>
      )}
    </div>
  );
}
