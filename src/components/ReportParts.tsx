import type { ChartDatum, NeuroDivAnalysisReport } from "../types";
import { buildAnalysisMarkdown } from "../lib/analysis-reports";
import { Bar } from "./charts/bar";
import { BarChart } from "./charts/bar-chart";
import { Ring } from "./charts/ring";
import { RingCenter } from "./charts/ring-center";
import { RingChart } from "./charts/ring-chart";

function downloadText(filename: string, contents: string, type: string) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function downloadReportMarkdown(report: NeuroDivAnalysisReport) {
  downloadText(`nd-analysis-${report.id}.md`, buildAnalysisMarkdown(report), "text/markdown;charset=utf-8");
}

export function downloadReportJson(report: NeuroDivAnalysisReport) {
  downloadText(`nd-analysis-${report.id}.json`, JSON.stringify(report, null, 2), "application/json;charset=utf-8");
}

export function ReportBarList({ items }: { items: ChartDatum[] }) {
  if (items.length === 0) {
    return (
      <p style={{ margin: 0, fontSize: 13, color: "var(--ink-muted)", lineHeight: 1.6 }}>
        Not enough structured data for this chart yet.
      </p>
    );
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ minHeight: 220, width: "100%" }}>
        <BarChart
          aspectRatio="3 / 2"
          data={items.map((item) => ({ name: item.label, value: item.value }))}
          margin={{ top: 18, right: 24, bottom: 18, left: 128 }}
          orientation="horizontal"
          xDataKey="name"
        >
          <Bar dataKey="value" fill={items[0]?.group === "energy" ? "var(--terracotta)" : "var(--teal)"} lineCap="round" />
        </BarChart>
      </div>
      {items.map((item) => (
        <div key={`${item.label}-${item.group ?? "default"}`}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 5 }}>
            <span style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.35 }}>{item.label}</span>
            <span className="mono" style={{ fontSize: 10, color: "var(--ink-muted)" }}>{item.value}/{item.max}</span>
          </div>
          <div style={{ height: 7, background: "rgba(26,26,24,0.07)", overflow: "hidden" }}>
            <div
              style={{
                width: `${Math.max(0, Math.min(100, (item.value / item.max) * 100))}%`,
                height: "100%",
                background: item.group === "energy" ? "var(--terracotta)" : "var(--teal)",
              }}
            />
          </div>
          {item.evidence ? (
            <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--ink-muted)", lineHeight: 1.45 }}>{item.evidence}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function ProcessFitRing({ report }: { report: NeuroDivAnalysisReport }) {
  const score = report.processFitScore.score;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 24, alignItems: "center" }} className="strategy-middle-grid">
      <div style={{ width: 180, height: 180 }}>
        <RingChart
          baseInnerRadius={48}
          data={[{ label: "Fit", value: score, maxValue: report.processFitScore.max, color: "var(--teal)" }]}
          ringGap={5}
          size={180}
          strokeWidth={16}
        >
          <Ring index={0} />
          <RingCenter defaultLabel="Fit" suffix="%" />
        </RingChart>
      </div>
      <div>
        <h2 style={{ margin: "0 0 8px", fontSize: 30, letterSpacing: 0 }}>
          {score}/{report.processFitScore.max}
        </h2>
        <p style={{ margin: 0, fontSize: 14, color: "var(--ink-light)", lineHeight: 1.7 }}>
          {report.processFitScore.rationale}
        </p>
      </div>
    </div>
  );
}

