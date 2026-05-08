import type { IntelligenceBrief } from "../types";

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function dedupeSegments(segments: string[]): string[] {
  const seen = new Set<string>();
  return segments.filter((segment) => {
    const key = segment.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function splitIntoSegments(text: string): string[] {
  const normalized = normalizeWhitespace(text);
  if (!normalized) return [];

  const sentenceSegments = dedupeSegments(
    normalized
      .split(/(?<=[.!?])\s+/)
      .map((segment) => segment.trim())
      .filter(Boolean),
  );
  if (sentenceSegments.length > 1) {
    return sentenceSegments;
  }

  const clauseSegments = dedupeSegments(
    normalized
      .split(/(?<=[;:])\s+|(?<=,)\s+(?=[A-Z0-9])/)
      .map((segment) => segment.trim())
      .filter(Boolean),
  );
  if (clauseSegments.length > 1) {
    return clauseSegments;
  }

  return normalized ? [normalized] : [];
}

function truncateAtWord(text: string, maxChars: number): string {
  const normalized = normalizeWhitespace(text);
  if (normalized.length <= maxChars) {
    return normalized;
  }

  const truncated = normalized.slice(0, maxChars + 1);
  const lastSpace = truncated.lastIndexOf(" ");
  const base = lastSpace > 40 ? truncated.slice(0, lastSpace) : truncated.slice(0, maxChars);
  return `${base.replace(/[.,;:\s]+$/, "")}…`;
}

function compactSingleLine(text: string, maxChars: number): string {
  const firstSegment = splitIntoSegments(text)[0] ?? normalizeWhitespace(text);
  return truncateAtWord(firstSegment, maxChars);
}

function normalizeNarrative(text: string): string {
  const normalizedParagraphs = text
    .split(/\n\s*\n/)
    .map((paragraph) => normalizeWhitespace(paragraph))
    .filter(Boolean);

  if (normalizedParagraphs.length >= 2) {
    return normalizedParagraphs
      .slice(0, 5)
      .map((paragraph) => truncateAtWord(paragraph, 320))
      .join("\n\n");
  }

  const segments = splitIntoSegments(text);
  if (segments.length === 0) {
    return "";
  }

  const paragraphs: string[] = [];
  for (let i = 0; i < segments.length && paragraphs.length < 5; i += 2) {
    paragraphs.push(truncateAtWord(segments.slice(i, i + 2).join(" "), 320));
  }

  return paragraphs.join("\n\n");
}

export function normalizeIntelligenceBrief(brief: IntelligenceBrief): IntelligenceBrief {
  return {
    ...brief,
    summary: normalizeNarrative(brief.summary),
    scorecard: {
      ...brief.scorecard,
      metrics: brief.scorecard.metrics.map((metric) => {
        const source = normalizeWhitespace(metric.takeaway || metric.rationale || "");
        const sourceSegments = splitIntoSegments(source);
        const evidenceSource = normalizeWhitespace(metric.evidence || sourceSegments.slice(1).join(" "));
        return {
          ...metric,
          takeaway: compactSingleLine(sourceSegments[0] || source, 120),
          evidence: evidenceSource ? compactSingleLine(evidenceSource, 150) : undefined,
        };
      }),
    },
    landscape: {
      ...brief.landscape,
      content: normalizeNarrative(brief.landscape.content),
      callouts: brief.landscape.callouts.map((callout) => {
        const source = normalizeWhitespace(callout.headline || callout.text || "");
        const sourceSegments = splitIntoSegments(source);
        const supportSource = normalizeWhitespace(callout.support || sourceSegments.slice(1).join(" "));
        return {
          ...callout,
          headline: compactSingleLine(sourceSegments[0] || source, 110),
          support: supportSource ? compactSingleLine(supportSource, 145) : undefined,
        };
      }),
    },
  };
}

function formatMetric(metric: IntelligenceBrief["scorecard"]["metrics"][number]): string {
  const takeaway = metric.takeaway || metric.rationale || "";
  return metric.evidence ? `${takeaway} Evidence: ${metric.evidence}` : takeaway;
}

function formatCallout(callout: IntelligenceBrief["landscape"]["callouts"][number]): string {
  const headline = callout.headline || callout.text || "";
  return callout.support ? `${headline} ${callout.support}` : headline;
}

export function buildIntelligenceMarkdown(brief: IntelligenceBrief): string {
  const sections: string[] = [];

  sections.push(`# Strategic Intelligence Brief`);
  sections.push("");
  sections.push(`> Generated: ${new Date(brief.generatedAt).toLocaleString()}`);
  sections.push("");

  // Executive Summary
  sections.push(`## Executive Summary`);
  sections.push("");
  sections.push(brief.summary);
  sections.push("");

  // Scorecard
  sections.push(`## 01 — Situation Assessment`);
  sections.push("");
  for (const metric of brief.scorecard.metrics) {
    sections.push(`**${metric.label}:** ${metric.grade.toUpperCase()} — ${formatMetric(metric)}`);
  }
  sections.push("");

  // Landscape
  sections.push(`## 02 — Market Landscape`);
  sections.push("");
  sections.push(brief.landscape.content);
  sections.push("");
  if (brief.landscape.callouts.length > 0) {
    for (const callout of brief.landscape.callouts) {
      const emoji = callout.type === "insight" ? "💡" : callout.type === "warning" ? "⚠️" : "🎯";
      sections.push(`> ${emoji} **${callout.type.toUpperCase()}:** ${formatCallout(callout)}`);
    }
    sections.push("");
  }

  // Positioning
  sections.push(`## 03 — Competitive Positioning`);
  sections.push("");
  sections.push(`| ${brief.positioning.headers.join(" | ")} |`);
  sections.push(`| ${brief.positioning.headers.map(() => "---").join(" | ")} |`);
  for (const row of brief.positioning.rows) {
    sections.push(`| ${row.dimension} | ${row.us} | ${row.competitorA} | ${row.competitorB} |`);
  }
  sections.push("");

  // Channels
  sections.push(`## 04 — Channel Opportunity Matrix`);
  sections.push("");
  sections.push(`| ${brief.channels.headers.join(" | ")} |`);
  sections.push(`| ${brief.channels.headers.map(() => "---").join(" | ")} |`);
  for (const row of brief.channels.rows) {
    sections.push(`| ${row.channel} | ${row.fitScore}/5 | ${row.effort} | ${row.speed} | ${row.evidence} | ${row.verdict.toUpperCase()} |`);
  }
  sections.push("");

  // Risks
  sections.push(`## 05 — Risk Assessment`);
  sections.push("");
  for (const risk of brief.risks.risks) {
    const emoji = risk.level === "critical" ? "🔴" : risk.level === "watch" ? "🟡" : "🟢";
    sections.push(`### ${emoji} ${risk.name}`);
    sections.push(`- **Impact:** ${risk.impact} | **Probability:** ${risk.probability} | **Level:** ${risk.level}`);
    sections.push(`- **Mitigation:** ${risk.mitigation}`);
    sections.push("");
  }

  // Timeline
  sections.push(`## 06 — 90-Day Roadmap`);
  sections.push("");
  for (const phase of brief.timeline.phases) {
    sections.push(`### ${phase.name} (${phase.weeks})`);
    sections.push(`**Focus:** ${phase.focus}`);
    sections.push("");
    for (const task of phase.tasks) {
      sections.push(`- ${task}`);
    }
    sections.push("");
  }

  // Resources
  sections.push(`## 07 — Resource Framework`);
  sections.push("");

  sections.push("### Time");
  for (const item of brief.resources.time) {
    sections.push(`- ${item}`);
  }
  sections.push("");

  sections.push("### Budget");
  for (const item of brief.resources.budget) {
    sections.push(`- ${item}`);
  }
  sections.push("");

  sections.push("### Tools");
  for (const item of brief.resources.tools) {
    sections.push(`- ${item}`);
  }
  sections.push("");

  sections.push("### Skills");
  for (const item of brief.resources.skills) {
    sections.push(`- ${item}`);
  }
  sections.push("");

  sections.push("### Gaps to Close");
  for (const item of brief.resources.gaps) {
    sections.push(`- ${item}`);
  }
  sections.push("");

  return sections.join("\n");
}
