# ND Skill Artifact Contracts

These contracts are the stable handoff layer between tools and skills. Web output and skill output should match these headings and semantics closely enough that one surface can hand off cleanly to the other.

## 1. ND profile artifact

Recommended file name: `nd-profile.md`

Required sections:

- `# ND Profile`
- `## My Neurodivergent Profile`
- `## What Activates Me`
- `## What Causes Shutdown or Avoidance`
- `## My Relationship With Time and Energy`
- `## Systems I've Tried`
- `## How I Prefer to Receive Information`
- `## What Helps Me Work`
- `## For Any Agent Working With Me`

Rules:

- Preserve the user's own language where it adds specificity.
- Distinguish structured labels from freeform narrative.
- The final section must be written to the receiving agent, not to the user.

## 2. ND process artifact

Recommended file name: `nd-process-<slug>.md`

Required sections:

- `# ND Process Designer`
- `## What you're working with`
- `## Protected conditions`
- `## What you're not doing`
- `## Session start`
- `## Move menu`
- `## Rescue moves`
- `## Measurement`
- `## Agent brief`
- `## Source notes`

Strongly recommended additional section:

- `## Outcomes log`

Move format:

- `### <group title>`
- `#### <move title>`
- `- Trigger`
- `- Action`
- `- Done signal`
- `- Effort`
- `- Why this fits you`

Rules:

- Moves are organized by condition, not chronology.
- There must be a dignified `Not today` path somewhere in the process.
- The not-doing list is a real boundary, not decoration.

## 3. Session loop updates

The `nd-session-loop` skill should update existing artifacts rather than creating a brand-new primary file.

Expected writes:

- append to `## Outcomes log` in the process artifact
- optionally propose updates to the ND profile when repeated patterns emerge
