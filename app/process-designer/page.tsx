import { ToolRoutePage } from "@/components/tool-route-page";
import { buildMetadata } from "@/lib/site";

export const metadata = buildMetadata({
  title: "Process Designer | NeuroDiv OS",
  description: "Turn one goal into a trigger-based process with move menus, rescue moves, and protected conditions.",
  path: "/process-designer",
});

export default function ProcessDesignerPage() {
  return <ToolRoutePage slug="process-designer" />;
}
