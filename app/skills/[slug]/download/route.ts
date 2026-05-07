import { buildSkillBundle, getSkillBySlug } from "@/lib/skills";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const skill = await getSkillBySlug(slug);

  if (!skill) {
    return new Response("Skill not found", { status: 404 });
  }

  const bundle = await buildSkillBundle(skill);
  return new Response(bundle, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "content-disposition": `attachment; filename="${skill.slug}-skill-package.txt"`,
      "cache-control": "public, max-age=300",
    },
  });
}
