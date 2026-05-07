import { StructuredData } from "@/components/structured-data";
import { absoluteUrl, buildMetadata, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export const metadata = buildMetadata({
  title: SITE_NAME,
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
    </>
  );
}
