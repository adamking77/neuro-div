import { ToolRoutePage } from "@/components/tool-route-page";
import { buildMetadata } from "@/lib/site";

export const metadata = buildMetadata({
  title: "Distribution Strategy | NeuroDiv OS",
  description: "Generate low-contact distribution strategy and strategic intelligence from research, constraints, and ND context.",
  path: "/distribution-strategy",
});

export default function DistributionStrategyPage() {
  return <ToolRoutePage slug="distribution-strategy" />;
}
