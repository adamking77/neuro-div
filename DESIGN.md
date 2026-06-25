# NeuroDiv OS — Design System

> **Single source of truth.** Derived from the implemented code, not from a scrape: tokens come from [`app/globals.css`](app/globals.css) `:root`; component contracts from [`src/components/`](src/components/) (`ui/`, `app-shell.tsx`) and [`src/components/SpineFinder.tsx`](src/components/SpineFinder.tsx). This file supersedes the previous root and `spine-tool/` design docs. When code and this doc disagree, fix one to match the other — don't let them drift.

> **Stack:** Next.js 15 App Router · React 19 · TypeScript · Tailwind v4 · HeroUI v3 · Framer Motion. Components style themselves with the CSS variables below + inline styles; tokens are the source of truth.

---

## 1. Visual posture

Restrained, editorial, instrument-like. A warm cream canvas, hairline rules, square cards, mono labels, and a **single teal accent that carries every actionable signal**. No shadows, no gradients, no purple/violet. Depth comes from borders and translucent surfaces over the cream — a paper notebook with structured fields. It reads as a tool for thinking, not a marketing site.

Five principles (govern every call):

1. **The tool disappears into the work.** No chrome for its own sake; every element carries information or gets out of the way.
2. **Calm is a feature.** No urgency cues, no "do more" signals, no loading anxiety. ND users need an interface that doesn't spike demand.
3. **Structure over decoration.** Typography, spacing, and proportion do the visual work. Color is signal, not wallpaper.
4. **Evidence earns hierarchy.** Things holding more research weight look more substantial — by density and presence, not by shouting.
5. **Honest feedback over polish theater.** Empty states say what's missing, not what you'd get if you upgraded.

---

## 2. Color tokens

All defined in `globals.css :root`. Restrained warm-neutral base + single teal accent. Terracotta and amber are **signal-only**.

| Token | Value | Role |
|---|---|---|
| `--cream` | `#FDFBF7` | Page background — warm white, never pure `#FFF` |
| `--ink` | `#1A1A18` | Primary text — warm near-black |
| `--ink-light` | `#4A4A45` | Body copy, secondary text |
| `--ink-muted` | `#8A8A82` | Labels, metadata, placeholder, dot-done |
| `--teal` | `#5B8A8A` | Primary accent — focus, action, "high" grade, selection |
| `--teal-deep` | `#3D6B6B` | Teal hover/active; AA-safe teal for small text on cream |
| `--terracotta` | `#C4725A` | Error, low grade, brand secondary |
| `--warning` | `#B8860B` | Medium grade, attention |
| `--warning-deep` | `#966F00` | Warning hover |
| `--warning-bg` | `rgba(196,164,132,0.08)` | Warning surface tint |
| `--warning-pill` | `rgba(196,164,132,0.15)` | Warning chip fill |
| `--rule` | `rgba(26,26,24,0.1)` | Dividers, borders, input outlines |
| `--rule-strong` | `rgba(26,26,24,0.3)` | Focused input border, emphasis hairlines |
| `--surface` | `rgba(255,255,255,0.58)` | Panel/card fill over the cream |
| `--surface-strong` | `rgba(255,255,255,0.82)` | Inputs, open-state fills, sheets |

Selection: teal background, cream text. **Contrast note:** `--teal` at 11px on cream is ~3:1 (fails AA for small text) — use `--teal-deep` for small/mono text.

**Never invent tokens.** Derive new values with `color-mix()` from these (e.g. open-accordion tint is `rgba(91,138,138,0.06)`), or add the token here first.

---

## 3. Typography

Two families, loaded via `--font-display` (Satoshi) and `--font-mono` (JetBrains Mono). Mono is for labels, section numbers, status, tags, and inline code only — **never body copy**.

