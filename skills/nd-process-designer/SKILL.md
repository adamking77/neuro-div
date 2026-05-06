---
name: nd-process-designer
description: Use when a user has an ND profile and a specific goal and needs a trigger-based process artifact instead of a schedule or task system. Trigger when the user wants one goal turned into a move menu, not-doing list, measurement system, and agent brief.
---

# ND Process Designer

## Overview

This skill takes the ND profile plus one concrete goal and writes a reusable process artifact. It is the domain-agnostic generalization of the ND process methodology.

## Workflow

1. Read the ND profile artifact and any existing process artifact if they are available. If they are not, proceed without them.
2. Open by confirming the goal the user wants to work on. Ask one clarifying question at a time: success signal, existing assets, likely friction points, and explicit not-doing boundaries.
3. If the ND profile is missing, run a short fallback intake — ask about activation patterns, shutdown triggers, and one recent stuck point. State what is missing and recommend building a full profile with `nd-context-builder` afterward. Do not pretend you have a full profile when you do not.
4. Write the process artifact using the contract in `../_shared/artifact-contracts.md` once the goal and key constraints are clear. Do not continue clarifying after the artifact is drafted.
5. Include the readable structure plus the receiving-agent brief inside the same artifact.

## What the process must contain

- A process thesis in plain language
- What the user is working with
- Protected conditions
- A visible not-doing list
- Session-start guidance
- Trigger-based move groups
- Rescue moves
- Measurement that does not reduce to completion rates
- An agent brief

## Guardrails

- Organize moves by condition, not chronology.
- Include a dignified `Not today` path.
- No compliance framing, no catch-up framing, no fake urgency.
- Do not build a dashboard, score system, or task manager.
- Research is optional input, not a required step.

## When to redirect

- If the user needs market evidence first, redirect to `category-scout`.
- If the user specifically needs a distribution process tied to research, redirect to `distribution-strategy`.
- If the user wants a live session check-in from an existing process, redirect to `nd-session-loop`.

## References

- Read `../_shared/architecture.md` before running the workflow.
- Read `../_shared/artifact-contracts.md` before writing the process artifact.
- Read `../_shared/surface-map.md` if there is ambiguity about this skill versus Distribution Strategy.
