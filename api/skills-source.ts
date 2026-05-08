import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSkillBySlug, readSkillSource } from "../lib/skills-data.js";

function getSlug(req: VercelRequest) {
  const raw = req.query.slug;
  return Array.isArray(raw) ? raw[0] : raw;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const slug = getSlug(req)?.trim();
  if (!slug) {
    return res.status(400).json({ error: "Missing slug" });
  }

  const skill = await getSkillBySlug(slug);
  if (!skill) {
    return res.status(404).json({ error: "Skill not found" });
  }

  const source = await readSkillSource(skill);
  res.setHeader("Content-Type", "text/markdown; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=300");
  return res.status(200).send(source);
}
