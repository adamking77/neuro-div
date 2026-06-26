'use client';

import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { MetaLabel } from "./ui";
import { Card } from "./ui/Card";

// Lindsey Mackereth's essay introducing the Compression Framework.
const ESSAY_URL = "https://lindseymackereth.substack.com/p/youre-constantly-in-motionand-nothing";
const DOWNLOAD_HREF = "/skills/spine-finder/download";

const EASE = [0.2, 0, 0, 1] as const;
// DESIGN.md motion: spring for expand/collapse, stiffness 240–300, damping 25–28.
const SPRING = { type: "spring", stiffness: 260, damping: 26 } as const;

const titleStyle: CSSProperties = {
  fontSize: 17,
  fontWeight: 500,
  color: "var(--ink)",
  letterSpacing: 0,
  lineHeight: 1.25,
  margin: 0,
};
const ledeStyle: CSSProperties = {
  fontSize: 15,
  color: "var(--ink-light)",
  lineHeight: 1.7,
  margin: "10px 0 0",
  maxWidth: "60ch",
};
const bodyStyle: CSSProperties = {
  fontSize: 15,
  color: "var(--ink-light)",
  lineHeight: 1.7,
  margin: "0 0 12px",
};

type Stage = {
  num: string;
  title: string;
  preview: string;
  body: ReactNode;
};

const STAGES: Stage[] = [
  {
    num: "01",
    title: "Write freely · pain lens",
    preview: "Answer three raw questions. No polish.",
    body: (
      <>
        <p>
          <strong>These three questions are Lindsey&apos;s, taken straight from her framework.</strong> You answer them raw, written rough on purpose. They&apos;re the same starting material her method asks for.
        </p>
        <ol>
          <li>What tensions or problems keep reappearing across every context in your life?</li>
          <li>Which frictions disturb you that others seem to ignore?</li>
          <li>What do people seek you out for, repeatedly, without you advertising it?</li>
        </ol>
        <p>
          Bring it however you have it: type it out, paste it, upload a doc, or photograph a journal page. The tool won&apos;t interpret or react yet. It&apos;s just taking your unfiltered words in, because everything later is built from them.
        </p>
      </>
    ),
  },
  {
    num: "02",
    title: "Write freely · pull lens",
    preview: "Same questions, opposite lens: what pulls you forward.",
    body: (
      <>
        <p>A second short pass, this time on what pulls you forward. The first pass catches what constrains you; this one catches what drives you.</p>
        <ol>
          <li>What do you keep trying to build, protect, or make possible?</li>
          <li>What can you not stop noticing, even when nobody rewards you for it?</li>
          <li>What keeps pulling you forward, even when you&apos;re exhausted?</li>
        </ol>
        <p>Two lenses, because the strongest direction usually sits where the two agree. Bring it the same way you brought the first.</p>
      </>
    ),
  },
  {
    num: "03",
    title: "See the insights",
    preview: "The tool surfaces a few deep findings about your material.",
    body: (
      <>
        <p>
          The tool reads both passes and does the sorting for you, then shows you a short set of <strong>insights</strong>: a handful of deep, specific observations about your own material, often things you hadn&apos;t put into words yet. Each one shows the exact phrases of yours it came from.
        </p>
        <p>
          Your job here is easy: read them and notice which ring true, and say if any feel off or wrong. You&apos;re reacting, not grading. The sorting that usually stalls people is the part the tool does for you.
        </p>
      </>
    ),
  },
  {
    num: "04",
    title: "See the example spines",
    preview: "A few broad problem domains, with possible spine questions under each.",
    body: (
      <>
        <p>
          From the insights, the tool builds a few <strong>example spine questions</strong>, grouped under broad problem domains, so instead of a blank page you have real things to react to. They&apos;re written as questions pitched larger than yourself, the way the framework defines a spine.
        </p>
        <p>
          You react by feel. From there you either take one that&apos;s yours, or use them as a starting point to write your own (the tool can also dig into one with you if you want to go deeper). Both endings count. The examples are a springboard, not a menu to pick from.
        </p>
      </>
    ),
  },
];

