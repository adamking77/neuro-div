'use client';

import type { CSSProperties } from "react";
import { useState } from "react";
import { Check, Copy, DownloadSimple } from "@phosphor-icons/react";

interface SkillCard {
  name: string;
  slug: string;
  status: "Available" | "Planned";
  summary: string;
  includesAgent: boolean;
}

const SKILLS: SkillCard[] = [
  {
    name: "Context Builder",
    slug: "nd-context-builder",
    status: "Available",
    summary:
      "Build your profile here or inside any AI that saves instructions. It asks the same questions and produces the same profile file. Set it up once and every conversation in that AI already knows how you work.",
    includesAgent: true,
  },
  {
    name: "Process Designer",
    slug: "nd-process-designer",
    status: "Available",
    summary:
      "Give it your profile and one goal. It builds a plan that matches your energy patterns, not a fixed schedule. The output is structured so any AI can run it with no extra setup.",
    includesAgent: true,
  },
  {
    name: "Category Scout",
    slug: "category-scout",
    status: "Available",
    summary:
      "Run this before you commit to a direction. Give it a problem statement and any known players. It searches six angles and gives you a research file you can read or pass straight to Distribution Strategy.",
    includesAgent: true,
  },
  {
    name: "Distribution Strategy",
    slug: "distribution-strategy",
    status: "Available",
    summary:
      "Reads your Category Scout research and your profile together. It writes a plan for getting your work seen that matches how you actually work. Not a generic template.",
    includesAgent: true,
  },
  {
    name: "Session Loop",
    slug: "nd-session-loop",
    status: "Available",
    summary:
      "Run this at the start of a session. It checks your active plan, asks what you have energy for today, and gives you exactly one move to make. Run it at the end and it records what happened and updates your plan. No catch-up talk. No guilt.",
    includesAgent: true,
  },
];

export function SkillsLibrary() {
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  async function handleCopy(skill: SkillCard) {
    const response = await fetch(`/skills/${skill.slug}/download`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to load skill bundle (${response.status})`);
    }

    const bundle = await response.text();
    await navigator.clipboard.writeText(bundle);
    setCopiedSlug(skill.slug);
    setTimeout(() => setCopiedSlug((current) => (current === skill.slug ? null : current)), 2000);
  }

  return (
    <div>
      <div style={{ maxWidth: 600, marginBottom: 32, paddingBottom: 32, borderBottom: "1px solid var(--rule)" }}>
        <p style={{ margin: "0 0 10px", fontSize: 14, color: "var(--ink-light)", lineHeight: 1.75 }}>
          Each skill is a set of instructions you paste into an AI you already use. Once pasted, that AI runs the same process as these web tools.
        </p>
        <p style={{ margin: 0, fontSize: 14, color: "var(--ink-muted)", lineHeight: 1.65 }}>
          Copy or download a skill below, then paste it into your system prompt or project instructions.
        </p>
      </div>

      <div style={{ display: "grid", gap: 18 }}>
        {SKILLS.map((skill, index) => {
          const isCopied = copiedSlug === skill.slug;
          return (
            <div key={skill.slug} style={{ border: "1px solid var(--rule)", padding: "18px 18px 16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "32px 1fr", gap: 12 }}>
                <span className="mono" style={{ fontSize: 10, color: "var(--ink-muted)", letterSpacing: "0.1em", paddingTop: 2 }}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 style={{ margin: "0 0 10px", fontSize: 17, fontWeight: 500, color: "var(--ink)", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                    {skill.name}
                  </h3>
                  <p style={{ margin: "0 0 20px", fontSize: 14, color: "var(--ink-light)", lineHeight: 1.7 }}>
                    {skill.summary}
                  </p>
                  <div style={{ marginBottom: 16 }}>
                    <p style={metaLabelStyle}>Package includes</p>
                    <p style={{ margin: 0, fontSize: 12, color: "var(--ink-muted)", lineHeight: 1.8 }}>
                      {`skills/${skill.slug}/SKILL.md`}
                      {skill.includesAgent ? " · agents/openai.yaml" : ""}
                      {" · _shared/ reference docs"}
                    </p>
                  </div>
                  {skill.status === "Available" && (
                    <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                      <button
                        className="btn-text"
                        onClick={() => void handleCopy(skill)}
                        style={{ fontSize: 12, color: isCopied ? "var(--teal-deep)" : "var(--ink-muted)" }}
                      >
                        {isCopied ? <Check size={12} /> : <Copy size={12} />}
                        {isCopied ? "Copied" : "Copy skill"}
                      </button>
                      <a
                        href={`/skills/${skill.slug}/download`}
                        style={{ fontSize: 12, color: "var(--ink-muted)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5 }}
                      >
                        <DownloadSimple size={12} />
                        Download skill
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const metaLabelStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "var(--ink-muted)",
  margin: "0 0 8px",
  fontFamily: "var(--font-mono)",
};
