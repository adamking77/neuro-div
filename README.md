# Category Scout

Six research phases in parallel — who has the pain, who's solving it, how the market is structured, and how people talk about it.

Built for category design research. Runs semantic search across six distinct lenses simultaneously, then turns that evidence into a grounded strategy workflow using Exa deep-reasoning search plus Anthropic synthesis.

## How it works

1. Enter a problem statement in plain language
2. Optionally add known players in the space
3. Hit **Run** — six phases search in parallel via Exa's neural search
4. Review results by phase, each with relevance scores, publication timelines, and source highlights
5. Switch to **Strategy** to generate a low-contact distribution draft grounded in Exa deep-reasoning search and Anthropic
6. **Export** either the research file or the generated strategy as markdown

## Research phases

| # | Phase | What it finds |
|---|-------|---------------|
| 01 | Problem Cartography | How the problem is described in the wild, before anyone has branded it |
| 02 | Enemy Identification | The incumbent approach being displaced — the old story your category replaces |
| 03 | Solution Landscape | Everyone solving adjacent problems; what's named, overcrowded, or sparse |
| 04 | Category Audit | Existing categories — newly named (opportunity), mid-formation, or mature (avoid) |
| 05 | Evidence Mining | Proof the problem is real, growing, and expensive |
| 06 | Language Mining | Vocabulary people reach for before they know a solution exists |

## Stack

- **Frontend** — React 19, TypeScript, Vite, Tailwind CSS v4, HeroUI v3, Framer Motion
- **Search & research** — [Exa](https://exa.ai) neural search plus deep-reasoning search via Vercel serverless functions
- **Strategy synthesis** — [Anthropic Claude Sonnet 4](https://docs.anthropic.com/en/docs/models-overview) or [Kimi K2.6](https://www.moonshot.cn/) (selectable)
- **Deployment** — Vercel

## Setup

### Environment variables

```
EXA_API_KEY=your_key_here
EXA_SEARCH_TYPE=deep-reasoning
ANTHROPIC_API_KEY=your_key_here
ANTHROPIC_MODEL=claude-sonnet-4-6
KIMI_API_KEY=your_key_here
KIMI_MODEL=kimi-k2-6
KIMI_BASE_URL=https://api.moonshot.cn/v1
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
