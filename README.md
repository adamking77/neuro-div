# NeuroDiv OS

Context and process tools for neurodivergent founders.

The app runs on Next.js App Router with real URLs for each tool while preserving the persistent client shell.

## Routes

- `/`
- `/context-builder`
- `/process-designer`
- `/spine-finder`
- `/skills`
- `/skills/[slug]`
- `/skills/[slug]/source`
- `/skills/[slug]/download`
- `/llms.txt`
- `/skills.json`
- `/.well-known/api-catalog`
- `/robots.txt`
- `/sitemap.xml`

The public skill catalog is limited to:

- `nd-context-builder`
- `nd-process-designer`
- `spine-finder`
- `nd-session-loop`

Category Scout and Distribution Strategy now live in the standalone local project at `/Users/adamking/projects/category-scout`.

## Stack

- **Frontend**: Next.js 15 App Router, React 19, TypeScript, Tailwind CSS v4, HeroUI v3, Framer Motion
- **Deployment**: Vercel

## Setup

```bash
npm install
npm run dev
```

The app runs at `http://localhost:3000`.
