import App from "@/src/App";
import { StructuredData } from "@/components/structured-data";
import { absoluteUrl, getToolDefinition, type ToolSlug } from "@/lib/site";
import type { ActiveTool } from "@/src/lib/tool-routes";

export function ToolRoutePage({ slug }: { slug: ToolSlug }) {
  const tool = getToolDefinition(slug);

  return (
    <>
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: `${tool.title} | NeuroDiv OS`,
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          description: tool.description,
          url: absoluteUrl(`/${slug}`),
          featureList: [...tool.howItWorks, ...tool.outputs],
        }}
      />

      <section className="hero-panel">
        <p className="eyebrow">Tool</p>
        <div className="hero-copy">
          <div>
            <h1>{tool.title}</h1>
            <p className="hero-lead">{tool.description}</p>
          </div>
          <div className="hero-meta">
            <div>
              <p className="meta-label">Best For</p>
              <p>{tool.audience}</p>
            </div>
            <div>
              <p className="meta-label">Outputs</p>
              <ul className="plain-list">
                {tool.outputs.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="feature-grid">
          {tool.howItWorks.map((step, index) => (
            <article key={step} className="feature-card">
              <p className="feature-index">{String(index + 1).padStart(2, "0")}</p>
              <p>{step}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="surface-section">
        <div className="section-heading">
          <p className="eyebrow">Interactive Surface</p>
          <h2>Use the live tool</h2>
        </div>
        <App activeTool={slug as ActiveTool} embedded />
      </section>
    </>
  );
}
