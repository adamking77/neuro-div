# Codex Implementation Plan — 2026-06-25

## Scope update after extraction

Category Scout and Distribution Strategy have been extracted from NeuroDiv OS into
`/Users/adamking/projects/category-scout`. Workstream 2 is no longer NeuroDiv OS scope, and the
home/context stack should not include Market Research.

Spine-Finder is not an in-app workflow. It is a NeuroDiv OS landing page with a downloadable
skill package. Do not build Spine-Finder app state, persistence, movements UI, or AI routes
inside NeuroDiv OS.

Current remaining NeuroDiv OS scope:
- Context Builder
- Process Designer
- Spine-Finder landing page and skill download
- Skill Suite

Five workstreams for NeuroDiv OS. Ordered by dependency. Each task names exact files, the
change, and a verification step. Do not start a workstream's UI work before its data/route
layer compiles.

**Repo facts Codex must know up front:**
- Not a git repo. No commits expected; just working-tree edits.
- App is Next.js (App Router). The real UI lives in `src/App.tsx`, mounted per-route by
  `components/persistent-app-shell.tsx` via `app/<tool>/page.tsx` thin routes.
- LLM calls are OpenAI-compatible and centralized in `api/_lib/strategy-api.ts`
  (`getKimiConfig`, `callKimiWithTool`) plus `api/_lib/intelligence-api.ts`. Three routes
  call them: `app/api/phase-synthesis`, `app/api/strategy-draft`, `app/api/intelligence-brief`.
  (`intelligence-snapshot-v1` wraps intelligence-brief.)
- Skills: source in `skills/<slug>/`. `npm run build` runs `scripts/copy-skills.cjs` which
  copies `skills/` → `public/skills/`. `lib/skills-data.ts` reads `public/skills/` at runtime
  and only exposes slugs in `PUBLIC_SKILL_SLUGS`. The spine-tool spec lives in `spine-tool/`
  (NOT yet a real skill, NOT in the app).

---

## Workstream 1 — Replace Kimi (Moonshot) with DeepSeek V4

**Goal:** swap the LLM provider behind the three AI routes from Kimi/Moonshot to DeepSeek V4
(`deepseek-v4-flash` default, OpenAI-compatible base `https://api.deepseek.com`).

### ⚠️ Blocking design constraint — read first
`callKimiWithTool` (`api/_lib/strategy-api.ts:249-306`) forces a tool call with
`tool_choice: { type: "function", function: { name: tool.name } }` and sends a Moonshot-only
`thinking: { type: "disabled" }` field. **DeepSeek V4 (`deepseek-v4-flash`/`-pro`) returns HTTP
400 for forced `tool_choice` and for any `tool_choice` in thinking mode.** A naive env swap will
500 every AI route. The function must be reworked, not just re-pointed.

### Resolved approach (Adam, 2026-06-25)
**Prototype JSON mode first; fall back if parsing proves unreliable.** Use
`response_format: { type: "json_object" }` with the tool's parameter schema described in the
system prompt (DeepSeek supports JSON mode; it sidesteps the forced-tool 400 entirely). Keep
the same parsed return shape so callers are unaffected. If live output fails to parse reliably
against the existing `parse*` functions, escalate the choice of an alternative (provider with
forced-tool support) rather than papering over with brittle retries.

**Default model: `deepseek-v4-flash`** (schema-bound calls, not deep reasoning — flash is the
right cost/latency tradeoff).

### Tasks
1. **Add provider config.** In `api/_lib/strategy-api.ts`, add `getDeepseekConfig(env)`
   mirroring `getKimiConfig`:
   - `apiKey = env.DEEPSEEK_API_KEY` (throw 500 "DEEPSEEK_API_KEY not configured" if missing)
   - `model = env.DEEPSEEK_MODEL || "deepseek-v4-flash"`
   - `baseUrl = env.DEEPSEEK_BASE_URL || "https://api.deepseek.com"`
   Update `getUpstreamTimeouts` to read `DEEPSEEK_TIMEOUT_MS` (keep `EXA_TIMEOUT_MS`).
   Keep `getKimiConfig` as a thin alias temporarily OR delete after callers migrate (prefer
   delete — do a full rename so no `KIMI_*` survives).

