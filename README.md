# NeuroDiv OS

ND-aware tools for context building, process design, category research, and distribution strategy.

The app now runs on Next.js App Router with real URLs for each tool while preserving the original interactive shell and core UX. The main suite routes stay fast by keeping the client app mounted across navigation, while the public route layer exposes crawlable URLs, skill pages, `llms.txt`, and `skills.json`.

## Routes

- `/`
- `/context-builder`
- `/process-designer`
- `/category-scout`
- `/distribution-strategy`
- `/skills`
- `/skills/[slug]`
- `/skills/[slug]/source`
- `/skills/[slug]/download`
- `/llms.txt`
- `/skills.json`
- `/.well-known/api-catalog`
- `/robots.txt`
- `/sitemap.xml`

The public skill catalog is intentionally limited to the five NeuroDiv suite skills:

- `nd-context-builder`
- `nd-process-designer`
- `category-scout`
- `distribution-strategy`
- `nd-session-loop`

## Stack

- **Frontend** — Next.js 15 App Router, React 19, TypeScript, Tailwind CSS v4, HeroUI v3, Framer Motion
- **Search & research** — [Exa](https://exa.ai) neural search plus deep-reasoning search via Next route handlers
- **Strategy synthesis** — [Kimi K2.6](https://www.moonshot.cn/)
- **Deployment** — Vercel

## Setup

### Environment variables

```
EXA_API_KEY=your_key_here
EXA_SEARCH_TYPE=deep-reasoning
KIMI_API_KEY=your_key_here
KIMI_MODEL=kimi-k2-6
KIMI_BASE_URL=https://api.moonshot.cn/v1
```

Add to Vercel project settings under Environment Variables.

### Local development

```bash
npm install
npm run dev
```

This runs the App Router app and the route handlers together at `http://localhost:3000`.

### Production build

```bash
npm run build
npm run start
```

### Deploy

```bash
git push origin main
```

This repo is connected to Vercel, so pushing `main` triggers the production deployment automatically.
