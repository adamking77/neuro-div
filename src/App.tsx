import { NDContextBuilder } from "./components/NDContextBuilder";
import { NDProcessDesigner } from "./components/NDProcessDesigner";
import { SkillsLibrary } from "./components/SkillsLibrary";
import { SpineFinder } from "./components/SpineFinder";
import { ToolSection } from "./components/app-shell";
import { TOOL_LINKS, TOOL_ROUTES, type ActiveTool } from "./lib/tool-routes";

export default function App({
  activeTool,
  embedded = false,
}: {
  activeTool: ActiveTool;
  embedded?: boolean;
}) {
  return (
    <div className="main-wrap" style={{ maxWidth: 960, margin: "0 auto", padding: "52px 40px 100px" }}>
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="28" height="20" viewBox="0 0 32 32" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="16" r="10" stroke="var(--teal)" strokeWidth="2" fill="none" />
              <circle cx="20" cy="16" r="10" stroke="var(--terracotta)" strokeWidth="2" fill="none" opacity="0.85" />
            </svg>
            <span style={{ fontSize: 20, fontWeight: 500, color: "var(--ink)", letterSpacing: 0, lineHeight: 1 }}>
              NeuroDiv OS
            </span>
          </div>
        </div>
      </div>

      {!embedded ? (
        <div style={{ maxWidth: 640, margin: "0 0 56px" }}>
          <p style={{ fontSize: 14, color: "var(--ink-light)", lineHeight: 1.7, margin: 0 }}>
            AI is the most adaptive partner neurodivergent people have ever had access to. The problem is context: it doesn't know your activation patterns, what causes shutdown, when you have real capacity, or what produces action versus paralysis. That context is hard to articulate, so it almost never gets in. NeuroDiv OS helps you build that full context and hand it to your AI, so every tool and every session responds to how you actually work.
          </p>
          <p style={{ fontSize: 14, color: "var(--ink-muted)", lineHeight: 1.7, margin: "12px 0 0" }}>
            A tool for neurodivs by the neurodivs at{" "}
            <a
              href="https://gokart.studio"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--teal-deep)" }}
            >
              GoKart Studio
            </a>
          </p>
        </div>
      ) : null}

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32, overflowX: "auto", paddingBottom: 2 }}>
        <div style={{ display: "inline-flex", gap: 2, padding: 3, borderRadius: 999, flexWrap: "nowrap", minWidth: "max-content" }}>
          {TOOL_LINKS.map(({ id, label }) => {
            const isActive = activeTool === id;
            return (
              <a
                key={id}
                href={TOOL_ROUTES[id]}
                className={`nav-pill${isActive ? " nav-pill--active" : ""}`}
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
              </a>
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
          <NDProcessDesigner onOpenContextBuilder={() => window.location.assign(TOOL_ROUTES["context-builder"])} />
        </ToolSection>
      )}


      {activeTool === "spine-finder" && (
        <ToolSection
          label="Spine-Finder"
          description="A small assist for finding your spine — a companion to Lindsey Mackereth's Compression Framework. You write, the tool does the part in between, you decide."
        >
          <SpineFinder />
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

      <footer className="site-footer" style={{ marginTop: 48 }}>
        <span>
          © {new Date().getFullYear()}{" "}
          <a
            href="https://gokart.studio"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--teal-deep)" }}
          >
            GoKart Studio
          </a>
        </span>
      </footer>
    </div>
  );
}
