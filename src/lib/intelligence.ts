import type { IntelligenceBrief } from "../types";

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
