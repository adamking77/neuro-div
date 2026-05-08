'use client';

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NDContextBuilder } from "./components/NDContextBuilder";
import { NDProcessDesigner } from "./components/NDProcessDesigner";
import { SkillsLibrary } from "./components/SkillsLibrary";
import { CategoryScoutTool } from "./components/CategoryScoutTool";
import { DistributionStrategyTool } from "./components/DistributionStrategyTool";
import { ProjectDrawer, ToolSection } from "./components/app-shell";
import { useProjectSession } from "./hooks/useProjectSession";
import { buildIntelligenceMarkdown } from "./lib/intelligence";
import {
  buildStrategyMarkdown,
  condensePhaseResearch,
  getStrategyFingerprint,
  hasCompleteStrategyDraft,
} from "./lib/strategy";
import { PHASES } from "./phases";
import { TOOL_LINKS, TOOL_ROUTES, type ActiveTool } from "./lib/tool-routes";
import type {
  ExaResult,
  IntelligenceBrief,
  StrategyDraft,
} from "./types";
import "./index.css";

interface StrategyDraftErrorResponse {
  error?: string;
}

function isIntelligenceBriefPayload(value: unknown): value is IntelligenceBrief {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const body = value as Record<string, unknown>;
  return (
    typeof body.summary === "string" &&
    !!body.scorecard &&
    !!body.landscape &&
    !!body.positioning &&
    !!body.channels &&
    !!body.risks &&
    !!body.timeline &&
    !!body.resources
  );
}

const CLAUDE_PROMPT = `I'm attaching a Category Scout research file. It contains results from 6 research phases, each with source titles, URLs, publication dates, relevance scores, and direct highlight excerpts pulled from each source.

Produce a category design brief with these sections:

1. The Problem — in customer language, not solution language
2. The Enemy — the worldview or incumbent approach being displaced
3. The Landscape — who's adjacent, what's named, where the edges are
4. The White Space — the unclaimed combination of problem + solution
5. The Evidence Stack — proof the problem is real and growing
6. The Vocabulary Set — candidate words for naming the category
7. The POV Thesis — one paragraph: broken world → enemy → new way

Rules:
- Every claim must be grounded in a specific highlight or source from the file
- Cite sources inline using the format: ([domain.com](URL))
- Quote highlight excerpts directly when they are strong evidence
- Do not introduce information from outside the file
- Be specific and direct — no generic category design filler`;

