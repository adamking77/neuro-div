# Migration Plan: Vite SPA → Next.js 15 (App Router) with Agentic Discoverability

## Strategic Framing

**Current architecture:** Vite + React 19 SPA, single URL, all five tools rendered client-side from tab state in `App.tsx`. Vercel serverless functions in `/api/`. localStorage for persistence. Skills loaded as `?raw` text imports bundled into JS.

**The discoverability gap:** Every crawler — Google, Perplexity, ChatGPT, Claude web search, Bing — fetches the URL and sees `<div id="root"></div>`. No content, no metadata, nothing to index. Skills aren't reachable as standalone documents. Tools have no individual URLs. Nothing exists for an agent to discover, link to, quote, or install.

**The fix:** Next.js 15 App Router with server-rendered content per tool, real URLs, metadata API, JSON-LD, plus a purpose-built agentic surface (`llms.txt`, `skills.json`, per-skill detail pages, sitemap, well-known endpoints, and discovery headers/files where they are cheap to maintain).

**Why Next.js over Astro:** React 19 already in use, the current app is heavily stateful, and the hard part is preserving interactive behavior while adding server-rendered routes. Next.js keeps the entire migration inside React. Astro would still require React islands for the tools, plus extra decomposition work around hydration boundaries and shared state.

## Reality Check From The Current Repo

The migration is still a good idea, but parts of the original plan understated the amount of refactoring required:

- `App.tsx` is not just a view switcher. It owns route-like tab state, shared session state, project management, autosave, ND profile sync, draft history, and cross-tool handoff logic.
- The SSR/browser-only surface is broader than `lib/storage.ts`. `lib/nd-profile.ts`, `lib/process-designer.ts`, and several components also depend directly on `window`, `document`, `navigator`, or `localStorage`.
- HeroUI is not unused today. It is used in report and strategy views, so dropping it is a separate decision, not cleanup to assume for free.
- Skill files currently expose only minimal frontmatter (`name`, `description`). A richer discoverability layer (`skills.json`, tags, versions, dependencies, related skills) requires new metadata authoring, not just routing.
- The current `tsconfig.json` only includes `src`, so moving to `app/`, `components/`, and `lib/` requires explicit config work.

## Additional Discoverability Inputs

An external static SEO/discovery playbook is also worth borrowing from during implementation:

- keep the discovery surface additive and source-driven: `llms.txt`, sitemaps, structured data, OG images, and validation should be generated from the app source, not patched into built output
- add a few cheap machine-readable discovery surfaces beyond the original plan when they are easy to maintain
- treat validation as part of the implementation, not a final polish pass

---

## Phase 0 — Decisions to Lock Before Touching Code

| Decision | Recommendation | Why |
|---|---|---|
| Framework | **Next.js 15.x, App Router** | Server Components default → HTML by default → discoverable by default |
| Package manager | Stay with `npm` | Already in use; no reason to switch |
| Styling | Keep Tailwind v4, keep HeroUI for first pass | HeroUI is currently used; defer UI library changes until after parity |
| Routing strategy | **Real URLs per tool**, not tab state | `/context-builder`, `/process-designer`, `/category-scout`, `/distribution-strategy`, `/skills`, `/skills/[slug]` |
| Rendering strategy | Static (SSG) for content + tool landings; Client Components only inside the interactive surfaces | Maximum HTML to crawlers, minimum hydration cost |
| Tauri | Removed from the web app migration path | The active product is the Astro/Vercel web app; the previous Tauri scaffold was vestigial and is not part of the repo runtime. |
| Branch strategy | Migrate on a `next-migration` branch, cut over via PR | Preserves rollback path |
| Domain | Keep current Vercel project + domain | Same deployment surface, no DNS work |
| Delivery strategy | **Two-stage cutover** | Ship discoverable pages first, then migrate interactive tool surfaces |

---

## Phase 1 — Audit And Scaffold The Next.js Foundation

**Goal:** Establish the real migration surface, then boot an empty Next.js app on the dev server.

1. Create `next-migration` branch.
2. Inventory every browser-only dependency before moving files:
   - `localStorage` / `sessionStorage`
   - `window`, `document`, `navigator`
   - direct downloads / clipboard APIs
   - animation and UI libraries that must stay client-side
