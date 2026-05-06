# ND Process Framework

*Working document — updated as the idea develops.*

---

## What this is

A suite of tools and skills for neurodivergent people using AI — an overlooked category that nobody is building for seriously.

ND people over-index on early AI adoption because they've spent their whole lives building compensatory systems. They're already wired to use tools creatively to close gaps. What they haven't had is tools built *for* them rather than *despite* them. The demand is there. The gap is real.

### The dual format

Each tool in the suite ships in two versions:

**Web app** — clean interface, no technical setup required. Answer questions, read the formatted output, download the file. The on-ramp for people just starting with AI or who don't have an agentic setup.

**Claude Code skill** — downloadable, plugs into any agentic workflow. More powerful, more personalized, integrates with whatever context the person has already built (vault, memory, AI COO, CLAUDE.md). The power path for people who've built out their AI environment.

Same methodology. Two surfaces. Not two products — one product distributed two ways.

### The suite

1. **Category Scout** *(exists — proof of concept)* — category design and distribution strategy, ND-aware. Shows the pattern works: structured intake → research → formatted output → agent brief → downloadable artifact. Every other tool follows the same shape.
2. **ND Context Builder** *(next)* — the foundation. Builds the persistent profile everything else depends on.
3. **ND Process Designer** — goal + profile → trigger-based process doc + agent brief. Any goal, not just distribution.
4. **ND Session Start** — daily check-in, one move surfaced, nothing else.
5. **ND Reflection** — end of session/week, updates the profile over time.

### What makes this different from other productivity / AI tools

- Starts with context building — not generic, not one-size
- Assumes variable bandwidth — not consistent daily execution
- Invitation-based throughout — not demand-based
- Plain language — no jargon, no terms that require decoding
- Persistent context that travels with the user across sessions and tools
- Both web and native agentic versions — meets people where they are

---

**Near-term:** Refine Category Scout's Strategy section into an actual process output (specced — ready to build).

**Longer-term:** Build out the ND Context Builder as the next tool, then the rest of the suite.

---

### Category Scout's evolving identity

Category Scout started as a category design research tool with an ND-aware strategy output. What it's becoming: a distribution strategy tool built specifically for neurodivergent founders — someone with a real business idea who needs to get it in front of the right people in ways that work for how their brain operates.

The research phases serve that. The strategy sections serve that. The agent brief serves that. It all points at one specific person with one specific problem. That's a cleaner, more honest product than "category design tool with ND features bolted on."

It sits naturally as the most developed, most domain-specific tool in the suite — the proof of concept that the methodology works before it gets generalized into the Context Builder and everything else.

**Open architectural question:** Does Category Scout belong inside the ND suite as Tool 1, or does it stand alone as its own product that shares methodology with the suite? Decide with a clear head.

---

## The core insight

Most productivity tools are built on **obligation-based motivation**: you decided to do X, so now you do X. ND brains don't run on obligation — they run on interest, novelty, urgency, and challenge. A tool that doesn't account for this becomes another source of shame when you can't follow through on what felt obvious yesterday.

The methodology this framework is building around: **ND-compatible process design** — systems that work with how the brain actually operates, not against it.

---

## What Category Scout already does well (don't lose this)

The Agent Brief export is genuinely sophisticated PDA-aware design:

- Explicit PDA framing — "invitations, not assignments"
- Session check-in: capacity, mode (Thinking / Deciding / Executing), what changed
- Content matched to stated mode — nothing extra until current move is closed
- Execution shape: batched bursts + ambient quiet, not a daily queue
- One thing visible at a time — next move only surfaces after current is closed
- Hard constraints block the receiving agent cannot override
- Evolution protocol: log outcomes, flag staleness, preserve founder edits

Constraint inputs are also right: outreach tolerance, social posting tolerance, channel avoidances — declared limits, not soft preferences.

---

## What's missing in Category Scout's Strategy section

### The research phase gate creates demand pressure
Strategy locks until 4+ phases complete (including 3 specific required ones). For PDA, prerequisites that stand between you and "the real thing" are a common avoidance trigger.

