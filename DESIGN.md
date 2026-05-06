# Design

## Color Palette

Strategy: **Restrained** — warm neutral base, single teal accent used only as signal.

| Token | Value | Role |
|---|---|---|
| `--cream` | `#FDFBF7` | Page background — warm white, not pure |
| `--ink` | `#1A1A18` | Primary text — warm near-black |
| `--ink-light` | `#4A4A45` | Secondary text, body copy |
| `--ink-muted` | `#8A8A82` | Labels, metadata, placeholder |
| `--teal` | `#5B8A8A` | Primary accent — phase status, actions, focus |
| `--teal-deep` | `#3D6B6B` | Teal hover/active state |
| `--terracotta` | `#C4725A` | Warning, error, high-effort signal |
| `--rule` | `rgba(26,26,24,0.1)` | Dividers, borders |

Selection highlight: teal background, cream text.

## Typography

| Role | Family | Size | Weight | Tracking |
|---|---|---|---|---|
| Display / UI | Satoshi | varies | 400–600 | slight negative at large sizes |
| Monospace | JetBrains Mono | 9–12px | 400–500 | 0.05–0.12em |
| Body | Satoshi | 13–15px | 400 | default |
| Labels | JetBrains Mono | 9–11px | 500 | 0.08–0.12em uppercase |

Site title: 22px / 500 / -0.03em tracking. Section headings: 15–17px / 400–500. Body: 13–14px / 400.

## Spacing

Base unit: 4px. Common steps: 4, 8, 10, 12, 14, 16, 20, 24, 32, 36, 40, 48.
Section margins: 32–40px. Component internal padding: 12–16px. Content max-width: 560–680px.

## Elevation

No shadows. Depth through: border (`1px solid var(--rule)`), background tint (`rgba` fills), and left-border accent on structured cards (3px solid accent color).

## Borders & Radius

- Inputs: 0 radius (square corners), `1px solid var(--rule)`
- Pills / chips: `border-radius: 999px`
- Effort/grade chips: `border-radius: 999px`
- Cards / callouts: no radius (square)
- Select: `border-radius: 0`

## Motion

Framer Motion. Spring physics for expand/collapse: `stiffness 240–300, damping 25–28`. Opacity fades: `0.2s`. Stagger entry: `delay: index * 0.04`. No bounce, no elastic. Reduce motion: respect `prefers-reduced-motion`.

## Components

### Status Dots
6px circles. Running: teal + blink animation. Done: ink-muted / 0.4 opacity. Error: terracotta.

### Section Cards (Research / Strategy)
Grid layout: `36px index column + 1fr content`. Index in mono 11px. Phase/section name 15–17px / 400–500 weight. Description 13px / ink-muted.

### Structured Section Cards (Strategy)
Left-border accent (3px teal) on anchor sections. Summary 14px / ink-light. Recommendations: check icon (actionable) or bullet, with effort pill right-aligned. Callouts: left-border by type (teal/terracotta/amber).

### Scorecard
4-column grid. Grade pill (high=teal, medium=amber, low=terracotta). Metric label mono uppercase 10px. Rationale 12px / ink-light.

### Form Inputs
Full-width, square, transparent background. Focus: border darkens to `rgba(26,26,24,0.3)`. Labels: mono uppercase 10px / 500 / ink-muted.

### Buttons
Primary: teal fill, white text, 999px radius, 10px 52px padding. Text buttons: no border, no background, ink-muted, flex with icon gap.

### View Toggle
Pill outline container. Active tab: solid teal. Inactive: ghost. Dot indicator for dirty state.
