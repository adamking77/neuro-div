# Strategy Section UI/UX — Plan (Final)

## Structure: two commits

- **Commit A** — Copy, fields, button placement (items 1–5)
- **Commit B** — Output layout restructure (item 6)

---

## Commit A — Copy, fields, button placement

**Files touched:**

- `src/components/StrategyView.tsx` (primary)
- `src/types.ts` (contentMode union + new `contentModeOther` field)
- `api/_lib/strategy-api.ts` (include `contentModeOther` text in the Claude prompt when `"other"` selected)
- `tests/strategy.test.ts` (fixtures + one new assertion)

### Changes

#### 1. Generate button location swap

- `drawerOpen === false` → button renders in the summary bar (current location).
- `drawerOpen === true` → button hidden from summary bar, rendered at the bottom of `InputForm`, right-aligned below the last field row.
- Pass button props (`canGenerate`, `buttonLabel`, `strategyRunning`, `onGenerate`) into `InputForm` so it can render the conditional button.

#### 2. "Existing Credibility" → "Existing Work And Assets"

- Rename `FieldLabel`.
- Replace placeholder with: *"Published writing, shipped tools, case studies, press mentions, named clients — anything a stranger could find and verify without your say-so."*
- No helper subcomponent — placeholder carries the explanation.

#### 3. "Content Mode" → "Formats You'll Produce"

- Rename `FieldLabel`.
- Add `interactive` option (label: "Interactive"), positioned after "Design". PDA-friendly "product-is-the-marketing" mode.
- Add `other` option (label: "Other"). When toggled on, reveal an inline text input directly below the pill row. Input binds to new `contentModeOther` field.
- Type update in `src/types.ts`:

  ```ts
  contentMode: Array<"writing" | "short-video" | "audio" | "design" | "interactive" | "other" | "none">;
  contentModeOther: string;
  ```

- `CONTENT_LABELS` map: add `"interactive" → "Interactive"`, `"other" → "Other"`.
- Prompt update in `strategy-api.ts`: when `"other"` is in `contentMode`, append the `contentModeOther` text to the founder constraints block.
- Fingerprint picks up the new field automatically (serializes full `StrategyInputs`).

#### 4. "Outreach" → "Outreach Preferences"

- Relabel only. No type or logic change.

#### 5. "Team Size" → "Your Team"

- Relabel only. No type change.

### Test updates

- Add `contentModeOther: ""` to any test fixtures constructing `StrategyInputs`.
- Verify fingerprint test still passes with extended input shape.
- Add one assertion: when `"other"` is selected with `contentModeOther` populated, the Claude prompt includes that text.

---

## Commit B — Output layout restructure (item 6)

**Files touched:**

- `src/components/StrategyView.tsx` (`StrategyContent` + `StrategyLoadingState`)

### Changes

Replace the flat 2-column grid in `StrategyContent` with three rows:

```
Row 1: Positioning                     [full-width hero]
Row 2: Channel Plan  │ Message Angles  [2×2 grid]
       Asset Ideas   │ Experiments
Row 3: 30-Day Sequence                 [full-width output]
```

### Implementation

