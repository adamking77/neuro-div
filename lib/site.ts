import type { Metadata } from "next";

export type ToolSlug =
  | "context-builder"
  | "process-designer"
  | "category-scout"
  | "distribution-strategy";

export const SITE_NAME = "NeuroDiv OS";
export const SITE_TAGLINE = "Planning, research, and strategy tools built for neurodivergent founders.";
export const SITE_DESCRIPTION =
  "NeuroDiv OS is four interconnected tools for neurodivergent founders: a persistent AI context profile, a trigger-based working process, category research, and a distribution strategy that accounts for real energy and availability.";

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
      "Create a persistent ND profile that tells any AI how you actually work — your activation patterns, shutdown triggers, support conditions, and how you need information delivered.",
    audience:
      "Neurodivergent founders and builders who want a stable AI starting point they can set once and carry across tools and sessions.",
    howItWorks: [
      "Answer intake questions about your traits, activation patterns, shutdown triggers, energy patterns, and support conditions.",
      "Save a reusable profile that other tools in the suite — and any AI you work with — can read.",
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
      "Turn one goal into a trigger-based working process: step menus for each working mode, rescue steps for hard days, protected conditions, and an agent brief.",
    audience:
      "Neurodivergent founders who need a process that works with energy variability and demand avoidance — and holds up on hard days.",
    howItWorks: [
      "Load your ND profile, define one goal, and name what usually creates drag.",
      "Generate a process organized by working mode and energy state, with specific steps for each condition.",
      "Save and revise the process as your conditions and goals shift.",
    ],
    outputs: [
      "Process thesis",
      "Step menus and rescue steps",
      "Protected conditions and not-doing list",
    ],
  },
  "category-scout": {
    title: "Category Scout",
    shortTitle: "Category Scout",
    description:
      "Run six research lenses on any problem statement — problem framing, customer demand, competitor landscape, evidence, category language, and white space. Export a dossier or pass the findings to Distribution Strategy.",
    audience:
      "Founders doing category design or market validation who need grounded research before committing to a direction.",
    howItWorks: [
      "Enter a problem statement and any known players or competitors.",
      "Launch six research phases, each pulling from a different analytical angle.",
      "Review highlights, export a research dossier, or hand the evidence off to Distribution Strategy.",
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
      "Generate a low-contact distribution strategy and intelligence brief built from your Category Scout research, ND profile, and real constraints.",
    audience:
      "Founders who want channel choices, message angles, and experiments sized for real energy and availability.",
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
