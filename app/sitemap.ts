import type { MetadataRoute } from "next";
import { getSiteOrigin, TOOL_ORDER } from "@/lib/site";
import { listSkills } from "@/lib/skills";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteOrigin();
  const skills = await listSkills();
  const now = new Date();

  return [
    "",
    ...TOOL_ORDER,
    "skills",
  ].map((segment) => ({
    url: `${base}/${segment}`.replace(/\/$/, "/"),
    lastModified: now,
  })).concat(
    skills.map((skill) => ({
      url: `${base}/skills/${skill.slug}`,
      lastModified: now,
    })),
  );
}
