# NeuroDiv OS

Server-rendered ND-aware tools for context building, process design, category research, and distribution strategy.

The suite now runs on Next.js App Router with real URLs for each tool, filesystem-backed skill pages, route metadata, `llms.txt`, and `skills.json`. The interactive surfaces still use browser-side state where needed, but the public route layer is now crawlable and linkable.

## Routes

- `/`
- `/context-builder`
- `/process-designer`
- `/category-scout`
- `/distribution-strategy`
- `/skills`
- `/skills/[slug]`
- `/llms.txt`
- `/skills.json`
- `/.well-known/api-catalog`

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
vercel --prod
```
