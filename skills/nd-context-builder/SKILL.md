---
name: nd-context-builder
description: Use when a user needs to create or refresh a persistent ND profile artifact for Claude, Codex, or another LLM. Trigger when the user wants structured intake around traits, activation patterns, shutdown triggers, time and energy patterns, prior systems, information preferences, or agent working instructions.
---

# ND Context Builder

## Overview

This skill interviews the user about how their ND traits actually show up in work, then writes a reusable `nd-profile.md` artifact. It is the foundation skill for the rest of the suite.

## Workflow

1. Read any existing ND profile, CLAUDE.md, vault notes, or related context before asking questions.
2. Decide whether this is a fresh intake or an update pass.
3. Ask one question at a time. Use a mix of structured, mixed, and open-ended prompts.
4. Write or update the ND profile artifact using the contract in `../_shared/artifact-contracts.md`.
5. End with a short handoff: what was captured, what remains fuzzy, and whether `nd-process-designer` is now ready.

## Question format rules

- Use structured prompts when the user may need vocabulary to recognize their own experience.
- Use open-ended prompts when the user's own words are the important data.
- Use mixed prompts when common patterns help, but specificity still matters.
- Never force the entire intake into checkbox mode or blank-page mode.

## Intake scope

- Which ND traits apply and how they manifest
- What activates the user
- What causes shutdown or avoidance
- How they know when work is going well
- Their relationship with time, scheduling, and recovery
- What systems they have already tried
- How they prefer information to be delivered
- What support conditions help

## Output rules

- Write stable headings so downstream skills can read the artifact reliably.
- Preserve the user's own language where it adds specificity.
- The final section must be written to the receiving agent, not the user.
- If the user already has a profile, update it rather than rewriting it from scratch unless they explicitly ask to restart.

## Guardrails

- Do not diagnose.
- Do not turn the conversation into therapy.
- Do not ask for everything at once.
- Do not overwrite existing context casually.
- If the user wants only a partial profile update, do only that.

## References

- Read `../_shared/architecture.md` before running the workflow.
- Read `../_shared/artifact-contracts.md` before writing or updating the profile artifact.
