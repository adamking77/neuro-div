export type ActiveTool =
  | "context-builder"
  | "process-designer"
  | "spine-finder"
  | "skills";

export const TOOL_ROUTES: Record<ActiveTool, string> = {
  "context-builder": "/context-builder",
  "process-designer": "/process-designer",
  "spine-finder": "/spine-finder",
  skills: "/skills",
};

export const TOOL_LINKS: Array<{ id: ActiveTool; label: string }> = [
  { id: "context-builder", label: "Context Builder" },
  { id: "process-designer", label: "Process Designer" },
  { id: "spine-finder", label: "Spine-Finder" },
  { id: "skills", label: "Skills" },
];