**Fix:** Reframe phases as a buffet. Allow strategy generation from any 2+ phases with a visible quality signal ("confidence: partial / strong"). Required phases become suggestions with rationale, not gatekeepers.

### The form captures what you won't do — not what pulls you
Missing inputs (in plain language — no jargon, no terms that require decoding):

**What you're already doing to get your work out there**
What have you tried? What happened? What made you stop?
*(Prevents the strategy from recommending things that have already failed)*

**What kinds of tasks make you want to disappear**
Not just where you show up — what you actually have to do. Replying to people? Formatting things? Getting on calls? Being "on" for extended periods?
*(More specific than channel avoidances — shapes which moves in the process are low-cost vs. high-cost)*

**When you actually feel like working on this**
Not when you think you should. When do you actually sit down and go?
*(Determines when process moves happen, not just what they are. "Weekly capacity" is a number; this is the real pattern.)*

**When you know you'll be unavailable**
Burnout periods, recovery days, times when nothing gets done no matter what. These are protected — nothing gets scheduled here.
*(Currently the system treats quiet as "strategy going stale." For ND people, silence is often planned rest, not abandonment.)*

~~**Tools you're already using** — removed.~~ Don't add a tools input field. Put this on the agent side instead (see Agent Brief section below). Fewer inputs is a feature for ND users, not a gap.

**Who you're trying to reach, and what's going on for them when they find you**
What problem are they living with? What have they already tried? What makes them ready to pay attention?
*(The bridge between your distribution and the right buyer — their recognition moment, not just your constraints.)*

### "30-Day Sequence" implies 30 days of obligation
Even framed as sprints, the time-bound label is a PDA trigger. Implies you're already behind if you haven't started.

**Fix:** Rename to **"Next Activation Window"** — a menu of moves available when conditions are right, not a sequence starting now.

### Session check-in has a compliance undertone
"What's your capacity today?" reads as "how much can I ask of you?"

**Fix:** Change to "What's actually available today?" Add a fourth valid mode: **Not today** — explicitly dignified, not a failure state.

### The Agent Brief needs a tool audit instruction

Don't add a tools input field to the form. Instead, the Agent Brief instructs the receiving agent to handle this itself:

> Before planning execution, audit what tools and systems you have access to or the user has already connected. Check your existing context first — memory, prior conversations, any connected integrations. If you can determine what's in place, use it directly. If you can't, ask the user — one question at a time, not a list.

An agent that already knows the user won't need to ask at all. A new agent gets one targeted question. The user never fills out a tools form.

### 30-Day Sequence — keep the name, improve the rendering

The section is useful as-is. It stays. What changes: it renders with the new structured format (summary, bulleted moves with effort levels and rationale, callouts) rather than prose paragraphs. The name "30-Day Sequence" is fine.

### The strategy output formatting needs a cleanup pass

The existing strategy output is close — it just needs formatting consistency and more depth to do the job without a separate readable view.

**Prompt changes** (how Claude is instructed to write each section):
- Consistent heading level across all sections — no mixing sizes
- Suggestions as bulleted lists, not prose paragraphs
- Check marks for anything actionable
- Each recommendation includes a brief "why this fits you" — connected to the research phases or stated constraints, not generic advice. Example: "based on how your audience describes this problem..." not "consider this channel because it works well."

**Rendering changes** (how the app displays the output):
- Markdown renders properly — headings, bullets, check marks display as formatted text, not raw symbols
- Markdown tables for structured comparisons (channel fit, message angles, effort estimates) — renders natively, no new components needed
- Custom visual components (timeline, ranked visual lists) — defer unless a table genuinely can't do the job

**The readable view doesn't need to be a separate tab.** If the formatting and content depth are right, the existing strategy panel in the app is the readable view. That simplifies the scope significantly.

### Why the Intelligence section looks better (and how to match it)

The Intelligence brief — the executive summary, scorecard cards, colored callout blocks — works because it's not rendering markdown. Claude returns structured JSON with typed fields (`grade`, `rationale`, `callout type`), and the app renders those with dedicated React components. Semantic colors (teal = good, gold = caution, terracotta = concern) are applied automatically based on data type. The visual quality comes from the data shape matching the renderer.