- Wrap sections in a flex-column container, `gap: 24`.
- `STRATEGY_SECTIONS[0]` → renders directly (full width).
- `STRATEGY_SECTIONS.slice(1, 5)` → nested 2-column grid.
- `STRATEGY_SECTIONS[5]` → renders directly (full width).
- `SectionCard` gets no new props — existing `isAnchor` / `isOutput` index logic stays.
- Relax internal textarea `minHeight` on hero + output cards from `300px` → `220px` (full-width cards don't need as much vertical room). Middle 2×2 cards keep `300px`.
- `StrategyLoadingState` mirrors the same 3-row structure to avoid layout flash on loaded.

### Mobile fallback

- Row 2's 2-column grid collapses to single column below ~720px. Add an inline breakpoint or reuse the `.constraints-grid` pattern already in `index.css`.

### Deferred

- Sticky table-of-contents navigator. Skip until the hierarchical layout has been used for a while — it may already solve the readability problem.

---

## Addendum — Structured Existing Work and Assets (supersedes part of item 2)

**Context:** Item 2 in Commit A originally reused the free-text textarea with an improved placeholder. On reflection, the field is already list-shaped — structured rows produce better strategy output (Claude can cite entries by name/URL) and survive better if a save layer is added later. This addendum replaces the textarea approach.

**Label rename still stands:** "Existing Credibility" → "Existing Work And Assets". Only the input shape changes.

**Scope note:** Channel Avoidances stays as a free-text textarea. The principle: structure when the strategy needs to *reference entries by name*, leave as prose when entries are just *things to exclude*.

### Schema change

Replace the `existingCredibility: string` field in `StrategyInputs` with a structured array:

```ts
existingAssets: Array<{
  name: string;
  url: string;
  description: string;
}>;
```

- All three fields are stored as `string` (not `string | undefined`) for cleaner React form binding. Empty string = not provided.
- Default value: one empty row — `[{ name: "", url: "", description: "" }]` — so the empty state shows a visible row, not a button-to-add.
- Only `name` is treated as required to count as an entry during serialization. `url` and `description` are optional sugar.

### New component: `AssetRowEditor`

A repeating-row editor rendered in place of the Existing Credibility textarea.

**Row structure (desktop):**

```
┌─────────────┬──────────────┬──────────────────────────────┬─────┐
│ Name*       │ URL          │ Short description            │  X  │
└─────────────┴──────────────┴──────────────────────────────┴─────┘
```

- Grid: `1fr 1fr 2fr 32px` (name, url, description, remove button column).
- All three inputs are single-line `<input>` elements styled to match existing form inputs.
- Remove button (X) sits in a fixed 32px column at the end of the row.
- Remove button is hidden when the row is the **only row AND all three fields are empty** (avoids showing a remove affordance on a fresh form).

**Below the rows:**

- A text button: **"+ Add asset"** — appends a new empty row.
- Hitting Enter in the last row's description field can also append a row (nice-to-have, low priority).

**Placeholders (per column):**

- Name: `GenZen Solutions`
- URL: `genzen.solutions`
- Description: `counter-exploitation agency, 6 years running`

(Generic examples are fine; users will overwrite on first entry.)

### Mobile stacking (below ~720px)

- Row collapses to single column: Name / URL / Description stack vertically.
- Remove button (X) pins to the top-right of the row, outside the stacked fields.
- Reuse the existing `.constraints-grid` breakpoint logic in `index.css`, or add a scoped media query for `AssetRowEditor`.

### Prompt serialization (`api/_lib/strategy-api.ts`)

Serialize the array into a clean markdown-ish list for Claude. Rows with empty `name` are filtered out so a half-filled form doesn't pollute the prompt.

```ts
const assetLines = existingAssets
  .filter((a) => a.name.trim().length > 0)
  .map((a) => {
    let line = a.name.trim();
    if (a.url.trim()) line += ` (${a.url.trim()})`;
    if (a.description.trim()) line += ` — ${a.description.trim()}`;
    return `- ${line}`;
  })
  .join("\n");
```

Produces:

```
- GenZen Solutions (genzen.solutions) — counter-exploitation agency, 6 years
- 'Legacy Hijacking' essay (medium.com/...) — 3K reads
- Shadow Lotus investigation — ongoing case, 250+ signals
```

When `assetLines` is empty (no rows with a name), omit the "Existing Work and Assets" section from the founder constraints block entirely — don't send an empty header.

### Files touched (delta from original Commit A)

- `src/types.ts` — replace `existingCredibility: string` with `existingAssets` array schema.
- `src/components/StrategyView.tsx` — remove the Existing Credibility textarea; add new `AssetRowEditor` subcomponent; update `InputForm` layout to host it.
- `api/_lib/strategy-api.ts` — replace the `existingCredibility` passthrough with the serialization logic above.
- `tests/strategy.test.ts` — fixture updates (see below).

### Test updates

- Update all `StrategyInputs` fixtures to use the new `existingAssets` array shape.
- Add assertion: serialized prompt contains a properly formatted asset line when name + url + description are all populated.
- Add assertion: rows with empty `name` are filtered out of the prompt.
- Add assertion: when no assets have a name, the prompt omits the section entirely (no dangling header).
- Fingerprint test should continue to pass unchanged (serializes the full input object).

### Not changing

- Label rename ("Existing Credibility" → "Existing Work And Assets") stays as specified in item 2.
- All other items (1, 3, 5 in Commit A, and all of Commit B) stay as specified.
- Channel Avoidances remains a free-text textarea.

---

## Addendum — Outreach Preferences expansion (supersedes item 4)

**Context:** Item 4 originally specified a label-only change ("Outreach" → "Outreach Preferences"). Two additions land alongside the rename: a new fourth rung on the outreach ladder, and a separate peer collaboration toggle that captures a dimension the single-select ladder can't.

**Label rename still stands.** The SegmentedControl stays single-select.

### Add "Live calls" to the outreach ladder

Extend the union from three options to four:

```ts
outreachTolerance: "inbound-only" | "warm-intro-ok" | "async-email-ok" | "live-calls-ok";
```

Order in the SegmentedControl (least → most friction):

1. Inbound
2. Warm intro
3. Async email
4. Live calls

Update `OUTREACH_LABELS` map: add `"live-calls-ok" → "Live calls"`. The summary-bar MiniPill picks up the new value automatically.

### Add peer collaboration toggle

New field in `StrategyInputs`:

```ts
peerCollaborationOk: boolean;
```

Default: `false`.

**UI placement:** Render directly below the Outreach SegmentedControl, inside the same grid cell so outreach-related controls stay visually grouped. Use the same pill-button pattern as `MultiPillSelector` — a single pill that toggles between outlined (off) and teal-filled (on).

- **Label on the pill:** "Peer collaboration"
- **Helper text below the pill** (muted, ~11px): *"Content swaps, podcast guesting, cross-promotion with other operators."*

This is the only helper text in the form. Justified here because the field is a binary toggle with no placeholder to carry context.

### Prompt serialization

In `api/_lib/strategy-api.ts`, append to the founder constraints block:

- When `peerCollaborationOk === true`: include *"Open to peer collaboration (content swaps, podcast guesting, cross-promotion with other operators)."*
- When `false`: omit entirely (absence = not willing).

The existing `outreachTolerance` handling stays as-is — the prompt builder picks up the new `"live-calls-ok"` value automatically since it uses the raw string. If the current prompt builder switch-cases on outreach values explicitly, add a branch for `"live-calls-ok"` with language like *"Willing to take scheduled 1:1 calls once a connection exists."*

### Files touched (delta from original Commit A)

- `src/types.ts` — extend `outreachTolerance` union, add `peerCollaborationOk: boolean`.
- `src/components/StrategyView.tsx` — add "Live calls" option to the Outreach SegmentedControl; add peer collaboration pill + helper text below it.
- `api/_lib/strategy-api.ts` — append peer collaboration line when true; ensure `"live-calls-ok"` is handled in outreach serialization.
- `tests/strategy.test.ts` — fixture updates, new assertions (see below).

### Test updates

- Add `peerCollaborationOk: false` to all `StrategyInputs` fixtures.
- Add assertion: when `outreachTolerance === "live-calls-ok"`, the serialized prompt reflects live-call acceptance.
- Add assertion: when `peerCollaborationOk === true`, the prompt includes the peer collaboration line.
- Add assertion: when `peerCollaborationOk === false`, the prompt does NOT include a peer collaboration line.
- Fingerprint test continues to pass unchanged (serializes the full input object).

---

## Commit C — Agent Brief export

**Context:** Category Scout produces strategies as human-readable reports. The Strategy Layer should also produce a *portable, agent-consumable artifact* that the user feeds to their own AI system (Steve, Claude Code, Jason's agent, generic Claude) to run as an ongoing practice. This is the third commit in the Strategy section work.

### Framing decisions (locked in)

- **No live agent integrations.** Too many targets, fragile, runtime lock-in. The brief is a self-contained markdown file any competent agent can absorb.
- **Two artifacts, one strategy generation.** The Report (existing) and the Agent Brief (new) render from the same `StrategyDraft` + `StrategyInputs` data. No duplicate pipeline, no second LLM call.
- **Rhythm-neutral.** The brief describes execution *shape* (batched bursts, ambient quiet, invitation register, one-thing-at-a-time) and tells the receiving agent to map that shape onto the user's own system. Does not name specific weekly themes.
- **PDA-first voice.** The agent is instructed to surface moves as invitations, not assignments; to track outcomes; to flag staleness; to preserve founder edits.
- **Client-side renderer.** No server call. Pure function. Cheap, fast, deterministic.

### Scope

**In:**

- Pure renderer: `renderAgentBrief(draft, inputs, problemStatement) => string`
- Second export button in StrategyView header ("Agent Brief")
- File download with `{slug}-agent-brief.md` naming
- Full markdown schema as specified below

**Out (deferred, not part of Commit C):**

- Live integrations (Steve API, Claude Code skill bundle, MCP shape)
- Persistence / history of exported briefs
- Structured JSON output alongside markdown
- Per-action executor tagging (requires Claude prompt changes to produce structured actions)
- Second LLM pass for prose quality

### Files touched

- `src/lib/strategy.ts` — add `renderAgentBrief()` pure function + template constants
- `src/components/StrategyView.tsx` — second export button in header, wire handler
- `src/App.tsx` — add `handleAgentBriefExport` mirroring existing `handleExport`
- `tests/strategy.test.ts` — unit tests for the renderer

### Agent Brief — top-level structure

One markdown file, sections in this order:

1. Title + generation date
2. **For the receiving agent** (hardcoded preamble — proposed text below)
3. **Founder profile** (rendered from `StrategyInputs`)
4. **Existing work and assets** (rendered from structured array; "none listed" if empty)
5. **Hard constraints** (hardcoded — the non-negotiables that apply regardless of strategy evolution)
6. **The strategy** (six sections as markdown prose, same content as Report)
7. **Warnings surfaced by the planner** (from `draft.warnings`; omit section if empty)
8. **Evidence / citations** (from `draft.citations`, grouped by section; omit section if empty)
9. **Execution shape** (hardcoded guidance — proposed text below)
10. **Evolution protocol** (hardcoded — proposed text below)

### Proposed text — "For the receiving agent"

> This is a distribution strategy for a PDA-neurodivergent founder. Treat it as a *living plan*, not a one-time execution list.
>
> The founder cannot sustain pushed demands. Surface relevant moves as **invitations, not assignments**. Expect to engage with this strategy across batched work sessions separated by ambient quiet — not as a daily task queue. When the founder returns to distribution work, orient them to where they are in the plan and what's available, rather than presenting a list.
>
> Key expectations of the receiving agent:
>
> 1. **Respect hard constraints** (listed below). Do not suggest moves that violate them, even if the strategy evolves.
> 2. **Surface one thing at a time** during active distribution work. Never present a full sequence as a to-do list.
> 3. **Track outcomes.** When the founder engages with a move, log what was tried, what happened, what was dropped. Update this brief over time.
> 4. **Flag staleness.** When accumulated outcomes indicate the strategy is drifting from reality, suggest the founder regenerate from Category Scout with updated context.
> 5. **Integrate with the founder's own system.** The founder already has a working rhythm; map the strategy's execution shape onto that rhythm without imposing a new one.

### Proposed text — "Hard constraints"

> - Low-contact is a hard constraint, not a preference. Do not propose high-touch outreach regardless of perceived opportunity.
> - Create-once over do-again. Favor assets that compound without maintenance over recurring tasks.
> - No demand stacking. One focus at a time.
> - Respect stated channel avoidances without exception.

### Proposed text — "Execution shape"

> How this strategy wants to be *paced*, independent of any specific weekly rhythm:
>
> - **Batched bursts.** Execution work happens in concentrated sessions, not distributed across days. The founder can accomplish several strategy items in one focused sitting; that is preferred over spreading them thin.
> - **Ambient quiet between bursts.** Between work sessions, do not surface pending items. Previously-built assets continue working in the background; the founder is not "behind."
> - **Invitation register.** All surfacing language should be optional ("there's an X queued — want to start it?"), not imperative.
> - **One thing visible at a time.** When the founder is actively engaged with the strategy, show a single move, not a list. The next move comes after the current one is closed (completed, dropped, or deferred).
>
> Map this shape onto the founder's existing operating rhythm. Do not impose a specific cadence.

### Proposed text — "Evolution protocol"

> When the founder engages with this strategy:
>
> 1. **Log outcomes** against specific moves. What was tried, what happened, what was dropped.
> 2. **Surface staleness** when accumulated outcomes indicate the strategy is drifting. Suggest regeneration from Category Scout rather than attempting to rewrite internally.
> 3. **Preserve the founder's edits.** If the founder has edited strategy sections inside Category Scout, those represent deliberate decisions. Do not silently replace them when regenerating.

### UI addition

- Second export button placed to the **left** of the existing Export button in the Strategy header.
- Label: **"Agent Brief"**
- Icon: `Robot` from Phosphor (reads as "AI" without being too cute; alternative: `CircuitBoard`)
- Behavior: identical to existing Export — generates markdown, triggers file download with `.md` extension
- Filename: `{slug}-agent-brief.md` where `{slug}` is the problem statement slugified (mirror existing report naming)

### Renderer function spec

```ts
function renderAgentBrief(
  draft: StrategyDraft,
  inputs: StrategyInputs,
  problemStatement: string,
): string;
```

- Pure function, no side effects, deterministic
- Returns a complete markdown string ready for file download
- Uses template string constants for preamble, hard constraints, execution shape, evolution protocol
- Renders founder profile, existing assets, strategy sections, warnings, citations from inputs/draft
- Handles empty cases gracefully (no assets → "none listed"; no warnings → omit section; no citations → omit section)

### Tests

- Renderer produces non-empty markdown for a complete draft
- All six strategy sections present with correct headings
- Founder profile reflects every field in `StrategyInputs`
- `existingAssets` empty → "none listed" rendered (not an empty list)
- `warnings` empty → warnings section omitted entirely
- `citations` empty → evidence section omitted entirely
- `contentMode` containing `"other"` → `contentModeOther` text appended to the formats line
- `peerCollaborationOk: true` → reflected in the founder profile
- Filename slug derives from the problem statement cleanly (lowercased, dashes, no punctuation)

### Deferred decisions (revisit after Commit C ships)

- **Structured JSON alongside markdown** — if the receiving agents need parseable action objects, add a `{slug}-agent-brief.json` companion file.
- **Per-action executor tagging** — requires Claude prompt changes to produce structured action arrays instead of prose. Meaningful quality gain, real scope.
- **Second LLM pass** — if the hardcoded template voice feels stale across strategies, run a Claude pass to personalize the preamble/evolution protocol per generation.
- **Live integrations** — specific adapters for Steve, Claude Code, etc., once the markdown format has been validated in real use.
