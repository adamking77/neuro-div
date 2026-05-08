import { absoluteUrl } from "@/lib/site";
import { getSkillSourceApiPath } from "@/lib/skill-routes";
import { listSkills } from "@/lib/skills";

export async function GET() {
  const skills = await listSkills();

  return Response.json({
    generatedAt: new Date().toISOString(),
    skills: skills.map((skill) => ({
      slug: skill.slug,
      name: skill.name,
      description: skill.description,
      version: skill.version,
      tags: skill.tags,
      dependencies: skill.dependencies,
      relatedSkills: skill.relatedSkills,
      sourceUrl: absoluteUrl(getSkillSourceApiPath(skill.slug)),
      downloadUrl: absoluteUrl(`/skills/${skill.slug}/download`),
      detailUrl: absoluteUrl(`/skills/${skill.slug}`),
    })),
  });
}
