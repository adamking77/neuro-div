# NeuroDiv OS Astro + LLM Analysis Plan

Date: June 25, 2026

## Job To Be Done

NeuroDiv OS should become a focused neurodivergent operating-context tool:

1. The user builds a durable ND operating profile.
2. The user designs a process around one real goal.
3. DeepSeek V4 Flash analyzes the profile + process inputs.
4. The app returns a polished report with insights, risks, charts, and practical next moves.
5. The user can export or reuse that report in their own AI environment.

This is no longer a market-research app. Category Scout and Distribution Strategy live in `/Users/adamking/projects/category-scout`.

## Product Shape

Primary routes after migration:

- `/` - NeuroDiv OS home and context stack.
- `/context-builder` - structured profile intake plus optional LLM synthesis.
- `/process-designer` - goal/process intake plus deterministic baseline plan plus LLM refinement.
- `/reports` - saved analysis reports.
- `/reports/[id]` - the full output page for one profile/process analysis.
- `/spine-finder` - landing/download page only.
- `/skills` - skill downloads.

## Core Architecture Decision

Migrate NeuroDiv OS from Next.js to Astro, but keep React islands for the stateful tools.

Astro should own:

- static route shell
- metadata
- layout
- content pages
- skill download/source routes
- report page wrappers

React should remain responsible for:

- Context Builder form state
- Process Designer form state
- report viewer interactions
- Bklit charts
- localStorage-backed saved profiles, processes, and reports

This avoids a full rewrite of the working interactive components while removing the unnecessary Next.js surface now that Category Scout is gone.

## Workstream 1 - Astro Migration

**Goal:** convert NeuroDiv OS into an Astro app without changing user-facing behavior first.

Tasks:

1. Add Astro with React integration.
2. Replace `app/` routes with Astro pages:
   - `src/pages/index.astro`
   - `src/pages/context-builder.astro`
   - `src/pages/process-designer.astro`
   - `src/pages/spine-finder.astro`
   - `src/pages/skills.astro`
   - `src/pages/skills.json.ts`
   - `src/pages/skills/[slug]/source.ts`
   - `src/pages/skills/[slug]/download.ts`
3. Move route shell/layout behavior out of `components/persistent-app-shell.tsx` and into Astro layouts.
4. Convert `src/App.tsx` into a React island used by Astro route pages, or split it into smaller islands:
   - `ContextBuilderIsland.tsx`
   - `ProcessDesignerIsland.tsx`
   - `SpineFinderLanding.tsx`
   - `SkillsLibraryIsland.tsx`
5. Preserve current localStorage keys:
   - `nd-profile`
   - `nd-process-designer`
   - `nd-process-designer-artifacts`
   - `nd-process-designer-current`
6. Replace Next-only APIs:
   - `next/link` -> Astro links or ordinary anchors.
   - `next/navigation` -> browser navigation helpers.
   - `next/dynamic` -> Astro `client:only="react"` / `client:load` islands.
   - `Metadata` helpers -> Astro frontmatter metadata.
7. Keep `scripts/copy-skills.cjs` or replace it with an Astro-compatible skill read path.
8. Update package scripts:
   - `dev: astro dev`
   - `build: node scripts/copy-skills.cjs && astro build`
   - `preview: astro preview`
   - `test: vitest run`
9. Remove Next dependencies after parity is verified:
   - `next`
   - `eslint-config-next`
   - `next-env.d.ts`
   - `next.config.ts`

Acceptance criteria:

- Existing pages load in Astro.
- Existing Context Builder and Process Designer data remains readable.
- Existing tests pass.
- Astro build passes.
- Browser smoke check confirms no blank islands.

## Workstream 2 - DeepSeek V4 Flash API Integration

**Goal:** add a single server-side LLM client for NeuroDiv OS analysis.

Provider choice:

- Default model: `deepseek-v4-flash`
- Optional fallback: Claude Haiku 4.5 later, only if tone or judgment needs it.

Environment variables:

```env
DEEPSEEK_API_KEY=
NEURODIV_MODEL=deepseek-v4-flash
```

Tasks:

1. Add `src/lib/server/deepseek.ts`.
2. Implement a small OpenAI-compatible client using DeepSeek's chat completions API.
3. Add strict request/response schemas for:
   - profile synthesis
   - process analysis
   - report generation
4. Add Astro API routes:
   - `src/pages/api/analyze-profile.ts`
   - `src/pages/api/analyze-process.ts`
   - `src/pages/api/generate-report.ts`
5. Keep deterministic builders as fallback:
   - `buildNDProfileContext`
   - `buildProcessPlan`
   - `buildProcessMarkdown`
6. Never expose the API key to client code.
7. Add error states that preserve user inputs and offer deterministic output when the model fails.

Acceptance criteria:

- API key is only read server-side.
- App can generate analysis from saved profile + process inputs.
- Invalid or malformed model output is rejected and handled cleanly.
- Tests cover request assembly, output parsing, and fallback behavior.

## Workstream 3 - Analysis Contract And Prompt Refinement

**Goal:** make LLM output consistently useful, grounded, and not generic self-help.

The model should produce structured JSON, not loose prose. The report renderer should own presentation.

Core output schema:

```ts
interface NeuroDivAnalysisReport {
  id: string;
  createdAt: string;
  title: string;
  profileSnapshot: ProfileSnapshot;
  processSnapshot: ProcessSnapshot;
  executiveSummary: string;
  operatingPatternInsights: Insight[];
  activationMap: ChartDatum[];
  shutdownRiskMap: ChartDatum[];
  processFitScore: ScoreBlock;
  recommendations: Recommendation[];
  nextSevenDays: ActionBlock[];
  rescuePlan: RescueMove[];
  agentBrief: string;
  caveats: string[];
}
```

