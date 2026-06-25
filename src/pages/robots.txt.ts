import type { APIRoute } from "astro";
import { getSiteOrigin } from "../../lib/site";

export const GET: APIRoute = () => new Response(
  [
    "User-agent: *",
    "Allow: /",
    `Sitemap: ${getSiteOrigin()}/sitemap.xml`,
    "",
  ].join("\n"),
  {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  },
);