export default function App({
  activeTool,
  embedded = false,
}: {
  activeTool: ActiveTool;
  embedded?: boolean;
}) {
  const router = useRouter();
  const [pendingTool, setPendingTool] = useState<ActiveTool | null>(null);
  const displayTool = pendingTool ?? activeTool;

  useEffect(() => {
    setPendingTool(null);
  }, [activeTool]);

  const {
    ndProfileContext,
    session,
    mutateSession,
    draftHistory,
    setDraftHistory,
    projectId,
    projectDrawerOpen,
    setProjectDrawerOpen,
    projects,
    editingProjectId,
    editName,
    setEditName,
    lastSavedAt,
    refreshProjects,
    createNewProject,
    switchProject,
    handleDeleteProject,
    startRenamingProject,
    handleRenameProject,
    cancelRenamingProject,
    updatePhase,
    updateStrategyInput,
    updateStrategySection,
  } = useProjectSession(activeTool);

  const handleSessionFieldChange = useCallback((field: "problem" | "knownPlayers", value: string) => {
    mutateSession((current) => ({ ...current, [field]: value }));
  }, [mutateSession]);

  const runPhase = useCallback(async (phaseId: number, startDelay = 0) => {
    const phase = PHASES.find((item) => item.id === phaseId);
    if (!phase || !session.problem.trim()) return;

    if (startDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, startDelay));
    }

    updatePhase(phaseId, { status: "running", results: [], error: undefined });
    const queries = phase.buildQueries(session.problem, session.knownPlayers);
    const allResults: ExaResult[] = [];

    try {
      for (let index = 0; index < queries.length; index += 1) {
        if (index > 0) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }

        const query = queries[index];
        const response = await fetch("/api/exa-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: query.query, phase: phaseId, category: query.category ?? null }),
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }

        const results: ExaResult[] = await response.json();
        for (const result of results) {
          if (!allResults.find((existing) => existing.url === result.url)) {
            allResults.push(result);
          }
        }
      }

      updatePhase(phaseId, { status: "done", results: allResults });
    } catch (error) {
      updatePhase(phaseId, { status: "error", error: String(error) });
    }
  }, [session.problem, session.knownPlayers, updatePhase]);

  const runAll = useCallback(() => {
    if (!session.problem.trim()) return;
    PHASES.forEach((phase, index) => {
      void runPhase(phase.id, index * 400);
    });
  }, [runPhase, session.problem]);

  const reset = useCallback(() => {
    if (!window.confirm("Start fresh? Your current research and drafts will be cleared.")) return;
    createNewProject();
  }, [createNewProject]);

  const downloadBlob = useCallback((contents: string, prefix: string) => {
    const blob = new Blob([contents], { type: "text/markdown" });
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(blob);
    anchor.download = `${prefix}-${Date.now()}.md`;
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  }, []);

  const downloadResearch = useCallback(() => {
    const date = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const lines: string[] = [
      "# Category Scout Research",
      `**Problem:** ${session.problem}`,
      session.knownPlayers ? `**Known Players:** ${session.knownPlayers}` : "",
      `**Date:** ${date}`,
      "",
    ];

    for (const phase of PHASES) {
      const result = session.phases[phase.id];
      if (result.status !== "done" || result.results.length === 0) continue;

      lines.push("---", "", `## Phase ${String(phase.id).padStart(2, "0")} — ${phase.name}`, `*${phase.description}*`, "");

      for (const item of result.results) {
        const domain = (() => {
          try {
            return new URL(item.url).hostname.replace(/^www\./, "");
          } catch {
            return item.url;
          }
        })();
        const publishedDate = item.publishedDate
          ? new Date(item.publishedDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })
          : null;
        const score = item.score != null ? `${(item.score * 100).toFixed(0)}% relevance` : null;

        lines.push(`### [${item.title || item.url}](${item.url})`);
        lines.push(`*${[domain, publishedDate, score].filter(Boolean).join(" · ")}*`, "");

        if (item.highlights?.length) {
          for (const highlight of item.highlights.slice(0, 2)) {
            lines.push(`> ${highlight}`, "");
          }
        }
      }
    }

    downloadBlob(lines.filter(Boolean).join("\n"), "category-scout");
  }, [downloadBlob, session]);

  const downloadStrategy = useCallback(() => {
    const markdown = buildStrategyMarkdown(session);
    if (!markdown) return;
    downloadBlob(markdown, "category-scout-strategy");
  }, [downloadBlob, session]);

  const downloadIntelligenceBrief = useCallback(() => {
    if (!session.intelligenceBrief) return;
    const markdown = buildIntelligenceMarkdown(session.intelligenceBrief);
    const slug = session.problem
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "strategy";
    downloadBlob(markdown, `${slug}-intelligence-brief`);
  }, [downloadBlob, session]);

  const generateStrategy = useCallback(async () => {
    if (!session.problem.trim() || !session.strategyInputs.audienceLens.trim()) return;

    mutateSession((current) => ({
      ...current,
      strategyStatus: "researching",
      strategyError: undefined,
    }));

    try {
      const draftRequest = {
        problem: session.problem,
        knownPlayers: session.knownPlayers,
        audienceLens: session.strategyInputs.audienceLens,
        founderConstraints: {
          teamSize: session.strategyInputs.teamSize,
          budgetBand: session.strategyInputs.budgetBand,
          weeklyCapacity: session.strategyInputs.weeklyCapacity,
          socialPostingTolerance: session.strategyInputs.socialPostingTolerance,
          channelAvoidances: session.strategyInputs.channelAvoidances,
          outreachTolerance: session.strategyInputs.outreachTolerance,
          peerCollaborationOk: session.strategyInputs.peerCollaborationOk,
          contentMode: session.strategyInputs.contentMode,
          contentModeOther: session.strategyInputs.contentModeOther,
          existingAssets: session.strategyInputs.existingAssets,
          previousAttempts: session.strategyInputs.previousAttempts ?? "",
          avoidanceTasks: session.strategyInputs.avoidanceTasks ?? "",
          activationWindows: session.strategyInputs.activationWindows ?? "",
          unavailablePeriods: session.strategyInputs.unavailablePeriods ?? "",
        },
        ndProfileContext: ndProfileContext ?? undefined,
        phaseResearch: condensePhaseResearch(session.phases),
      };

      const response = await fetch("/api/strategy-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draftRequest),
      });

      const rawText = await response.text();
      let payload: StrategyDraft | StrategyDraftErrorResponse;
      try {
        payload = JSON.parse(rawText) as StrategyDraft | StrategyDraftErrorResponse;
      } catch {
        throw new Error(`Server error (${response.status}): ${rawText.slice(0, 200)}`);
      }

      if (!response.ok) {
        throw new Error(typeof payload === "object" && payload && "error" in payload ? payload.error : "Strategy draft failed");
      }

      mutateSession((current) => ({ ...current, strategyStatus: "drafting" }));
      await new Promise((resolve) => setTimeout(resolve, 700));

      const finalDraft = payload as StrategyDraft;
      if (!hasCompleteStrategyDraft(finalDraft)) {
        throw new Error("Strategy draft returned without section text. Try rebuilding.");
      }

      const fingerprint = getStrategyFingerprint({
        problem: session.problem,
        knownPlayers: session.knownPlayers,
        phases: session.phases,
        strategyInputs: session.strategyInputs,
        ndProfileContext,
      });

      mutateSession((current) => ({
        ...current,
        strategyDraft: finalDraft,
        strategyStatus: "done",
        strategyError: undefined,
        strategyDirty: false,
        strategySourceFingerprint: fingerprint,
      }));

      setDraftHistory((current) => [...current, finalDraft]);
    } catch (error) {
      mutateSession((current) => ({
        ...current,
        strategyDraft: hasCompleteStrategyDraft(current.strategyDraft) ? current.strategyDraft : null,
        strategyStatus: "error",
        strategyError: error instanceof Error ? error.message : "Strategy draft failed",
      }));
    }
  }, [mutateSession, ndProfileContext, session, setDraftHistory]);

  const generateIntelligenceBrief = useCallback(async () => {
    if (!session.problem.trim() || !session.strategyInputs.audienceLens.trim()) return;

    mutateSession((current) => ({
      ...current,
      intelligenceStatus: "researching",
      intelligenceError: undefined,
    }));

    try {
      const draftRequest = {
        problem: session.problem,
        knownPlayers: session.knownPlayers,
        audienceLens: session.strategyInputs.audienceLens,
        founderConstraints: {
          teamSize: session.strategyInputs.teamSize,
          budgetBand: session.strategyInputs.budgetBand,
          weeklyCapacity: session.strategyInputs.weeklyCapacity,
          socialPostingTolerance: session.strategyInputs.socialPostingTolerance,
          channelAvoidances: session.strategyInputs.channelAvoidances,
          outreachTolerance: session.strategyInputs.outreachTolerance,
          peerCollaborationOk: session.strategyInputs.peerCollaborationOk,
          contentMode: session.strategyInputs.contentMode,
          contentModeOther: session.strategyInputs.contentModeOther,
          existingAssets: session.strategyInputs.existingAssets,
          previousAttempts: session.strategyInputs.previousAttempts ?? "",
          avoidanceTasks: session.strategyInputs.avoidanceTasks ?? "",
          activationWindows: session.strategyInputs.activationWindows ?? "",
          unavailablePeriods: session.strategyInputs.unavailablePeriods ?? "",
        },
        ndProfileContext: ndProfileContext ?? undefined,
        phaseResearch: condensePhaseResearch(session.phases),
      };

      const response = await fetch("/api/intelligence-snapshot-v1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draftRequest),
      });

      const rawText = await response.text();
      let payload: IntelligenceBrief | StrategyDraftErrorResponse;
      try {
        payload = JSON.parse(rawText) as IntelligenceBrief | StrategyDraftErrorResponse;
      } catch {
        throw new Error(`Server error (${response.status}): ${rawText.slice(0, 200)}`);
      }

      if (!response.ok) {
        throw new Error(typeof payload === "object" && payload && "error" in payload ? payload.error : "Intelligence brief failed");
      }

      if (!isIntelligenceBriefPayload(payload)) {
        throw new Error("The server returned an unexpected analysis format. Try again.");
      }

      mutateSession((current) => ({ ...current, intelligenceStatus: "drafting" }));
      await new Promise((resolve) => setTimeout(resolve, 700));

      mutateSession((current) => ({
        ...current,
        intelligenceBrief: payload,
        intelligenceStatus: "done",
        intelligenceError: undefined,
      }));
    } catch (error) {
      mutateSession((current) => ({
        ...current,
        intelligenceBrief: current.intelligenceBrief,
        intelligenceStatus: "error",
        intelligenceError: error instanceof Error ? error.message : "Intelligence brief failed",
      }));
    }
  }, [mutateSession, ndProfileContext, session]);

  const dismissStrategyNotice = useCallback(() => {
    mutateSession((current) => ({
      ...current,
      strategyStatus: current.strategyStatus === "error" ? "idle" : current.strategyStatus,
      strategyError: undefined,
    }));
  }, [mutateSession]);

  const dismissIntelligenceNotice = useCallback(() => {
    mutateSession((current) => ({
      ...current,
      intelligenceStatus: current.intelligenceStatus === "error" ? "idle" : current.intelligenceStatus,
      intelligenceError: undefined,
    }));
  }, [mutateSession]);

  const phaseRunning = Object.values(session.phases).some((phase) => phase.status === "running");
  const hasAnyResults = Object.values(session.phases).some((phase) => phase.results.length > 0);
  const canRun = !!session.problem.trim() && !phaseRunning;
  const donePhaseCount = Object.values(session.phases).filter((phase) => phase.status === "done").length;
  const totalResultCount = Object.values(session.phases).reduce((sum, phase) => sum + phase.results.length, 0);
  const usesProjectShell = activeTool === "category-scout" || activeTool === "distribution-strategy";

  useEffect(() => {
    for (const route of Object.values(TOOL_ROUTES)) {
      void router.prefetch(route);
    }
  }, [router]);

  return (
    <div className="main-wrap" style={{ maxWidth: 960, margin: "0 auto", padding: "52px 40px 100px" }}>
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="28" height="20" viewBox="0 0 32 32" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="16" r="10" stroke="var(--teal)" strokeWidth="2" fill="none" />
              <circle cx="20" cy="16" r="10" stroke="var(--terracotta)" strokeWidth="2" fill="none" opacity="0.85" />
            </svg>
            <span style={{ fontSize: 20, fontWeight: 500, color: "var(--ink)", letterSpacing: "-0.03em", lineHeight: 1 }}>
              NeuroDiv OS
            </span>
          </div>
          {usesProjectShell ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                className="btn-text"
                onClick={() => {
                  refreshProjects();
                  setProjectDrawerOpen(true);
                }}
                style={{ fontSize: 12, color: "var(--ink-muted)" }}
              >
                {session.problem ? session.problem.slice(0, 30) + (session.problem.length > 30 ? "…" : "") : "Projects"}
              </button>
              {lastSavedAt && (
                <span className="mono" style={{ fontSize: 9, color: "var(--ink-muted)", opacity: 0.5 }}>
                  Saved {new Date(lastSavedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <ProjectDrawer
        open={projectDrawerOpen}
        onClose={() => setProjectDrawerOpen(false)}
        projects={projects}
        currentId={projectId}
        onSelect={switchProject}
        onNew={createNewProject}
        onDelete={handleDeleteProject}
        onRenameStart={startRenamingProject}
        onRenameSubmit={handleRenameProject}
        onRenameCancel={cancelRenamingProject}
        editingId={editingProjectId}
        editName={editName}
        onEditNameChange={setEditName}
      />

      {!embedded ? (
        <div style={{ maxWidth: 600, margin: "0 0 60px" }}>
          <p style={{ fontSize: 14, color: "var(--ink-light)", lineHeight: 1.7, margin: "0 0 12px" }}>
            AI is the most adaptive partner neurodivergent people have ever had access to. The problem is context: it doesn't know your activation patterns, what causes shutdown, when you have real capacity, or what produces action versus paralysis. That context is hard to articulate, so it almost never gets in. NeuroDiv OS helps you build that full context and hand it to your AI, so every tool and every session responds to how you actually work.
          </p>
          <p style={{ fontSize: 14, color: "var(--ink-light)", lineHeight: 1.7, margin: 0 }}>
            Start with Context Builder. It takes about ten minutes. Stop whenever, skip anything you'd rather not answer. Once your profile is built, the other tools read from it and you can paste it into any AI you already use.
          </p>
        </div>
      ) : null}

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32, flexWrap: "wrap" }}>
        <div style={{ display: "inline-flex", gap: 2, padding: 3, borderRadius: 999, flexWrap: "wrap" }}>
          {TOOL_LINKS.map(({ id, label }) => {
            const isActive = displayTool === id;
            return (
              <Link
                key={id}
                href={TOOL_ROUTES[id]}
                className={`nav-pill${isActive ? " nav-pill--active" : ""}`}
                onClick={() => setPendingTool(id)}
                style={{
                  fontSize: 12,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? "#fff" : "var(--ink-muted)",
                  background: isActive ? "var(--teal)" : "transparent",
                  border: "none",
                  borderRadius: 999,
                  padding: "5px 14px",
                  fontFamily: "var(--font-display)",
                  letterSpacing: "0.02em",
                  lineHeight: 1,
                  textDecoration: "none",
                  display: "inline-block",
                }}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>

      <hr className="rule" />

      {activeTool === "context-builder" && (
        <ToolSection
          label="Context Builder"
          description="A profile that tells any AI how you actually work: your activation patterns, shutdown triggers, and support conditions. Build it once. Every other tool reads from it."
        >
          <NDContextBuilder />
        </ToolSection>
      )}

      {activeTool === "process-designer" && (
        <ToolSection
          label="Process Designer"
          description="One goal, converted into a working process organized by energy state. Step menus for each working mode. Rescue steps for hard days."
        >
          <NDProcessDesigner onOpenContextBuilder={() => router.push(TOOL_ROUTES["context-builder"])} />
        </ToolSection>
      )}

      {activeTool === "skills" && (
        <ToolSection
          label="Skill Suite"
          description="You built your context here. These skills carry it into the AI you already use every day. Use any skill as often as you need, natively in your own agentic environment."
        >
          <SkillsLibrary />
        </ToolSection>
      )}

      {activeTool === "category-scout" && (
        <CategoryScoutTool
          session={session}
          phaseRunning={phaseRunning}
          hasAnyResults={hasAnyResults}
          donePhaseCount={donePhaseCount}
          totalResultCount={totalResultCount}
          canRun={canRun}
          onSessionChange={handleSessionFieldChange}
          onRunAll={runAll}
          onRunPhase={runPhase}
          onDownloadResearch={downloadResearch}
          onReset={reset}
          onOpenDistributionStrategy={() => router.push(TOOL_ROUTES["distribution-strategy"])}
          prompt={CLAUDE_PROMPT}
        />
      )}

      {activeTool === "distribution-strategy" && (
        <DistributionStrategyTool
          session={session}
          ndProfileContext={ndProfileContext}
          draftHistory={draftHistory}
          phaseRunning={phaseRunning}
          hasAnyResults={hasAnyResults}
          onInputChange={updateStrategyInput}
          onSectionChange={updateStrategySection}
          onGenerate={generateStrategy}
          onGenerateIntelligence={generateIntelligenceBrief}
          onDismissStrategyNotice={dismissStrategyNotice}
          onDismissIntelligenceNotice={dismissIntelligenceNotice}
          onExport={downloadStrategy}
          onExportIntelligence={downloadIntelligenceBrief}
          onReset={reset}
          onBackToResearch={() => router.push(TOOL_ROUTES["category-scout"])}
        />
      )}
    </div>
  );
}