| Role | Family | Size | Weight | Notes |
|---|---|---|---|---|
| Product wordmark | Satoshi | 20px | 500 | "NeuroDiv OS" header |
| Tool title (`ToolSection` label) | Satoshi | 19px | 500 | the page/tool heading |
| Section title (`h3`) | Satoshi | 17px | 500 | section heads inside a tool |
| Body / lede | Satoshi | 14–15px | 400 | line-height 1.7 |
| Tool description / fine print | Satoshi | 13px | 400 | `--ink-muted`, line-height 1.6 |
| Meta / eyebrow / index (`MetaLabel`, `SectionNumber`) | JetBrains Mono | 10–11px | 500 | 0.1–0.12em, uppercase |
| Inline code | JetBrains Mono | 0.92em | 400 | quiet tint, no box |

**Restraint over scale.** The in-tool scale tops out around 19–22px. Oversized marketing heroes (the `clamp(2.2rem,4vw,4.25rem)` display classes still in `globals.css`) are **not** used in the tool UI and were explicitly rejected for tool pages — keep headings calm. Body line-height ≥ 1.7 for reading rhythm.

---

## 4. Spacing

Base unit **4px**. Scale: 4, 8, 10, 12, 14, 16, 20, 24, 28, 32, 36, 40, 48, 52.

- App shell: `main-wrap` is `max-width: 960px`, padding `52px 40px 100px`, centered.
- Prose / panel max-width inside the shell: ~**720px** (ledes ~60ch).
- Section rhythm: ~40px top padding between in-tool sections; `ToolSection` pads `28px 0 24px` header + `56px` content bottom, closed by `<hr class="rule">`.
- Card padding: `sm` 12×14 · `md` 16×18 · `lg` 22×24.
- Inputs: 12×14.

**Radius:** cards / inputs / panels are **square (`0`)**. Buttons, chips, pills, status dots use `999px`.

---

## 5. Layout

- Single centered **app shell** (`main-wrap`, 960px), persistent across routes; public tool routes share the same chrome (wordmark + tool nav).
- **Tool nav:** horizontal pill row. Active pill = solid teal / white text; inactive = transparent / `--ink-muted`. 999px, 12px/500.
- **Section card grid:** a `36px` mono **index column** + `1fr` content. The index is a mono label (`What`, `How`, `01`…); the content holds title + lede + body.
- Skill cards and most content stack vertically (gap 16) — no multi-column tool grid.
- Hero/asymmetric splits are available but the current tools lead with the `ToolSection` header, not a large hero.

---

## 6. Components

All live in `src/components/`. Prefer these primitives over ad-hoc markup.

### `ToolSection` (`app-shell.tsx`)
Tool page header + body wrapper. Optional `SectionNumber`; label 19px/500; description 13px/`--ink-muted`; optional `statusChip` / `headerActions`; content; trailing `<hr class="rule">`. This is the standard chrome for every tool route.

### `Card` (`ui/Card.tsx`)
Square, hairline panel. `padding`: `sm | md | lg`. `border`: `default` (`--rule`) · `teal` (`rgba(91,138,138,0.25)`) · `terracotta`. Optional `background` tint. **No radius, no shadow.**

### `MetaLabel` (`ui/MetaLabel.tsx`)
Mono eyebrow/label: 10px / 500 / 0.12em / uppercase / `--ink-muted` (color overridable, e.g. `--teal-deep`).

### `SectionNumber` (`ui/SectionNumber.tsx`)
Mono index: 10px / 0.1em, `--ink-muted` or `--teal` (700 weight) when active.

### Buttons
- **`PrimaryButton` / `RunButton`** — teal fill, white text, 999px, `10×52px`, 15px/600. Hover → `--teal-deep`. Disabled → `rgba(91,138,138,0.4)`. Armed/destructive → `--ink-light` fill.
- **`.cta-pill`** (`globals.css`, shared) — inline pill CTA used by the Spine-Finder page and Skill cards. Teal → `--teal-deep` on hover, 14px/600, `11×26px`, 999px. Works as `<a>` or `<button>`.
- **`.btn-text`** — borderless, `--ink-muted`, inline-flex with a small icon gap. Secondary actions (Copy, View, Back).

