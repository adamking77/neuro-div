'use client';

import { usePathname } from "next/navigation";
import App from "@/src/App";
import type { ActiveTool } from "@/src/lib/tool-routes";

const SUITE_ROUTES: Record<string, ActiveTool> = {
  "/": "context-builder",
  "/context-builder": "context-builder",
  "/process-designer": "process-designer",
  "/category-scout": "category-scout",
  "/distribution-strategy": "distribution-strategy",
  "/skills": "skills",
};

export function PersistentAppShell() {
  const pathname = usePathname();
  const activeTool = SUITE_ROUTES[pathname];

  if (!activeTool) {
    return null;
  }

  return <App activeTool={activeTool} />;
}
