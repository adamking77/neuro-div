export type ActiveTool =
  | "category-scout"
  | "distribution-strategy"
  | "context-builder"
  | "process-designer"
  | "skills";

export const TOOL_ROUTES: Record<ActiveTool, string> = {
  "context-builder": "/context-builder",
  "process-designer": "/process-designer",
  "category-scout": "/category-scout",
  "distribution-strategy": "/distribution-strategy",
  skills: "/skills",
};

export const TOOL_LINKS: Array<{ id: ActiveTool; label: string }> = [
  { id: "context-builder", label: "Context Builder" },
  { id: "process-designer", label: "Process Designer" },
  { id: "category-scout", label: "Category Scout" },
  { id: "distribution-strategy", label: "Distribution Strategy" },
  { id: "skills", label: "Skills" },
];
