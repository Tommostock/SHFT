# CLAUDE.md — SHFT Project

## What is this project?
SHFT is a daily word puzzle game (PWA). Players transform one word into another by changing one letter at a time. Each step must be a valid English word. Fewest steps wins. Think Wordle meets word ladders with competitive leaderboards.

## Tech stack
- Next.js 15 (App Router, TypeScript)
- Tailwind CSS + shadcn/ui (new-york style, slate base)
- Supabase (Postgres, Auth, Realtime) — Phase 2+
- Zustand (state management)
- Vercel (hosting, free tier)
- PWA (service worker for offline play, installable to home screen)

## Key files
- `SPEC.md` — Full game design document. **This is the single source of truth.** Every design decision, mechanic, UI layout, colour token, animation timing, and database schema is in here. Read it fully before building anything.
- `src/lib/game/` — Core game engine (dictionary, validator, BFS solver, scorer). Pure TypeScript, no React dependencies.
- `src/components/game/` — Game UI components (chain board, keyboard, result modal)
- `public/data/` — Bundled word lists, pre-computed adjacency graphs, daily puzzle definitions
- `supabase/migrations/` — Database schema (Phase 2+)
- `scripts/` — Build scripts for dictionary curation, word graph generation, puzzle generation

## Commands
- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run generate:dictionary` — Build word lists from source dictionary
- `npm run generate:graphs` — Build word adjacency graphs from word lists
- `npm run generate:puzzles` — Generate 90 days of daily puzzles

## Code style
- TypeScript strict mode
- Prefer named exports
- Components in PascalCase files (e.g. `ChainBoard.tsx`)
- Hooks prefixed with `use` (e.g. `useGame.ts`)
- All game logic lives in `src/lib/game/` as pure functions — no React, no hooks, no side effects
- Keep components thin — delegate all game logic to hooks and lib functions
- Comment all non-obvious logic, especially in the solver and validator
- Mobile-first CSS (min-width breakpoints, max content width 480px)
- Portrait orientation only
- Accessibility: all interactive elements must be keyboard navigable with ARIA labels
- Use semantic HTML elements

## Architecture principles
- Game engine is framework-agnostic (pure TypeScript in `src/lib/game/`)
- All word validation happens client-side — dictionaries are bundled as JSON in `public/data/`
- BFS solver runs client-side for practice mode, server-side for daily puzzle par calculation
- Offline-first for Daily Chain: puzzles and dictionaries cached via service worker
- Guest mode uses localStorage. Supabase is added in Phase 2 for persistent accounts.
- No external API calls during gameplay — everything needed is bundled

## Design system
Full design tokens are in SPEC.md Section 7.1. Key references:

**Colours:**
- Gold accent: `#C9A84C` (success states, genius solves, chain connectors)
- Ink / primary text: `#1A1A1A` (light) / `#F5F3EE` (dark)
- Background: `#FAFAF8` (light) / `#0F0F0F` (dark)
- Error: `#DC2626` (invalid word shake)

**Fonts (Google Fonts):**
- Display / logo: `Instrument Serif`
- Game letters: `JetBrains Mono` (monospaced for alignment)
- UI / body: `DM Sans`

**Spacing:** 4px base unit (4, 8, 12, 16, 24, 32, 48, 64)

## Game rules (quick reference)
1. Player sees a start word and a target word (same length)
2. Change exactly one letter to form a new valid English word
3. Repeat until the chain reaches the target word
4. Par = shortest possible path (BFS). Fewer steps = better score.
5. Chain quality: Gold (≤ par), Silver (par+1), Bronze (par+2), Iron (par+3+)

## Important constraints
- **Zero cost:** Everything must work within free tiers (Vercel, Supabase, GitHub, Google Fonts)
- **PWA, not native:** No App Store / Google Play fees. Installable from browser.
- **No external API calls during gameplay:** Dictionary and graphs are bundled locally
- **Beginner-friendly code:** Tom is a beginner developer. Write clean, well-commented code that's easy to understand and extend. Avoid overly clever patterns. Prefer readability over brevity.
- **One thing at a time:** Build incrementally. Commit after each meaningful chunk. Test as you go.

## Phase overview
- **Phase 1 (current):** Daily Chain + Practice mode, client-side only, localStorage
- **Phase 2:** Supabase, user accounts, leaderboards
- **Phase 3:** Sprint mode, Versus mode (Supabase Realtime)
- **Phase 4:** Badges, push notifications, weekly recap, polish