3. Add Next.js + dependencies. Remove Vite-only pieces:
   - Add: `next@^15`, `eslint-config-next`
   - Remove: `vite`, `@vitejs/plugin-react`, `@tailwindcss/vite` (replace with `@tailwindcss/postcss`)
   - Keep: `@heroui/react`, `framer-motion`, current React packages
   - Removed `@tauri-apps/*` after confirming the Astro web runtime does not depend on Tauri
4. Replace `vite.config.ts` with `next.config.ts`. Replace `index.html` with App Router structure:
   ```
   app/
     layout.tsx          ← root layout (replaces index.html shell)
     page.tsx            ← homepage
     globals.css         ← moved from src/index.css
     (tools)/
       context-builder/page.tsx
       process-designer/page.tsx
       category-scout/page.tsx
       distribution-strategy/page.tsx
     skills/
       page.tsx
       [slug]/page.tsx
     api/
       exa-search/route.ts
       exa-crawl/route.ts
       strategy-draft/route.ts
       intelligence-brief/route.ts
   components/           ← moved from src/components, mark interactive ones 'use client'
   lib/                  ← moved from src/lib
   skills/               ← unchanged location, served from filesystem
   public/               ← unchanged
   ```
5. Rewrite `tsconfig.json` for Next.js and widen includes beyond `src`. Do not rely on auto-augmentation alone.
6. Update `vercel.json` — drop the explicit `framework: "vite"` and `outputDirectory: "dist"`. Keep duration handling only until route handlers replace it.
7. Update `package.json` scripts: `dev` → `next dev`, `build` → `next build`, `start` → `next start`.
8. Boot empty homepage. Verify deploy.

**Stop point:** Empty Next.js app deployed at the same URL, with config ready for the real port. **Risk: low. Time: ~3–4 hours.**

---

## Phase 2 — Delivery A: Discoverable Content Surface First

**Goal:** Capture the indexability win before the interactive migration is complete.

1. Build a server-rendered homepage and per-tool landing pages:
   - `/`
   - `/context-builder`
   - `/process-designer`
   - `/category-scout`
   - `/distribution-strategy`
2. Keep these pages mostly content-first at first:
   - problem framing
   - who it is for
   - how it works
   - outputs
   - install/use paths
3. Build `app/skills/page.tsx` and `app/skills/[slug]/page.tsx` as server-rendered pages from filesystem content.
4. Add the metadata layer:
   - route metadata
   - sitemap
   - robots
   - `llms.txt`
   - optional `llms-full.txt`
   - `/.well-known/api-catalog` if the route inventory is stable enough to publish
5. Add a minimal `skills.json` based on metadata you actually have now:
   - `slug`
   - `name`
   - `description`
   - `sourceUrl`
   - `downloadUrl`
   Do not promise `version`, `tags`, or `dependencies` until those fields exist in source metadata.
6. Add JSON-LD for the product and skill detail pages.
7. Add a deterministic OG image approach for the public routes:
   - product default image
   - per-tool image variant if cheap
   - per-skill default image only if it can be generated without hand-authoring every skill

**Risk:** Low to medium. Mostly additive. **Time: ~1 day.**

---

## Phase 3 — Component And Utility Port

**Goal:** Move the existing React code into the Next.js structure and make it compile without claiming full route parity yet.

1. Move `src/components/*` → `components/*`. Add `'use client'` to files that use hooks, events, `framer-motion`, HeroUI, or browser APIs.
2. Move `src/lib/*` → `lib/*`.
3. Move `src/types.ts`, `src/phases.ts` → `lib/types.ts`, `lib/phases.ts`.
4. Move `src/index.css` → `app/globals.css`. Import from `app/layout.tsx`.
5. Replace Tailwind Vite plugin with PostCSS plugin: add `postcss.config.mjs` with `@tailwindcss/postcss`.
6. Audit and harden all browser-only utilities, not just one file:
   - `lib/storage.ts`
   - `lib/nd-profile.ts`
   - `lib/process-designer.ts`
   - any helper that touches clipboard, downloads, or DOM globals
7. Verify `next build` compiles. Fix type errors, import paths, and client/server boundary issues before attempting behavior parity.

