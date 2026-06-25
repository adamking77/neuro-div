'use client';

import { useState } from "react";
import { Check, Copy } from "@phosphor-icons/react";
import { getSkillDownloadPath } from "@/lib/skill-routes";
import { Card } from "./ui";

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
      "Install this in your AI and run it there. It walks you through the same intake: activation patterns, shutdown triggers, energy rhythms, support conditions. Then it produces the same profile natively in your AI. Every conversation after that already knows how you work.",
    includesAgent: true,
  },
  {
    name: "Process Designer",
    slug: "nd-process-designer",
    status: "Available",
    summary:
      "With your profile already loaded, give it one goal. It builds a working process organized by energy state: step menus for each working mode, rescue steps for when you hit a wall.",
    includesAgent: true,
  },
  {
    name: "Spine-Finder",
    slug: "spine-finder",
    status: "Available",
    summary:
      "Use this in your AI environment when raw self-analysis needs structure. It turns messy paragraph material into candidate problem domains and question-form spines you can react to.",
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
  const [errorSlug, setErrorSlug] = useState<string | null>(null);

  async function fetchSkillSource(skill: SkillCard) {
    const response = await fetch(getSkillDownloadPath(skill.slug), { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to load skill source (${response.status})`);
    }

    return response.text();
  }

  async function handleCopy(skill: SkillCard) {
    try {
      const source = await fetchSkillSource(skill);
      await navigator.clipboard.writeText(source);
      setErrorSlug((current) => (current === skill.slug ? null : current));
      setCopiedSlug(skill.slug);
      setTimeout(() => setCopiedSlug((current) => (current === skill.slug ? null : current)), 2000);
    } catch {
      setErrorSlug(skill.slug);
    }
  }

  async function handleDownload(skill: SkillCard) {
    try {
      const source = await fetchSkillSource(skill);
      const blob = new Blob([source], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${skill.slug}-SKILL.md`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setErrorSlug((current) => (current === skill.slug ? null : current));
    } catch {
      setErrorSlug(skill.slug);
    }
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {SKILLS.map((skill) => {
        const isCopied = copiedSlug === skill.slug;
        const hasError = errorSlug === skill.slug;
        const isAvailable = skill.status === "Available";
        return (
          <Card key={skill.slug} padding="lg">
            <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 260 }}>
                <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 500, color: "var(--ink)", letterSpacing: 0, lineHeight: 1.25 }}>
                  {skill.name}
                </h3>
                <p style={{ margin: 0, fontSize: 14, color: "var(--ink-light)", lineHeight: 1.7 }}>
                  {skill.summary}
                </p>
              </div>
              {isAvailable && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 10, flexShrink: 0 }}>
                  <button className="cta-pill" onClick={() => void handleDownload(skill)} aria-label={`Download the ${skill.name} skill file`}>
                    Download SKILL.md
                    <span aria-hidden="true">↓</span>
                  </button>
                  <button
                    className="btn-text"
                    onClick={() => void handleCopy(skill)}
                    style={{ fontSize: 12, color: isCopied ? "var(--teal-deep)" : "var(--ink-muted)" }}
                  >
                    {isCopied ? <Check size={12} /> : <Copy size={12} />}
                    {isCopied ? "Copied" : "Copy skill"}
                  </button>
                </div>
              )}
            </div>
            {hasError && (
              <p style={{ margin: "14px 0 0", fontSize: 12, color: "var(--terracotta)", lineHeight: 1.5 }}>
                Could not load this skill package. Try again.
              </p>
            )}
          </Card>
        );
      })}
    </div>
  );
}