2. **Rework the LLM call.** Replace `callKimiWithTool` with `callDeepseekStructured(baseUrl,
   apiKey, model, prompt, schema, timeoutMs, options)`:
   - Send `response_format: { type: "json_object" }`, no `tool_choice`, no `thinking` field,
     no `tools` array (move the tool's JSON schema into the system prompt as an explicit
     "Return JSON matching this schema" instruction — reuse each existing
     `*_TOOL.parameters`).
   - Parse `choices[0].message.content` as JSON (not `tool_calls[0].function.arguments`).
   - Preserve the exact return contract: returns the parsed object the callers expect.
     `parseIntelligenceBriefPart1/2` etc. in `intelligence-api.ts` must keep working — verify
     the JSON-mode output maps to the same field names the existing tool schemas produced.
   - Keep `StrategyRequestError` + timeout/abort handling unchanged.

3. **Migrate the three callers** to the new config + function name:
   - `app/api/phase-synthesis/route.ts:64-94` (currently inlines `process.env.KIMI_*` and the
     `https://api.moonshot.ai/v1` / `kimi-k2.6` defaults — replace with `getDeepseekConfig`).
   - `app/api/strategy-draft/route.ts` (uses `getKimiConfig` + `callKimiWithTool` ×2).
   - `app/api/intelligence-brief/route.ts` (uses `getKimiConfig` + `callKimiWithTool` ×2).
   Rename local vars (`kimiApiKey`→`deepseekApiKey`, `kimiMs`→`deepseekMs`) and log labels
   (`[*] kimi settled` → `[*] deepseek settled`).

4. **Rename types/exports.** `KimiToolDefinition` → keep as a neutral `LLMToolSchema` (or
   `StructuredOutputSchema`); `KimiResponse`/`KimiToolCallApiResponse` interfaces in both
   `strategy-api.ts` and `intelligence-api.ts:231` → DeepSeek-shaped equivalents. Update the
   export list at `strategy-api.ts:894` and the imports in `intelligence-api.ts:9-12`.

5. **Env + docs.** Document new env vars in `README.md` / wherever `KIMI_*` is referenced.
   Search `grep -rin "kimi\|moonshot" --include='*.ts' --include='*.md' .` (excluding
   node_modules) and ensure zero functional references remain.

### Verification
- `npm run test` (vitest) passes — check `tests/` for any strategy/intelligence-api unit tests
  that assert the Kimi request body; update them to the DeepSeek shape.
- With `DEEPSEEK_API_KEY` set, hit each route once (phase-synthesis, strategy-draft,
  intelligence-snapshot-v1) and confirm a valid parsed payload, not a 500/502.
- Confirm `parseIntelligenceBriefPart1/2` and strategy section parsing still succeed against
  live JSON-mode output (this is the highest-risk regression).

---

## Workstream 2 — Split Category Scout + Distribution into a standalone combo

**Goal:** Category Scout and Distribution Strategy become their own paired "Market Research"
tool, visually and navigationally separated from the ND context suite. They already share the
project/session shell (`usesProjectShell` in `App.tsx:468`) — formalize that grouping.

### Current state
- Both render inside the single `App.tsx` body alongside context-builder/process-designer/skills.
- Routes: `/category-scout`, `/distribution-strategy` (in `tool-routes.ts` + `app/<dir>/page.tsx`
  + `persistent-app-shell.tsx` SUITE_ROUTES).
- They already pass session between each other (`onOpenDistributionStrategy`,
  `onBackToResearch`).

### Tasks
1. **Introduce tool grouping.** In `src/lib/tool-routes.ts`, add a group concept:
   - `ND_SUITE_TOOLS = ["context-builder", "process-designer", "spine-finder", "skills"]`
   - `MARKET_TOOLS = ["category-scout", "distribution-strategy"]`
   Export a helper `getToolGroup(tool): "nd" | "market"`.
2. **Separate nav.** In `App.tsx` (lines 538-568) render two pill clusters instead of one flat
   `TOOL_LINKS.map`, OR — cleaner — render only the active group's pills plus a single
   top-level switch ("ND Context Suite" ⇆ "Market Research"). Match PRODUCT.md: calm, no
   chrome. Recommend a small segmented control above the rule for the two groups, then the
   in-group pills below.
3. **Optional combined landing route.** Add `/market-research` (new `app/market-research/page.tsx`
   + SUITE_ROUTES entry + tool-routes) that defaults to category-scout, so the combo has its own
   entry point. Decide with Adam whether this is wanted or whether the two existing routes +
   grouped nav suffice (see Open questions).
