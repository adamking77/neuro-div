import { useMemo, useState } from "react";
import { DownloadSimple, Copy, Check, ArrowRight } from "@phosphor-icons/react";
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
  buildAgentBenefits,
} from "../../lib/nd-insights";
import { LeadTakeaway, QuietRow, SectionHeading } from "./OutputSection";
import { OutputActionBar } from "./OutputActionBar";
import { ProfileBars, BalanceMeter } from "./OutputCharts";

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
        <span style={{ color: "var(--teal-deep)", fontWeight: 600 }}>Do this: </span>
        <span style={{ fontWeight: 500 }}>{action}</span>
      </p>
    </div>
  );
}

/** One side of the operating window: a color-capped column with a readable
 * header, a count, and roomy rows. The color coding (teal = energize,
 * terracotta = drain) carries the contrast so the two sides never blur. */
function WindowColumn({
  label,
  headerColor,
  accent,
  items,
}: {
  label: string;
  headerColor: string;
  accent: string;
  items: string[];
}) {
  if (items.length === 0) return null;
  return (
    <div style={{ borderTop: `2px solid ${accent}`, paddingTop: 16, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, marginBottom: 18 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: headerColor, lineHeight: 1.3 }}>{label}</span>
        <span className="mono" style={{ fontSize: 11, color: "var(--ink-muted)" }}>{items.length}</span>
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 16 }}>
        {items.map((p) => (
          <li key={p} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span aria-hidden style={{ flexShrink: 0, width: 6, height: 6, marginTop: 8, borderRadius: 999, background: accent }} />
            <span style={{ fontSize: 15, color: "var(--ink-light)", lineHeight: 1.55 }}>{p}</span>
          </li>
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
      ? { kind: insights[0].kind, text: `${insights[0].claim} Do this: ${insights[0].action}` }
      : null;
  // Supporting insights = everything except whichever became the lead.
  const supporting = window.sweetSpot ? insights : insights.slice(1);

  // The closing recap: a short digest of the insights (essence only, not the
  // full claim+action), so the page ends on a summary of what was found rather
  // than a checklist of commands. Same source as the insights above, so it
  // can't drift.
  const recap = insights.map((i) => ({ kind: i.kind, summary: i.summary }));

  // The payoff: concrete things the AI will do differently once it has this.
  const benefits = buildAgentBenefits(profile);

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
    <div style={{ display: "grid", gap: 72, minWidth: 0, maxWidth: 720 }}>
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
        <SectionHeading marginBottom={8}>How you're wired</SectionHeading>
        <p style={{ margin: "0 0 24px", fontSize: 15, color: "var(--ink-muted)", lineHeight: 1.6 }}>
          A quick picture of where your strengths and needs sit, built from what you chose.
        </p>
        <ProfileBars axes={radar} />
      </div>

      {/* SUPPORTING INSIGHTS — stacked, even, breathing room. */}
      {supporting.length > 0 && (
        <div>
          <SectionHeading marginBottom={28}>What this says about how you work</SectionHeading>
          <div style={{ display: "grid", gap: 32 }}>
            {supporting.map((insight) => (
              <InsightRow key={insight.kind} {...insight} />
            ))}
          </div>
        </div>
      )}

      {/* WINDOW — what works / what to avoid. Two color-coded columns so the
          energize-vs-drain contrast reads at a glance, with the balance meter
          as the at-a-glance topper. */}
      {(window.activators.length > 0 || window.shutdowns.length > 0) && (
        <div>
          <SectionHeading marginBottom={8}>What works for you, what to avoid</SectionHeading>
          <p style={{ margin: "0 0 24px", fontSize: 15, color: "var(--ink-muted)", lineHeight: 1.6 }}>
            The conditions that switch you on, and the ones that switch you off. Build the first into your day, and
            keep the second out of it.
          </p>
          <BalanceMeter activators={window.activators.length} shutdowns={window.shutdowns.length} />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 32,
              marginTop: 36,
            }}
          >
            <WindowColumn label="What gets you going" headerColor="var(--teal-deep)" accent="var(--teal)" items={window.activators} />
            <WindowColumn label="What shuts you down" headerColor="var(--terracotta)" accent="var(--terracotta)" items={window.shutdowns} />
          </div>
        </div>
      )}

      {/* REFERENCE — quiet, secondary, stacked. Set apart by space alone. */}
      <div style={{ display: "grid", gap: 32 }}>
        <QuietRow label="Your neurotype">
          {traits.length > 0 ? <PillRow items={traits} tone="teal" /> : (
            <p style={{ margin: 0, fontSize: 15, color: "var(--ink-muted)" }}>No neurotype selected.</p>
          )}
          {profile.traits.manifestations.length > 0 && (
            <p style={{ fontSize: 15, color: "var(--ink-light)", lineHeight: 1.6, margin: "10px 0 0" }}>
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
              <p style={{ fontSize: 15, color: "var(--ink-light)", lineHeight: 1.6, margin: "0 0 6px" }}>
                <strong style={{ color: "var(--ink)" }}>When you work:</strong> {profile.timeEnergy.activationWindows.trim()}
              </p>
            )}
            {profile.timeEnergy.unavailablePeriods.trim() && (
              <p style={{ fontSize: 15, color: "var(--ink-light)", lineHeight: 1.6, margin: 0 }}>
                <strong style={{ color: "var(--ink)" }}>Protected downtime:</strong> {profile.timeEnergy.unavailablePeriods.trim()}
              </p>
            )}
          </QuietRow>
        )}

        <QuietRow label="How you take in information">
          {profile.infoConditions.density && (
            <p style={{ fontSize: 15, color: "var(--ink-light)", lineHeight: 1.6, margin: "0 0 8px" }}>
              <strong style={{ color: "var(--ink)" }}>Density:</strong> {INFO_DENSITY_LABELS[profile.infoConditions.density]}
            </p>
          )}
          <PillRow items={infoFormats} />
          {!profile.infoConditions.density && infoFormats.length === 0 && (
            <p style={{ fontSize: 15, color: "var(--ink-muted)", margin: 0 }}>No information preferences set.</p>
          )}
        </QuietRow>

        <QuietRow label="What helps you work">
          {supportConditions.length > 0 ? (
            <PillRow items={supportConditions} />
          ) : (
            <p style={{ fontSize: 15, color: "var(--ink-muted)", margin: 0 }}>No support conditions selected.</p>
          )}
        </QuietRow>

        {hasHistory && (
          <QuietRow label="What you've tried">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {profile.history.triedSystems.trim() && (
                <p style={{ fontSize: 15, color: "var(--ink-light)", lineHeight: 1.6, margin: 0 }}>
                  <strong style={{ color: "var(--ink)" }}>Tried:</strong> {profile.history.triedSystems.trim()}
                </p>
              )}
              {profile.history.whatWorked.trim() && (
                <p style={{ fontSize: 15, color: "var(--ink-light)", lineHeight: 1.6, margin: 0 }}>
                  <strong style={{ color: "var(--ink)" }}>Worked:</strong> {profile.history.whatWorked.trim()}
                </p>
              )}
              {profile.history.whatFailed.trim() && (
                <p style={{ fontSize: 15, color: "var(--ink-light)", lineHeight: 1.6, margin: 0 }}>
                  <strong style={{ color: "var(--ink)" }}>Fell apart:</strong> {profile.history.whatFailed.trim()}
                </p>
              )}
            </div>
          </QuietRow>
        )}
      </div>

      {/* CLOSE — the short version of what the profile found, the handoff, and
          plain instructions for using it with an AI. Not a checklist of moves;
          a recap plus the deliverable. */}
      {agentBrief && (
        <div style={{ border: "1px solid rgba(91,138,138,0.25)", background: "rgba(91,138,138,0.06)", padding: "26px 28px" }}>
          <SectionHeading color="var(--teal-deep)" marginBottom={8}>The short version</SectionHeading>
          <p style={{ margin: "0 0 28px", fontSize: 15, color: "var(--ink-light)", lineHeight: 1.6, maxWidth: 600 }}>
            Hand this to your AI once, and it starts working the way you do. No more explaining yourself at the start
            of every chat.
          </p>

          {recap.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <MetaLabel color="var(--teal)" style={{ marginBottom: 12 }}>What it now understands about you</MetaLabel>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 12 }}>
                {recap.map((item) => (
                  <li key={item.kind} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <span aria-hidden style={{ flexShrink: 0, width: 6, height: 6, marginTop: 8, borderRadius: 999, background: "var(--teal)" }} />
                    <span style={{ fontSize: 15, color: "var(--ink)", lineHeight: 1.6 }}>{item.summary}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {benefits.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <MetaLabel color="var(--teal)" style={{ marginBottom: 12 }}>What it'll do differently for you</MetaLabel>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 12 }}>
                {benefits.map((b) => (
                  <li key={b} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <ArrowRight size={14} color="var(--teal-deep)" weight="bold" style={{ flexShrink: 0, marginTop: 4 }} />
                    <span style={{ fontSize: 15, color: "var(--ink)", lineHeight: 1.6 }}>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

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

          <div style={{ marginTop: 24, paddingTop: 22, borderTop: "1px solid rgba(91,138,138,0.25)" }}>
            <MetaLabel color="var(--teal)" style={{ marginBottom: 12 }}>How to use it</MetaLabel>
            <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
              {[
                "Copy the instructions above, or download the file.",
                "Open ChatGPT, Claude, or any AI app you use.",
                "Paste it at the start of a chat. Better still, save it as that app's custom instructions or project memory so it sticks to every conversation, not just one.",
              ].map((stepText, i) => (
                <li key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span
                    aria-hidden
                    style={{
                      flexShrink: 0,
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      color: "var(--teal-deep)",
                      lineHeight: "24px",
                      minWidth: 14,
                    }}
                  >
                    {i + 1}
                  </span>
                  <span style={{ fontSize: 15, color: "var(--ink-light)", lineHeight: 1.6 }}>{stepText}</span>
                </li>
              ))}
            </ol>
            <p style={{ margin: "14px 0 0", fontSize: 15, color: "var(--ink-light)", lineHeight: 1.6, maxWidth: 600 }}>
              From then on it responds to how you actually work, with no re-explaining.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
