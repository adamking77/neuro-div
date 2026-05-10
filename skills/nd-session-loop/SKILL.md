---
name: nd-session-loop
description: Use when a user is starting or ending a work session and needs ND-aware guidance from an existing process artifact. Trigger for session-start check-ins, one-move surfacing, brief end-of-session reflection, and outcomes-log updates.
version: 1.0.0
tags:
  - session
  - reflection
  - execution
  - neurodivergent
relatedSkills:
  - nd-context-builder
  - nd-process-designer
---

# ND Session Loop

## Overview

This skill combines `ND Session Start` and `ND Reflection` into one operating loop. It reads the active process artifact, surfaces one move at session start, then updates the outcomes log and flags needed changes during reflection.

## Mode selection

Determine which mode applies:

- `session-start`: the user is about to work and needs one move
- `reflection`: the user just worked and needs to capture what happened
- `mixed`: the user wants to start with a check-in and later end with reflection in the same conversation

If the user does not specify a mode, ask one question: "Are you starting a session or wrapping one up?"

If the active process artifact is missing, redirect to `nd-process-designer`.

## Session-start workflow

1. Read the active process artifact first. If it is not available, say so and redirect to `nd-process-designer`.
2. Ask: `What's actually available today?`
3. Let the user choose a mode. Present each option with a one-line descriptor so the user can recognize themselves in it:
   - `Thinking` — you have some capacity but low drive; reading, noticing, connecting ideas is about as far as it goes today
   - `Deciding` — you can evaluate and commit to something but not execute it yet
   - `Executing` — you have actual energy and can move something forward
   - `Not today` — nothing is available and that's the honest answer
4. If the user selects `Not today`: acknowledge it simply ("Got it. Nothing to do today."), do not question or reframe the choice, and close cleanly. No follow-up tasks or suggestions.
5. For all other modes, surface exactly one move from the process artifact. Select the move by matching it to the stated mode and energy level — not the first move in the artifact, not the most important-looking move, but the one that fits what is actually available. A Thinking mode session gets a low-activation move. An Executing session gets a concrete action with a clear done signal.
6. Do not surface a second move until the first is closed, declined, or explicitly replaced.

## Reflection workflow

1. Ask what activated.
2. Ask what froze or caused drag.
3. Ask what compounded without effort.
4. Update the `## Outcomes log` section in the process artifact using the entry format in `../_shared/artifact-contracts.md`.
5. If repeated patterns point to a profile or process mismatch, say so clearly and recommend the smallest appropriate update.
6. Reflection is complete when the outcomes log entry is written and any flags are surfaced. Do not extend the conversation beyond that.

## Guardrails

- No guilt language.
- No catch-up posture.
- No dumping a queue of options.
- `Not today` is a valid finish state.
- Reflection is for learning, not performance review.

## References

- Read `../_shared/architecture.md` before running the workflow.
- Read `../_shared/artifact-contracts.md` before updating a process artifact.
