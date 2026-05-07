import { StructuredData } from "@/components/structured-data";
import { absoluteUrl, buildMetadata } from "@/lib/site";

export const metadata = buildMetadata({
  title: "Skills | NeuroDiv OS",
  description: "Installable skill packages for NeuroDiv OS.",
  path: "/skills",
});

export default function SkillsPage() {
  return (
    <>
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "NeuroDiv OS skills",
          url: absoluteUrl("/skills"),
        }}
      />
    </>
  );
}
