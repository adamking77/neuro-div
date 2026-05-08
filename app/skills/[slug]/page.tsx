import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { StructuredData } from "@/components/structured-data";
import { getSkillSourceApiPath } from "@/lib/skill-routes";
import { absoluteUrl, buildMetadata } from "@/lib/site";
import { getSkillBySlug, listSkills, readSkillSource } from "@/lib/skills";

export async function generateStaticParams() {
  const skills = await listSkills();
  return skills.map((skill) => ({ slug: skill.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const skill = await getSkillBySlug(slug);

  if (!skill) {
    return buildMetadata({
      title: "Skill not found | NeuroDiv OS",
      description: "Requested skill was not found.",
      path: `/skills/${slug}`,
    });
  }

  return buildMetadata({
    title: `${skill.name} | NeuroDiv OS skill`,
    description: skill.description,
    path: `/skills/${skill.slug}`,
  });
}

export default async function SkillDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const skill = await getSkillBySlug(slug);

  if (!skill) {
    notFound();
  }

  const source = await readSkillSource(skill);
  const relatedSkills = await Promise.all(skill.relatedSkills.map((relatedSlug) => getSkillBySlug(relatedSlug)));

  return (
    <>
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareSourceCode",
          name: skill.name,
          description: skill.description,
          codeRepository: absoluteUrl(getSkillSourceApiPath(skill.slug)),
          url: absoluteUrl(`/skills/${skill.slug}`),
          programmingLanguage: "Markdown",
          keywords: skill.tags,
        }}
      />

      <section className="content-panel skill-header">
        <div>
          <p className="eyebrow">Skill Detail</p>
          <h1>{skill.name}</h1>
          <p className="skill-description">{skill.description}</p>
        </div>

        <div className="skill-actions">
          <a href={getSkillSourceApiPath(skill.slug)} className="button-link secondary">Open raw source</a>
          <a href={`/skills/${skill.slug}/download`} className="button-link primary">Download skill</a>
        </div>

        <div className="content-columns">
          <div>
            <p className="meta-label">Version</p>
            <p>{skill.version ?? "Unversioned"}</p>
            {skill.tags.length > 0 ? (
              <>
                <p className="meta-label" style={{ marginTop: 18 }}>Tags</p>
                <div className="tag-row">
                  {skill.tags.map((tag) => (
                    <span key={tag} className="tag-chip">{tag}</span>
                  ))}
                </div>
              </>
            ) : null}
          </div>
          <div>
            <p className="meta-label">Includes</p>
            <ul className="plain-list">
              <li>`skills/{skill.slug}/SKILL.md`</li>
              {skill.agentPath ? <li>`skills/{skill.slug}/agents/openai.yaml`</li> : null}
              {skill.sharedPaths.map((sharedPath) => (
                <li key={sharedPath}>`skills/{sharedPath}`</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="meta-label">Direct links</p>
            <ul className="plain-list">
              <li><Link href={`/skills/${skill.slug}`}>Detail page</Link></li>
              <li><a href={getSkillSourceApiPath(skill.slug)}>Raw source</a></li>
              <li><a href={`/skills/${skill.slug}/download`}>Download skill</a></li>
            </ul>
          </div>
        </div>

        {(skill.relatedSkills.length > 0 || skill.dependencies.length > 0) ? (
          <div className="content-columns">
            <div>
              <p className="meta-label">Related skills</p>
              <ul className="plain-list">
                {relatedSkills.map((related) => related ? (
                  <li key={related.slug}>
                    <Link href={`/skills/${related.slug}`}>{related.name}</Link>
                  </li>
                ) : null)}
              </ul>
            </div>
            <div>
              <p className="meta-label">Dependencies</p>
              {skill.dependencies.length > 0 ? (
                <ul className="plain-list">
                  {skill.dependencies.map((dependency) => (
                    <li key={dependency}>{dependency}</li>
                  ))}
                </ul>
              ) : (
                <p>None.</p>
              )}
            </div>
          </div>
        ) : null}
      </section>

      <section className="content-panel">
        <div className="section-heading">
          <p className="eyebrow">Guide</p>
          <h2>Full skill content</h2>
        </div>
        <div className="markdown-surface">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{skill.body}</ReactMarkdown>
        </div>
      </section>

      <section className="content-panel">
        <div className="section-heading">
          <p className="eyebrow">Source</p>
          <h2>Raw source</h2>
        </div>
        <pre className="skill-source">{source}</pre>
      </section>
    </>
  );
}
