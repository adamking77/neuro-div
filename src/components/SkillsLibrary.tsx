import { useState } from "react";
import { Check, Copy, DownloadSimple } from "@phosphor-icons/react";

import sharedArchitecture from "../../skills/_shared/architecture.md?raw";
import sharedArtifacts from "../../skills/_shared/artifact-contracts.md?raw";
import sharedSurfaceMap from "../../skills/_shared/surface-map.md?raw";
import sharedGithubDistribution from "../../skills/_shared/github-distribution.md?raw";

import ndContextSkill from "../../skills/nd-context-builder/SKILL.md?raw";
import ndContextOpenAi from "../../skills/nd-context-builder/agents/openai.yaml?raw";

import ndProcessSkill from "../../skills/nd-process-designer/SKILL.md?raw";
import ndProcessOpenAi from "../../skills/nd-process-designer/agents/openai.yaml?raw";

import categoryScoutSkill from "../../skills/category-scout/SKILL.md?raw";
import categoryScoutOpenAi from "../../skills/category-scout/agents/openai.yaml?raw";

import distributionStrategySkill from "../../skills/distribution-strategy/SKILL.md?raw";
import distributionStrategyOpenAi from "../../skills/distribution-strategy/agents/openai.yaml?raw";

import ndSessionLoopSkill from "../../skills/nd-session-loop/SKILL.md?raw";
import ndSessionLoopOpenAi from "../../skills/nd-session-loop/agents/openai.yaml?raw";

interface SkillPackage {
  name: string;
  slug: string;
  status: "Available" | "Planned";
  surface: string;
  summary: string;
  input: string;
  output: string;
  skillText: string;
  openAiYaml: string;
}

const SHARED_FILES = [
  { path: "_shared/architecture.md", content: sharedArchitecture },
  { path: "_shared/artifact-contracts.md", content: sharedArtifacts },
  { path: "_shared/surface-map.md", content: sharedSurfaceMap },
  { path: "_shared/github-distribution.md", content: sharedGithubDistribution },
];

const SKILLS: SkillPackage[] = [
  {
    name: "ND Context Builder",
    slug: "nd-context-builder",
    status: "Available",
    surface: "Tool + Skill",
    summary: "Builds the persistent ND profile artifact that every other skill and tool can read.",
    input: "Existing context plus intake answers about traits, activation, shutdown, time, systems, and support conditions.",
    output: "ND profile markdown artifact.",
    skillText: ndContextSkill,
    openAiYaml: ndContextOpenAi,
  },
  {
    name: "ND Process Designer",
    slug: "nd-process-designer",
    status: "Available",
    surface: "Tool + Skill",
    summary: "Turns an ND profile and one concrete goal into a trigger-based process artifact and agent brief.",
    input: "ND profile artifact plus one goal, a success signal, likely friction, and a not-doing list.",
    output: "ND process markdown artifact.",
    skillText: ndProcessSkill,
    openAiYaml: ndProcessOpenAi,
  },
  {
    name: "Category Scout",
    slug: "category-scout",
    status: "Available",
    surface: "Tool + Skill",
    summary: "Runs the research side only: evidence gathering, phase framing, and the category dossier.",
    input: "Problem statement, known players, and whatever live or provided research context is available.",
    output: "Category research dossier.",
    skillText: categoryScoutSkill,
    openAiYaml: categoryScoutOpenAi,
  },
  {
    name: "Distribution Strategy",
    slug: "distribution-strategy",
    status: "Available",
    surface: "Tool + Skill",
    summary: "Reads research plus ND constraints and writes the strategy/process artifact and receiving-agent brief.",
    input: "Research dossier, ND profile, audience lens, operator constraints, and project-specific realities.",
    output: "Distribution strategy artifact plus agent brief.",
    skillText: distributionStrategySkill,
    openAiYaml: distributionStrategyOpenAi,
  },
  {
    name: "ND Session Loop",
    slug: "nd-session-loop",
    status: "Planned",
    surface: "Skill only",
    summary: "Combines session start and reflection into one operating loop that reads the active process and updates it over time.",
    input: "Active ND process artifact and the user's in-the-moment session state.",
    output: "A surfaced move plus outcomes-log updates.",
    skillText: ndSessionLoopSkill,
    openAiYaml: ndSessionLoopOpenAi,
  },
];

