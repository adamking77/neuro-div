import { getSkillBySlug, readSkillSource } from "@/lib/skills";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const skill = await getSkillBySlug(slug);

  if (!skill) {
    return new Response("Skill not found", { status: 404 });
  }

  const source = await readSkillSource(skill);
  return new Response(source, {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
}
