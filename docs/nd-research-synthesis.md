# ND Research Synthesis

Grounded in the IntelliZen `ND Research Foundation` project:

- `case-2026-001` — PDA: what works and what backfires
- `case-2026-002` — ADHD: executive function, motivation, and where tools fail
- `case-2026-003` — autistic burnout: patterns, triggers, recovery
- `case-2026-004` — ND people using AI: what fails, what they've adapted
- `case-2026-005` — ND productivity frameworks: what has actually lasted

This document is the bridge between that research and the Category Scout / ND suite build.

## Why this research exists

The IntelliZen project is not background reading. It is the evidence base for the ND tool suite:

- what breaks for ND people in real execution contexts
- what conventional productivity and AI tools get wrong
- what patterns consistently help across PDA, ADHD, autism, and combined presentations
- what the Context Builder, Strategy layer, and Agent Brief should and should not do

## Stable principles

These are the strongest cross-case findings. Treat them as build rules, not inspiration.

### 1. The tool must reduce demands, not monitor compliance

From the PDA research:

- avoidance is anxiety-driven and protective, not oppositional
- reminders, streaks, "you haven't done X", and passive accountability signals backfire
- the system must not feel like it is watching whether the user complied

Practical rule:

- no shame surfaces
- no passive debt accumulation
- no "catch-up" posture when the user returns

### 2. Variable bandwidth is the default, not an edge case

From ADHD and autistic burnout research:

- capacity varies hour to hour and day to day
- a system built on consistent daily execution will misread reality as failure
- recovery periods are real operating constraints, not weak preferences

Practical rule:

- ask about patterns, not just averages
- treat unavailable periods as hard-protected
- make silence neutral

### 3. Task initiation is the bottleneck

From ADHD research and ND productivity frameworks:

- users usually already know what matters
- the problem is starting, not understanding priorities
- systems that optimize categorization but not activation fail

Practical rule:

- one next move beats a dashboard
- the tool should lower the distance to starting
- each extra decision point is real friction

### 4. External scaffolding beats self-maintenance

From ADHD research and ND people using AI:

- the effective intervention is external structure
- tools that require the user to keep the tool current will be abandoned
- AI is valuable because it holds context without demanding maintenance

Practical rule:

- the system should update from use, not from admin
- the user should not have to rebuild context each session
- profile + history need to travel automatically

### 5. Conversation beats blank-slate forms

From ND people using AI:

- conversational AI reduces the blank-page problem
- ND users already build custom context docs and prompts to avoid re-explaining themselves
- form-heavy tools recreate the same activation friction as productivity software

Practical rule:

- the Context Builder should ultimately behave like a guided conversation
- if forms remain, they should be treated as a temporary implementation surface, not the destination

### 6. Trigger-based systems outperform calendar-based systems

From ND productivity frameworks:

- condition-based moves hold better than time-slot commitments
- body doubling, interest matching, and state-aware selection outperform rigid schedules
- "when X, do Y" fits ND execution better than "do Y every Tuesday"

Practical rule:

- outputs should be organized by activation condition
- the session check-in should select from a menu of moves, not replay a plan chronologically

## What this validates in the current direction

Several choices in this repo are on the right track and should be preserved.

### Category Scout strategy direction

- Strategy as a low-contact, constraint-aware layer is correct.
- The move from hard phase gates toward `partial` vs `strong` confidence is correct.
- The Agent Brief concept is correct: portable artifact, external scaffold, not an in-app task manager.

### ND Process Framework

The core claims in [ND-Process-Framework.md](/Users/adamking/projects/category-scout/ND-Process-Framework.md:1) are strongly supported:

- invitation-based framing
- one move at a time
- batched bursts over daily cadence
- not-doing list as a real boundary
- session start by current mode/capacity, not by stale plan

### Existing strategy inputs

These fields are research-aligned and should stay:

- `previousAttempts`
- `avoidanceTasks`
- `activationWindows`
- `unavailablePeriods`
- `channelAvoidances`
- `peerCollaborationOk`
- structured `existingAssets`

## Where the current repo still diverges

### 1. `NDContextBuilder` is still implemented as a form wizard

Current file: [src/components/NDContextBuilder.tsx](/Users/adamking/projects/category-scout/src/components/NDContextBuilder.tsx:1)

The content is directionally good, but the interaction model is still a step-based form. Research says the long-term right answer is conversational intake with persistent memory, not a static questionnaire.

Implication:

- keep the question content
- plan to replace the interaction shell

### 2. The ND profile is not yet affecting Category Scout

Current files:

- [src/lib/nd-profile.ts](/Users/adamking/projects/category-scout/src/lib/nd-profile.ts:1)
- [src/components/StrategyView.tsx](/Users/adamking/projects/category-scout/src/components/StrategyView.tsx:1)
- [api/_lib/strategy-api.ts](/Users/adamking/projects/category-scout/api/_lib/strategy-api.ts:1)

The profile exists as a separate artifact, but Strategy/Intelligence generation does not consume it yet.

Implication:

- Category Scout is still "ND-aware by manual inputs", not "ND-informed by persistent context"

### 3. The agent brief is promising but still generic

Current file: [src/lib/strategy.ts](/Users/adamking/projects/category-scout/src/lib/strategy.ts:290)

The architecture is right, but the brief is still largely template-driven. The research suggests the highest-leverage value comes from compensating for the user's actual neurological patterns, not just enforcing generic ND-safe pacing.

Implication:

- once the profile is wired in, the agent brief should cite those profile patterns directly

## Build rules for the next phase

These should drive implementation order.

### Priority 1: Wire profile context into Category Scout

Use the ND profile to prefill and constrain strategy generation.

Implementation target:

- load saved ND profile when Category Scout opens
- map profile fields into strategy defaults where appropriate
- pass profile-derived context into strategy and intelligence prompts
- let project-level inputs override profile defaults

Minimum useful mapping:

- activation patterns -> `activationWindows`
- shutdown triggers / demand sensitivities -> `avoidanceTasks` and prompt constraints
- time/energy patterns -> `unavailablePeriods`
- info preferences -> agent brief communication style

### Priority 2: Make the Agent Brief profile-aware

The brief should stop at generic guardrails only after it includes user-specific ones.

Implementation target:

- include known demand triggers
- include known shutdown patterns
- include good-session conditions
- include preferred information density / format
- include explicit "do not" communication patterns

### Priority 3: Shift Context Builder toward conversation

Do not throw away the content model. Replace the shell.

Implementation target:

- move from rigid step wizard to guided dialogue
- ask one thing at a time
- reflect back what was learned before moving on
- allow skipping without penalty
- treat "not now" as valid

### Priority 4: Let Strategy output express activation conditions directly

The ND doc is already pointing here. The product should follow through.

Implementation target:

- structure recommendations around conditions like:
  - when you have 20 minutes and low energy
  - when you have 2 hours and want to make something
  - when you want background distribution with no social effort
- this should appear in both the visible strategy and the exported agent artifact

## Concrete implementation queue

### Done in this pass

- aligned Strategy generation gating to the 2+ phase model
- added handler guardrails so Strategy/Intelligence cannot run below readiness
- updated stale readiness tests
- aligned runtime docs with Kimi-based synthesis

### Next code change

1. Add profile loading helpers in Category Scout.
2. Extend strategy/intelligence request payloads with optional ND profile context.
3. Update prompt builders to consume that context safely.
4. Expose profile-derived defaults in the Strategy drawer with user override.
5. Revise the Agent Brief to include profile-specific operating guidance.

## Non-negotiables

- No streaks.
- No passive accountability.
- No "you missed this."
- No assumed daily cadence.
- No tool-maintenance burden as the price of support.
- No treating silence as drift.

If a feature violates one of those, it is probably contradicting the research rather than extending it.