4. **Header treatment.** The "NeuroDiv OS" header + project drawer already only show for the
   market tools (`usesProjectShell`). Keep that; ensure the ND-suite tools get the
   context-first intro (Workstream 3) and the market tools keep the project drawer.

### Verification
- Navigating `/category-scout` ⇄ `/distribution-strategy` keeps session/project state (it
  already does via `useProjectSession`); confirm grouping didn't break the shared shell.
- ND-suite nav no longer lists the two market tools inline (they're under their own group).

---

## Workstream 3 — Redesign home to center the ND Context Builder as the spine

**Goal:** Home reframes the product as **context-building first**, with each tool presented as a
*layer of context*, and a navigation that scales as tools are added.

### Current state
- `app/page.tsx` is nearly empty (just StructuredData); `PersistentAppShell` maps `"/"` →
  `context-builder`, so `App.tsx` IS the home. The intro copy (`App.tsx:527-536`) already
  centers Context Builder. Nav is a flat pill row.

### Tasks
1. **Layered framing.** Redesign the home/context-builder view in `App.tsx` (the
   `!embedded` intro block + context-builder `ToolSection`) so the mental model is explicit:
   Context Builder is the base layer; each other tool *reads from and adds to* that context.
   Render a "context stack" — an ordered, calm list/diagram of layers:
   1. Context Builder (foundation — your operating profile)
   2. Process Designer (turns a goal into an energy-aware process)
   3. Spine-Finder (finds the central question your work answers to) ← new, WS4
   4. Market Research combo (Category Scout → Distribution) — applied context for a venture
   5. Skill Suite (carries all of it into your own AI)
   Each layer = one row: name, one-line "what context it adds," status (built / not yet),
   link. No gradients/glass per PRODUCT.md anti-references; hairline rules, mono labels.
2. **Scalable navigation.** Replace the flat pill row with a structure that survives 8-12 tools.
   **The specific nav pattern is a design-phase decision, not prescribed here** (Adam: not a
   plan-time choice). Constraints the chosen pattern must meet: survives ~8-12 tools without
   ugly wrapping, respects reduced-motion, low cognitive load, no chrome-for-chrome's-sake per
   PRODUCT.md. Codex should produce 2-3 visual options in the design phase and get a pick
   before building.
3. **Primary CTA = build context.** The home's single stated primary action is "Start with
   Context Builder" (per clarity rules — one primary action, not a menu of equals). Other
   tools are reachable but visually secondary until context exists.
4. **Empty-vs-built states.** If a context profile exists (`ndProfileContext` is non-null),
   show the stack with Context Builder marked built and downstream tools "unlocked"/inviting.
   If not, downstream layers read as "build your context first." Honest empty states per
   PRODUCT.md principle 5 — no upgrade-bait.

### Verification
- Fresh load (no profile): home leads with Context Builder, downstream tools clearly secondary.
- With a saved profile: stack reflects built state; downstream tools invite use.
- Add a dummy 7th nav item mentally — confirm the nav layout doesn't break or wrap ugly.

---

## UI Redesign Specification (governs WS2, WS3, WS4)

Produced via the `impeccable` design system against the loaded PRODUCT.md + DESIGN.md.
Register: **product** (the design serves the work; the tool disappears into it — PRODUCT.md
"tool-first, the work speaks not the chrome"). This section is the visual contract for every
nav/layout/home change. Where it conflicts with a reflex toward "modern SaaS polish," this
section wins — that polish is explicitly an anti-reference here.

### Design intent (one sentence)
A neurodivergent founder, alone at an irregular hour, opening a calm instrument that shows
them what they've built and what each next tool will add — never what they "should" be doing.

### Non-negotiable constraints (from PRODUCT.md + DESIGN.md, do not violate)
- **Restrained color only.** Warm cream canvas (`--cream #FDFBF7`), warm near-black ink, a
  single teal accent used *as signal* (status, the one primary action, focus). Terracotta =
  error/high-effort only. Amber = uncertain only. No second decorative accent. Accent surface
  coverage stays ≤10%.
- **No shadows. Ever.** Depth = 1px hairline rules (`--rule`) + flat background tints. (This
  is in DESIGN.md and matches impeccable's no-generic-shadows floor.)
- **Square cards, square inputs.** Radius only on pills/chips (`999px`). No rounded cards.
- **Calm is a feature.** No urgency cues, no loading anxiety, no "you could be doing more"
  signals, no animated attention-grabs. Respect `prefers-reduced-motion` (already wired).
- **Typography does the hierarchy.** Satoshi display/body, JetBrains Mono for labels/metadata
  (uppercase, tracked). Hierarchy via scale + weight (≥1.25 step ratio), not color or boxes.
- **Content max-width 560–680px.** The current `App.tsx` body is `maxWidth: 960` — see layout
  task below; reading column stays ≤680, full-width is reserved for nav/stack chrome.

### Hard anti-references (reject on sight — these are PRODUCT.md's named enemies)
SaaS dashboard chrome (gradients, glass, hero-metric blocks), AI-tool aesthetic ("powered by
AI" language, neural/network motifs, Cursor/Perplexity energy), growth-hacker CTAs (bright
buttons, conversion pressure), McKinsey-deck density. If a change would let someone say "an AI
designed this" or "this is a generic AI startup," it has failed.

### Resolved — retire the 3px left-border card accent (Adam, 2026-06-25)
DESIGN.md §Elevation and §Structured Section Cards specify a **3px solid left-border accent**
on strategy cards and callouts. The impeccable system bans side-stripe borders (>1px colored
left/right border as accent) as a generic tell. **Adam resolved this in impeccable's favor:
remove the stripe everywhere.** Both new and legacy surfaces use the hairline/dot/tint
vocabulary instead.

Replacement vocabulary (use these to carry the meaning the stripe used to carry):
- **Type/category signal** (was: colored left-stripe on callouts by type) → a leading mono
  uppercase micro-label (e.g. `RISK`, `OPPORTUNITY`) in the type's color, or a 6px status dot
  (teal/terracotta/amber per existing Status Dots spec), plus a flat background tint
  (`rgba` fill at ~4–6% of the type color). No side border.
- **Anchor/structured section emphasis** (was: 3px teal left-border) → full `1px solid
  var(--rule)` border on all four sides + heavier section-name weight, or a leading mono
  index. Emphasis through weight and the existing 36px index column, not a stripe.
- **Error/blocked state** → terracotta dot + terracotta micro-label + faint terracotta tint,
  never a terracotta left-border.

Migration is a real task — see Migration task below. It touches the shipped strategy/
intelligence UI, so it carries regression risk; verify visually before calling it done.

### Migration task — remove existing 3px left-stripes (do as part of WS3, before new UI lands)
1. Find every left-stripe accent: `grep -rinE "border-left|borderLeft" src components app`
   (excluding node_modules). Expected hits in the structured strategy/intelligence cards and
   callouts (e.g. `StrategySectionCard.tsx`, `Intelligence*` components, callout renderers).
2. Replace each per the vocabulary above. Keep the *meaning* (type, emphasis, error) intact;
   only change how it's expressed. Do not drop the signal — a callout that was "teal-striped =
   actionable" must still read as actionable via dot/label/tint.
3. Confirm no `border-left`/`borderLeft` > 1px colored accent survives anywhere in the app.
4. Visual check: load `/distribution-strategy` with a completed strategy + intelligence brief
   and confirm every former-striped element still reads with correct emphasis/type/state.

### Layout system for the redesigned home + nav (WS3 + WS2)

**The home is a "context stack," not a tool grid.** Reject the identical-card-grid cliché
(impeccable absolute ban). The stack is a single vertical column of *rows*, each row one
context layer, in dependency order. A row is not a card — it's a hairline-separated band.

Per-row anatomy (left → right, single line that wraps gracefully on narrow screens):
- **Leading mono index** — `01`, `02`… JetBrains Mono 11px, `--ink-muted`, fixed ~36px column
  (reuse the existing 36px index-column pattern from DESIGN.md §Section Cards). This carries
  "order / depth" — it replaces any left-stripe.
- **Layer name** — Satoshi 15–17px, weight 500. The foundation layer (Context Builder) gets
  the heaviest treatment; downstream layers step down in weight, not in a different color.
- **One-line "what context it adds"** — Satoshi 13px, `--ink-muted`. Exactly one line. This is
  the whole pitch for the layer; no paragraph.
- **State chip** — mono uppercase 10px pill. `BUILT` (teal text on faint teal tint) when the
  layer has produced context; `NOT YET` (`--ink-muted`, no fill) otherwise. The chip is the
  only place teal appears in a row, and only when earned. No progress bars.
- **Affordance** — the whole row is the link (large hit target, ND-friendly). No separate
  button per row; the single page-level primary action is the exception below.

Vertical rhythm: rows separated by `1px var(--rule)`, generous row padding (~16–20px vertical)
so the stack breathes — varied spacing, not a dense table (impeccable: "same padding
everywhere is monotony"; PRODUCT.md: low cognitive load per screen).

**The foundation layer reads differently.** Context Builder (layer 01) is visually the base of
the stack: slightly more vertical space, the heaviest name weight, and — when no profile
exists — the *only* row carrying the page's single primary action ("Start with Context
Builder", teal pill, DESIGN.md button spec). Downstream rows render quiet/secondary until a
profile exists. This is the "shift focus to context as primary function" requirement, done
through hierarchy rather than hiding.

**Empty vs built (honest states, PRODUCT.md principle 5):**
- No profile: layer 01 active + primary CTA; layers 02+ are legible but visibly secondary
  (lighter weight, `NOT YET` chips), with a single quiet line under the stack: "Each tool
  reads from your context. Build it first." No lock icons, no upsell, no blur.
- Profile exists: layer 01 shows `BUILT` with a one-line summary of what's captured; layers
  02+ become inviting (full-weight names, the CTA moves to "next unbuilt layer" or disappears).

### Navigation (WS2 grouping + WS3 scalability)

The flat pill row in `App.tsx:538–568` is replaced. **Pattern is a design-phase decision**
(Adam deferred it) — Codex produces 2–3 options as static mockups and gets a pick before
building. All options must satisfy:
- Two groups visibly distinct: **ND Context Suite** (Context Builder, Process Designer,
  Spine-Finder, Skills) and **Market Research** (Category Scout, Distribution Strategy).
- Survives 8–12 tools without ugly wrapping.
- Built from the existing vocabulary only: mono group labels, pill items (`999px`), teal =
  active item, hairline separators. No icons-in-a-rail unless they're thin/custom (no thick
  Lucide-style icons — impeccable floor).
- The active item is the *only* filled-teal element; inactive items are ghost pills with
  `--ink-muted` text (matches current `nav-pill` treatment, just grouped).

Candidate options for Codex to mock (not prescriptive — explore):
1. **Group label + pill cluster per group**, stacked, the inactive group's label muted.
2. **Segmented group switcher** (two-segment control: Context Suite ⇆ Market Research) with
   only the active group's pills shown below it.
3. **Quiet left rail** of group labels on wide screens, collapsing to option 2 on narrow.
Each mock: cream bg, real labels, show active + hover + the 8-tool overflow case.

### Motion (keep what exists, add nothing loud)
Reuse the DESIGN.md motion spec: spring `stiffness 240–300 / damping 25–28` for expand/collapse,
`0.2s` opacity fades, `delay: index * 0.04` stagger on stack-row entry (subtle, once, on first
paint — not on every nav). Ease-out only, no bounce/elastic. Animate transform/opacity only,
never layout properties. Under `prefers-reduced-motion`, rows appear with no stagger.

### Copy rules for all new UI strings (WS2/WS3/WS4)
- One line per layer description; every word earns its place; no heading that restates the
  nav label.
- **No em dashes** in UI copy (commas/colons/periods/parens instead). (Plan prose may keep
  them; shipped interface strings may not.)
- No urgency, no "unlock," no "boost/supercharge," no "powered by AI." Calm, plain, true.
- Run the `copy-audit` skill on the home stack copy and nav labels before they ship.

### Spine-Finder visual conformance (WS4)
Spine-Finder inherits this entire system. Specifics already in WS4 task 6 plus: the four
movements are hairline-separated panels in one column (not a wizard with chrome), state labels
are mono uppercase, the only teal is the single forward action per movement, terracotta only
when a candidate fails a silent structural check, amber only on explicitly uncertain insights.
No card grid of insights — insights are a calm vertical list, receipts disclosed inline on
demand (spring expand), never a table the user "reviews."

### Design verification (run before WS2/WS3/WS4 are called done)
- **AI-slop test:** could someone say "an AI designed this"? If yes, rework. No gradients, no
  glass, no hero-metric block, no identical card grid, no thick icons, no second accent, and
  **no colored side-stripe borders anywhere** (new or legacy — see Migration task).
- **Category-reflex test:** does it look like a generic "neurodivergent productivity app"
  (soft pastels, rounded blobs, cute mascot)? If yes, rework — this is a quiet instrument.
- **Calm test:** screenshot the home; is there any urgency cue, any element competing for
  attention, any color that isn't earned signal? There should be none.
- **Hierarchy test:** with color removed (grayscale screenshot), is Context Builder still
  clearly the primary layer? It must be — hierarchy is structural, not chromatic.
- **Scale test:** mock the nav with 10 tools; does it still read calmly and not wrap badly?
- **Reduced-motion test:** with `prefers-reduced-motion`, nothing staggers or springs.

---

## Workstream 4 — Integrate Spine-Finder into the ND context suite

**Goal:** Ship Spine-Finder as a first-class tool in the app, reading from the ND profile like
the other context tools. Spec is canonical in `spine-tool/Spine-Finder-Tool-Spec.md` (revised
2026-06-25, four movements: Intake → Insights → Check-in → Drafts → Close).

### Tasks
1. **Route + type plumbing.**
   - `src/lib/tool-routes.ts`: add `"spine-finder"` to `ActiveTool`, `TOOL_ROUTES`
     (`/spine-finder`), `TOOL_LINKS`, and the ND group (WS2).
   - `components/persistent-app-shell.tsx`: add `"/spine-finder": "spine-finder"` to
     `SUITE_ROUTES`.
   - New thin route `app/spine-finder/page.tsx` (mirror `app/process-designer/page.tsx` —
     metadata + render path; the shell does the rest).
2. **Component.** Create `src/components/SpineFinder.tsx` and wire it in `App.tsx` with a
   `ToolSection` (label "Spine-Finder", description from the spec's product promise). Mirror
   `NDProcessDesigner` for structure, including `onOpenContextBuilder` fallback.
3. **Data model — IN-MEMORY ONLY.** Add the spec's types (Lens, EvidenceItem, Insight,
   ProblemDomain, SpineQuestion, DraftGateReport, SpineFinderOutcome — spec lines 189-316) to
   `src/types.ts` or a new `src/lib/spine-finder.ts`. **Spine-Finder persists NOTHING**
   (Adam, 2026-06-25): do NOT wire it into `useProjectSession`/`storage.ts`, do NOT write to
   localStorage or any project store. All movement state lives in component state for the
   duration of the session and is gone on reload. The "Close/Save" movement's outcome is a
   **download/export to take into the Compression Framework**, not an in-app saved record.
   This overrides spec §5's saved-artifact framing and MVP DoD #8 (reopen with receipts) —
   those assumed persistence; there is none. The "save" outcome states still exist as the
   *export's* status field, just not as stored app state.
4. **Movements UI.** Build the four user-facing movements + Close per spec. Hard rules to honor
   (these are the spec's whole point — do not soften):
   - User reacts to findings; **never grades the tool's scaffolding** (no evidence-row audit UI).
   - Insights ≤ 7, deep, each with on-demand receipts ("From your words", not labeled
     "evidence").
   - Drafts = plural labeled problem **domains** with 1-3 nested **question-form** spines,
     pitched larger than self; **no "none" button** — "write my own from these" is the equal
     second win.
   - Structural checks run silently; surface only on failure.
   - Non-final save states are successes (`own_version_going_to_journal`, etc.).
5. **Backing AI route(s).** Spine analysis needs an LLM call (intake → insights, insights →
   drafts). Add `app/api/spine-*` route(s) using the **DeepSeek** client from WS1 (do WS1
   first). Two structured calls: (a) passes → insights[], (b) reacted-insights → problem
   domains[]. Reuse `callDeepseekStructured` with per-call JSON schemas.
6. **UI language.** Cream canvas, hairline rules, square panels, mono state labels, teal =
   actionable, terracotta = error, amber = uncertain (spec UI Requirements). Reuse `src/components/ui`.

### Verification
- Walk the MVP DoD (spec lines 369-381) **minus persistence**: enter pain+pull → get ≤7
  insights with receipts → react → get plural question-form domains → take one OR "write my
  own" → silent check surfaces only on failure → reach a Close outcome and **export it**.
  Skip DoD #8 (reopen with receipts) — no persistence by design; reload resets the tool.
- Validate against the Adam seed example (spec lines 382-392): center "Autonomy, and the
  pressure to surrender it" survives without the tool over-producing a grand narrative.

---

## Workstream 5 — Refine + verify all downloadable skills

**Goal:** Every skill exposed in the Skill Suite is current, internally consistent, and
correctly bundled — including the newly added Spine-Finder skill.

### Current state
- Downloadable skills = `PUBLIC_SKILL_SLUGS` in `lib/skills-data.ts:7-13`:
  `nd-context-builder`, `nd-process-designer`, `category-scout`, `distribution-strategy`,
  `nd-session-loop`.
- Source in `skills/<slug>/SKILL.md` (+ `agents/openai.yaml`), shared refs in
  `skills/_shared/`. Build copies to `public/skills/`. Bundles attach the four `_shared` files.
- `spine-tool/SKILL.md` exists (slug `spine-finder`) but is NOT in `skills/` and NOT exposed.

### Tasks
1. **Promote Spine-Finder to a real skill.** Create `skills/spine-finder/SKILL.md` (from
   `spine-tool/SKILL.md`, reconciled against the revised four-movement spec — the spec was
   revised 2026-06-25; confirm the SKILL.md matches, not the superseded six-panel version).
   Add `skills/spine-finder/agents/openai.yaml` matching the pattern of
   `skills/category-scout/agents/openai.yaml`. Add `"spine-finder"` to `PUBLIC_SKILL_SLUGS`
   and `BUNDLE_DISPLAY_NAMES` in `lib/skills-data.ts`.
2. **Audit each skill's frontmatter + body** for: correct `name`/`description`/`version`,
   accurate `relatedSkills`/`dependencies`, working `../_shared/...` references (the bundler
   regex at `skills-data.ts:92` only picks up `../_shared/...` paths — verify each skill that
   needs shared files actually references them that way).
3. **Cross-check shared files.** `BUNDLE_SHARED_FILES` (`skills-data.ts:16-21`) attaches
   architecture/artifact-contracts/surface-map/github-distribution to *every* bundle. Confirm
   `skills/_shared/` contains all four and that `surface-map.md` reflects the new tool layout
   from WS2/WS3/WS4 (it likely names the tools/routes — update it).
4. **Consistency pass.** Make sure skill descriptions match what the in-app tools now do after
   WS2-4 (e.g. Category Scout + Distribution as a combo; Spine-Finder added; context-layer
   framing). Run `copy-audit` skill on any user-facing skill copy that changed.
5. **Rebuild + verify bundling.** Run `npm run build` (or just `node scripts/copy-skills.cjs`)
   and confirm `public/skills/spine-finder/` and all others copy cleanly, then load `/skills`
   and download each bundle.

### Verification
- `/skills` lists all six (five existing + spine-finder) in `PUBLIC_SKILL_SLUGS` order.
- Each download bundle contains SKILL.md + agents/openai.yaml + the four `_shared` files,
  with no broken `../_shared` references.
- Frontmatter parses (no skill silently dropped by `listSkills` due to missing SKILL.md).

---

## Suggested execution order
1. **WS1 (DeepSeek)** — unblocks WS4's AI route; isolated, testable.
2. **WS2 (tool grouping)** — pure routing/nav refactor; small surface; sets up WS3.
3. **WS4 (Spine-Finder)** — biggest build; depends on WS1 (AI) + WS2 (group).
4. **WS3 (home redesign)** — best done once Spine-Finder exists so the layer stack is complete.
5. **WS5 (skills)** — last; needs final tool layout to write accurate skill copy + surface-map.

## Decisions (resolved 2026-06-25)
- **WS1 — RESOLVED:** JSON mode first, fall back if unreliable. Default `deepseek-v4-flash`.
- **WS4 storage — RESOLVED:** Spine-Finder persists nothing. In-memory only; Close = export.
- **WS3 nav — DEFERRED TO DESIGN PHASE:** Codex produces 2-3 nav options and gets a pick
  before building. Not a plan-time decision.

## Still open (resolve before the affected workstream)
- **WS2:** do you want a dedicated `/market-research` combined entry route, or just grouped nav
  over the two existing routes?

---
Sources for the DeepSeek constraint:
- https://api-docs.deepseek.com/guides/function_calling
- https://github.com/deepseek-ai/DeepSeek-V3/issues/1376
- https://api-docs.deepseek.com/guides/thinking_mode
