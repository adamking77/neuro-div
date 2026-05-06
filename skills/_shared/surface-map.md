# Web and Skill Surface Map

## Principle

Each major methodology should exist in two forms when it benefits from both:

- web tool for guided use and export
- skill package for users who already work inside an LLM environment

## Surface map

### ND Context Builder

- Web: guided intake wizard
- Skill: conversational intake and ND profile writer

### ND Process Designer

- Web: guided process designer and readable artifact view
- Skill: profile + goal -> process artifact

### Category Scout

- Web: research-only workspace
- Skill: research-only dossier builder

### Distribution Strategy

- Web: takes research and constraints, returns the strategy artifact
- Skill: takes research dossier and ND context, returns the strategy artifact

### ND Session Loop

- Web: none planned
- Skill: session start + reflection combined

## Why Category Scout and Distribution Strategy are split

They represent different operating modes:

- research generation
- strategic synthesis and process framing

They should be independently usable and independently replaceable.

## Recommendation for the web app

The app shell should eventually expose:

- `Category Scout`
- `Distribution Strategy`
- `ND Context Builder`
- `ND Process Designer`
- `Skills`

The `Skills` tab is the library/distribution surface, not another tool.
