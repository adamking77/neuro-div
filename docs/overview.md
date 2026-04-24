# Category Scout — Overview

Living reference for what this webapp is, who it's for, and how it works. Updated as the app evolves.

---

## Purpose

Category Scout is a distribution-strategy tool for PDA-neurodivergent founders. It takes a problem statement and produces (1) a grounded research dossier across six strategic phases and (2) a PDA-aware distribution strategy that works *around* the founder's constraints rather than pushing against them.

The tool assumes the user's craft is already strong. The gap it addresses is distribution — specifically for people who cannot sustain high-contact, networking-heavy, content-treadmill strategies without sacrificing the core work.

---

## Who it's for

Primary users: Adam King (founder, GenZen) and Jason. Shared profile:

- **PDA** (Persistent Demand Avoidance) — explicit demands trigger avoidance; invitations and optional cues don't
- **Unifocused** — can go deep on one thing, can't context-switch without real cost
- **Thinkers, not networkers** — distribution can't depend on relational hustle
- **Craft-first operators** — the quality of the work is the product; marketing can't degrade it
- **Low trust in conventional playbooks** — bad experiences with mainstream "growth" advice

The tool is explicitly *not* for founders comfortable with outreach volume, content cadence demands, or events-and-networking distribution.

---

## What it does

Two stacked layers:

### Research Layer

Runs six parallel Exa neural searches covering the strategic surface of a problem:

1. **Problem Cartography** — how the problem is talked about, by whom, in what language
2. **Adjacent Solutions** — what exists near the problem space
3. **Solution Landscape** — direct competitors and alternatives
4. **Competitive Positioning** — how incumbents frame themselves
5. **Evidence Mining** — proof points, testimonials, case studies, pain evidence
6. **Channel Discovery** — where the audience already is

Output: a dossier with per-phase results (title, source, publication date, relevance score, highlights).

### Strategy Layer

Takes research output + founder constraints, runs a two-phase pipeline:

1. **Exa deep-reasoning** — builds a grounded dossier from the research + constraints (audience signals, positioning edges, low-contact channels with fit/evidence/caution, message patterns, asset directions, experiment levers, risks)
2. **Claude Sonnet 4 (tool use)** — drafts a six-section distribution strategy against the grounded dossier

Six sections:

- **Positioning** — the anchor; who this is for and what claim it makes
- **Channel Plan** — where to show up, in what form, with what frequency
- **Message Angles** — what to say, framed for the audience
- **Asset Ideas** — concrete things to make
- **Experiments** — small bets to test assumptions
- **30-Day Sequence** — the action output; what happens when

Plus: warnings (PDA guardrails surfaced by the model), citations (per-section evidence trail), and edit-in-place refinement per section.

---

## Design principles

1. **Low-contact is a hard constraint, not a preference.** The tool rejects strategies that require sustained outreach, networking, or content cadence.
2. **Create-once over do-again.** Strategies favor one-shot assets that compound over recurring effort.
3. **Grounded, not generic.** Every section cites real sources. The model cannot freestyle advice untethered from research.
4. **Edit, don't overwrite.** Fingerprint-based dirty-state tracking protects user edits from regeneration clobber.
5. **Neurotype-aware prompt design.** Claude's system prompt explicitly encodes PDA founder realities — unifocus, demand avoidance, craft-over-sales orientation, create-once patterns.

---

## How it works (technical)

- **Frontend:** React 19 + TypeScript + Vite + Tailwind v4, HeroUI components, Framer Motion animations, Phosphor icons
- **Hosting:** Vercel (serverless functions for API routes)
- **Search:** Exa neural search + deep-reasoning mode
- **LLM:** Anthropic Claude Sonnet 4 via structured tool-use
- **Persistence:** none today — in-session React state only; markdown download is the only export mechanism
- **Tests:** Vitest suite covering readiness logic, fingerprinting, prompt building, output parsing

### Directory map

- `src/` — React frontend (`StrategyView.tsx` is the largest component)
- `src/lib/` — shared utilities (`strategy.ts`, `strategy-api.ts`)
- `api/` — Vercel serverless routes (`exa-search.ts`, `strategy-draft.ts`)
- `api/_lib/` — core API logic (`strategy-api.ts`)
- `tests/` — Vitest suite
- `docs/` — plan documents, this overview

---

## Current views

- **Research / Report** — enter a problem statement, run the six phases, view per-phase results with citations and highlights
- **Strategy** — configure founder constraints, generate and refine the distribution strategy with six editable sections

Views are toggled in `App.tsx` (single-page app; no router).

---

## Status

- Live on Vercel
- `ANTHROPIC_API_KEY` and Exa credentials configured in Vercel env
- Stable enough to use end-to-end

### Open threads

- Live test: run a real strategy generation end-to-end on Vercel; validate Exa Research API + Anthropic produce useful output for an actual problem statement
- Exa Research timeout behavior: 80 polls × 2.5s = ~3.3min max — watch for this on long-running strategies

---

## Roadmap

Planned work tracked in separate plan documents:

- **[strategy-ui-plan.md](./strategy-ui-plan.md)** — Strategy section UI/UX improvements (copy, fields, button placement, structured assets input, output layout restructure, agent brief export)

### Upcoming (not yet designed)

- **Agent Brief export** — second artifact at the Strategy level, written for AI consumption. Lets each user feed their strategy into their own agent ecosystem (Steve, Claude Code, or whatever) for ongoing engagement — Category Scout produces the portable strategy, the user's agent handles daily integration.
- **Save / history layer** — 30-day retention of strategy generations; decision pending on localStorage vs. Supabase vs. hybrid

---

## Design constraints worth preserving

- No daily-dashboard-in-the-app — the tool produces portable artifacts; ongoing engagement happens in the user's existing AI ecosystem
- No prescriptive weekly rhythm in output — Adam runs 4-week rotations, Jason doesn't; output describes execution *shape*, not specific weekly themes
- No "growth hacking" defaults — every strategy must remain compatible with the PDA / unifocus / low-contact profile
