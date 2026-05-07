import Link from "next/link";
import { StructuredData } from "@/components/structured-data";
import { buildMetadata, absoluteUrl } from "@/lib/site";
import { listSkills } from "@/lib/skills";

export const metadata = buildMetadata({
  title: "Skills | NeuroDiv OS",
  description: "Server-rendered skill registry with per-skill pages, source downloads, and machine-readable metadata.",
  path: "/skills",
});

export default async function SkillsPage() {
  const skills = await listSkills();

  return (
    <>
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "NeuroDiv OS skill registry",
          url: absoluteUrl("/skills"),
          numberOfItems: skills.length,
        }}
      />

      <section className="content-panel">
        <div className="section-heading">
          <p className="eyebrow">Skill Registry</p>
          <h1>Installable instructions with stable URLs</h1>
          <p className="hero-lead">
            These pages are generated from the filesystem. Each skill has a standalone route, a raw source endpoint,
            and a bundled download surface that agents or operators can reference directly.
          </p>
        </div>
        <div className="skill-grid">
          {skills.map((skill) => (
            <article key={skill.slug} className="skill-card">
              <p className="eyebrow">{skill.slug}</p>
              <h2>{skill.name}</h2>
              <p>{skill.description}</p>
              {skill.tags.length > 0 ? (
                <div className="tag-row">
                  {skill.tags.map((tag) => (
                    <span key={tag} className="tag-chip">{tag}</span>
                  ))}
                </div>
              ) : null}
              <Link href={`/skills/${skill.slug}`} className="button-link secondary">View skill</Link>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
