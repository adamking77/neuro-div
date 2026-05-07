import { ToolRoutePage } from "@/components/tool-route-page";
import { buildMetadata } from "@/lib/site";

export const metadata = buildMetadata({
  title: "Category Scout | NeuroDiv OS",
  description: "Run six research phases against a problem statement to map pain, incumbents, evidence, and language.",
  path: "/category-scout",
});

export default function CategoryScoutPage() {
  return <ToolRoutePage slug="category-scout" />;
}