const OUTCOMES: { label: string; text: string }[] = [
  {
    label: "A spine",
    text: "A spine question fits, either one of the examples or one you edited into your own words. You carry it into the rest of Lindsey's framework, where it gets put to work.",
  },
  {
    label: "A starting point",
    text: "No example fits exactly, but they showed you the shape a good spine question takes. You leave to write your own. That's a real finish, not a half-done session.",
  },
  {
    label: "A direction",
    text: "No single question landed, but one problem domain clearly matters to you. You keep it as the area to think about next. The tool never pressures you into an answer you don't have yet.",
  },
];

/** Static wrapper. The scroll-triggered opacity fade was removed: it added no
 * value and left sections invisible (opacity 0) until they were scrolled into
 * view. Kept as a thin layout wrapper so callers can still pass grid styles. */
function Reveal({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={style}>{children}</div>;
}

/** Canonical section card: 36px mono index + content (DESIGN.md). */
function Section({
  index,
  title,
  lede,
  children,
}: {
  index: string;
  title: string;
  lede?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Reveal style={{ display: "grid", gridTemplateColumns: "36px minmax(0, 1fr)", gap: 24, paddingTop: 40 }}>
      <span className="mono" style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-muted)", paddingTop: 4 }}>
        {index}
      </span>
      <div>
        <h3 style={titleStyle}>{title}</h3>
        {lede ? <p style={ledeStyle}>{lede}</p> : null}
        <div style={{ marginTop: 20 }}>{children}</div>
      </div>
    </Reveal>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  const reduce = useReducedMotion();
  return (
    <motion.span
      aria-hidden="true"
      animate={reduce ? undefined : { rotate: open ? 180 : 0 }}
      transition={SPRING}
      style={{ display: "inline-flex", marginTop: 4, color: open ? "var(--teal)" : "var(--ink-muted)" }}
    >
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </motion.span>
  );
}

function StepsAccordion() {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState<number | null>(0);
  const headerRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: React.KeyboardEvent, index: number) {
    const keys = ["ArrowDown", "ArrowUp", "Home", "End"];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    let next = index;
    if (e.key === "ArrowDown") next = Math.min(STAGES.length - 1, index + 1);
    else if (e.key === "ArrowUp") next = Math.max(0, index - 1);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = STAGES.length - 1;
    headerRefs.current[next]?.focus();
  }

  return (
    <div className="sf-acc">
      {STAGES.map((stage, index) => {
        const isOpen = open === index;
        const headId = `sf-acc-head-${index}`;
        const panelId = `sf-acc-panel-${index}`;
        return (
          <div key={stage.num} className={`sf-acc-item${isOpen ? " is-open" : ""}`}>
            <button
              type="button"
              className="sf-acc-header"
              id={headId}
              aria-expanded={isOpen}
              aria-controls={panelId}
              ref={(el) => {
                headerRefs.current[index] = el;
              }}
              onClick={() => setOpen(isOpen ? null : index)}
              onKeyDown={(e) => onKeyDown(e, index)}
            >
              <span className="sf-acc-num">{stage.num}</span>
              <span style={{ minWidth: 0 }}>
                <span className="sf-acc-title">{stage.title}</span>
                <span className="sf-acc-preview">{stage.preview}</span>
              </span>
              <ChevronIcon open={isOpen} />
            </button>
            <AnimatePresence initial={false}>
              {isOpen ? (
                <motion.div
                  key="panel"
                  id={panelId}
                  role="region"
                  aria-labelledby={headId}
                  initial={reduce ? false : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  transition={reduce ? { duration: 0 } : { height: SPRING, opacity: { duration: 0.2, ease: EASE } }}
                  style={{ overflow: "hidden" }}
                >
                  <div className="sf-acc-body">{stage.body}</div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

export function SpineFinder() {
  return (
    <div className="spine-finder">
      {/* Opening — eyebrow + lede, system scale (no oversized hero) */}
      <Reveal>
        <Card border="teal" padding="lg" background="rgba(91, 138, 138, 0.04)" style={{ maxWidth: 720 }}>
          <MetaLabel color="var(--teal-deep)" marginBottom={12}>
            A companion to the Compression Framework
          </MetaLabel>
          <p style={{ fontSize: 15, color: "var(--ink-light)", lineHeight: 1.7, margin: 0, maxWidth: "60ch" }}>
            Spine-Finder works alongside Lindsey Mackereth&apos;s <em>Compression Framework</em>. You write the messy notes her first step asks for. Then, instead of leaving you to stare at them, the tool shows you what it notices and turns it into example spine questions you can take as your own, or use as a starting point to write fresh ones. You write, you decide. The tool does the part in between.
          </p>
        </Card>
      </Reveal>

      {/* What this is */}
      <Section
        index="What"
        title="What this is."
        lede={
          <>
            Lindsey Mackereth&apos;s <strong style={{ color: "var(--ink)", fontWeight: 500 }}>Compression Framework</strong> helps you find your spine: the one question or problem everything else in your life answers to. Spine-Finder helps with one step of her method, the step that stalls some people. It does not replace her framework, so read her essay first. The rest of this page assumes you have.
          </>
        }
      >
        <Card padding="lg" style={{ maxWidth: 720, display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <MetaLabel marginBottom={8}>Start here · the source essay</MetaLabel>
            <p style={{ fontSize: 15, color: "var(--ink-light)", lineHeight: 1.7, margin: 0 }}>
              <strong style={{ color: "var(--ink)", fontWeight: 500 }}>You&apos;re Constantly in Motion—and Nothing Is Taking Form</strong>, by Lindsey Mackereth. The full Compression Framework, in her words. Read it first so the rest of this page has somewhere to stand.
            </p>
          </div>
          <a className="cta-pill" href={ESSAY_URL} target="_blank" rel="noopener" aria-label="Read the essay by Lindsey Mackereth (opens in a new tab)">
            Read the essay →
          </a>
        </Card>

        <div style={{ maxWidth: 720 }}>
          <MetaLabel marginBottom={14}>The step this helps with</MetaLabel>
          <p style={bodyStyle}>
            Her first step asks you to write one messy paragraph about what keeps pulling at you, then let the spine <em>emerge through honest reflection.</em> That assumes you feel your way to the answer first and find the words after. For a lot of people, that&apos;s exactly how it works.
          </p>
          <p style={bodyStyle}>
            <strong style={{ color: "var(--ink)", fontWeight: 500 }}>Many of us who are neurocomplex run the other way: we need a draft in front of us before the feeling can land.</strong> We see patterns across everything, we read what&apos;s behind people&apos;s masks, we can hold a dozen threads at once. That range is exactly why a single answer won&apos;t surface on command. We can&apos;t feel our way toward something that isn&apos;t on the page yet. So &ldquo;reflect until it emerges&rdquo; leaves us staring at a blank paragraph. It&apos;s the same wall we hit everywhere else: no concrete, proven method built for how we actually think.
          </p>
          <p style={bodyStyle}>
            What we are good at is <strong style={{ color: "var(--ink)", fontWeight: 500 }}>recognition</strong>. Put real candidates in front of us and we know right away: wrong, closer, that one. We weren&apos;t failing the step. There was just nothing there to react to.
          </p>
          <p style={{ ...bodyStyle, margin: 0 }}>
            That is the gap this fills. Spine-Finder builds the candidates so our recognition has something to push against. You still supply the raw material, and you still decide what&apos;s right. The only part it takes off your hands is the one that stalls us: producing an answer from a blank page.
          </p>
        </div>
      </Section>

      {/* How to use it */}
      <Section
        index="How"
        title="How to use it."
        lede="Four steps. You write in the first two. The tool analyzes and drafts through the middle, and you react to what it finds; you never grade its work. Open any step to read it."
      >
        <StepsAccordion />
      </Section>

      {/* What you walk away with */}
      <Section
        index="End"
        title="What you walk away with."
        lede="You're never pushed to force a final answer. A session can end three ways, and all three count as finished."
      >
        <dl style={{ maxWidth: 720, margin: 0, borderTop: "1px solid var(--rule)" }}>
          {OUTCOMES.map((outcome) => (
            <div
              key={outcome.label}
              style={{
                display: "grid",
                gridTemplateColumns: "140px minmax(0, 1fr)",
                gap: 24,
                padding: "20px 0",
                borderBottom: "1px solid var(--rule)",
              }}
            >
              <dt>
                <MetaLabel color="var(--teal-deep)" marginBottom={0}>{outcome.label}</MetaLabel>
              </dt>
              <dd style={{ margin: 0, fontSize: 15, color: "var(--ink-light)", lineHeight: 1.7 }}>{outcome.text}</dd>
            </div>
          ))}
        </dl>
      </Section>

      {/* Context profile */}
      <Section index="Context" title="Sharper results, more context.">
        <Card padding="lg" style={{ maxWidth: 720 }}>
          <p style={bodyStyle}>
            Spine-Finder works from two short passes of writing. It works <strong style={{ color: "var(--ink)", fontWeight: 500 }}>noticeably better</strong> when the agent already knows how your mind runs: where you freeze, what pulls you, how you process. The more it knows you, the deeper and more recognizable its insights get.
          </p>
          <p style={{ ...bodyStyle, margin: 0 }}>
            That&apos;s what the rest of <strong style={{ color: "var(--ink)", fontWeight: 500 }}>NeuroDiv OS</strong> is for. You can build a full <strong style={{ color: "var(--ink)", fontWeight: 500 }}>context profile</strong> (a reusable document about how you think) and feed it to this skill and any other agent or tool you use. Build it once; every session after starts already knowing you.{" "}
            <a className="sf-link" href="https://neuros.gokart.studio/">
              Build your context profile →
            </a>
          </p>
        </Card>
      </Section>

      {/* Download */}
      <Section
        index="Get it"
        title="Run it in your own agent."
        lede="Spine-Finder is a downloadable skill: one file that turns any capable AI agent into the scaffold described above. It runs the same four steps and keeps you as the judge throughout."
      >
        <Card padding="lg" style={{ maxWidth: 720, display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <MetaLabel marginBottom={8}>The skill file</MetaLabel>
            <p style={{ fontSize: 15, color: "var(--ink-light)", lineHeight: 1.7, margin: 0 }}>
              <strong style={{ color: "var(--ink)", fontWeight: 500 }}>SKILL.md</strong>. The complete Spine-Finder process, self-contained. Works in any agent that accepts a skill or system file. No setup, no account.
            </p>
          </div>
          <a className="cta-pill" href={DOWNLOAD_HREF} aria-label="Download the Spine-Finder skill file">
            Download SKILL.md ↓
          </a>
        </Card>

        <Card padding="lg" style={{ maxWidth: 720 }}>
          <MetaLabel marginBottom={16}>How to use it</MetaLabel>
          <ol style={{ margin: 0, paddingLeft: 20, fontSize: 15, color: "var(--ink-light)", lineHeight: 1.7, listStyle: "decimal" }}>
            <li style={{ marginBottom: 10 }}>
              <strong style={{ color: "var(--ink)", fontWeight: 500 }}>Download</strong> the file above.
            </li>
            <li style={{ marginBottom: 10 }}>
              <strong style={{ color: "var(--ink)", fontWeight: 500 }}>Read Lindsey&apos;s essay first</strong> if you haven&apos;t. This assists one step of her framework and only makes sense alongside it.
            </li>
            <li style={{ marginBottom: 10 }}>
              <strong style={{ color: "var(--ink)", fontWeight: 500 }}>Load it into your agent.</strong>
              <ul style={{ margin: "8px 0 0", paddingLeft: 18, listStyle: "disc" }}>
                <li style={{ marginBottom: 6 }}>
                  <strong style={{ color: "var(--ink)", fontWeight: 500 }}>Claude Code / claude.ai:</strong> place the file in your skills directory (e.g. <code>~/.claude/skills/spine-finder/SKILL.md</code>), or paste its contents at the start of a chat.
                </li>
                <li style={{ marginBottom: 6 }}>
                  <strong style={{ color: "var(--ink)", fontWeight: 500 }}>Any other agent (ChatGPT, Gemini, a custom GPT, etc.):</strong> paste the full contents into the system prompt or the first message, and tell it to follow the skill.
                </li>
              </ul>
            </li>
            <li style={{ marginBottom: 10 }}>
              <strong style={{ color: "var(--ink)", fontWeight: 500 }}>Start the session.</strong> Say something like <em>&ldquo;run Spine-Finder with me.&rdquo;</em> The agent will ask for your first pass. You can type it, paste it, upload a doc, or photograph a journal page.
            </li>
            <li>
              <strong style={{ color: "var(--ink)", fontWeight: 500 }}>Go at your own pace.</strong> You write the first two steps; the agent does the middle; you judge everything it produces. Stop whenever you have something to sit with.
            </li>
          </ol>
        </Card>
      </Section>
    </div>
  );
}
