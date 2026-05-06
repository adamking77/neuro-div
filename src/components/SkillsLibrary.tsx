const SKILLS = [
  {
    name: "ND Context Builder",
    slug: "nd-context-builder",
    status: "Available",
    surface: "Tool + Skill",
    summary: "Builds the persistent ND profile artifact that every other skill and tool can read.",
    input: "Existing context plus intake answers about traits, activation, shutdown, time, systems, and support conditions.",
    output: "ND profile markdown artifact.",
  },
  {
    name: "ND Process Designer",
    slug: "nd-process-designer",
    status: "Available",
    surface: "Tool + Skill",
    summary: "Turns an ND profile and one concrete goal into a trigger-based process artifact and agent brief.",
    input: "ND profile artifact plus one goal, a success signal, likely friction, and a not-doing list.",
    output: "ND process markdown artifact.",
  },
  {
    name: "Category Scout",
    slug: "category-scout",
    status: "Available",
    surface: "Tool + Skill",
    summary: "Runs the research side only: evidence gathering, phase framing, and the category dossier.",
    input: "Problem statement, known players, and whatever live or provided research context is available.",
    output: "Category research dossier.",
  },
  {
    name: "Distribution Strategy",
    slug: "distribution-strategy",
    status: "Available",
    surface: "Tool + Skill",
    summary: "Reads research plus ND constraints and writes the strategy/process artifact and receiving-agent brief.",
    input: "Research dossier, ND profile, audience lens, operator constraints, and project-specific realities.",
    output: "Distribution strategy artifact plus agent brief.",
  },
  {
    name: "ND Session Loop",
    slug: "nd-session-loop",
    status: "Planned",
    surface: "Skill only",
    summary: "Combines session start and reflection into one operating loop that reads the active process and updates it over time.",
    input: "Active ND process artifact and the user's in-the-moment session state.",
    output: "A surfaced move plus outcomes-log updates.",
  },
];

export function SkillsLibrary() {
  return (
    <div style={{ paddingTop: 40 }}>
      <div style={{ maxWidth: 640, marginBottom: 34 }}>
        <p style={metaLabelStyle}>Skill Suite</p>
        <p style={{ fontSize: 15, color: "var(--ink-light)", lineHeight: 1.75, margin: 0 }}>
          These are the portable versions of the methodology. The tools in this app are the guided web surface. The skills are the handoff surface
          for Claude, Codex, or any LLM environment that can carry stable instructions and artifacts.
        </p>
      </div>

      <div style={{ display: "grid", gap: 18, marginBottom: 34 }}>
        {SKILLS.map((skill, index) => (
          <div key={skill.slug} style={{ border: "1px solid var(--rule)", padding: "18px 18px 16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "32px 1fr", gap: 12 }}>
              <span className="mono" style={{ fontSize: 10, color: "var(--ink-muted)", letterSpacing: "0.1em", paddingTop: 2 }}>
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 6 }}>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 500, color: "var(--ink)", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                    {skill.name}
                  </h3>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <Pill label={skill.surface} tone="neutral" />
                    <Pill label={skill.status} tone={skill.status === "Available" ? "teal" : "terracotta"} />
                  </div>
                </div>
                <p style={{ margin: "0 0 14px", fontSize: 13, color: "var(--ink-light)", lineHeight: 1.7 }}>
                  {skill.summary}
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }} className="constraints-grid">
                  <div>
                    <p style={metaLabelStyle}>Input</p>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--ink-light)", lineHeight: 1.65 }}>{skill.input}</p>
                  </div>
                  <div>
                    <p style={metaLabelStyle}>Output</p>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--ink-light)", lineHeight: 1.65 }}>{skill.output}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ border: "1px solid var(--rule)", padding: "16px 18px" }}>
        <p style={metaLabelStyle}>Architecture note</p>
        <p style={{ margin: "0 0 8px", fontSize: 14, color: "var(--ink)", lineHeight: 1.65 }}>
          `Category Scout` and `Distribution Strategy` are intentionally separate on both surfaces.
        </p>
        <p style={{ margin: 0, fontSize: 13, color: "var(--ink-light)", lineHeight: 1.65 }}>
          Category Scout owns research. Distribution Strategy owns synthesis, process framing, and the agent brief. The split is now reflected in
          the app shell and in the skill packages under `skills/`.
        </p>
      </div>
    </div>
  );
}

function Pill({
  label,
  tone,
}: {
  label: string;
  tone: "neutral" | "teal" | "terracotta";
}) {
  const tones = {
    neutral: {
      background: "rgba(26, 26, 24, 0.03)",
      border: "var(--rule)",
      color: "var(--ink-muted)",
    },
    teal: {
      background: "rgba(91, 138, 138, 0.06)",
      border: "rgba(91, 138, 138, 0.18)",
      color: "var(--teal-deep)",
    },
    terracotta: {
      background: "rgba(196, 114, 90, 0.08)",
      border: "rgba(196, 114, 90, 0.18)",
      color: "var(--terracotta)",
    },
  } as const;

  return (
    <span
      style={{
        fontSize: 10,
        fontFamily: "var(--font-mono)",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        border: `1px solid ${tones[tone].border}`,
        background: tones[tone].background,
        color: tones[tone].color,
        padding: "5px 9px",
        borderRadius: 999,
        lineHeight: 1,
      }}
    >
      {label}
    </span>
  );
}

const metaLabelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "var(--ink-muted)",
  margin: "0 0 8px",
  fontFamily: "var(--font-mono)",
};
