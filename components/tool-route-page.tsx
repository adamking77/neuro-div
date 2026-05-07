import { StructuredData } from "@/components/structured-data";
import { absoluteUrl, getToolDefinition, type ToolSlug } from "@/lib/site";

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
        }}
      />
    </>
  );
}
