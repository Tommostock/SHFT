# SHFT — Claude Code Kickoff Guide

Follow these steps in order. Don't skip any.

---

## STEP 1: Create the GitHub Repo

1. Go to https://github.com/new
2. Repository name: `shft`
3. Description: `The daily word chain puzzle`
4. Set to **Private**
5. Check "Add a README file"
6. Click **Create repository**
7. Copy the repo URL (e.g. `https://github.com/YOUR-USERNAME/shft`)

---

## STEP 2: Clone it locally

Open your terminal (Command Prompt, PowerShell, or Windows Terminal) and run:

```bash
cd Desktop
git clone https://github.com/YOUR-USERNAME/shft
cd shft
```

Replace `YOUR-USERNAME` with your actual GitHub username.

---

## STEP 3: Add the spec files to the repo

Take the two files from this package and put them in the root of your `shft` folder:

- `CLAUDE.md` — Claude Code's instructions (the file below this one)
- `SPEC.md` — The full game design document (the GDD file you already have — rename it from `SHFT-GDD.md` to `SPEC.md`)

Your folder should now look like:

```
shft/
├── CLAUDE.md
├── SPEC.md
└── README.md
```

---

## STEP 4: Set up Supabase (free)

1. Go to https://supabase.com and sign up / log in (use your GitHub account)
2. Click **New Project**
3. Project name: `shft`
4. Database password: generate a strong one and **save it somewhere safe**
5. Region: choose the closest to London (e.g. `eu-west-2` London)
6. Click **Create new project** and wait for it to provision (~2 minutes)
7. Once ready, go to **Settings → API**
8. Copy these two values — you'll need them:
   - `Project URL` (looks like `https://xxxxxxxxxxxx.supabase.co`)
   - `anon / public` key (long string starting with `eyJ...`)

**Don't run the SQL migration yet** — Claude Code will handle that.

---

## STEP 5: Open Claude Code

Open your terminal in the `shft` folder and launch Claude Code:

```bash
cd Desktop/shft
claude
```

---

## STEP 6: Paste the prompt

Once Claude Code is running, paste the following prompt. **Copy everything between the START and END markers:**

---

### ✂️ --- START PROMPT --- ✂️

