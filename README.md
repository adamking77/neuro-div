# Category Scout

Six research phases in parallel — who has the pain, who's solving it, how the market is structured, and how people talk about it.

Built for category design research. Runs semantic search across six distinct lenses simultaneously, then gives you a structured export to take into Claude for brief generation.

## How it works

1. Enter a problem statement in plain language
2. Optionally add known players in the space
3. Hit **Run** — six phases search in parallel via Exa's neural search
4. Review results by phase, each with relevance scores, publication timelines, and source highlights
5. **Export** the research as a structured markdown file
6. Upload to [claude.ai](https://claude.ai) with the included prompt to generate a full category design brief

## Research phases

| # | Phase | What it finds |
|---|-------|---------------|
| 01 | Pain Mapping | Who has the problem and how they describe it |
| 02 | Competitor Landscape | Who's solving it and how they position |
| 03 | Market Structure | How the category is currently named and bounded |
| 04 | Use Cases | How people actually deploy solutions |
| 05 | Evidence & Data | Proof the problem is real and growing |
| 06 | Vocabulary | Language patterns and naming candidates |

## Stack

- **Frontend** — React 19, TypeScript, Vite, Tailwind CSS v4, HeroUI v3, Framer Motion
- **Search** — [Exa](https://exa.ai) neural search via Vercel serverless functions
- **Deployment** — Vercel

## Setup

### Environment variables

```
EXA_API_KEY=your_key_here
```

Add to Vercel project settings under Environment Variables.

### Local development

```bash
npm install
vercel dev
```

`vercel dev` runs both the Vite frontend and the API routes locally. `npm run dev` alone will not proxy API calls.

### Deploy

```bash
vercel --prod
```