**Risk:** Medium. **Time: ~1 day.**

---

## Phase 4 — State Architecture Refactor And Interactive Route Migration

**Goal:** Replace the single-app tab architecture with route-native interactive surfaces.

1. Tear `App.tsx` into 5 route pages. The pattern for each tool page (e.g. `app/(tools)/category-scout/page.tsx`):
   ```tsx
   // Server Component — generates real HTML for crawlers
   export const metadata = { title: '...', description: '...', openGraph: {...} };

   export default function CategoryScoutPage() {
     return (
       <>
         <ToolLanding {...content} />     {/* server-rendered marketing copy */}
         <CategoryScoutTool />            {/* 'use client' interactive surface */}
       </>
     );
   }
   ```
2. Split `App.tsx` by responsibility before splitting by file:
   - shared project/session store
   - ND profile synchronization
   - project drawer state
   - category scout interactions
   - distribution strategy interactions
   - process designer interactions
   - skills library interactions
3. Build `app/layout.tsx` to hold the persistent shell: brand, top nav, and any truly global UI.
4. Build a shared client-side provider for project/session state. Category Scout and Distribution Strategy clearly share this state today; treat that as first-class architecture rather than a temporary prop tunnel.
5. Give each tool a dedicated client wrapper component:
   - `ContextBuilderTool`
   - `ProcessDesignerTool`
   - `CategoryScoutTool`
   - `DistributionStrategyTool`
   - `SkillsLibraryClient` only where client behavior is still needed
6. Keep the server-rendered landing content above each interactive surface. That remains the crawlable layer.
7. Only after state is stable, remove the old tab-based shell.

**Risk:** High. This is the core migration risk. **Time: ~1.5–2 days.**

---

## Phase 5 — API Migration

**Goal:** Backend functions work identically under Next.js conventions.

1. For each `/api/*.ts` file, move to `app/api/[name]/route.ts` and rewrite the handler signature:
   ```ts
   // OLD: export default function handler(req: VercelRequest, res: VercelResponse)
   // NEW:
   export const maxDuration = 300;  // replaces vercel.json config
   export async function POST(req: Request) {
     const body = await req.json();
     // ...
     return Response.json(data);
   }
   ```
2. Co-locate the shared `api/_lib/` utilities under `lib/api/` and update imports.
3. Replace `?raw` skill imports in `SkillsLibrary.tsx` and any other Vite-only raw loading:
   - Server Components should read files from disk via `fs`
   - client copy/download actions should receive preloaded strings or fetch from a small route handler when needed
4. Delete `vercel.json` function overrides; `maxDuration` exports replace them.

**Risk:** Low to medium. **Time: ~0.5–1 day.**

---

## Phase 6 — Metadata Enrichment For The Skill Registry

**Goal:** Upgrade the skills layer from “pages that exist” to “pages and manifests that agents can reason over cleanly.”

1. Decide where richer skill metadata lives:
   - frontmatter in each `SKILL.md`
   - or a sidecar manifest per skill
2. Add only fields you can maintain reliably:
   - optional `version`
   - optional `tags`
   - optional `dependencies`
   - optional `relatedSkills`
3. Extend `/skills.json`, per-skill pages, and related links only after that metadata exists in source form.
4. Add release/version history only if there is a real source of truth for it.
5. Decide whether to expose extra machine-readable discovery:
   - `/.well-known/api-catalog`
   - discovery `Link` headers from route handlers where useful
   - any additional agent-facing manifest only if it maps cleanly to real site structures

**Risk:** Low. Mostly content modeling. **Time: ~0.5 day.**

---

## Phase 7 — Validation And Cutover