The Strategy section returns markdown prose into a textarea. That's the root of the inconsistency.

**Two paths forward:**

**Path A — Better prompt, same renderer**
Instruct Claude to use consistent H3 headings, bullet lists, check marks for actionable items, and a "Why this fits you:" line after each recommendation. Gets ~70% of the way there. Fast, no new components. Still limited by what markdown-in-a-textarea can look like.

**Path B — Structured data + dedicated components** *(matches Intelligence section quality)*
Claude returns JSON for each section: a summary sentence, an array of recommendations each with text + rationale + effort estimate, and callouts typed as `insight` / `warning` / `opportunity`. The app renders those with styled components — same visual language as the Intelligence brief. More engineering work, but this is what actually produces the quality Adam is pointing at as the reference.

Path A is the quick improvement. Path B is the right answer if the goal is visual parity with the Intelligence section.

**Decision: read-only.** Strategy output is a read-only view — no textarea editing. This resolves the tension completely and makes Path B the clear choice.

### Strategy section data schema

Each of the 6 sections (Positioning, Channel Plan, Message Angles, Asset Ideas, Experiments, Next Activation Window) returns structured JSON:

```
summary        — 1-2 sentences, the "so what" for this section
recommendations — array of:
    text       — the recommendation
    why        — why this fits this specific person (from constraints + research)
    effort     — low / medium / high
    actionable — true (check mark) or false (bullet / informational)
callouts       — array of:
    type       — insight / warning / opportunity
    text       — the callout content
```

Plus a scorecard at the top of the Strategy view — same 4-column card grid as the Intelligence executive summary — grading the overall strategy across key dimensions (channel fit, message clarity, asset leverage, execution realism).

**Components needed:** StrategyScorecard (mirrors IntelligenceScorecard), StrategySectionCard (renders summary + recommendation list + callouts). The color system, section header pattern, and callout block style are already established in the Intelligence components — this extends the existing pattern, not a new one.

---

## What the output actually looks like

Two layers, clean separation.

### Layer 1 — The readable view (in-app)

A separate tab or side panel. Nicely formatted. Comfortable to read through once before you do anything else. Basic visuals only where they actually help — a map of available moves, maybe a simple indicator of which research phases contributed. Not a dashboard, not decoration. Just enough to orient yourself.

The PDF idea is out. A PDF is a dead artifact — polished but not feedable to an agent, not updatable, not living.

### Layer 2 — The markdown file (the working artifact)

This is what matters. You grab it, hand it to your agent, and the agent creates whatever you need in whatever tools you use — Notion tasks, calendar events, a weekly rhythm. The agent does that translation. The app just produces the file cleanly.

**The markdown has to be agent-readable, not just human-readable.** Prose strategy sections aren't enough. The agent needs to parse and act on it. So moves are in a consistent format:

- **Trigger** — the condition that makes this available
- **Action** — the single thing to do
- **Done signal** — how you know it's finished (explicit, because ND brains often can't tell when to stop)
- **Effort estimate** — real time, not abstract "tasks"
- **Status** — available / in progress / done / dropped

The file also includes the tool integration info — which tools, which databases — so the agent can create a Notion task or calendar event without asking again.

The markdown file is the handoff. The agent is the executor.

### What the distribution process section looks like

Not a prose strategy document. A menu of moves organized by the condition that makes them available:

> **When you have 2+ hours and feel pulled to make something:** [move]
> **When you have 30 minutes and low energy:** [move]
> **When you want something running in the background without active effort:** [move]

Each move has its trigger, action, done signal, and effort estimate. The agent picks from the menu based on your stated mode and capacity at session start — not based on a calendar.

### Measurement (plain language)

Not "did you complete your tasks today." Instead:

- Of the times you sat down to work on this, how often did you actually get going vs. avoid it?
- Where did you stop? What was happening right before?
- Is anything you built earlier still bringing in attention without you doing anything?
- When you did work on this, did it feel forced or did it just happen?

Weekly check-in (one question): *What happened this week that you didn't plan for?*

### The not-doing list

Every output includes an explicit list of things you're not doing — not a disclaimer, a real list. Makes the boundary visible so the "yes" has room.

---

