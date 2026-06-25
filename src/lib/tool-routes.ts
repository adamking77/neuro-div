export type ActiveTool =
  | "context-builder"
  | "process-designer"
  | "reports"
  | "spine-finder"
  | "skills";

export const TOOL_ROUTES: Record<ActiveTool, string> = {
  "context-builder": "/context-builder",
  "process-designer": "/process-designer",
  reports: "/reports",
  "spine-finder": "/spine-finder",
  skills: "/skills",
};

export const TOOL_LINKS: Array<{ id: ActiveTool; label: string }> = [
  { id: "context-builder", label: "Context Builder" },
  { id: "process-designer", label: "Process Designer" },
  { id: "reports", label: "Reports" },
  { id: "spine-finder", label: "Spine-Finder" },
  { id: "skills", label: "Skills" },
];