export function SkillsLibrary() {
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  async function handleCopy(skill: SkillPackage) {
    await navigator.clipboard.writeText(buildPackageBundle(skill));
    setCopiedSlug(skill.slug);
    setTimeout(() => setCopiedSlug((current) => (current === skill.slug ? null : current)), 2000);
  }

  function handleDownload(skill: SkillPackage) {
    const blob = new Blob([buildPackageBundle(skill)], { type: "text/plain" });
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(blob);
    anchor.download = `${skill.slug}-skill-package.txt`;
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  }

  return (
    <div style={{ paddingTop: 40 }}>
      <div style={{ maxWidth: 640, marginBottom: 34 }}>
        <p style={metaLabelStyle}>Skill Suite</p>
        <p style={{ fontSize: 15, color: "var(--ink-light)", lineHeight: 1.75, margin: "0 0 14px" }}>
          These are the portable versions of the methodology. The tools in this app are the guided web surface. The skills are the handoff surface
          for Claude, Codex, or any LLM environment that can carry stable instructions and artifacts.
        </p>
        <p style={{ fontSize: 13, color: "var(--ink-muted)", lineHeight: 1.65, margin: 0 }}>
          Each package below can now be copied or downloaded directly. The bundle includes the skill file, `agents/openai.yaml`, and the shared suite
          references that the skill depends on.
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
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 6 }}>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 500, color: "var(--ink)", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                      {skill.name}
                    </h3>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <Pill label={skill.surface} tone="neutral" />
                      <Pill label={skill.status} tone={skill.status === "Available" ? "teal" : "terracotta"} />
                    </div>
                  </div>
                  <p style={{ margin: "0 0 14px", fontSize: 13, color: "var(--ink-light)", lineHeight: 1.7 }}>
                    {skill.summary}
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14, marginBottom: 16 }} className="constraints-grid">
                    <div>
                      <p style={metaLabelStyle}>Input</p>
                      <p style={{ margin: 0, fontSize: 13, color: "var(--ink-light)", lineHeight: 1.65 }}>{skill.input}</p>
                    </div>
                    <div>
                      <p style={metaLabelStyle}>Output</p>
                      <p style={{ margin: 0, fontSize: 13, color: "var(--ink-light)", lineHeight: 1.65 }}>{skill.output}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 14 }}>
                    <button className="btn-text" onClick={() => handleCopy(skill)} style={{ fontSize: 12, color: isCopied ? "var(--teal-deep)" : "var(--ink-muted)" }}>
                      {isCopied ? <Check size={12} /> : <Copy size={12} />}
                      {isCopied ? "Copied package" : "Copy package"}
                    </button>
                    <button className="btn-text" onClick={() => handleDownload(skill)} style={{ fontSize: 12, color: "var(--ink-muted)" }}>
                      <DownloadSimple size={12} />
                      Download package
                    </button>
                  </div>
                  <div style={{ border: "1px solid var(--rule)", padding: "12px 14px" }}>
                    <p style={metaLabelStyle}>Package files</p>
                    <p style={{ margin: "0 0 6px", fontSize: 12, color: "var(--ink-light)", lineHeight: 1.6 }}>
                      {`skills/${skill.slug}/SKILL.md`}
                    </p>
                    <p style={{ margin: "0 0 6px", fontSize: 12, color: "var(--ink-light)", lineHeight: 1.6 }}>
                      {`skills/${skill.slug}/agents/openai.yaml`}
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: "var(--ink-light)", lineHeight: 1.6 }}>
                      Shared docs from `skills/_shared/`
                    </p>
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

function buildPackageBundle(skill: SkillPackage): string {
  const sections = [
    renderFile(`skills/${skill.slug}/SKILL.md`, skill.skillText),
    renderFile(`skills/${skill.slug}/agents/openai.yaml`, skill.openAiYaml),
    ...SHARED_FILES.map((file) => renderFile(`skills/${file.path}`, file.content)),
  ];

  return [
    `# ${skill.name} skill package`,
    "",
    "This bundle contains the skill file, the UI metadata file, and the shared suite references it depends on.",
    "",
    ...sections,
  ].join("\n");
}

function renderFile(path: string, content: string): string {
  return [`===== ${path} =====`, content.trim(), ""].join("\n");
}

function Pill({
  label,
  tone,
}: {
  label: string;
  tone: "neutral" | "teal" | "terracotta";
}) {
  const tones = {
    neutral: {
      background: "rgba(26, 26, 24, 0.03)",
      border: "var(--rule)",
      color: "var(--ink-muted)",
    },
    teal: {
      background: "rgba(91, 138, 138, 0.06)",
      border: "rgba(91, 138, 138, 0.18)",
      color: "var(--teal-deep)",
    },
    terracotta: {
      background: "rgba(196, 114, 90, 0.08)",
      border: "rgba(196, 114, 90, 0.18)",
      color: "var(--terracotta)",
    },
  } as const;

  return (
    <span
      style={{
        fontSize: 10,
        fontFamily: "var(--font-mono)",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        border: `1px solid ${tones[tone].border}`,
        background: tones[tone].background,
        color: tones[tone].color,
        padding: "5px 9px",
        borderRadius: 999,
        lineHeight: 1,
      }}
    >
      {label}
    </span>
  );
}

const metaLabelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "var(--ink-muted)",
  margin: "0 0 8px",
  fontFamily: "var(--font-mono)",
};
