import { ToolRoutePage } from "@/components/tool-route-page";
import { buildMetadata } from "@/lib/site";

export const metadata = buildMetadata({
  title: "Context Builder | NeuroDiv OS",
  description: "Create a persistent ND profile that teaches any AI how you work.",
  path: "/context-builder",
});

export default function ContextBuilderPage() {
  return <ToolRoutePage slug="context-builder" />;
}