Prompt principles:

- Use the user's actual saved profile and process inputs as primary evidence.
- Separate observation from inference.
- Do not diagnose.
- Do not moralize inconsistent energy, avoidance, shutdown, or burst work.
- Convert vague goals into smaller condition-based moves.
- Prefer bounded next actions over broad lifestyle advice.
- Preserve the user's autonomy and language.
- Clearly mark missing information instead of inventing it.
- Output JSON only.

Quality gates:

- Every recommendation cites at least one input field or inferred pattern.
- Every risk includes a mitigation.
- Every report includes one low-energy path, one normal-energy path, and one high-energy path.
- No generic productivity language like "just be consistent" or "build discipline."
- No medical claims.

## Workstream 4 - Bklit Charts And Graphs

**Goal:** use Bklit for readable charts inside the report page.

Bklit is a React/shadcn registry, so it should live inside React report components rather than Astro-only pages.

Initial chart set:

1. Activation map
   - Bklit bar chart or radar chart.
   - Shows which conditions are most likely to create usable momentum.
2. Shutdown risk map
   - Bklit bar chart or heatmap.
   - Shows demand/friction triggers and risk levels.
3. Process fit score
   - Bklit gauge or ring chart.
   - Shows how well the designed process fits the saved ND profile.
4. Energy-mode plan
   - Bklit composed chart or grouped bars.
   - Compares low, normal, and high-energy paths.

Tasks:

1. Initialize shadcn registry support if needed.
2. Install only the Bklit components used in the first report:
   - likely `@bklit/bar-chart`
   - likely `@bklit/radar-chart` or `@bklit/ring-chart`
   - likely `@bklit/gauge`
3. Add chart theme tokens to global CSS.
4. Build `ReportCharts.tsx` as a React island.
5. Keep chart data derived from the structured report schema, not generated ad hoc in the UI.
6. Add empty and low-confidence chart states.

Acceptance criteria:

- Charts render in the Astro app.
- Charts work on mobile.
- Chart labels are readable and do not overlap.
- Report remains understandable if charts fail or data is sparse.

References:

- Bklit docs: https://bklit.com/docs/skills
- Bklit chart catalog: https://bklit.com/
- Bklit GitHub: https://github.com/bklit/bklit-ui

## Workstream 5 - Report And Output Page

**Goal:** give the user a durable output surface for analysis and insights.

Report route:

- `/reports` lists saved reports.
- `/reports/[id]` shows one report.

Storage:

- Start with localStorage to stay consistent with the current app.
- Key: `nd-analysis-reports`.
- Each report stores the full structured JSON response plus profile/process snapshots.
- Do not introduce a database until multi-device sync or accounts are required.

Report sections:

1. Summary
2. What the app noticed
3. Activation conditions
4. Shutdown and friction risks
5. Process fit
6. Recommended process changes
7. Next seven days
8. Rescue plan
9. Agent brief
10. Source context used

User actions:

- Regenerate report
- Save report
- Rename report
- Delete report
- Copy agent brief
- Download Markdown
- Download JSON

Acceptance criteria:

- User can generate a report from Process Designer.
- User can return to a saved report later.
- Report links survive refresh.
- Markdown export is readable without the app.
- JSON export is agent-consumable.

## Workstream 6 - UX Refinement For Optimized Output

**Goal:** make analysis feel like a practical operating brief, not a generic chatbot response.

UX rules:

- The LLM should not appear as a chat box.
- The primary action should be "Generate analysis" or "Refine analysis."
- The user should see what context will be sent before generation.
- The app should show missing context before calling the model.
- Report copy should be direct, grounded, and skimmable.
- The report should separate "known from your inputs" from "model inference."

Interaction flow:

1. User builds or updates Context Builder profile.
2. User builds Process Designer plan.
3. User clicks "Generate analysis."
4. App previews included context:
   - profile summary
   - selected activation/shutdown patterns
   - goal
   - friction points
   - boundaries
5. API generates structured report.
6. App saves report and opens `/reports/[id]`.
7. User exports report or agent brief.

Refinement loop:

- "Make this more concrete"
- "Make this lower-energy"
- "Make this more autonomous"
- "Reduce social demand"
- "Shorten next steps"

These should be predefined refinement controls, not an open-ended chat interface.

## Implementation Order

1. Freeze current behavior with tests around localStorage and process output.
2. Migrate to Astro with no product behavior changes.
3. Add report data model and localStorage report store.
4. Add DeepSeek server client and analysis API routes.
5. Add Process Designer "Generate analysis" flow.
6. Add report list/detail pages.
7. Add Bklit chart components to report detail.
8. Refine prompts and schemas until output is stable.
9. Remove Next leftovers and stale docs.
10. Run full verification:
    - `npm run test`
    - `npm run build`
    - browser check on `/`, `/context-builder`, `/process-designer`, `/reports`, `/spine-finder`, `/skills`

## What Not To Build Yet

- User accounts.
- Database persistence.
- Multi-user sharing.
- Open-ended chat.
- Spine-Finder interactive app behavior.
- Category Scout or Distribution Strategy inside NeuroDiv OS.
- Medical or diagnostic interpretation.

## Immediate Next Step

Start with Workstream 1. The migration must come before the new API/report work so the app does not carry two framework patterns while adding new behavior.

The only exception: before the migration, add a small test harness around current localStorage keys and deterministic Process Designer output so we can prove the Astro version did not break the existing tool.
