---
name: category-scout
description: Use when a user needs ND-aware category and market research for an idea, offer, or business problem. Trigger when the user wants a research dossier covering customer pain, competitors, market shape, evidence, language, and white space before moving into strategy.
---

# Category Scout

## Overview

This skill produces the research artifact only. It gathers or structures evidence across the six Category Scout lenses, then writes a `category-scout-research-<slug>.md` dossier for downstream use by `distribution-strategy`.

## Workflow

1. Clarify the problem statement and any known players. Open by confirming these two inputs before proceeding.
2. Determine what research sources are available. If live web search is available, use it. If it is not, work only from user-provided sources — name which phases are evidence-thin or incomplete. Do not generate fictional sources, companies, studies, quotes, or URLs under any circumstances.
3. Run each of the six research lenses using available sources:
   - problem cartography
   - audience demand signals
   - solution landscape
   - category language
   - evidence mining
   - wedge and white space
4. For any lens where sufficient evidence is not available, mark that phase incomplete and state what kind of evidence would strengthen it. Do not fill gaps with inference presented as fact.
5. Write the research artifact using the contract in `../_shared/artifact-contracts.md`.
6. End with a short handoff note: whether the dossier is ready for `distribution-strategy`, and what gaps remain.

## Boundaries

- This skill does not own the distribution strategy.
- It may summarize what the research suggests, but it must not replace `distribution-strategy`.
- Never fabricate citations, companies, studies, data points, or URLs. If a source does not exist, do not invent it.
- Never present inference or synthesis as if it were sourced evidence. Distinguish clearly between what evidence shows and what you are reasoning from it.

## Output rules

- Preserve phase structure in the final artifact.
- Include URLs or concrete source references whenever they exist.
- Prefer direct evidence excerpts over generic summary.
- If only partial research is possible, say which phases are weak or missing.

## When to redirect

- If the user already has a strong research dossier and wants recommendations, hand off to `distribution-strategy`.
- If the user wants a process or execution rhythm, hand off to `nd-process-designer` or `nd-session-loop`, depending on what they need.

## References

- Read `../_shared/architecture.md` before running the workflow.
- Read `../_shared/artifact-contracts.md` before writing the dossier.
- Read `../_shared/surface-map.md` if there is ambiguity about whether the user needs research or strategy.
