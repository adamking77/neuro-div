export type ToolSlug =
  | "context-builder"
  | "process-designer"
  | "spine-finder";

export const SITE_NAME = "NeuroDiv OS";
export const SITE_TAGLINE = "Context and process tools built for neurodivergent founders.";
export const SITE_DESCRIPTION =
  "NeuroDiv OS helps neurodivergent founders build persistent AI context and turn goals into working processes that account for real energy and availability.";

export const TOOL_ORDER: ToolSlug[] = [
  "context-builder",
  "process-designer",
  "spine-finder",
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
      "Create a persistent profile that tells any AI how you actually work: your activation patterns, shutdown triggers, support conditions, and how you need information delivered.",
    audience:
      "Neurodivergent founders and builders who want a stable AI starting point they can set once and carry across tools and sessions.",
    howItWorks: [
      "Answer intake questions about your traits, activation patterns, shutdown triggers, energy patterns, and support conditions.",
      "Save a reusable profile that other tools in the suite, and any AI you work with, can read.",
      "Reuse the same profile inside NeuroDiv OS or paste it into Claude, ChatGPT, Codex, or another agent workflow.",
    ],
    outputs: [
      "Structured profile",
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
      "Neurodivergent founders who need a process that works with energy variability and demand avoidance, and holds up on hard days.",
    howItWorks: [
      "Load your profile, define one goal, and name what usually creates drag.",
      "Generate a process organized by working mode and energy state, with specific steps for each condition.",
      "Save and revise the process as your conditions and goals shift.",
    ],
    outputs: [
      "Process thesis",
      "Step menus and rescue steps",
      "Protected conditions and not-doing list",
    ],
  },
  "spine-finder": {
    title: "Spine-Finder",
    shortTitle: "Spine-Finder",
    description:
      "Download the skill that helps structure-first minds find a central question or problem-space from raw self-analysis without generating meaning from a blank page.",
    audience:
      "Neurocomplex founders and builders who have raw reflection material and need a concrete scaffold for finding their spine.",
    howItWorks: [
      "Install the skill in your agent environment.",
      "Bring messy paragraph material or raw self-analysis.",
      "React to concrete insights and candidate spine questions until you have a launch point.",
    ],
    outputs: [
      "Candidate problem domains",
      "Question-form spine options",
      "A clear handoff back into the Compression Framework",
    ],
  },
};

export function getToolDefinition(slug: ToolSlug) {
  return TOOL_DEFINITIONS[slug];
}

export function getSiteOrigin() {
  const explicit = process.env.PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) {
    return explicit.startsWith("http") ? explicit : `https://${explicit}`;
  }

  const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (productionUrl) {
    return productionUrl.startsWith("http") ? productionUrl : `https://${productionUrl}`;
  }

  return "http://localhost:4321";
}

export function buildMetadata({
  title,
  description,
  path = "/",
}: {
  title: string;
  description: string;
  path?: string;
}) {
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
