# GitHub Distribution Notes

## Yes, host the skills on GitHub

GitHub should be the canonical distribution surface for the skill packages.

Why:

- versioning is explicit
- installation from repo is straightforward
- users can inspect the prompts and artifacts
- issues, revisions, and release notes can stay public
- the web app and skill suite can evolve together without being identical

## Recommended repo strategy

Short term:

- keep skills in this repo under `skills/`
- keep shared docs in `skills/_shared/`
- iterate the contracts here while the web tools are still changing fast

Medium term:

- move the skill suite to a dedicated sibling repo once the contracts stabilize
- example name: `nd-skill-suite`

## Versioning

Tag releases when the artifact contracts or skill behavior changes materially.

Suggested version bump triggers:

- major: artifact contract break
- minor: new skill, new required behavior, new output section
- patch: prompt refinements, copy changes, clarifications

## Packaging expectation

Each skill folder should remain usable as a standalone package within the suite repo. Avoid hidden dependencies on the web app code. Shared references are acceptable as long as the suite repo remains the install target.
