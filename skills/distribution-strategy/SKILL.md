---
name: distribution-strategy
description: Use when a user has research plus ND constraints and needs a distribution strategy artifact, not just a market dossier. Trigger when they want channel choices, message angles, asset ideas, experiments, activation-window moves, and an agent brief grounded in evidence.
---

# Distribution Strategy

## Overview

This skill reads a research dossier and ND context, then writes the distribution strategy artifact. It is the synthesis layer, separate from Category Scout research.

## Workflow

1. Read the research dossier, ND profile, and any existing strategy artifact before asking questions.
2. Confirm the missing pieces only: audience lens, operator constraints, prior attempts, avoidance tasks, activation windows, unavailable periods, and any project-specific limits.
3. If the research dossier is missing, do not fabricate. Redirect to `category-scout` or work only from user-supplied evidence.
4. Write the strategy artifact using the contract in `../_shared/artifact-contracts.md`.
5. Include the receiving-agent brief in the same artifact.

## What this skill owns

- Positioning
- Channel plan
- Message angles
- Asset ideas
- Experiments
- Next activation window
- ND-aware agent brief

## Guardrails

- Recommendations must connect to real evidence or explicit constraints.
- Keep the strategy invitation-based, not hustle-based.
- Name uncertainty when the evidence is weak.
- The output is read-only guidance and handoff, not an operating dashboard.

## When to redirect

- If the user needs market evidence first, redirect to `category-scout`.
- If the user needs a domain-agnostic process for a non-distribution goal, redirect to `nd-process-designer`.
- If the user wants moment-of-work guidance from an existing process, redirect to `nd-session-loop`.

## References

- Read `../_shared/architecture.md` before running the workflow.
- Read `../_shared/artifact-contracts.md` before writing the strategy artifact.
- Read `../_shared/surface-map.md` to keep the research/strategy split clean.
