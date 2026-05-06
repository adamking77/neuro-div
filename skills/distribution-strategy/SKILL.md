---
name: distribution-strategy
description: Use when a user has research plus ND constraints and needs a distribution strategy artifact, not just a market dossier. Trigger when they want channel choices, message angles, asset ideas, experiments, activation-window moves, and an agent brief grounded in evidence.
---

# Distribution Strategy

## Overview

This skill reads a research dossier and ND context, then writes the distribution strategy artifact. It is the synthesis layer, separate from Category Scout research.

## Workflow

1. Read the research dossier, ND profile, and any existing strategy artifact if they are available. If they are not, proceed without them and note what is missing.
2. Confirm only the missing pieces needed to write a grounded strategy. Minimum required before writing: a clear target audience, at least one stated constraint, and either a research dossier or user-supplied evidence. If any of these are absent, ask for them before proceeding.
3. If the research dossier is missing, do not fabricate. Either redirect to `category-scout` or work only from evidence the user provides explicitly.
4. Ask one clarifying question at a time. Once audience, constraints, and evidence basis are confirmed, write the strategy. Do not keep clarifying after that point.
5. Write the strategy artifact using the contract in `../_shared/artifact-contracts.md`.
6. Include the receiving-agent brief in the same artifact.

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
