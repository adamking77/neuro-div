import type { APIRoute } from "astro";
import { TOOL_ORDER, getSiteOrigin } from "../../lib/site";
import { listSkills } from "../../lib/skills";

function sitemapUrl(location: string, lastModified: string) {
  return [
    "  <url>",
    `    <loc>${location}</loc>`,
    `    <lastmod>${lastModified}</lastmod>`,
    "  </url>",
  ].join("\n");
}

export const GET: APIRoute = async () => {
  const base = getSiteOrigin();
  const skills = await listSkills();
  const lastModified = new Date().toISOString();
  const routes = ["", ...TOOL_ORDER, "skills"].map((segment) =>
    `${base}/${segment}`.replace(/\/$/, "/"),
  );

  const skillRoutes = skills.map((skill) => `${base}/skills/${skill.slug}`);
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...[...routes, ...skillRoutes].map((route) => sitemapUrl(route, lastModified)),
    "</urlset>",
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
};