export function ReportView({ report }: { report: NeuroDivAnalysisReport }) {
  return (
    <article style={{ display: "grid", gap: 24 }}>
      <section className="content-panel">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 18, flexWrap: "wrap" }}>
          <div>
            <p className="eyebrow">Analysis Report</p>
            <h1 style={{ margin: "6px 0 0", fontSize: "clamp(2rem, 4vw, 3.5rem)", lineHeight: 1, letterSpacing: 0 }}>
              {report.title}
            </h1>
            <p style={{ margin: "12px 0 0", fontSize: 13, color: "var(--ink-muted)" }}>
              {new Date(report.createdAt).toLocaleString()} · {report.model.name}
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
            <button className="button-link secondary" onClick={() => void navigator.clipboard.writeText(report.agentBrief)}>
              Copy agent brief
            </button>
            <button className="button-link secondary" onClick={() => downloadReportMarkdown(report)}>
              Download Markdown
            </button>
            <button className="button-link primary" onClick={() => downloadReportJson(report)}>
              Download JSON
            </button>
          </div>
        </div>
      </section>

      <section className="content-panel">
        <p className="eyebrow">Summary</p>
        <p style={{ margin: "10px 0 0", fontSize: 16, color: "var(--ink-light)", lineHeight: 1.75 }}>
          {report.executiveSummary}
        </p>
      </section>

      <section className="content-panel">
        <p className="eyebrow">What the app noticed</p>
        <div style={{ display: "grid", gap: 18, marginTop: 16 }}>
          {report.operatingPatternInsights.map((insight) => (
            <div key={insight.title}>
              <h2 style={{ margin: 0, fontSize: 20, letterSpacing: 0 }}>{insight.title}</h2>
              <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--ink-light)", lineHeight: 1.7 }}>
                <strong>Observation:</strong> {insight.observation}
              </p>
              <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--ink-light)", lineHeight: 1.7 }}>
                <strong>Inference:</strong> {insight.inference}
              </p>
              <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--ink-muted)", lineHeight: 1.6 }}>
                Evidence: {insight.evidence.join("; ")}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16 }} className="strategy-middle-grid">
        <div className="content-panel">
          <p className="eyebrow">Activation conditions</p>
          <div style={{ marginTop: 16 }}>
            <ReportBarList items={report.activationMap} />
          </div>
        </div>
        <div className="content-panel">
          <p className="eyebrow">Shutdown and friction risks</p>
          <div style={{ marginTop: 16 }}>
            <ReportBarList items={report.shutdownRiskMap} />
          </div>
        </div>
      </section>

      <section className="content-panel">
        <p className="eyebrow">Process fit</p>
        <div style={{ marginTop: 16 }}>
          <ProcessFitRing report={report} />
        </div>
        <div style={{ marginTop: 18 }}>
          <ReportBarList items={report.energyModePlan} />
        </div>
      </section>

      <section className="content-panel">
        <p className="eyebrow">Recommended process changes</p>
        <div style={{ display: "grid", gap: 14, marginTop: 16 }}>
          {report.recommendations.map((item) => (
            <div key={`${item.title}-${item.energyMode}`} style={{ borderTop: "1px solid var(--rule)", paddingTop: 14 }}>
              <h2 style={{ margin: 0, fontSize: 18, letterSpacing: 0 }}>{item.title}</h2>
              <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--ink-light)", lineHeight: 1.7 }}>{item.recommendation}</p>
              <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--ink-muted)", lineHeight: 1.6 }}>
                {item.energyMode} energy · {item.why}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="content-panel">
        <p className="eyebrow">Next seven days</p>
        <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
          {report.nextSevenDays.map((item) => (
            <div key={item.day} style={{ display: "grid", gridTemplateColumns: "72px 1fr", gap: 12, borderTop: "1px solid var(--rule)", paddingTop: 12 }}>
              <span className="mono" style={{ fontSize: 10, color: "var(--ink-muted)" }}>{item.day}</span>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, letterSpacing: 0 }}>{item.title}</h3>
                <p style={{ margin: "5px 0 0", fontSize: 13, color: "var(--ink-light)", lineHeight: 1.65 }}>{item.action}</p>
                <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--ink-muted)", lineHeight: 1.5 }}>Done: {item.doneSignal}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="content-panel">
        <p className="eyebrow">Rescue plan</p>
        <div style={{ display: "grid", gap: 14, marginTop: 16 }}>
          {report.rescuePlan.map((move) => (
            <div key={move.title} style={{ borderTop: "1px solid var(--rule)", paddingTop: 14 }}>
              <h2 style={{ margin: 0, fontSize: 18, letterSpacing: 0 }}>{move.title}</h2>
              <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--ink-light)", lineHeight: 1.7 }}>{move.action}</p>
              <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--ink-muted)", lineHeight: 1.6 }}>
                Trigger: {move.trigger} · Mitigation: {move.mitigation}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="content-panel">
        <p className="eyebrow">Agent brief</p>
        <pre className="skill-source" style={{ marginTop: 16 }}>{report.agentBrief}</pre>
      </section>

      <section className="content-panel">
        <p className="eyebrow">Source context used</p>
        <ul className="plain-list">
          <li>Profile: {report.profileSnapshot.source}</li>
          <li>Goal: {report.processSnapshot.plan.goal}</li>
          {report.caveats.map((caveat) => <li key={caveat}>{caveat}</li>)}
        </ul>
      </section>
    </article>
  );
}