### Accordion (single-open) — `SpineFinder.tsx` + `.sf-acc*` in `globals.css`
Disclosure list for sequential content (e.g. the four Spine-Finder steps). One row open at a time; clicking the open row closes it. Header is a real `<button>` (keyboard arrows / Home / End, `aria-expanded`, `aria-controls`). **Open state = flat background tint (`rgba(91,138,138,0.06)`) + teal mono index + 600-weight title. No side-stripe** (see §9). Height + chevron animate with the standard spring (§7).

### Inputs
Full-width, square, transparent fill, 1px `--rule` border. Focus darkens border to `--rule-strong` + 2px teal halo at ~15%. Labels above, mono uppercase 10–11px / `--ink-muted`.

### Status dots
6px circles. Running = teal + blink (1.4s). Done = `--ink-muted` @ 0.4. Error = `--terracotta`. (The blinking/pulsing dot means *running* — don't use it decoratively.)

### Project drawer / sheet
Cream surface, hairline border, square, no shadow; backdrop `rgba(26,26,24,0.2–0.45)`; slides in with a spring.

### Brand marks
Logo families on a cream square, derived from a 32×32 grid: `mark-arc` (270° teal arc + core), `mark-node`, `mark-orbit`, `mark-venn` (teal + terracotta venn — public favicon). Strokes: 1.5px marks, 2px favicons.

---

## 7. Motion

Framer Motion. One vocabulary:

- **Expand/collapse + tab transitions:** spring, **stiffness 240–300, damping 25–28** (implemented value: 260 / 26). No bounce, no elastic.
- **Opacity fades:** 0.2s. Entrance reveals are opacity-only (no large translate); subtle.
- **Stagger entry:** `delay: index * 0.04`.
- **Button hover:** 0.15s background tween only.
- **Focus ring:** 2px solid teal, 2px offset (inputs add a 2px teal-15% halo).
- **`prefers-reduced-motion`:** always respected — durations collapse to ~0.01ms and transforms are dropped; the opacity/state change still happens.

Do **not** use CSS scroll-timeline reveals, load-rise stagger, or decorative pulses — they aren't part of this system.

---

## 8. Voice & brand

- Title-case product nouns ("Context Builder", "Spine-Finder"); sentence-case actions ("Run", "Download SKILL.md", "Copy skill").
- Calm, plain, low-jargon, ND-aware. Prefer "use this when…" over imperative marketing.
- Mono labels carry status/metadata; prose carries meaning.
- Numbers (grades, counts) are first-class — show them.
- No emoji decoration, no exclamation marks, no "AI-powered" puffery.
- **No em-dashes or other AI tells in public copy.** Run the copy-audit linter before shipping copy.

---

## 9. Anti-patterns

- ❌ Pure white (`#FFFFFF`) backgrounds — the canvas is `--cream`.
- ❌ Drop shadows or gradients — depth = border + tint only.
- ❌ Rounded card corners — cards/panels/inputs are square; only chips/buttons/pills/dots use 999px.
- ❌ Violet/purple accents — teal is the only signal accent; terracotta and amber are signal-only.
- ❌ **Colored side-stripe borders.** A colored left/right border (>1px) as an accent is banned. Signal state with a leading mono label, a 6px status dot, or a flat background tint + teal index instead. *(This resolves the prior doc conflict — the old "3px left accent on anchor cards" rule is retired.)*
- ❌ Oversized marketing heroes on tool pages — keep the in-tool scale (§3).
- ❌ Decorative use of the blinking dot (it means *running*).
- ❌ Two sans families faking hierarchy — hierarchy is size + tracking + mono labels.
- ❌ Body copy set in mono.
- ❌ Tailwind utility soup — components style via CSS variables; tokens are the source of truth.
- ❌ Inventing tokens outside §2 — derive via `color-mix()` or document the addition here first.