## The core design principle: plain language throughout

Every label, every question, every output section should read like something a person would actually say out loud. No invented terms. No framework jargon. If someone has to stop and decode what a word means, that's already a friction point that could trigger avoidance.

This applies to the inputs, the strategy sections, the process moves, and the agent brief. The system should feel like talking to someone who already knows you — not filling out a form designed for someone else.

---

## Why Claude specifically could matter here

The gap for ND adults isn't intelligence or capability. It's that every system they encounter was designed by neurotypical people, for neurotypical execution patterns: consistent daily effort, obligation-based motivation, linear progress. The tools assume a brain that works a certain way, and when yours doesn't, the tool concludes you've failed rather than that it was the wrong fit.

What this framework assumes instead: bursts beat schedules. Interest beats obligation. Permission structures are as important as action plans. Rest is planned, not apologized for.

Claude specifically (versus another app or tool) can hold a person's full context — their patterns, dead zones, past attempts, operating rhythm — and work from that without them having to re-explain themselves every session. Not just executing tasks, but knowing the person well enough to meet them where they actually are. That's the gap-filler.

If this gets validated through real use — starting with Adam as the first test case — it becomes something other people can pick up and adapt. Not a product per se. A demonstrated approach.

---

## The ND Skill Suite

Not one skill — a suite of focused skills that stack. Each works on its own. Together they compose into a complete operating system for ND people using AI.

### Skill 1 — ND Context Builder *(the foundation)*

The intake skill. The agent interviews the user about their specific ND experience — not generic traits, but how those traits actually show up in their work. Outputs a persistent markdown profile they own and can hand to any AI agent. Everything else in the suite builds on this.

**Format:** A deliberate mix of structured and open-ended questions — not one or the other throughout.

- **Structured / recommended-answer** for questions where the user might not have language for their experience yet. Gives them vocabulary to confirm, reject, or build from rather than leaving them with a blank.
- **Open-ended** for questions where their specific words are the point — how they'd describe their work, what a good day actually feels like, what they've tried and what happened. You can't give options for these without putting words in their mouth. Their actual language is what makes the output genuinely personal.
- **Mix** for questions with common patterns but real variation — offer options first to reduce blank-page friction, then "anything else that doesn't fit these?" So they get the efficiency of structured without losing specificity.

| Question | Format |
|---|---|
| Which traits apply and how they show up | Structured — gives vocabulary without assuming |
| What causes shutdown | Mix — options first, then open space |
| What activates / pulls you in | Open — their words matter here |
| Relationship with time and scheduling | Structured — common patterns are well-defined |
| What a good working day feels like | Open — nobody else can describe this for them |
| What they've tried and what happened | Open — the story is the data |
| How they prefer to receive information | Structured — clear options exist |
| What support conditions help | Mix — common ones listed, space to add their own |

**What it covers:**
- Which ND traits apply and how they actually manifest (not everyone with ADHD has the same experience)
- What pulls them in naturally — interest, activation patterns, hyperfocus areas
- What causes shutdown or avoidance — specific task types, environmental factors, social demands
- How they know when they're in a good working state
- Their relationship with time, scheduling, and deadlines
- What they've tried before and what happened
- How they prefer to receive information (format, pace, length, level of detail)
- What support conditions help (body doubling, music, timers, movement, etc.)

**Output:** A persistent markdown document — their ND profile — that they keep, update, and hand to any agent as part of their context setup. Like a more personal, more specific version of a CLAUDE.md.

**Why this is the most important skill:** Most ND people who try AI tools give up because the tool doesn't know them and they have to re-explain themselves every session. Starting with a structured intake that builds lasting context solves that at the foundation.

---

### Skill 2 — ND Process Designer

Takes the ND profile + a specific goal and builds a trigger-based process for that goal. Outputs a process document + agent brief. Research is an optional module, not required. This is the Category Scout methodology extracted and generalized — works for any goal, not just distribution strategy.

---

### Skill 3 — ND Session Start

