import Link from "next/link";
import { StructuredData } from "@/components/structured-data";
import { absoluteUrl, buildMetadata, SITE_DESCRIPTION, SITE_NAME, TOOL_DEFINITIONS, TOOL_ORDER } from "@/lib/site";

export const metadata = buildMetadata({
  title: `${SITE_NAME} | ND-aware tools for research, process design, and distribution`,
  description: SITE_DESCRIPTION,
  path: "/",
});

export default function HomePage() {
  return (
    <>
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: SITE_NAME,
          description: SITE_DESCRIPTION,
          url: absoluteUrl("/"),
        }}
      />

      <section className="hero-panel home-hero">
        <p className="eyebrow">Neurodivergent Operating System</p>
        <div>
          <h1>Real routes for the tool suite, not one empty SPA shell.</h1>
          <p>
            NeuroDiv OS gives AI tools stable context about how you work, then uses that context to research a market,
            design an execution process, and generate realistic distribution strategy. Each tool now lives at its own
            server-rendered URL so people and agents can discover, cite, and install it.
          </p>
        </div>
        <div className="home-actions">
          <Link href="/context-builder" className="button-link primary">Start with Context Builder</Link>
          <Link href="/skills" className="button-link secondary">Browse installable skills</Link>
        </div>
      </section>

      <section className="content-panel">
        <div className="section-heading">
          <p className="eyebrow">Tool Suite</p>
          <h2>Four working surfaces, one shared context model</h2>
        </div>
        <div className="tool-grid">
          {TOOL_ORDER.map((slug) => {
            const tool = TOOL_DEFINITIONS[slug];
            return (
              <article key={slug} className="tool-card">
                <p className="eyebrow">{tool.shortTitle}</p>
                <h2>{tool.title}</h2>
                <p>{tool.description}</p>
                <Link href={`/${slug}`} className="button-link secondary">Open route</Link>
              </article>
            );
          })}
        </div>
      </section>

      <section className="content-panel">
        <div className="content-columns">
          <div>
            <p className="eyebrow">Discoverability Surface</p>
            <h2>Built for crawlers, assistants, and direct linking</h2>
            <p>
              The public surface now exposes `llms.txt`, `skills.json`, route metadata, JSON-LD, a sitemap, and
              filesystem-backed skill detail pages. The interactive tools still run client-side where they need browser
              APIs, but the route-level framing is now visible to agents before hydration.
            </p>
          </div>
          <div>
            <p className="meta-label">Public endpoints</p>
            <ul className="plain-list">
              <li><Link href="/llms.txt">/llms.txt</Link></li>
              <li><Link href="/skills.json">/skills.json</Link></li>
              <li><Link href="/skills">/skills</Link></li>
              <li><Link href="/.well-known/api-catalog">/.well-known/api-catalog</Link></li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
