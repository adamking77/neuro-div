'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, Copy, DownloadSimple } from "@phosphor-icons/react";

interface SkillManifestEntry {
  slug: string;
  name: string;
  description: string;
  detailUrl: string;
  sourceUrl: string;
  downloadUrl: string;
}

interface SkillsManifest {
  generatedAt: string;
  skills: SkillManifestEntry[];
}

export function SkillsLibrary() {
  const [skills, setSkills] = useState<SkillManifestEntry[]>([]);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadSkills() {
      try {
        const response = await fetch("/skills.json", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Failed to load skills manifest (${response.status})`);
        }

        const data = (await response.json()) as SkillsManifest;
        if (!cancelled) {
          setSkills(data.skills);
        }
      } catch {
        if (!cancelled) {
          setSkills([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadSkills();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCopy(skill: SkillManifestEntry) {
    await navigator.clipboard.writeText(skill.sourceUrl);
    setCopiedSlug(skill.slug);
    setTimeout(() => setCopiedSlug((current) => (current === skill.slug ? null : current)), 2000);
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--ink-muted)" }}>
        <span className="spinner" />
        <span style={{ fontSize: 14 }}>Loading skills…</span>
      </div>
    );
  }

  return (
    <div>
      <div style={{ maxWidth: 600, marginBottom: 32, paddingBottom: 32, borderBottom: "1px solid var(--rule)" }}>
        <p style={{ margin: "0 0 10px", fontSize: 14, color: "var(--ink-light)", lineHeight: 1.75 }}>
          Each skill is a set of instructions you can install or reference directly. The public route gives you the
          detail page, raw source, and bundle download without relying on Vite raw imports.
        </p>
        <p style={{ margin: 0, fontSize: 14, color: "var(--ink-muted)", lineHeight: 1.65 }}>
          Open a skill page to inspect it, copy the raw source URL, or download the packaged bundle.
        </p>
      </div>

      <div style={{ display: "grid", gap: 18 }}>
        {skills.map((skill, index) => {
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
                    {skill.description}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                    <Link href={skill.detailUrl} style={{ fontSize: 12, color: "var(--teal-deep)", textDecoration: "none" }}>
                      View skill
                    </Link>
                    <button className="btn-text" onClick={() => void handleCopy(skill)} style={{ fontSize: 12, color: isCopied ? "var(--teal-deep)" : "var(--ink-muted)" }}>
                      {isCopied ? <Check size={12} /> : <Copy size={12} />}
                      {isCopied ? "Copied source URL" : "Copy source URL"}
                    </button>
                    <a href={skill.downloadUrl} style={{ fontSize: 12, color: "var(--ink-muted)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5 }}>
                      <DownloadSimple size={12} />
                      Download bundle
                    </a>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
