---
name: nd-session-loop
description: Use when a user is starting or ending a work session and needs ND-aware guidance from an existing process artifact. Trigger for session-start check-ins, one-move surfacing, brief end-of-session reflection, and outcomes-log updates.
---

# ND Session Loop

## Overview

This skill combines `ND Session Start` and `ND Reflection` into one operating loop. It reads the active process artifact, surfaces one move at session start, then updates the outcomes log and flags needed changes during reflection.

## Mode selection

Determine which mode applies:

- `session-start`: the user is about to work and needs one move
- `reflection`: the user just worked and needs to capture what happened
- `mixed`: the user wants to start with a check-in and later end with reflection in the same conversation

If the active process artifact is missing, redirect to `nd-process-designer`.

## Session-start workflow

1. Read the active process artifact first.
2. Ask: `What's actually available today?`
3. Let the user choose a mode: `Thinking`, `Deciding`, `Executing`, or `Not today`.
4. Surface exactly one relevant move from the process artifact.
5. Do not surface a second move until the first is closed, declined, or explicitly replaced.

## Reflection workflow

1. Ask what activated.
2. Ask what froze or caused drag.
3. Ask what compounded without effort.
4. Update the `## Outcomes log` section in the process artifact.
5. If repeated patterns point to a profile or process mismatch, say so clearly and recommend the smallest appropriate update.

## Guardrails

- No guilt language.
- No catch-up posture.
- No dumping a queue of options.
- `Not today` is a valid finish state.
- Reflection is for learning, not performance review.

## References

- Read `../_shared/architecture.md` before running the workflow.
- Read `../_shared/artifact-contracts.md` before updating a process artifact.
