import type { APIRoute } from "astro";
import { absoluteUrl } from "../../../lib/site";

const ROUTES = [
  { method: "GET", path: "/", description: "NeuroDiv OS tool workspace." },
  { method: "GET", path: "/context-builder", description: "Persistent AI context profile builder." },
  { method: "GET", path: "/process-designer", description: "Goal-to-process designer with analysis generation." },
  { method: "GET", path: "/reports", description: "Saved NeuroDiv analysis report index." },
  { method: "GET", path: "/reports/[id]", description: "Saved NeuroDiv analysis report detail." },
  { method: "GET", path: "/spine-finder", description: "Spine-Finder skill landing page." },
  { method: "GET", path: "/skills", description: "Public NeuroDiv OS skill library." },
  { method: "GET", path: "/skills/[slug]", description: "Human-readable public skill detail page." },
  { method: "GET", path: "/skills.json", description: "Machine-readable skill manifest." },
  { method: "GET", path: "/skills/[slug]/source", description: "Raw SKILL.md source for a public skill." },
  { method: "GET", path: "/skills/[slug]/download", description: "Downloadable SKILL.md response for a public skill." },
  { method: "GET", path: "/llms.txt", description: "Agent-readable NeuroDiv OS route and skill summary." },
  { method: "GET", path: "/sitemap.xml", description: "Sitemap for public pages." },
  { method: "GET", path: "/robots.txt", description: "Crawler directives and sitemap location." },
  { method: "POST", path: "/api/analyze-profile", description: "DeepSeek-backed profile synthesis with deterministic fallback." },
  { method: "POST", path: "/api/analyze-process", description: "DeepSeek-backed process analysis with deterministic fallback." },
  { method: "POST", path: "/api/generate-report", description: "DeepSeek-backed full analysis report generation with deterministic fallback." },
];

export const GET: APIRoute = () => Response.json({
  generatedAt: new Date().toISOString(),
  routes: ROUTES.map((route) => ({
    ...route,
    url: absoluteUrl(route.path),
  })),
});
