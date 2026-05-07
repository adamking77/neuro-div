import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const SKILLS_ROOT = path.join(process.cwd(), "skills");

interface RawSkillFrontmatter {
  name?: string;
  description?: string;
  version?: string;
  tags?: string[];
  dependencies?: string[];
  relatedSkills?: string[];
}

export interface SkillEntry {
  slug: string;
  name: string;
  description: string;
  version: string | null;
  tags: string[];
  dependencies: string[];
  relatedSkills: string[];
  body: string;
  skillPath: string;
  agentPath: string | null;
  sharedPaths: string[];
}

async function pathExists(target: string) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function parseSkillFrontmatter(raw: string) {
  const parsed = matter(raw);
  const data = parsed.data as RawSkillFrontmatter;

  return {
    attributes: {
      name: typeof data.name === "string" ? data.name.trim() : "",
      description: typeof data.description === "string" ? data.description.trim() : "",
      version: typeof data.version === "string" ? data.version.trim() : "",
      tags: normalizeStringArray(data.tags),
      dependencies: normalizeStringArray(data.dependencies),
      relatedSkills: normalizeStringArray(data.relatedSkills),
    },
    body: parsed.content.trim(),
  };
}

function extractSharedReferences(body: string) {
  const matches = new Set<string>();

  for (const match of body.matchAll(/\.\.\/(_shared\/[A-Za-z0-9._/-]+)/g)) {
    matches.add(match[1]);
  }

  return Array.from(matches).sort();
}

export async function listSkills(): Promise<SkillEntry[]> {
  const entries = await fs.readdir(SKILLS_ROOT, { withFileTypes: true });
  const skills: SkillEntry[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith("_")) {
      continue;
    }

    const skillPath = path.join(SKILLS_ROOT, entry.name, "SKILL.md");
    if (!(await pathExists(skillPath))) {
      continue;
    }

    const raw = await fs.readFile(skillPath, "utf8");
    const parsed = parseSkillFrontmatter(raw);
    const agentPath = path.join(SKILLS_ROOT, entry.name, "agents", "openai.yaml");

    skills.push({
      slug: entry.name,
      name: parsed.attributes.name || entry.name,
      description: parsed.attributes.description || "No description provided.",
      version: parsed.attributes.version || null,
      tags: parsed.attributes.tags,
      dependencies: parsed.attributes.dependencies,
      relatedSkills: parsed.attributes.relatedSkills,
      body: parsed.body,
      skillPath,
      agentPath: (await pathExists(agentPath)) ? agentPath : null,
      sharedPaths: extractSharedReferences(parsed.body),
    });
  }

  return skills.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getSkillBySlug(slug: string) {
  const skills = await listSkills();
  return skills.find((skill) => skill.slug === slug) ?? null;
}

export async function readSkillSource(skill: SkillEntry) {
  return fs.readFile(skill.skillPath, "utf8");
}

async function readOptionalFile(target: string | null) {
  if (!target) return null;
  return fs.readFile(target, "utf8");
}

export async function buildSkillBundle(skill: SkillEntry) {
  const sections: string[] = [];
  const skillSource = await readSkillSource(skill);
  sections.push(renderFile(`skills/${skill.slug}/SKILL.md`, skillSource));

  const agentSource = await readOptionalFile(skill.agentPath);
  if (agentSource) {
    sections.push(renderFile(`skills/${skill.slug}/agents/openai.yaml`, agentSource));
  }

  for (const sharedPath of skill.sharedPaths) {
    const absoluteSharedPath = path.join(SKILLS_ROOT, sharedPath);
    const contents = await fs.readFile(absoluteSharedPath, "utf8");
    sections.push(renderFile(`skills/${sharedPath}`, contents));
  }

  return [
    `# ${skill.name} skill package`,
    "",
    skill.description,
    "",
    ...sections,
  ].join("\n");
}

function renderFile(relativePath: string, contents: string) {
  return [`===== ${relativePath} =====`, contents.trim(), ""].join("\n");
}
