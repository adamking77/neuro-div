# Spine-Finder Tool Spec
### Product architecture for turning the process into a NeuroDiv OS tool

> **Revised 2026-06-25** to the four-movement shape (Intake → Insights → Check-in → Drafts). See `Spine-Finder-Process.md` for the canonical process and the failure that drove the revision. The old six-panel, audit-heavy workflow is superseded.

## Product Promise

Spine-Finder helps structure-first neurocomplex users turn raw self-analysis into deep insights and candidate drafts they can recognize, react to, refine, save, pause, or use to tease out their own spine.

It does not promise to discover a person's deepest meaning. It helps the user build clear objects their own judgment can act on. "Spine" is Lindsey Mackereth's term, kept deliberately.

## Primary User

A neurocomplex user who:

- Can write raw material but freezes when asked to "reflect until it emerges."
- Recognizes fit quickly when shown a concrete insight or draft.
- Needs visible evidence, few choices, and permission not to finalize.
- Will not audit the tool's internal scaffolding — and should never be asked to.
- Is a deep thinker who benefits from deep findings, not shallow ones.
- Is vulnerable to over-trusting polished external narratives.

## Non-Goals

- Do not produce a spiritual or therapeutic identity.
- Do not force a question-form spine.
- Do not treat emotional intensity as proof.
- Do not reward the agent for sounding profound.
- Do not make chat the primary interface.
- **Do not ask the user to audit the tool's internal scaffolding** (evidence rows, provisional groupings). The user reacts to findings, never grades the machine's work.

## Workflow

The product is four movements. The analytic work that used to be exposed as user-facing audit panels (evidence table, cluster verdicts) now runs **under the hood** — it produces the receipts behind insights, but the user never grades it.

### 1. Intake

**Panel:** `Intake`

Inputs (never called "dumps"):

- Pain / friction pass.
- Pull / gravity pass.

For each lens, the agent **asks whether the user has already written it**, then accepts it in any form — no method preferred:

- Photo of a handwritten journal page (ingested).
- Uploaded document or pasted text.
- Written elsewhere, returned and uploaded.
- Answered directly in chat.

All methods produce the same raw pass and feed Insights identically. **Type/paste is the always-available fallback; photo + document upload are offered where the platform supports them** — the tool must not break where image upload is unavailable.

Required behavior:

- Label the two lenses clearly.
- Ask whether each pass is already written; meet the user where they are, never assume a blank field.
- Accept photo / upload / paste / in-chat equally; ingest faithfully, do not tidy.
- Keep the user in raw writing mode.
- Prevent synthesis until both passes are present or the user explicitly chooses to continue with partial data.

Partial-data warning:

> You can continue with pain-only material, but the tool will treat outputs as constraint-heavy and not ready for spine wording.

### 2. Insights

**Panel:** `Insights`

The agent analyzes both passes **internally** — clustering phrases, tagging verb/object/need/value/affect, finding cross-lens convergence, listing orphans — and surfaces a small set of deep findings. The internal analysis is the source of receipts; it is **available on demand but never a required user task**.

Insight fields:

- Finding (stated plainly and deeply).
- "From your words": exact source phrases (expandable, not forced). Never labeled "receipts" or "evidence" in the UI.
- Lens(es) drawn from; convergence flag.
- Possible type: wound, unmet need, value, skill, pull, orientation.
- Confidence.

Count and depth rules:

- **5–7 insights TOPS**, only as many as the material warrants. Fewer is fine.
- Never pad to a number; never merge distinct findings to stay under one.
- Each insight does real synthesis — a restatement is not an insight.
- Depth is the value; the constraint is count, not depth.
- Every insight traces to the user's words. Depth and receipts scale together.

Required behavior:

- The agent absorbs all audit load.
- Every meaningful phrase is accounted for internally (in an insight's receipts or the orphan list); nothing is silently dropped.
- The agent labels uncertainty.

### 3. Check-in

**Panel:** `Check-in`

The user reacts to the insights by feel — recognition, not grading. The on-screen invitation is plain language, never the internal vocabulary:

> Read these and see which ones ring true. If any feel off or just wrong, tell me. You don't have to respond to the ones that simply fit — leaving them be means they stand. If they all land, just say so, and if one stands out as the one you most want to follow, point at it.

User actions (internal vocabulary — not shown as a literal menu): lands · off (optionally: what's wrong) · false · important.

Required behavior:

- Silence on an insight means it stands. No row-by-row pass, no eight-item verdict menu.
- **The all-good path is explicit:** offer a clear "these hold — keep going" forward action. Never strand a user who has nothing to flag.
- **Offer the "most alive" pointer:** when all land, invite the user to point at the one to build drafts around first. This is recognition (indicating), not generation, and it routes into Movement 4.
- The agent re-cuts from the reaction without defending anything.
- A rejection is data, never a mistake to fix.

### 4. Drafts

**Panel:** `Drafts`

After insights are checked, the agent builds **draft spines as worked examples** the user either takes or uses to write their own.

**Drafts are examples, not a menu.** The user does not select-or-decline. They read worked examples that do one of two equally-good things: **"yes — that one"** (resonates, take it), or **"these are good — I'll write my own from these"** (model the shape, tease out their own). Writing their own is never the consolation prize. There is **no "none" draft option** — you don't abstain from an example, and the second win already covers "not exactly it."

**Phrased as questions/problem-spaces, pitched larger than the self.** Per the author's definition, a spine is a central question or problem-space, not a declarative statement, and is pitched at a class/condition ("How do high-capacity neurocomplex adults…"), not "how do I." First-person framing is wrong altitude.

**Standard shape: a few explicitly labeled, broad problem domains, each with 1–3 spine questions nested under it** — not a flat list. A domain is broad territory (Power and Coercion, Foresight and Time), not a single situation. Hierarchy is the author's own fix for cognitive noise: the user reacts in two cheap passes — which domain is alive, then which question inside it.

**Grounded, not constructed.** A spine question need not be assembled from the user's exact words. The agent uses its own plain, sharper framing where that serves the question, keeping the user's key phrases as anchors where they carry weight. The one floor: the question must be **recognizably about the user's material** — it may use none of their literal words and still be valid, as long as the user can feel "yes, that's mine." Recognition, not vocabulary-matching; the user decides by feel.

**What the user sees per domain:** the labeled domain, a one-line territory, and 1–3 spine questions. Nothing else.

Internal-only (held as agent reasoning + saved artifact, never printed as user-facing fields): source insights, lens mix + convergence, says-yes-to, says-no-to, risks. Traceability already happened in the insights movement; do not repeat "From your words" here.

**Both lenses required (internal rule).** The agent must draw on both pain and pull wherever the material allows; pull-only or pain-only is a defect unless the material truly offers nothing from the other side. The agent actively integrates pain material — it drifts toward the seed insight's lens otherwise. Convergence is **felt in the example's quality, never labeled on screen**.

On-screen instruction (plain, names both wins):

> Here are a few broad problem domains with possible spine questions under them. See if one resonates. Either point at the one that's yours, or use them to write your own. Both are exactly right.

User actions (internal vocabulary): warm · cold · close · too generic · too heavy · not me · "writing my own from these" · save for later.

Required behavior:

- **Plural always — never a single totalizing sentence.**
- Organized as broad, labeled problem domains with nested questions, never a flat list.
- Every space traces to the user's own words.
- **No "none" path as a draft** — "write my own from these" is the equal-footing second win; genuine emptiness resolves at save-time as an outcome, not a draft.
- A cold reaction immediately stops defense of that candidate.
- **Structural checks run silently.** The agent runs feed / differentiator / exclusion / wound-vs-vocation / agency / decision tests under the hood and surfaces a result only when a candidate *fails* one. There is no test procedure for the user to run. The body check is the user's alone and it wins over any structural pass.

### 5. Close (Save or Pause)

**Panel:** `Close`

This is a narrow assist (option A). The panel **states the done-signal plainly and blesses the soft endings** — then hands the user back to the Compression Framework. It does not present an ongoing-tool endpoint.

On-screen close message:

> That's the assist. You've got a spine that's yours, a launch point to go write from, or a domain you'll keep thinking about. Any of those means you're done here — carry it into the rest of the Compression Framework. A spine you'll sit with is a real result; nothing needs forcing.

Outcome states:

- `spine_taken`
- `own_version_going_to_journal` — a finish, not an unfinished session
- `digging_in_progress`
- `domain_recognized_wording_not_ready`
- `candidate_close_but_heavy_or_generic`
- `all_cold`
- `two_domains_pull`

**Clarity rules (apply to every step, not just this one):** each step ends with one stated primary action (plain words, not a menu of equals), and "done" is always explicit and permission-giving — "I'll go journal this" is named as a finish.

Saved artifact fields:

- Current gravitational center.
- Candidate or spine text.
- Status.
- Confidence.
- Receipts.
- Says yes to.
- Says no to.
- First decision clarified.
- Review date.
- Notes from the user.

Required behavior:

- Non-final save states are successful outcomes.
- "Final" means current usable orientation, not eternal identity.

## Data Model

```ts
type Lens = "pain" | "gravity";

// --- Internal scaffolding (never user-facing as a task) ---
// EvidenceItem is the agent's analysis. It produces the receipts behind
// insights and is available on demand, but the user never grades it — so
// there is no user-facing status field on it.

type EvidenceItem = {
  id: string;
  exactPhrase: string;
  sourceLens: Lens;
  verb: string;
  object: string;
  affect?: string;
  possibleNeed?: string;
  possibleValue?: string;
  insightId?: string;            // which insight this phrase feeds, if any
  confidence: "low" | "medium" | "high";
};

// --- Insights (Movement 2) — what the user actually sees ---

type InsightReaction =
  | "unreviewed"
  | "lands"
  | "off"
  | "false"
  | "important";

type Insight = {
  id: string;
  finding: string;               // stated plainly and deeply
  evidenceIds: string[];         // receipts — expandable, never forced
  lenses: Lens[];                // one or both
  isConvergence: boolean;        // sits where pain and pull agree
  possibleType: "wound" | "unmet_need" | "value" | "skill" | "pull" | "orientation";
  confidence: "low" | "medium" | "high";
  reaction: InsightReaction;
  offNote?: string;              // optional: what felt off
};
// Count invariant: insights.length <= 7. Fewer is fine. Never pad or merge to hit a number.

// --- Drafts (Movement 4) ---

type DraftReaction =
  | "unreviewed"
  | "warm"
  | "cold"
  | "close"
  | "too_generic"
  | "too_heavy"
  | "not_me"
  | "writing_my_own_from_these"   // second win — equal footing, not a fallback
  | "saved_for_later";

// A candidate spine question — always phrased as a question, never a
// declarative statement; pitched larger than the self. Grounded, not
// constructed: need not use the user's exact words, must be recognizably
// about their material. There are no "registers"; offer 1-3 distinct
// questions per domain, each the best phrasing the agent can give.
type SpineQuestion = {
  text: string;
};

// Drafts are organized as explicitly labeled, broad problem domains with
// 1-3 nested questions, never a flat list. No "none" option — "write my
// own" is the second win; genuine emptiness resolves as an outcome at save.
type ProblemDomain = {
  id: string;
  label: string;                 // e.g. "Power and Coercion" — broad territory
  territory: string;             // one-line description of the domain
  questions: SpineQuestion[];    // 1-3
  // --- internal: held as reasoning + saved artifact, NEVER printed as
  //     user-facing fields on this screen ---
  sourceInsightIds: string[];
  lensMix: "pain_only" | "pull_only" | "both";  // internal; "both" preferred
  convergenceNotes: string[];    // felt in the example, never labeled on screen
  saysYesTo: string[];
  saysNoTo: string[];
  risks: string[];
  reaction: DraftReaction;
};
// Lens-mix invariant (internal): pain_only / pull_only is a defect unless
// the material genuinely offers nothing from the other lens. The agent must
// actively integrate pain material, not default to the seed insight's lens.
// Plural problem domains only — never a single totalizing draft.

// --- Structural checks: run silently, surfaced only on failure ---

type GateResult = "pass" | "fail" | "unclear";

type DraftGateReport = {
  draftId: string;
  feedTest: GateResult;
  differentiatorTest: GateResult;
  exclusionTest: GateResult;
  woundVsVocationTest: GateResult;
  agencyTest: GateResult;
  decisionTest: GateResult;
  // No bodyTest field — the body check is the user's alone, lives on the
  // draft reaction, and is never run or recorded by the agent.
  failuresSurfaced: string[];    // only failures are shown to the user
};

type OutcomeStatus =
  | "spine_taken"                          // user owns a resonant question
  | "own_version_going_to_journal"         // leaving to write their own — a finish
  | "digging_in_progress"                  // working a candidate in beat 4b
  | "domain_recognized_wording_not_ready"
  | "candidate_close_but_heavy_or_generic"
  | "all_cold"
  | "two_domains_pull";

type SpineFinderOutcome = {
  id: string;
  status: OutcomeStatus;
  currentGravitationalCenter?: string;
  spineOrDraftText?: string;
  confidence: "low" | "medium" | "high";
  evidenceIds: string[];
  saysYesTo: string[];
  saysNoTo: string[];
  firstDecisionClarified?: string;
  reviewDate?: string;
  userNotes?: string;
};
```

## UI Requirements

The first prototype should use the existing NeuroDiv OS design language:

- Warm cream canvas.
- Hairline rules.
- Square panels.
- Mono labels for states and metadata.
- Teal only for actionable signal.
- Terracotta only for error or blocked states.
- Amber only for uncertain states.

The tool should feel like an instrument for thinking, not a personality quiz.

## Interaction Principles

- Prefer constrained reactions over open-ended questions.
- The user reacts to findings (insights, drafts), never audits the tool's scaffolding (rows, groupings).
- Receipts are available on demand, never forced as a task.
- Make the user's "no" faster than the agent's explanation.
- Few but deep beats many but shallow. Load is the count of things the user must act on, not the depth of any one.
- Treat resistance as data.
- Allow pause as success.
- Make every generated claim breakable.

## Required Empty / Edge States

| State | Tool response |
|---|---|
| Pain pass missing | Keep user in raw writing |
| Pull pass missing | Allow partial mode with warning |
| No insight lands | Re-analyze and re-surface; do not force drafts |
| All drafts cold | Mark draft set failed; recut from insights |
| User says "this is dumb" | Shrink scope; do not defend |
| Draft too heavy | Surface silent wound-vs-vocation result |
| Draft too generic | Surface silent exclusion result |
| User wants to stop | Save current state without judgment |

## Definition Of Done For Architecture

The architecture pass is done when:

- The canonical process is the four movements: intake, insights, check-in, drafts.
- Analysis (clustering, tagging) runs under the hood with receipts; the user never audits it.
- Insights are few (≤7) but deep, each traceable to the user's words.
- The tool supports non-final outcomes.
- The agent role is specified as scaffold, not authority.
- Every major movement has constrained user actions.
- Data objects can support a prototype without inventing workflow logic.
- Failure states are defined before UI implementation.

## Definition Of Done For MVP Prototype

The first working prototype is done when a user can:

1. Enter pain and pull passes.
2. Receive a set of deep insights (≤7) with receipts available, having graded nothing.
3. React to insights with lands / off / false / important.
4. Receive plural broad problem domains (with nested question-form spine candidates, pitched larger than the self) built from the insights they didn't flag false.
5. Either take a candidate that resonates, or use them as examples to write their own — both presented as equally right; no "none" button.
6. See a silent structural check surface only when a candidate fails one.
7. Save a non-final or final outcome.
8. Reopen the saved outcome with receipts intact.

## Adam Seed Example

Known gravitational center from the origin session:

> Autonomy, and the pressure to surrender it for participation and acceptance.

Status:

> Center recognized. Final spine wording not forced.

This is the reference example for validating that the tool can preserve a useful center without over-producing a grand narrative.