Short. Used at the beginning of any work session. Checks in (what's actually available today, what mode, what changed since last time), surfaces one relevant move from whatever process is active. Nothing else until that move is closed or declined. Could be used daily or whenever they sit down.

---

### Skill 4 — ND Reflection

End of session or week. What activated, what froze, what compounded without effort. Updates the persistent profile over time — learning from real use, not just intake answers. Flags when a process needs regenerating rather than treating quiet as failure.

---

### How they compose

Profile (Skill 1) → feeds Process Designer (Skill 2) → feeds Session Start (Skill 3) → Reflection (Skill 4) feeds back into the profile.

Someone can start with just the Context Builder and immediately have something useful. The suite grows with them.

---

## The ND Process Skill (longer-term)

### What it is

A Claude Code skill that any ND person can install and run inside their existing AI environment. It works *with* whatever context they've already set up — vault, memory, AI COO, CLAUDE.md — so it reads existing knowledge before asking anything. It only asks about genuine gaps.

### Why a skill, not another app

A web app needs fresh context every session. A skill integrates with what already exists. If someone has spent time building an AI brain or an AI COO, the skill reads that context before the first question. The intake conversation becomes 10-15 exchanges instead of starting from scratch.

### What the skill does

1. **Load existing context** — reads vault, memory, CLAUDE.md, whatever's available
2. **Capability intake** — asks targeted questions to fill gaps only. Covers:
   - ND profile (PDA, ADHD, autism, combination — how it actually manifests for them)
   - Operating system (peak conditions, dead zones, energy patterns)
   - Interest inventory (what pulls them vs. what they endure)
   - Friction map (specific activity types that cause shutdown)
   - Existing systems (what's already working, what isn't)
3. **Process design** — builds a trigger-based process tailored to their actual profile
4. **Output** — a living process document + agent brief they keep and use across sessions

### What the skill doesn't do (to avoid bloat)

- It doesn't run deep research (that's a separate trigger if needed)
- It doesn't try to be a full productivity system
- It doesn't require any specific AI platform — works with Claude, Codex, whatever
- It doesn't regenerate from scratch each session — it hands off a living document the agent runs from

### The output artifact

A single markdown document with:
- Capability profile (ND-specific, not generic)
- Trigger-based process moves (matched to their energy patterns)
- Permission structure (explicit not-doing list)
- Measurement system (ND-native metrics, not completion rates)
- Agent brief (instructions for the receiving agent on how to work with this person)
- Outcomes log (updated over time)

---

## The sequence

1. **Fix Category Scout's Strategy section** — refine the existing app's outputs into an actual ND process. This validates what works.
2. **Extract the methodology** — once proven in Category Scout, extract the domain-agnostic core.
3. **Build the skill** — packages the validated methodology, strips category-design specifics, makes it applicable to any goal.

---

## Category Scout refinement — spec status

**Locked. Ready to build from.**

Form inputs to add (plain language, no jargon):
- What have you already tried to get your work out there? What happened?
- What kinds of tasks make you want to disappear?
- When do you actually feel like working on this?
- When do you know you'll be unavailable?
- Who are you trying to reach, and what's going on for them when they find you?

Form inputs removed:
- Tools field — agent handles this via context audit, not user input

Strategy output:
- Structured JSON from Claude → dedicated rendering components (mirrors Intelligence section)
- Scorecard at top of strategy view
- Each section: summary + bulleted recommendations with "why this fits you" rationale + typed callouts (insight / warning / opportunity)
- Read-only — no textarea editing

Agent Brief additions:
- Tool audit instruction: check existing context first, ask one question if needed, never a list
- Session check-in language: "what's actually available today?" — four valid modes including "not today" as a dignified option
- Dead zones: treat quiet as planned rest, not a drift signal

30-Day Sequence: keep the name, apply new structured rendering.

**Quality bar to hit at build time:** the "why this fits you" rationale in each recommendation must connect to the person's actual stated constraints and research findings — not generate plausible-sounding generic justifications. This is a prompt quality test, not a spec gap.

---

## Open threads

- Should the ND Process Skill trigger research automatically, or offer it as an optional module?
- Does the skill replace the Agent Brief export from Category Scout, or complement it?
- How does the skill handle someone with no existing AI context set up? Needs a fallback intake path.

---

*Last updated: 2026-05-05*
