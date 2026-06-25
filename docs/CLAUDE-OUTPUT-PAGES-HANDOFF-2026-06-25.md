# Claude handoff: redesign Context and Process output pages

## Situation

NeuroDiv OS has been migrated to Astro/Vercel with React islands for the interactive tools. The app now has:

- Context Builder at `/context-builder`
- Process Designer at `/process-designer`
- Reports at `/reports` and `/reports/[id]`
- DeepSeek-backed report generation through `/api/generate-report`
- Bklit chart components installed under `src/components/charts/`

The generated analysis report page already uses Bklit charts in:

- `src/components/ReportParts.tsx`

The Context Builder and Process Designer outputs are functional but not yet polished artifact pages. They are mostly inline UI blocks inside the tool components.

## Goal

Redesign the final output experiences for:

1. Context Builder output
2. Process Designer output

The output screens should feel like durable, useful artifacts rather than just end-of-form summaries. Keep them practical and calm. These are work surfaces for neurodivergent founders, not marketing pages.

## Current Implementation Map

Context Builder:

- UI: `src/components/NDContextBuilder.tsx`
- Final output screen: `DoneStep` and `ProfileSummaryView`
- Markdown generation: `buildNDProfileMarkdown()` in `src/lib/nd-profile.ts`
- Profile shape/types: `src/types.ts`

Process Designer:

- UI: `src/components/NDProcessDesigner.tsx`
- Final output screen: `DoneStep`, `ProcessGlanceCard`, `ReadableProcessView`, `MoveCard`
- Markdown generation: `buildProcessMarkdown()` in `src/lib/process-designer.ts`
- Plan builder: `buildProcessPlan()` in `src/lib/process-designer.ts`
- Process shape/types: `src/types.ts`

Charts:

- Bklit chart components are installed in `src/components/charts/`
- Existing usage examples are in `src/components/ReportParts.tsx`
- Use Bklit only inside client-only React tool surfaces. Do not import Bklit into server-rendered Astro pages directly.

## Recommended Refactor

Create reusable output components instead of expanding the already large builder files:

- `src/components/output/ContextProfileOutput.tsx`
- `src/components/output/ProcessArtifactOutput.tsx`
- `src/components/output/OutputSection.tsx`
- `src/components/output/OutputActionBar.tsx`

Then replace the output portions of `NDContextBuilder.tsx` and `NDProcessDesigner.tsx` with these components.

Keep existing behavior:

- Save to localStorage
- Download Markdown
- Copy agent brief where available
- View raw markdown as a secondary action
- Generate analysis from Process Designer
- Saved process list

## Chart Guidance

Use charts only where they help the user understand the artifact faster.

Good Context Builder chart candidates:

- Activation conditions from selected activation patterns
- Shutdown/avoidance risks from selected shutdown triggers
- Support conditions from selected support conditions
- Information preference mix from density/formats

Good Process Designer chart candidates:

- Energy-mode distribution: low / normal / high
- Move composition: step-menu moves vs rescue moves vs check-in modes
- Process readiness/fit using available context fields
- Boundary load: working-with / protected / not-doing counts

Avoid charts for:

- Long prose fields
- Agent brief text
- Anything that would imply diagnosis or medical scoring
- False precision. If the number is a derived display score, label it as such.

## Design Constraints

- Keep the UI dense but readable.
- Do not make a landing page or hero page.
- Avoid nested cards.
- Keep cards to actual repeated items or framed artifacts.
- Use existing palette and typography from `src/styles/globals.css`.
- No decorative gradient blobs/orbs.
- Do not use viewport-scaled text.
- Ensure mobile width has no horizontal overflow.
- On compact tool surfaces, do not use giant hero typography.
- Use icons in action buttons where useful. Current icon library: `@phosphor-icons/react`; `lucide-react` is also installed.

## Important Runtime Constraints

- The tool pages use Astro `client:only="react"` islands. Bklit is safe inside those React components.
- Report detail also uses a client-only React island because saved reports live in localStorage.
- Avoid moving localStorage-dependent output into server-rendered Astro pages unless you change persistence.
- Do not commit `.env.local`; it contains the DeepSeek key and is gitignored.

## Validation Checklist

Run:

```bash
npm test
npm run build
```

Then visually check:

- `/context-builder` output screen after completing enough fields
- `/process-designer` output screen after completing a process
- Mobile width around 390px
- No horizontal overflow
- Bklit charts render nonblank where used
- Download/copy actions still work
- Process “Generate analysis” still routes to a saved report

## Claude Starting Prompt

Use this prompt:

```text
You are working in /Users/adamking/projects/neurodiv-os.

Task: redesign the final output pages for Context Builder and Process Designer.

Read these files first:
- docs/CLAUDE-OUTPUT-PAGES-HANDOFF-2026-06-25.md
- src/components/NDContextBuilder.tsx
- src/components/NDProcessDesigner.tsx
- src/components/ReportParts.tsx
- src/lib/nd-profile.ts
- src/lib/process-designer.ts
- src/types.ts
- src/styles/globals.css

Goal:
Turn the final Context Builder and Process Designer output screens into polished, durable artifact pages. They should be useful at a glance, downloadable, copyable, and easy to revisit. Keep the current behavior intact.

Implementation direction:
- Extract reusable output components under src/components/output/.
- Replace inline output sections in NDContextBuilder.tsx and NDProcessDesigner.tsx with those components.
- Use Bklit charts where they add real comprehension:
  - Context: activation patterns, shutdown risks, support conditions, info preferences.
  - Process: energy modes, move composition, rescue moves, boundary/load signals.
- Do not use charts for false precision or diagnostic scoring.
- Keep raw markdown as a secondary toggle/download, not the primary visual layout.

Constraints:
- This is an Astro app with client-only React tool islands.
- Bklit must remain inside React client-only surfaces; do not import chart components into server-rendered Astro pages.
- Keep localStorage persistence and existing actions working.
- Do not touch .env.local.
- Do not reintroduce Next or Tauri.
- Keep the UI calm, dense, and practical. No marketing hero, no decorative blobs, no nested cards.

Before finishing:
- Run npm test.
- Run npm run build.
- Check the output screens at desktop and mobile widths.
- Confirm no horizontal overflow and that charts render.
```

