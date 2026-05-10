# Plugin Workflows — Plan

Status: Deferred. Build after Skills tab is established and individual skills have traction.

---

## What plugins are (vs skills)

A **skill** is a markdown instruction set. It tells an AI how to behave. No infrastructure required — users copy it, paste it in, done.

A **plugin** is an MCP server. It gives an AI actual callable tools — functions that run code, hit external APIs, return structured data. Users install it once (`claude mcp add`), set their own API keys as environment variables, and those tools become available in every Claude conversation.

The key difference: skills shape behavior. Plugins add capability.

For these workflows, plugins make sense because the value comes from the external APIs (Exa for research, an LLM for synthesis) — not just from how Claude reasons. A skill alone can't run a 6-phase Exa search. A plugin can.

---

## Distribution model

Plugins live on the Skills tab alongside individual skills, in a separate "Workflow Plugins" section. Each plugin entry includes:

- What the workflow does (one sentence)
- What API keys are required
- Install command (`claude mcp add neurodivos-[name] ...`)
- Link to setup docs

Users bring their own keys. No usage goes through our infrastructure.

---

## Planned workflows

---

### 1. Idea Validator

**What it does:** Takes a problem statement and known players, runs 6-phase Exa research, synthesizes findings into a signal verdict with strongest/weakest evidence, outputs a dossier ready to pass to any AI for category assessment.

**Equivalent to:** Category Scout tool, end-to-end.

**API keys required:**
- `EXA_API_KEY` — for all 6 research phases

**Tools exposed to Claude:**
- `run_idea_validation(problem, knownPlayers)` — runs all 6 phases, returns structured results per phase with synthesis
- `get_phase_results(phaseId)` — retrieve individual phase output
- `export_dossier()` — returns formatted markdown dossier

**What the user says to Claude:** "Validate this idea: [problem statement]"

**Claude's role:** Orchestrates the tool calls, interprets the signal verdict, surfaces the aha moments, asks if the user wants to continue to distribution strategy.

**ND design note:** One entry point, one question from Claude ("What's the problem you're testing?"), no manual phase management. Re-entry is frictionless — Claude can call `get_phase_results` to resume a prior run.

---

### 2. Launch Planner

**What it does:** Takes a validated problem, an audience description, and the user's constraints (team size, budget, energy patterns, channel avoidances), generates a low-contact distribution strategy with channel recommendations, content plan, and a 90-day roadmap. Produces an agent brief ready to hand off for execution.

**Equivalent to:** Distribution Strategy + Intelligence Brief + Agent Brief, end-to-end.

**API keys required:**
- `EXA_API_KEY` — for market and channel research during strategy generation
- `ANTHROPIC_API_KEY` or `KIMI_API_KEY` — for synthesis (user's own key, not ours)

**Tools exposed to Claude:**
- `run_strategy_research(problem, audience, constraints)` — Exa research pass for market + channel fit
- `generate_strategy_draft(researchResults, constraints, ndProfile)` — LLM synthesis into structured strategy
- `generate_intelligence_brief(problem, audience, researchResults)` — 7-section market brief
- `build_agent_brief(strategyDraft, ndProfile)` — produces PDA-aware handoff instructions

**What the user says to Claude:** "Build a launch plan for [problem statement]"

**Claude's role:** Asks for audience and constraint inputs, calls tools in sequence, presents outputs section by section (not all at once), offers the agent brief at the end.

**ND design note:** Claude surfaces one section at a time rather than dumping the full strategy. The agent brief at the end closes the loop — user can immediately hand it back to Claude to start executing.

---


## Architecture notes

**Stack:** Node.js MCP server using the `@modelcontextprotocol/sdk` package. Each plugin is a standalone npm package users install globally or locally.

**State:** Stateless per call — no persistence required for either workflow. Results are returned to Claude and the user decides what to keep.

**Error handling:** All tools return structured errors with plain-language messages. API key missing → tell the user exactly which variable to set and how. Rate limit hit → tell the user to wait, offer to resume. Never expose raw API errors.

**Fabrication boundary:** If Exa returns zero or insufficient results for a phase, the tool must return that phase as explicitly incomplete — not empty, not silently skipped. Claude must surface this to the user ("Phase 03 returned no results — this lens is weak") rather than filling the gap with inference presented as evidence. This matches the skill's hard rule: never invent sources, companies, data points, or URLs. A dossier with honest gaps is more useful than a dossier that looks complete.

**Install UX target:**
```
claude mcp add neurodivos-idea-validator npx @neurodivos/idea-validator --key EXA_API_KEY=your_key
```

---

## Sequencing

Build in this order:

1. **Idea Validator** — logic already exists in the web app, just needs MCP wrapping; smallest external dependency (Exa only)
2. **Launch Planner** — larger scope, depends on both Exa and an LLM synthesis step; build after Idea Validator is proven

---

## Open questions before building

- Do plugins live in this repo as packages, or a separate monorepo?
- How do we handle users who have both the web app and the plugin — should they share state?
- Version the plugin API from day one — once users install and depend on tool signatures, breaking changes are painful.
