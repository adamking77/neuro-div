import type { Metadata } from "next";

export type ToolSlug =
  | "context-builder"
  | "process-designer"
  | "category-scout"
  | "distribution-strategy";

export const SITE_NAME = "NeuroDiv OS";
export const SITE_TAGLINE = "ND-aware research, planning, and strategy tools with real URLs and installable skills.";
export const SITE_DESCRIPTION =
  "NeuroDiv OS helps neurodivergent founders build persistent context, research a market category, design work processes, and generate distribution strategy that fits real energy constraints.";

export const TOOL_ORDER: ToolSlug[] = [
  "context-builder",
  "process-designer",
  "category-scout",
  "distribution-strategy",
];

export const TOOL_DEFINITIONS: Record<
  ToolSlug,
  {
    title: string;
    shortTitle: string;
    description: string;
    audience: string;
    howItWorks: string[];
    outputs: string[];
  }
> = {
  "context-builder": {
    title: "Context Builder",
    shortTitle: "Context Builder",
    description:
      "Create a persistent ND profile that teaches any AI how you work: what activates you, what causes shutdown, what support conditions help, and how information should be delivered.",
    audience:
      "Founders, operators, and independent builders who want stable working context instead of re-explaining themselves in every AI conversation.",
    howItWorks: [
      "Answer structured intake questions about traits, activation patterns, shutdown triggers, time and energy, and support conditions.",
      "Save a reusable profile artifact that downstream tools can read automatically.",
      "Reuse the same profile inside NeuroDiv OS or paste it into Claude, ChatGPT, Codex, or another agent workflow.",
    ],
    outputs: [
      "Structured ND profile",
      "Agent guidance summary",
      "Reusable context for the rest of the suite",
    ],
  },
  "process-designer": {
    title: "Process Designer",
    shortTitle: "Process Designer",
    description:
      "Turn one concrete goal into a trigger-based working process with move menus, rescue moves, protected conditions, and an agent brief instead of a rigid task system.",
    audience:
      "People with inconsistent energy, demand avoidance, or bursty working patterns who need process design instead of calendar compliance.",
    howItWorks: [
      "Load your ND profile, define one goal, and name the conditions that usually create drag.",
      "Generate a plan organized by working mode and condition rather than chronology.",
      "Save and iterate on reusable process artifacts over time.",
    ],
    outputs: [
      "Process thesis",
      "Move groups and rescue moves",
      "Protected conditions and not-doing list",
    ],
  },
  "category-scout": {
    title: "Category Scout",
    shortTitle: "Category Scout",
    description:
      "Run six parallel research lenses against a problem statement to map audience pain, incumbents, adjacent solutions, evidence, and vocabulary before you commit to a category direction.",
    audience:
      "Founders doing category design, offer shaping, or market validation who need grounded evidence rather than vibes.",
    howItWorks: [
      "Enter a problem statement and optional known players.",
      "Launch six distinct research phases that search the web from different strategic angles.",
      "Review highlights, export a research dossier, or hand the evidence off to strategy synthesis.",
    ],
    outputs: [
      "Per-phase research results",
      "Exportable markdown dossier",
      "Evidence base for distribution strategy and intelligence briefs",
    ],
  },
  "distribution-strategy": {
    title: "Distribution Strategy",
    shortTitle: "Distribution Strategy",
    description:
      "Generate a low-contact distribution strategy and strategic intelligence brief grounded in the research, your constraints, and your ND profile.",
    audience:
      "Founders who want realistic channels, message angles, and experiments without defaulting to high-touch outreach or social maintenance.",
    howItWorks: [
      "Combine Category Scout research with audience lens, founder constraints, and profile context.",
      "Generate a structured distribution plan plus an optional intelligence brief.",
      "Export the result as markdown or revise sections directly in the UI.",
    ],
    outputs: [
      "Distribution strategy draft",
      "Strategic intelligence brief",
      "Exportable markdown for agents or collaborators",
    ],
  },
};

export function getToolDefinition(slug: ToolSlug) {
  return TOOL_DEFINITIONS[slug];
}

export function getSiteOrigin() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) {
    return explicit.startsWith("http") ? explicit : `https://${explicit}`;
  }

  const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (productionUrl) {
    return productionUrl.startsWith("http") ? productionUrl : `https://${productionUrl}`;
  }

  return "http://localhost:3000";
}

export function buildMetadata({
  title,
  description,
  path = "/",
}: {
  title: string;
  description: string;
  path?: string;
}): Metadata {
  const metadataBase = new URL(getSiteOrigin());

  return {
    title,
    description,
    metadataBase,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title,
      description,
      url: new URL(path, metadataBase).toString(),
      siteName: SITE_NAME,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export function absoluteUrl(path: string) {
  return new URL(path, getSiteOrigin()).toString();
}