1. **Crawler validation:**
   - Run `curl https://[preview-url]/category-scout` and verify the HTML body contains the actual content (not an empty `<div id="root">`).
   - Run [Schema.org validator](https://validator.schema.org/) against key pages.
   - Run [Lighthouse SEO audit](https://developers.google.com/web/tools/lighthouse). Target high score; do not block launch on a literal 100.
   - Verify Open Graph images resolve and use stable public URLs.
2. **Functional validation:**
   - All five tools work end-to-end on preview deploy.
   - localStorage-backed projects and process artifacts still persist correctly after the shell change.
   - API routes return correct shapes.
   - Back/forward navigation does not break project state.
3. **Agent validation:**
   - Fetch `/llms.txt` directly and verify it is coherent and current.
   - Verify `/skills.json` matches real skill metadata.
   - Verify `robots.txt` references the sitemap and includes any intentional agent-discovery hints.
   - Verify any `/.well-known/*` discovery routes and `Link` headers return what they claim.
   - Treat external discovery by Perplexity, ChatGPT search, or Claude web search as a post-launch lagging indicator, not a release gate. Indexing is not immediate.
4. **CI validation:**
   - Add broken-link checking for public routes and skill pages.
   - Add a lightweight metadata/schema validation pass if it can run reliably in CI.
   - Add Lighthouse CI only if it will stay stable enough not to become noise.
5. **Cutover:**
   - Merge `next-migration` to `main`.
   - Vercel auto-deploys.
   - Submit new sitemap to Google Search Console + Bing Webmaster Tools.
   - Verify `/llms.txt` and `/skills.json` are live.

---

## Time Estimate

| Phase | Estimated time | Risk |
|---|---|---|
| 0 — Decisions | 30–60 min | Trivial |
| 1 — Audit + scaffold | 3–4 hr | Low |
| 2 — Discoverable content surface | ~1 day | Low–Medium |
| 3 — Component + utility port | ~1 day | Medium |
| 4 — State refactor + route migration | 1.5–2 days | High |
| 5 — API migration | 0.5–1 day | Low–Medium |
| 6 — Skill metadata enrichment | ~0.5 day | Low |
| 7 — Validation + cutover | ~0.5 day | Medium |
| **Total** | **4–7 focused days** | |

Realistically this is no longer a “2–3 day focused build” unless you accept a rougher port and defer cleanup. A more believable range is 4–7 focused days, depending on how much parity, polish, and metadata authoring you want in the first launch.

---

## What This Unlocks

- A staged path where discoverable, citable pages can ship before the entire interactive app is fully migrated
- Every tool can have an indexable URL with real HTML instead of a client-only tab surface
- Skills become citable, linkable, recommendable URLs
- AI agents can discover the suite through `/llms.txt`, `/skills.json`, and per-skill detail pages
- Future skill additions can propagate through the same content pipeline once metadata conventions are in place

---

## Execution Checklist

This is the practical starting checklist for the first two phases. It is intentionally file-oriented.

### Phase 1 — Audit + Scaffold

#### 1. Branch and baseline

- [ ] Create `next-migration` branch
- [ ] Run the current app and confirm the baseline still works before touching framework code
- [ ] Save one preview screenshot of the current UI for parity checks during migration

#### 2. Dependency and script changes

- [ ] Update `package.json`
  - add `next`
  - add `eslint-config-next`
  - replace `dev`, `build`, `preview`, and `start` scripts for Next.js
  - keep `@heroui/react`, `framer-motion`, `react`, and `react-dom`
  - remove `vite`, `@vitejs/plugin-react`, and `@tailwindcss/vite`
- [x] Remove `@tauri-apps/*` and `src-tauri/` from the Astro web repo

#### 3. Config files

- [ ] Rewrite `tsconfig.json`
  - include `app/**/*`
  - include `components/**/*`
  - include `lib/**/*`
  - include `src/**/*` temporarily during the port
  - include `api/**/*` until API migration is complete
- [ ] Add `next.config.ts`
- [ ] Add `postcss.config.mjs`
- [ ] Update `vercel.json`
  - remove `framework: "vite"`
  - remove `outputDirectory: "dist"`
  - keep function duration overrides only until route handlers replace them

#### 4. App Router shell

- [ ] Create `app/layout.tsx`
- [ ] Create `app/page.tsx`
- [ ] Create `app/globals.css`
- [ ] Move the contents of `src/index.css` into `app/globals.css`
- [ ] Keep `public/` assets in place and confirm font paths still resolve

#### 5. Browser-only audit

- [ ] Audit modules that touch browser globals directly
  - `src/lib/storage.ts`
  - `src/lib/nd-profile.ts`
  - `src/lib/process-designer.ts`
  - `src/components/SkillsLibrary.tsx`
  - `src/components/NDContextBuilder.tsx`
  - `src/components/NDProcessDesigner.tsx`
  - `src/components/AgentBriefView.tsx`
  - `src/components/VisualRenderer.tsx`
  - `src/App.tsx`
- [ ] Note which files can stay client-only with `'use client'`
- [ ] Note which utilities need runtime guards instead of client-only wrappers

#### 6. Scaffold verification

- [ ] Run `next dev`
- [ ] Fix boot errors only
- [ ] Verify the empty homepage deploys on Vercel preview

### Phase 2 — Discoverable Content Surface

#### 1. Shared server-side content loaders

- [ ] Create `lib/skills.ts` or equivalent filesystem loader
  - load all skill directories
  - read `SKILL.md`
  - parse existing frontmatter fields only
  - expose `slug`, `name`, `description`, `sourcePath`
- [ ] Create a small markdown rendering path for skill detail pages
  - either `react-markdown`
  - or a server-side markdown pipeline you trust

#### 2. Public site routes

- [ ] Create `app/(tools)/context-builder/page.tsx`
- [ ] Create `app/(tools)/process-designer/page.tsx`
- [ ] Create `app/(tools)/category-scout/page.tsx`
- [ ] Create `app/(tools)/distribution-strategy/page.tsx`
- [ ] Keep `app/page.tsx` as the suite landing page

#### 3. Skills routes

- [ ] Create `app/skills/page.tsx`
- [ ] Create `app/skills/[slug]/page.tsx`
- [ ] Add `generateStaticParams()` for skill slugs
- [ ] Render full skill content server-side from the filesystem
- [ ] Add download/copy affordances only if they do not force the entire page to become client-rendered

#### 4. Content extraction sources

- [ ] Pull product-level intro copy from `src/App.tsx`
- [ ] Pull tool descriptions from the existing tool sections in `src/App.tsx`
- [ ] Pull skill summaries from `src/components/SkillsLibrary.tsx`
- [ ] Expand thin descriptions into real landing-page sections:
  - problem
  - workflow
  - outputs
  - who it is for
  - handoff to the next tool in the suite

#### 5. Metadata routes and discoverability files

- [ ] Add page metadata to all public pages
- [ ] Create `app/sitemap.ts`
- [ ] Create `app/robots.ts`
- [ ] Create `app/llms.txt/route.ts`
- [ ] Optionally create `app/llms-full.txt/route.ts`
- [ ] Optionally create `app/.well-known/api-catalog/route.ts` if the published route inventory is stable
- [ ] Create `app/skills.json/route.ts`
  - emit only fields that are real today
  - do not invent versions, tags, or dependencies
- [ ] Decide whether to add discovery `Link` headers from route handlers for `llms.txt`, `skills.json`, or other machine-readable files

#### 6. Structured data

- [ ] Add product-level JSON-LD in `app/layout.tsx`
- [ ] Add skill-level JSON-LD in `app/skills/[slug]/page.tsx`
- [ ] Add canonical URLs to each route’s metadata
- [ ] Add a default OG image path for public pages
- [ ] Add per-route OG metadata only where it can be generated systematically

#### 6A. Robots and discovery hints

- [ ] Ensure `robots.txt` references `sitemap.xml`
- [ ] Decide whether to add a `Content-Signal` hint if you want explicit agent-discovery signaling
- [ ] Explicitly allow intended crawlers only if that policy matches the product decision

#### 7. Phase 2 verification

- [ ] `curl` the homepage and one tool route and confirm real HTML is present
- [ ] `curl` one skill page and confirm rendered content, not only shell markup
- [ ] Verify `/llms.txt` responds with plain text
- [ ] Verify `/skills.json` returns valid JSON
- [ ] Verify `/sitemap.xml` and `/robots.txt` are live on preview
- [ ] Verify OG image URLs resolve
- [ ] Verify any `/.well-known/*` route you added responds correctly

### Exit Criteria Before Phase 3

- [ ] The site has public, crawlable routes for the homepage, four tools, and skills
- [ ] Skill detail pages render from source files on the server
- [ ] `llms.txt`, `skills.json`, sitemap, and robots are live
- [ ] Any extra discovery endpoints you chose to support are live and truthful
- [ ] No interactive tool parity is required yet beyond basic navigation and page rendering
