# ND Skill Suite Architecture

## Purpose

This suite has two surfaces:

- Web tools for guided intake, readable output, and low-friction export
- Skill packages for Claude, Codex, and other LLM environments that can hold longer-lived context

The methodology is the same across both surfaces. The packaging is different.

## Canonical skill order

1. `nd-context-builder`
2. `nd-process-designer`
3. `spine-finder`
4. `nd-session-loop`

These are composable, not strictly mandatory. A user can start anywhere if they already have the required artifact.

## Artifact graph

`nd-context-builder` writes the persistent ND profile artifact.

`nd-process-designer` reads the ND profile and one concrete goal, then writes a process artifact plus agent brief.

`spine-finder` reads raw self-analysis and helps the user recognize candidate problem domains and question-form spines. It is distributed as a skill only.

`nd-session-loop` reads the active process artifact, surfaces one move at session start, then updates the outcomes log during reflection.

## Common operating rules

Every skill in this suite follows these rules:

- Read existing context first: current chat, memory, vault, CLAUDE.md, existing artifacts, but only if they are available. Context files are not automatically loaded in all environments. Handle their absence gracefully without assuming their contents.
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
- `spine-finder`: can run from pasted raw material. If the user has no material yet, ask for one pain pass and one pull pass.
- `nd-session-loop`: needs an active process artifact. If absent, redirect to `nd-process-designer`.

## Web mapping

Current or intended web surfaces:

- `ND Context Builder` -> web tool + skill
- `ND Process Designer` -> web tool + skill
- `Spine-Finder` -> landing page + skill
- `ND Session Loop` -> skill only

Market research tools are intentionally outside NeuroDiv OS and live in the standalone Category Scout project.
