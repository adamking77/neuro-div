import type { APIRoute } from "astro";
import { SITE_DESCRIPTION, SITE_NAME, TOOL_DEFINITIONS, TOOL_ORDER, absoluteUrl } from "../../lib/site";
import { listSkills } from "../../lib/skills";

export const GET: APIRoute = async () => {
  const skills = await listSkills();

  const body = [
    `# ${SITE_NAME}`,
    "",
    SITE_DESCRIPTION,
    "",
    "## Public routes",
    ...TOOL_ORDER.flatMap((slug) => {
      const tool = TOOL_DEFINITIONS[slug];
      return [`- ${tool.title}: ${absoluteUrl(`/${slug}`)} - ${tool.description}`];
    }),
    `- Skills index: ${absoluteUrl("/skills")} - Filesystem-backed skill registry.`,
    `- skills.json: ${absoluteUrl("/skills.json")} - Machine-readable skill manifest.`,
    `- API catalog: ${absoluteUrl("/.well-known/api-catalog")} - Route handler inventory.`,
    "",
    "## Skills",
    ...skills.map((skill) => `- ${skill.name}: ${absoluteUrl(`/skills/${skill.slug}`)} - ${skill.description}`),
    "",
    "## Notes",
    "- Interactive tool surfaces require client-side JavaScript for browser APIs and local persistence.",
    "- Route-level pages, metadata, and skill details are server-rendered for discoverability.",
  ].join("\n");

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
};
