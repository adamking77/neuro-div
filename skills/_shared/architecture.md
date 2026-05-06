# ND Skill Suite Architecture

## Purpose

This suite has two surfaces:

- Web tools for guided intake, readable output, and low-friction export
- Skill packages for Claude, Codex, and other LLM environments that can hold longer-lived context

The methodology is the same across both surfaces. The packaging is different.

## Canonical skill order

1. `nd-context-builder`
2. `nd-process-designer`
3. `category-scout`
4. `distribution-strategy`
5. `nd-session-loop`

These are composable, not strictly mandatory. A user can start anywhere if they already have the required artifact.

## Artifact graph

`nd-context-builder` writes the persistent ND profile artifact.

`nd-process-designer` reads the ND profile and one concrete goal, then writes a process artifact plus agent brief.

`category-scout` writes the research dossier only. It does not own strategy.

`distribution-strategy` reads the research dossier plus ND profile and writes a distribution strategy artifact plus agent brief.

`nd-session-loop` reads the active process artifact, surfaces one move at session start, then updates the outcomes log during reflection.

## Category Scout split

Category Scout and Distribution Strategy are separate products in both surfaces.

- `Category Scout` owns research discovery and evidence gathering.
- `Distribution Strategy` owns interpretation, recommendation, process framing, and the agent brief.

Do not collapse them into one skill or one web surface again. Keep the handoff explicit.

## Common operating rules

Every skill in this suite follows these rules:

- Read existing context first: current chat, memory, vault, CLAUDE.md, existing artifacts.
- Ask only for genuine gaps.
- Ask one question at a time unless the skill explicitly needs a short grouped intake.
- Use plain language, no framework jargon, no clinical posturing.
- Treat silence as neutral, not failure.
- No streaks, no catch-up framing, no passive accountability.
- If required upstream artifacts are missing, say so clearly and offer the smallest viable next move.

## Fallback rules

If a required artifact is missing:

- `nd-context-builder`: no fallback needed, it is the foundation.
- `nd-process-designer`: can run with a lighter fallback intake, but should recommend building an ND profile first.
- `category-scout`: can work from user-supplied materials if live research is unavailable.
- `distribution-strategy`: should not fabricate research. It can work from a provided dossier or pause and recommend `category-scout`.
- `nd-session-loop`: needs an active process artifact. If absent, redirect to `nd-process-designer`.

## Web mapping

Current or intended web surfaces:

- `ND Context Builder` -> web tool + skill
- `ND Process Designer` -> web tool + skill
- `Category Scout` -> web tool + skill
- `Distribution Strategy` -> web tool + skill
- `ND Session Loop` -> skill only

`ND Session Start` and `ND Reflection` are combined as one skill package, not separate web tools.
