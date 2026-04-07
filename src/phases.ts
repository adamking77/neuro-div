import type { PhaseConfig } from "./types";

export const PHASES: PhaseConfig[] = [
  {
    id: 1,
    name: "Problem Cartography",
    description: "Find how the problem is described in the wild — in customer language, before anyone has tried to brand it.",
    buildQueries: (problem) => [
      { query: problem, category: "personal site" },
      { query: `${problem} struggle frustration why`, category: "news" },
      { query: `why is it so hard to ${problem}` },
    ],
  },
  {
    id: 2,
    name: "Enemy Identification",
    description: "Map the incumbent approach being displaced — the old story your category will replace.",
    buildQueries: (problem, knownPlayers) => [
      { query: `${problem} consulting strategy approach`, category: "company" },
      { query: knownPlayers || `${problem} solution provider agency`, category: "company" },
      { query: `${problem} traditional methodology framework` },
    ],
  },
  {
    id: 3,
    name: "Solution Landscape",
    description: "Map everyone solving adjacent problems. Find what's already named, what's overcrowded, what's sparse.",
    buildQueries: (problem) => [
      { query: `${problem} platform software tool`, category: "company" },
      { query: `${problem} service agency firm`, category: "company" },
      { query: `best approach to solve ${problem}` },
    ],
  },
  {
    id: 4,
    name: "Category Audit",
    description: "Inventory existing categories — which are newly named (opportunity), mid-formation, or mature (avoid).",
    buildQueries: (problem) => [
      { query: `the rise of ${problem}`, category: "news" },
      { query: `what we call ${problem} new category emerging`, category: "research paper" },
      { query: `${problem} market analyst trend report` },
    ],
  },
  {
    id: 5,
    name: "Evidence Mining",
    description: "Build the proof stack. Category design lives or dies on proof the problem is real, growing, and expensive.",
    buildQueries: (problem) => [
      { query: `${problem} survey data statistics failure rate`, category: "research paper" },
      { query: `cost of ${problem} market size impact`, category: "financial report" },
      { query: `${problem} ROI business case evidence` },
    ],
  },
  {
    id: 6,
    name: "Language Mining",
    description: "Extract the vocabulary people reach for before they know a solution exists. That's your category language.",
    buildQueries: (problem) => [
      { query: `${problem} before after transformation`, category: "personal site" },
      { query: `what does it feel like when ${problem}` },
      { query: `${problem} analogy metaphor how to describe` },
    ],
  },
];
