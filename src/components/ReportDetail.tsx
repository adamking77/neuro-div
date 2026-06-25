import { useEffect, useState } from "react";
import { deleteAnalysisReport, getAnalysisReport, renameAnalysisReport } from "../lib/analysis-reports";
import type { NeuroDivAnalysisReport } from "../types";
import { ReportView } from "./ReportParts";

export function ReportDetail({ reportId }: { reportId: string }) {
  const [report, setReport] = useState<NeuroDivAnalysisReport | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setReport(getAnalysisReport(reportId));
    setLoaded(true);
  }, [reportId]);

  function handleRename() {
    if (!report) return;
    const title = window.prompt("Rename this report", report.title)?.trim();
    if (!title || title === report.title) return;
    setReport(renameAnalysisReport(report.id, title));
  }

  function handleDelete() {
    if (!report) return;
    if (!window.confirm("Delete this saved analysis report? This can't be undone.")) return;
    deleteAnalysisReport(report.id);
    window.location.assign("/reports");
  }

  if (!loaded) {
    return (
      <main className="main-wrap" style={{ maxWidth: 960, margin: "0 auto", padding: "52px 40px 100px" }}>
        <section className="content-panel">
          <p style={{ margin: 0, fontSize: 14, color: "var(--ink-muted)" }}>Loading report...</p>
        </section>
      </main>
    );
  }

  if (!report) {
    return (
      <main className="main-wrap" style={{ maxWidth: 960, margin: "0 auto", padding: "52px 40px 100px" }}>
        <section className="content-panel">
          <p className="eyebrow">Not found</p>
          <h1 style={{ margin: "8px 0 0", fontSize: 34, letterSpacing: 0 }}>Report not found</h1>
          <p style={{ margin: "12px 0 0", fontSize: 14, color: "var(--ink-light)", lineHeight: 1.7 }}>
            This report id is not in localStorage on this browser.
          </p>
          <p><a href="/reports">Return to reports</a></p>
        </section>
      </main>
    );
  }

  return (
    <main className="main-wrap" style={{ maxWidth: 960, margin: "0 auto", padding: "52px 40px 100px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <a href="/reports" className="btn-text" style={{ fontSize: 13, color: "var(--ink-muted)", textDecoration: "none" }}>
          Back to reports
        </a>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn-text" style={{ fontSize: 12, color: "var(--ink-muted)" }} onClick={handleRename}>Rename</button>
          <button className="btn-text" style={{ fontSize: 12, color: "var(--terracotta)" }} onClick={handleDelete}>Delete</button>
        </div>
      </div>
      <ReportView report={report} />
    </main>
  );
}
