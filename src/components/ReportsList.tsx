import { useEffect, useState } from "react";
import { buildAnalysisMarkdown, deleteAnalysisReport, listAnalysisReports, renameAnalysisReport } from "../lib/analysis-reports";
import type { NeuroDivAnalysisReport } from "../types";
import { Card } from "./ui";

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

function downloadReportMarkdown(report: NeuroDivAnalysisReport) {
  downloadText(`nd-analysis-${report.id}.md`, buildAnalysisMarkdown(report), "text/markdown;charset=utf-8");
}

function downloadReportJson(report: NeuroDivAnalysisReport) {
  downloadText(`nd-analysis-${report.id}.json`, JSON.stringify(report, null, 2), "application/json;charset=utf-8");
}

export function ReportsList() {
  const [reports, setReports] = useState<NeuroDivAnalysisReport[]>([]);

  function refresh() {
    setReports(listAnalysisReports());
  }

  useEffect(() => {
    refresh();
  }, []);

  function handleRename(report: NeuroDivAnalysisReport) {
    const title = window.prompt("Rename this report", report.title)?.trim();
    if (!title || title === report.title) return;
    renameAnalysisReport(report.id, title);
    refresh();
  }

  function handleDelete(report: NeuroDivAnalysisReport) {
    if (!window.confirm("Delete this saved analysis report? This can't be undone.")) return;
    deleteAnalysisReport(report.id);
    refresh();
  }

  if (reports.length === 0) {
    return (
      <Card padding="lg">
        <p style={{ margin: 0, fontSize: 14, color: "var(--ink-light)", lineHeight: 1.7 }}>
          No saved reports yet. Generate an analysis from Process Designer and it will appear here.
        </p>
      </Card>
    );
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {reports.map((report) => (
        <Card key={report.id} padding="lg">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <a href={`/reports/${report.id}`} style={{ textDecoration: "none" }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 500, color: "var(--ink)", letterSpacing: 0, lineHeight: 1.25 }}>
                  {report.title}
                </h3>
              </a>
              <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--ink-muted)", lineHeight: 1.6 }}>
                {new Date(report.updatedAt).toLocaleString()} · {report.model.name}
              </p>
              <p style={{ margin: "12px 0 0", fontSize: 14, color: "var(--ink-light)", lineHeight: 1.7 }}>
                {report.executiveSummary}
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start" }}>
              <a className="button-link primary" href={`/reports/${report.id}`}>Open report</a>
              <button className="btn-text" style={{ fontSize: 12, color: "var(--ink-muted)" }} onClick={() => handleRename(report)}>
                Rename
              </button>
              <button className="btn-text" style={{ fontSize: 12, color: "var(--ink-muted)" }} onClick={() => downloadReportMarkdown(report)}>
                Download Markdown
              </button>
              <button className="btn-text" style={{ fontSize: 12, color: "var(--ink-muted)" }} onClick={() => downloadReportJson(report)}>
                Download JSON
              </button>
              <button className="btn-text" style={{ fontSize: 12, color: "var(--terracotta)" }} onClick={() => handleDelete(report)}>
                Delete
              </button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
