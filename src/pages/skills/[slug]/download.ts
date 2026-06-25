import type { APIRoute } from "astro";
import { getSkillBySlug, readSkillSource } from "../../../../lib/skills";

export const GET: APIRoute = async ({ params }) => {
  const slug = params.slug;
  const skill = slug ? await getSkillBySlug(slug) : null;

  if (!skill) {
    return new Response("Skill not found", { status: 404 });
  }

  const source = await readSkillSource(skill);
  return new Response(source, {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "content-disposition": `attachment; filename="${skill.slug}-SKILL.md"`,
      "cache-control": "public, max-age=300",
    },
  });
};
