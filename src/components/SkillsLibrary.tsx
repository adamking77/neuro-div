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
  summary: string;
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

    summary: "Use the web tool to build your profile, or run this skill in any AI that takes persistent instructions. It asks the same intake questions and produces the same portable nd-profile.md. Install it once and every subsequent conversation in that environment already knows how your brain works.",

    skillText: ndContextSkill,
    openAiYaml: ndContextOpenAi,
  },
  {
    name: "ND Process Designer",
    slug: "nd-process-designer",
    status: "Available",

    summary: "Give it your ND profile and one thing you're trying to move. It builds a trigger-based process around how you actually activate — a menu of moves organized by condition, not a task list organized by priority. The output is structured so any AI can run from it without setup.",

    skillText: ndProcessSkill,
    openAiYaml: ndProcessOpenAi,
  },
  {
    name: "Category Scout",
    slug: "category-scout",
    status: "Available",

    summary: "Run this before committing to a direction. Give it a problem statement and any known players. It searches six angles and returns a research dossier you can read yourself or pass directly to Distribution Strategy for synthesis.",

    skillText: categoryScoutSkill,
    openAiYaml: categoryScoutOpenAi,
  },
  {
    name: "Distribution Strategy",
    slug: "distribution-strategy",
    status: "Available",

    summary: "Reads your Category Scout dossier alongside your ND profile. The output is a distribution plan built around how you specifically work — your activation patterns and the conditions that produce action for you. Not a generic strategy.",

    skillText: distributionStrategySkill,
    openAiYaml: distributionStrategyOpenAi,
  },
  {
    name: "ND Session Loop",
    slug: "nd-session-loop",
    status: "Available",

    summary: "Run it at the start of a work session and it reads your active process, asks what's actually available today, and surfaces exactly one move. Run it at the end and it captures what happened and updates the process. No catch-up posture. No guilt language.",

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
    <div>
      <div style={{ maxWidth: 600, marginBottom: 32, paddingBottom: 32, borderBottom: "1px solid var(--rule)" }}>
        <p style={{ margin: "0 0 10px", fontSize: 13, color: "var(--ink-light)", lineHeight: 1.75 }}>
          Each skill is a set of instructions you paste into your AI environment. That includes Claude Projects, custom GPT instructions, Codex, or anything that accepts a system prompt. Once installed, that AI runs the same methodology as the web tools here, and the outputs are compatible in both directions.
        </p>
        <p style={{ margin: 0, fontSize: 13, color: "var(--ink-muted)", lineHeight: 1.65 }}>
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
                  <p style={{ margin: "0 0 20px", fontSize: 13, color: "var(--ink-light)", lineHeight: 1.7 }}>
                    {skill.summary}
                  </p>
                  <div style={{ marginBottom: 16 }}>
                    <p style={metaLabelStyle}>Package includes</p>
                    <p style={{ margin: 0, fontSize: 12, color: "var(--ink-muted)", lineHeight: 1.8 }}>
                      {`skills/${skill.slug}/SKILL.md`}
                      {" · "}
                      {`agents/openai.yaml`}
                      {" · "}
                      {"_shared/ reference docs"}
                    </p>
                  </div>
                  {skill.status === "Available" && (
                    <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                      <button className="btn-text" onClick={() => handleCopy(skill)} style={{ fontSize: 12, color: isCopied ? "var(--teal-deep)" : "var(--ink-muted)" }}>
                        {isCopied ? <Check size={12} /> : <Copy size={12} />}
                        {isCopied ? "Copied" : "Copy skill"}
                      </button>
                      <button className="btn-text" onClick={() => handleDownload(skill)} style={{ fontSize: 12, color: "var(--ink-muted)" }}>
                        <DownloadSimple size={12} />
                        Download skill
                      </button>
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


const metaLabelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "var(--ink-muted)",
  margin: "0 0 8px",
  fontFamily: "var(--font-mono)",
};