```
Read CLAUDE.md and SPEC.md in this repository. These are your instructions and the full game design document for SHFT — a daily word puzzle game.

I want you to build Phase 1 (the MVP). Here's exactly what I need you to do, step by step:

**1. Project scaffolding**
- Initialise a Next.js 15 project with App Router, TypeScript, Tailwind CSS, and ESLint
- Install dependencies: @supabase/supabase-js, @supabase/ssr, zustand, next-pwa (or @ducanh2912/next-pwa if next-pwa doesn't support Next 15)
- Set up shadcn/ui with the "new-york" style and slate base colour
- Create the folder structure exactly as specified in SPEC.md Section 3
- Add Google Fonts: Instrument Serif, JetBrains Mono, DM Sans

**2. Design system**
- Set up CSS variables for the colour palette from SPEC.md Section 7.1 (both light and dark mode)
- Configure Tailwind to use these tokens
- Set up the dark/light theme toggle using a class-based approach on <html>
- Create the root layout with correct fonts, metadata, and PWA manifest link

**3. PWA setup**
- Create public/manifest.json as specified in SPEC.md Section 11.1
- Set up a basic service worker for app shell caching
- Create placeholder app icons (simple "SHFT" text on dark background, 192x192 and 512x512)

**4. Dictionary and word graph**
- Create the script `scripts/curate-dictionary.ts` that:
  - Fetches a public domain English word list (use https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt or bundle a suitable list)
  - Filters to 3, 4, 5, and 6 letter words
  - Removes any words that aren't purely alphabetic lowercase
  - Outputs: public/data/words-3.json, words-4.json, words-5.json, words-6.json
- Create the script `scripts/build-word-graph.ts` that:
  - For each word length, builds an adjacency list (words connected if they differ by exactly 1 letter)
  - Uses the pattern-grouping optimisation (group by _old, c_ld, co_d, col_ patterns)
  - Outputs: public/data/graph-3.json, graph-4.json, graph-5.json, graph-6.json
- Create the script `scripts/generate-puzzles.ts` that:
  - Uses BFS on the word graph to find good puzzle pairs
  - Generates 90 days of puzzles with the weekly difficulty rotation (Mon-Thu: 4-letter, Fri-Sat: 5-letter, Sun: 3-letter)
  - Picks common words (no obscure words on the optimal path)
  - Outputs: public/data/daily-puzzles.json
- Add npm scripts to package.json: generate:dictionary, generate:graphs, generate:puzzles
- Run all three scripts so the data files are ready

**5. Core game engine (src/lib/game/)**
- dictionary.ts: load word list by length, check if word exists
- validator.ts: isValidStep(prev, next), isValidChain(chain, start, target)
- solver.ts: BFS findShortestPath(start, target, graph), loadGraph(length)
- scorer.ts: calculateScore(chain, par) returning { steps, efficiency, chainQuality, isGenius }
- sharer.ts: generateShareText(puzzleNumber, steps, par, chainQuality)

**6. Game UI components (src/components/game/)**
- ChainBoard.tsx: the main game area showing start word, locked rungs, active rung, target word
- LetterSlot.tsx: individual letter display (tappable to select position)
- ChainRung.tsx: a row of LetterSlots representing one word in the chain
- GameKeyboard.tsx: custom QWERTY keyboard matching the SHFT design (not the device keyboard)
- ResultModal.tsx: post-solve modal with score, chain quality, share button
- ShareButton.tsx: copies share text to clipboard using the Web Share API (with navigator.share fallback to clipboard)

**7. Game state (src/lib/stores/gameStore.ts)**
- Zustand store managing: currentChain, activeRungWord, selectedPosition, puzzleData, gameStatus, timer
- Actions: selectPosition, inputLetter, undoStep, submitChain, resetGame, loadPuzzle

**8. Daily Chain page (src/app/play/page.tsx)**
- Loads today's puzzle from daily-puzzles.json (determined by current UTC date)
- Renders ChainBoard + GameKeyboard
- Manages game flow: play → complete → show ResultModal
- Saves result to localStorage (guest mode for now)
- Timer starts on first input, stops on completion

**9. Home page (src/app/page.tsx)**
- Shows the home screen layout from SPEC.md Section 7.2
- Daily Chain card with puzzle number, word length, streak count
- Sprint and Versus cards (greyed out with "Coming Soon" for now)
- Practice card (link to practice mode)
- Bottom tab navigation: Home, Leaderboard (placeholder), Profile (placeholder)

**10. Practice mode (src/app/practice/page.tsx)**  
- Let user pick word length (3, 4, 5)
- Generate a random puzzle client-side from the word graph
- Same game UI as Daily Chain but no timer, no scoring, no share

**11. Local storage for guest play**
- Save daily puzzle completion status per date
- Save current streak count
- Save chain history (last 30 days)
- Check on app load whether today's puzzle is already completed

**12. Theme and polish**
- Light/dark mode toggle in header (persisted to localStorage)
- All colours use CSS variables from the design system
- Portrait-only layout, max-width 480px centred
- Smooth animations for chain lock-in, invalid shake, puzzle complete
- Haptic feedback where Vibration API is available

My Supabase credentials are:
- Project URL: [I'LL TELL YOU]  
- Anon Key: [I'LL TELL YOU]

Don't set up Supabase integration yet — that's Phase 2. For now, everything runs locally/client-side with data files and localStorage.

Start by setting up the project scaffolding (step 1), then work through each step sequentially. After each major step, commit the code with a clear message. Show me what you're doing as you go.
```

### ✂️ --- END PROMPT --- ✂️

---

## STEP 7: After Claude Code finishes Phase 1

Once the build is done, test it locally:

```bash
npm run dev
```

Open `http://localhost:3000` on your phone (both devices must be on the same WiFi, use your PC's local IP address e.g. `http://192.168.1.x:3000`).

Check:
- [ ] Home screen loads with SHFT branding
- [ ] Daily Chain card shows today's puzzle
- [ ] Tapping PLAY opens the game screen
- [ ] Start word and target word are visible
- [ ] Tapping a letter highlights it
- [ ] Typing on the game keyboard replaces the letter
- [ ] Valid words lock in with animation
- [ ] Invalid words shake
- [ ] Completing the chain shows the result modal
- [ ] Share button generates the correct text
- [ ] Practice mode works with selectable word lengths
- [ ] Dark/light mode toggles correctly
- [ ] App feels good in portrait mode on mobile

When you're happy, deploy:

```bash
npx vercel
```

Follow the prompts (link to your Vercel account, accept defaults). Your game will be live at a `.vercel.app` URL.

---

## STEP 8: What comes next

Once Phase 1 is live and tested, come back to me and we'll build:

- **Phase 2:** Supabase integration, user accounts, leaderboards
- **Phase 3:** Sprint mode, Versus mode
- **Phase 4:** Badges, push notifications, weekly recap, final polish

---

## QUICK REFERENCE — What you need before starting

| Item | Where to get it |
|------|----------------|
| GitHub account | github.com |
| Node.js installed | nodejs.org (LTS version) |
| Claude Code installed | Already have it |
| Vercel account | vercel.com (sign in with GitHub) |
| Supabase account | supabase.com (sign in with GitHub) |
| SPEC.md file | The GDD file from this conversation |

That's everything. You're ready to build SHFT. 🔗
