# SHFT — Game Design Document & Technical Specification

**Version:** 1.0
**Date:** March 2026
**Purpose:** Complete blueprint for Claude Code to build SHFT from scratch

---

## 1. WHAT IS SHFT?

SHFT is a competitive daily word puzzle game. Players transform one word into another by changing exactly one letter per step. Every intermediate step must be a valid English word. Fewest steps wins.

**Example:** COLD → CORD → WORD → WORM → WARM (4 steps)

The game has a daily puzzle (same for everyone), a timed sprint mode, head-to-head versus mode, and global leaderboards. It is designed for one-thumb, portrait-mode play on mobile — the kind of game commuters play on the train.

**Name meaning:** "SHFT" = "Shift" without the vowel. You shift one letter at a time.

---

## 2. ZERO-COST CONSTRAINT

This project must cost nothing to build, deploy, and host. Every technology choice must have a free tier that is sufficient for launch and early growth.

| Layer | Technology | Free Tier |
|-------|-----------|-----------|
| Framework | Next.js 15 (App Router) | Open source |
| Styling | Tailwind CSS + shadcn/ui | Open source |
| Backend & Database | Supabase | 500MB DB, 50K MAU, 5GB bandwidth, 500K Edge Function invocations |
| Hosting | Vercel | 100GB bandwidth, serverless functions, automatic HTTPS |
| Auth | Supabase Auth | 50K MAU, social logins, magic links |
| Realtime | Supabase Realtime | Included in free tier (200 concurrent connections) |
| Dictionary | Bundled JSON word list | No API costs — ships with the app |
| Source Control | GitHub | Free private repos |
| PWA | next-pwa / service worker | Native — no cost |
| iOS / Android | PWA (installable) | No App Store fees required |

**App distribution:** SHFT is a Progressive Web App (PWA). Users install it to their home screen from the browser. It works offline, has push notifications (where supported), and feels native. This avoids the $99/year Apple Developer fee and the $25 Google Play fee entirely.

---

## 3. PROJECT STRUCTURE

```
shft/
├── CLAUDE.md                    # Claude Code instructions (copy of this section)
├── SPEC.md                      # Points here (this file)
├── next.config.js               # Next.js config with PWA support
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── public/
│   ├── manifest.json            # PWA manifest
│   ├── sw.js                    # Service worker
│   ├── icons/                   # App icons (192, 512)
│   └── data/
│       ├── words-3.json         # 3-letter word list
│       ├── words-4.json         # 4-letter word list
│       ├── words-5.json         # 5-letter word list
│       ├── words-6.json         # 6-letter word list
│       ├── graph-3.json         # Pre-computed adjacency graph
│       ├── graph-4.json
│       ├── graph-5.json
│       ├── graph-6.json
│       └── daily-puzzles.json   # Pre-generated daily puzzles (90 days ahead)
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Root layout (metadata, fonts, theme)
│   │   ├── page.tsx             # Home / landing
│   │   ├── play/
│   │   │   └── page.tsx         # Daily Chain game screen
│   │   ├── sprint/
│   │   │   └── page.tsx         # Sprint mode
│   │   ├── versus/
│   │   │   └── page.tsx         # Versus mode
│   │   ├── profile/
│   │   │   └── page.tsx         # Stats, badges, streaks
│   │   ├── leaderboard/
│   │   │   └── page.tsx         # Global and friends leaderboards
│   │   └── api/
│   │       ├── daily/route.ts        # Get today's puzzle
│   │       ├── submit/route.ts       # Submit a completed chain
│   │       ├── leaderboard/route.ts  # Fetch leaderboard data
│   │       ├── versus/route.ts       # Create/join versus match
│   │       └── generate/route.ts     # Admin: generate daily puzzles
│   ├── components/
│   │   ├── ui/                  # shadcn/ui components
│   │   ├── game/
│   │   │   ├── ChainBoard.tsx        # The main chain display (rungs)
│   │   │   ├── LetterSlot.tsx        # Individual letter position
│   │   │   ├── GameKeyboard.tsx      # Custom QWERTY keyboard
│   │   │   ├── ChainRung.tsx         # A single rung in the chain
│   │   │   ├── ResultModal.tsx       # Post-solve modal with share
│   │   │   ├── ShareButton.tsx       # Spoiler-free share text generator
│   │   │   ├── Timer.tsx             # Sprint mode timer
│   │   │   └── VersusOverlay.tsx     # Real-time opponent status
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── BottomNav.tsx         # Mobile tab navigation
│   │   │   └── ThemeToggle.tsx       # Light/dark mode
│   │   └── profile/
│   │       ├── StreakCounter.tsx
│   │       ├── BadgeGrid.tsx
│   │       └── StatsCard.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts             # Browser Supabase client
│   │   │   ├── server.ts             # Server-side Supabase client
│   │   │   └── middleware.ts          # Auth middleware
│   │   ├── game/
│   │   │   ├── dictionary.ts         # Load and query word lists
│   │   │   ├── validator.ts          # Validate chain steps
│   │   │   ├── solver.ts             # BFS shortest path solver
│   │   │   ├── generator.ts          # Generate puzzle pairs
│   │   │   ├── scorer.ts             # Calculate chain quality/score
│   │   │   └── sharer.ts             # Generate share text
│   │   ├── stores/
│   │   │   ├── gameStore.ts          # Zustand game state
│   │   │   └── userStore.ts          # Zustand user/auth state
│   │   └── utils/
│   │       ├── dates.ts              # Timezone-aware date helpers
│   │       └── constants.ts          # App-wide constants
│   ├── hooks/
│   │   ├── useGame.ts               # Core game logic hook
│   │   ├── useDaily.ts              # Daily puzzle hook
│   │   ├── useSprint.ts             # Sprint mode hook
│   │   ├── useVersus.ts             # Versus mode hook (Supabase Realtime)
│   │   └── useAuth.ts               # Auth hook
│   └── types/
│       └── index.ts                 # All TypeScript interfaces
├── scripts/
│   ├── build-word-graph.ts      # Pre-compute word adjacency graphs
│   ├── generate-puzzles.ts      # Generate 90 days of daily puzzles
│   └── curate-dictionary.ts     # Filter dictionary to common words
└── supabase/
    └── migrations/
        └── 001_initial.sql      # Database schema
```

---

## 4. DATABASE SCHEMA (Supabase / PostgreSQL)

```sql
-- Users (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily puzzle definitions
CREATE TABLE public.daily_puzzles (
  id SERIAL PRIMARY KEY,
  puzzle_date DATE UNIQUE NOT NULL,
  start_word TEXT NOT NULL,
  target_word TEXT NOT NULL,
  word_length INT NOT NULL,
  par INT NOT NULL,                          -- Optimal shortest path length
  optimal_path TEXT[] NOT NULL,              -- The BFS-solved optimal chain
  difficulty TEXT CHECK (difficulty IN ('starter', 'standard', 'advanced', 'expert')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Player submissions for daily puzzles
CREATE TABLE public.daily_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  puzzle_id INT REFERENCES public.daily_puzzles(id) NOT NULL,
  chain TEXT[] NOT NULL,                     -- The player's full chain ['COLD','CORD','WORD','WORM','WARM']
  steps INT NOT NULL,                        -- Number of steps (chain length - 1)
  time_ms INT NOT NULL,                      -- Solve time in milliseconds
  efficiency DECIMAL(5,2) NOT NULL,          -- (par / steps) * 100
  chain_quality TEXT NOT NULL,               -- 'gold', 'silver', 'bronze', 'iron'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, puzzle_id)                 -- One submission per puzzle per user
);

-- Player streaks and stats
CREATE TABLE public.player_stats (
  user_id UUID REFERENCES public.profiles(id) PRIMARY KEY,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  total_daily_solved INT DEFAULT 0,
  total_genius_solves INT DEFAULT 0,         -- Solves at or under par
  consecutive_genius INT DEFAULT 0,
  best_consecutive_genius INT DEFAULT 0,
  total_sprint_played INT DEFAULT 0,
  best_sprint_score INT DEFAULT 0,
  sprint_rank TEXT DEFAULT 'link',           -- link, chain, steel, gold, diamond
  sprint_elo INT DEFAULT 1000,
  versus_wins INT DEFAULT 0,
  versus_losses INT DEFAULT 0,
  versus_elo INT DEFAULT 1000,
  unique_words_used TEXT[] DEFAULT '{}',
  last_played_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sprint mode scores
CREATE TABLE public.sprint_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  score INT NOT NULL,                        -- Weighted total score
  chains_completed INT NOT NULL,
  avg_efficiency DECIMAL(5,2) NOT NULL,
  season INT NOT NULL,                       -- Season number (resets every 4 weeks)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Versus matches
CREATE TABLE public.versus_matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player1_id UUID REFERENCES public.profiles(id) NOT NULL,
  player2_id UUID,                           -- NULL until opponent joins
  start_word TEXT NOT NULL,
  target_word TEXT NOT NULL,
  word_length INT NOT NULL,
  par INT NOT NULL,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'complete')),
  winner_id UUID REFERENCES public.profiles(id),
  player1_chain TEXT[],
  player2_chain TEXT[],
  player1_time_ms INT,
  player2_time_ms INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Badges earned
CREATE TABLE public.badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  badge_type TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_type)
);

-- Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprint_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.versus_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

-- Profiles: anyone can read, owners can update
CREATE POLICY "Public profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Submissions: anyone can read (for leaderboards), authenticated can insert their own
CREATE POLICY "Read submissions" ON public.daily_submissions FOR SELECT USING (true);
CREATE POLICY "Own submissions" ON public.daily_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Stats: anyone can read, system updates via functions
CREATE POLICY "Read stats" ON public.player_stats FOR SELECT USING (true);
CREATE POLICY "Own stats" ON public.player_stats FOR ALL USING (auth.uid() = user_id);

-- Sprint: anyone can read, own insert
CREATE POLICY "Read sprints" ON public.sprint_scores FOR SELECT USING (true);
CREATE POLICY "Own sprints" ON public.sprint_scores FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Versus: participants can read/update
CREATE POLICY "Versus read" ON public.versus_matches FOR SELECT USING (true);
CREATE POLICY "Versus create" ON public.versus_matches FOR INSERT WITH CHECK (auth.uid() = player1_id);
CREATE POLICY "Versus update" ON public.versus_matches FOR UPDATE USING (auth.uid() IN (player1_id, player2_id));

-- Badges: anyone can read, system inserts
CREATE POLICY "Read badges" ON public.badges FOR SELECT USING (true);
CREATE POLICY "Own badges" ON public.badges FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_daily_submissions_puzzle ON public.daily_submissions(puzzle_id);
CREATE INDEX idx_daily_submissions_user ON public.daily_submissions(user_id);
CREATE INDEX idx_sprint_scores_season ON public.sprint_scores(season, score DESC);
CREATE INDEX idx_daily_puzzles_date ON public.daily_puzzles(puzzle_date);
CREATE INDEX idx_versus_status ON public.versus_matches(status);
```

---

## 5. CORE GAME MECHANICS — DETAILED SPECIFICATION

### 5.1 The Word Ladder

**Rule:** Given a start word and target word of the same length, the player must build a chain where each word differs from the previous by exactly one letter at exactly one position. Every word in the chain must be a valid English dictionary word.

**Validation function:**
```
isValidStep(prev: string, next: string): boolean
  - prev.length === next.length
  - exactly one character position differs
  - next is in the dictionary
```

**Chain validation:**
```
isValidChain(chain: string[]): boolean
  - chain[0] === startWord
  - chain[chain.length - 1] === targetWord
  - every consecutive pair passes isValidStep
```

### 5.2 Par Calculation

Par is the length of the shortest possible path between start and target, calculated using Breadth-First Search (BFS) on the pre-computed word graph.

**Word graph structure:**
- Nodes: every word in the dictionary of a given length
- Edges: connect words that differ by exactly one letter
- This is pre-computed at build time and shipped as a JSON adjacency list

**BFS algorithm:**
```
findShortestPath(start: string, target: string, graph: Map<string, string[]>): string[]
  - Standard BFS from start to target
  - Returns the full path (including start and target)
  - Par = path.length - 1 (number of steps)
```

### 5.3 Scoring

| Metric | Calculation |
|--------|-------------|
| Steps | chain.length - 1 |
| Efficiency | (par / steps) × 100, capped at 100% |
| Chain Quality | Gold = steps ≤ par, Silver = par+1, Bronze = par+2, Iron = par+3+ |
| Time | Milliseconds from first input to final submission (tiebreaker only) |

### 5.4 Dictionary

Use a curated English word list. Start with a well-known open-source Scrabble dictionary (e.g., the public domain TWL or SOWPODS subset), then filter:

**Curation rules:**
- Include only words 3–6 letters long
- Remove proper nouns, abbreviations, slurs, and offensive words
- For daily puzzle generation, maintain a "common words" subset (top ~3,000 most frequently used per word length) to ensure puzzles never require obscure words on the optimal path
- The full dictionary is used for player input validation (accept any valid word the player types)

**File structure:**
- `words-4.json` = `["able","ache","acid","acme","acre", ...]` — full valid word list
- `graph-4.json` = `{"able":["axle","abbe"], "ache":["acre","ache"], ...}` — adjacency list

### 5.5 Share Format

After completing the Daily Chain, the player can share a spoiler-free result:

```
SHFT #247 🔗⛓️⛓️⛓️⛓️ (4/5 par)
```

**Format breakdown:**
- `SHFT` — game name
- `#247` — puzzle number (days since launch)
- Chain emoji count = number of steps used
- 🔗 = gold (at or under par), ⛓️ = silver (par+1), regular chain for par+2+
- `(4/5 par)` — steps used / par

If the player solved at par or under:
```
SHFT #247 🔗🔗🔗🔗 (4/4 par) ⭐
```

---

## 6. GAME MODES — DETAILED SPECIFICATION

### 6.1 Daily Chain

**The anchor mode. Available to all players. One puzzle per day.**

- Puzzle is determined by the current date (UTC)
- Same start word and target word for all players worldwide
- Puzzles are pre-generated and stored in the database / JSON file
- Player opens the game → sees start word (bottom) and target word (top) with empty rungs between
- Player builds chain by selecting a letter position and typing a replacement
- Each valid word locks in with animation, a new empty rung appears above
- Player can undo any step (unlimited undos)
- When chain reaches the target word → puzzle complete
- Results screen shows: steps, par, efficiency, chain quality, time
- Share button generates the spoiler-free text
- Chain and score submitted to leaderboard

**Weekly difficulty rotation:**
- Monday–Thursday: Standard (4-letter words)
- Friday–Saturday: Advanced (5-letter words)
- Sunday: Starter (3-letter words)

**Offline support:**
- The next 7 days of puzzles are pre-fetched and cached locally
- Word graph is cached in IndexedDB on first load
- Chain progress is saved locally and synced on reconnection

### 6.2 Sprint Mode

**Timed competitive mode. Tests speed and vocabulary breadth.**

- 3-minute countdown timer
- Random word pairs are served one after another
- Complete a chain → score points → next pair appears immediately
- Scoring per chain: `(par × 10) + (efficiency bonus) + (speed bonus)`
- Session ends when timer hits zero
- Total score submitted to weekly Sprint leaderboard

**Difficulty scaling:**
- First 3 chains: 3-letter words, par 2–3
- Chains 4–6: 4-letter words, par 3–4
- Chains 7+: 4–5 letter words, par 4–6
- Adjust based on player's Sprint Elo

**Rank tiers (based on Elo):**
- Link: 0–999
- Chain: 1000–1199
- Steel: 1200–1399
- Gold: 1400–1599
- Diamond: 1600+

**Seasons:** Reset every 4 weeks. Rank resets to base of your previous tier. Top players earn cosmetic rewards.

### 6.3 Versus Mode

**Real-time 1v1 matches using Supabase Realtime.**

- Player creates a match → gets a share link
- Opponent joins via link → both see the same word pair
- 60-second time limit per chain
- Both solve simultaneously — see opponent's progress (number of steps locked, not the actual words)
- First to complete wins (ties broken by fewer steps, then time)
- Results: winner declared, both chains shown, Elo adjusted

**Versus match flow:**
1. Player 1 creates match → `versus_matches` row with `status: 'waiting'`
2. Player 1 shares link containing match ID
3. Player 2 opens link → joins match → `status: 'active'`
4. Both subscribe to Supabase Realtime channel for the match
5. Progress updates broadcast in real-time (step count only, not words)
6. On completion, chain submitted → server validates → winner determined
7. `status: 'complete'`, Elo updated for both players

### 6.4 Practice Mode

**Unlimited, untimed, unranked play.**

- Player selects word length (3, 4, 5, or 6)
- Random word pair generated client-side from the word graph
- No time pressure, no scoring, no leaderboard impact
- Ideal for warming up or learning the mechanic
- Available to all players, unlimited sessions

---

## 7. USER INTERFACE SPECIFICATION

### 7.1 Design System

**Design philosophy:** Typography-led minimalism. The words ARE the visual. No mascots, no illustrations, no decorative elements. Premium stationery brand energy, not mobile game energy.

**Colour palette:**

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| --bg-primary | #FAFAF8 | #0F0F0F | Page background |
| --bg-surface | #FFFFFF | #1A1A1A | Cards, modals |
| --bg-elevated | #F5F3EE | #242424 | Keyboard keys, subtle highlights |
| --text-primary | #1A1A1A | #F5F3EE | Headings, active letters |
| --text-secondary | #6B7280 | #9CA3AF | Body text, hints |
| --accent-gold | #C9A84C | #C9A84C | Success, par/genius, premium |
| --accent-silver | #9CA3AF | #9CA3AF | Par+1 result |
| --accent-error | #DC2626 | #EF4444 | Invalid word rejection |
| --border | #E5E7EB | #374151 | Subtle borders |
| --chain-locked | #C9A84C | #C9A84C | Locked rung connector |
| --chain-active | #1A1A1A | #F5F3EE | Active rung border |

**Typography:**

- Display / Logo: `"Instrument Serif", Georgia, serif` — for the SHFT wordmark and large display text
- Game letters: `"JetBrains Mono", "Fira Code", monospace` — monospaced for letter grid alignment
- Body / UI: `"DM Sans", system-ui, sans-serif` — clean, modern, highly legible
- Load via Google Fonts (free): `Instrument+Serif:ital@0;1&DM+Sans:wght@400;500;700&JetBrains+Mono:wght@400;700`

**Spacing scale:** 4px base unit. Use multiples: 4, 8, 12, 16, 24, 32, 48, 64, 96.

**Border radius:** 8px for cards/modals, 12px for buttons, 4px for letter slots.

**Shadows:** Minimal. One level only: `0 1px 3px rgba(0,0,0,0.08)` for elevated surfaces.

### 7.2 Screen Layouts

**All screens are portrait-only, mobile-first. Max content width: 480px, centred.**

#### Home Screen
```
┌────────────────────────┐
│  SHFT          [👤][⚙] │  ← Logo left, profile & settings right
│                        │
│  ┌──────────────────┐  │
│  │  DAILY CHAIN     │  │  ← Primary CTA card
│  │  #247 · 4 letters│  │
│  │  🔥 12 day streak│  │
│  │  [  PLAY  ]      │  │
│  └──────────────────┘  │
│                        │
│  ┌────────┐┌────────┐  │
│  │ SPRINT ││ VERSUS │  │  ← Secondary mode cards
│  │ 🏆 Gold ││ ⚔️ 1v1  │  │
│  └────────┘└────────┘  │
│                        │
│  ┌──────────────────┐  │
│  │ PRACTICE         │  │  ← Tertiary
│  │ No pressure. >   │  │
│  └──────────────────┘  │
│                        │
├────────────────────────┤
│ 🏠  📊  👤              │  ← Bottom tab nav: Home, Leaderboard, Profile
└────────────────────────┘
```

#### Game Screen (Daily Chain)
```
┌────────────────────────┐
│  ← Back    #247   ⏱ 2:15│  ← Header: back, puzzle number, timer
│                         │
│     ┌─────────────┐    │
│     │ W  A  R  M  │    │  ← Target word (top, muted until reached)
│     └─────────────┘    │
│           ·             │
│           ·             │  ← Empty rungs (dots showing path to fill)
│           ·             │
│     ┌─────────────┐    │
│     │ W  O  R  M  │    │  ← Most recent valid word (locked, gold chain icon)
│     ├─⛓️───────────┤    │
│     │ W  O  R  D  │    │  ← Previous locked word
│     ├─⛓️───────────┤    │
│     │ C  O  R  D  │    │  ← Previous locked word
│     ├─⛓️───────────┤    │
│     │ C  O  L  D  │    │  ← Start word (bottom, always visible)
│     └─────────────┘    │
│                         │
│  ┌─────────────────┐   │
│  │ [Active rung]    │   │  ← Current input rung, tap letter to select
│  │  _  O  R  D     │   │     then tap keyboard to replace
│  └─────────────────┘   │
│                         │
│  ┌─────────────────────┐│
│  │ Q W E R T Y U I O P ││  ← Compact QWERTY keyboard
│  │  A S D F G H J K L  ││
│  │ ↩ Z X C V B N M  ⌫ ││  ← Undo (↩) and Backspace (⌫)
│  └─────────────────────┘│
└─────────────────────────┘
```

**Chain area behaviour:**
- Start word is always anchored at the bottom
- Target word is always visible at the top (greyed out until reached)
- Locked rungs stack upward from the start word with chain-link connectors between them
- The active input rung sits just above the last locked rung
- If the chain gets tall enough to need scrolling, the chain area scrolls with the active rung always visible
- Tapping a letter position in the active rung highlights it
- Tapping a keyboard key replaces the highlighted letter
- If the resulting word is valid → satisfying lock animation, chain-link appears, new rung spawns
- If the resulting word is invalid → rung shakes briefly, no penalty
- If the new word matches the target → puzzle complete, trigger celebration

#### Result Modal
```
┌────────────────────────┐
│                        │
│       ⭐ GENIUS!       │  ← (or "COMPLETE!" if not at par)
│                        │
│   COLD → WARM          │
│   4 steps  ·  Par: 4   │
│   Efficiency: 100%     │
│   Time: 1:42           │
│                        │
│   🔗🔗🔗🔗 Gold Chain   │
│                        │
│  ┌──────────────────┐  │
│  │    📤 SHARE      │  │
│  └──────────────────┘  │
│  ┌──────────────────┐  │
│  │  📊 LEADERBOARD  │  │
│  └──────────────────┘  │
│                        │
│  🔥 Streak: 13 days    │
│                        │
└────────────────────────┘
```

### 7.3 Animations

All animations use CSS transitions/animations or Framer Motion. Keep them snappy — no sluggish transitions.

| Event | Animation | Duration |
|-------|-----------|----------|
| Valid word lock-in | Rung slides up, chain-link icon fades in, subtle gold flash | 300ms |
| Invalid word | Rung shakes horizontally (3 oscillations) | 250ms |
| Letter select | Letter slot gets gold border, subtle scale up | 150ms |
| Puzzle complete | Chain links all pulse gold simultaneously, confetti particles | 800ms |
| Genius solve | Star burst animation on the ⭐ icon | 500ms |
| Sprint chain complete | Fast slide-out left, new pair slides in from right | 200ms |
| Streak milestone | Number counter animates up with spring easing | 400ms |
| Keyboard key press | Key darkens briefly (active state) | 100ms |

### 7.4 Haptic Feedback

Use the Vibration API where available:
- Valid word: single short pulse (10ms)
- Invalid word: double short pulse (10ms, 50ms gap, 10ms)
- Puzzle complete: medium pulse (30ms)
- Genius solve: pattern pulse (10ms, 30ms, 10ms, 30ms, 50ms)

### 7.5 Sound Design (optional, off by default)

If implemented, all sounds should be subtle and satisfying:
- Valid word: soft "click" or "link" sound
- Invalid word: muted low tone
- Puzzle complete: ascending chime sequence
- Keep all audio files under 50KB total

---

## 8. AUTHENTICATION & USER SYSTEM

### 8.1 Auth Flow

Use Supabase Auth with the following methods:
- **Magic Link (email)** — primary method. No password to remember.
- **Google OAuth** — one-tap sign in
- **Anonymous / Guest** — play without signing up. Daily Chain available. Stats stored locally. Can convert to full account later.

**Guest-to-account conversion:**
- Guest progress stored in localStorage
- On sign-up, local stats merged into Supabase profile
- Prompt to create account after 3rd daily puzzle or first Sprint attempt

### 8.2 Profile

- Username (unique, 3–15 chars, alphanumeric + underscores)
- Display name (optional)
- Avatar (generated from username initials, like GitHub)
- Stats dashboard (streaks, efficiency averages, badges)
- Chain quality history (visual heatmap of daily results)

---

## 9. LEADERBOARD SPECIFICATION

### 9.1 Daily Chain Leaderboard

- Ranked by: steps (ascending), then time (ascending)
- Filters: Global, Friends, Regional
- Shows: rank, username, steps, time, chain quality emoji
- Resets daily with each new puzzle

### 9.2 Sprint Leaderboard

- Ranked by: score (descending)
- Filters: This week, This season, All-time, Friends
- Shows: rank, username, score, chains completed, rank tier badge
- Weekly resets. Season resets every 4 weeks.

### 9.3 Friends

- Add friends by username search
- Or share a friend link (deep link with user ID)
- Friends list stored in a `friendships` table (not shown in schema above for brevity — simple many-to-many with user IDs)

---

## 10. RETENTION MECHANICS

### 10.1 Streaks

- Increment on daily puzzle completion
- Reset if a day is missed (based on UTC date)
- Streak freeze: 1 free freeze per 30 days (stored in player_stats). Automatically applied if the player misses a day but had a freeze available.
- Visual: 🔥 fire emoji with number, increasingly dramatic as streak grows (changes colour at 7, 30, 100, 365)

### 10.2 Badges

| Badge | Requirement | Icon |
|-------|-------------|------|
| First Link | Complete your first chain | 🔗 |
| Week Warrior | 7-day streak | 🗓️ |
| Gold Standard | 10 Genius solves (lifetime) | 🥇 |
| Masterlinker | 10 consecutive Genius solves | 🧠 |
| Century Chain | 100-day streak | 💯 |
| Diamond Mind | Reach Diamond in Sprint | 💎 |
| Lexicon Legend | 5,000 unique words used | 📚 |
| Year of Chains | 365-day streak | 🏆 |
| Speed Demon | Complete a Sprint chain in under 10 seconds | ⚡ |
| Rival | Win 10 Versus matches | ⚔️ |

Badges are checked and awarded after every daily submission, sprint session, and versus match.

### 10.3 Push Notifications (PWA)

- Request permission after 3rd daily solve
- Single daily notification at player's preferred time (default: 8:00 AM local)
- Message: "Today's SHFT is ready. 🔗" — nothing more
- Never send more than 1 notification per day
- Use Web Push API / service worker

### 10.4 Weekly Recap

- Generated client-side every Monday
- Shows: puzzles solved, avg efficiency, best chain, streak status, rank change
- Displayed as a modal on first app open on Monday
- Shareable as an image (use html2canvas or similar)

---

## 11. PWA SPECIFICATION

### 11.1 Manifest

```json
{
  "name": "SHFT",
  "short_name": "SHFT",
  "description": "The daily word chain puzzle",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#0F0F0F",
  "theme_color": "#C9A84C",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

### 11.2 Service Worker Caching Strategy

- **App shell (HTML, CSS, JS):** Cache-first, update in background
- **Word graphs and dictionaries:** Cache-first (these rarely change)
- **Daily puzzles:** Network-first, fall back to pre-fetched cache (next 7 days)
- **API calls (leaderboard, profile):** Network-only (stale data is worse than no data)
- **Fonts:** Cache-first with long expiry

### 11.3 Offline Behaviour

- Daily Chain: fully playable offline (puzzle + dictionary cached)
- Sprint: requires connection (leaderboard submission)
- Versus: requires connection (real-time)
- Practice: fully playable offline
- Queued submissions: if the player completes the Daily Chain offline, store the result locally and submit on reconnection

---

## 12. BUILD SCRIPTS

### 12.1 Dictionary Builder (`scripts/curate-dictionary.ts`)

1. Download a public domain word list (e.g., from https://github.com/dwyl/english-words or similar MIT-licensed source)
2. Filter to 3–6 letter words only
3. Remove proper nouns (words starting with capital)
4. Remove offensive words (maintain a blocklist)
5. Output: `words-3.json`, `words-4.json`, `words-5.json`, `words-6.json`

### 12.2 Word Graph Builder (`scripts/build-word-graph.ts`)

1. For each word length file, load all words
2. For every pair of words, check if they differ by exactly one letter
3. Build adjacency list: `{ "cold": ["bold","cole","colt","cord","fold","gold","hold","mold","sold","told"] }`
4. Output: `graph-3.json`, `graph-4.json`, `graph-5.json`, `graph-6.json`

**Optimisation:** For 4-letter words (~5,000 words), comparing every pair is O(n²) ≈ 25M comparisons. Optimise by grouping words by pattern (e.g., `_old`, `c_ld`, `co_d`, `col_`) and only comparing within groups.

### 12.3 Puzzle Generator (`scripts/generate-puzzles.ts`)

1. For each day in the next 90 days:
2. Determine word length based on day-of-week
3. Pick a random start word from the "common words" subset
4. Use BFS to find all words reachable in 3–7 steps
5. From those, pick a target word that is also common
6. Prefer thematic pairs where possible (maintain a curated list: COLD/WARM, LOVE/HATE, DAWN/DUSK, HEAD/TAIL, etc.)
7. Store: date, start, target, word_length, par, optimal_path
8. Output to both `daily-puzzles.json` (for offline/static) and the Supabase database

---

## 13. CLAUDE.md (For Claude Code)

Copy this section into the project's `CLAUDE.md` file:

```markdown
# CLAUDE.md — SHFT Project

## What is this project?
SHFT is a daily word puzzle game (PWA). Players transform one word into another by changing one letter at a time. Each step must be a valid English word. Fewest steps wins.

## Tech stack
- Next.js 15 (App Router, TypeScript)
- Tailwind CSS + shadcn/ui
- Supabase (Postgres, Auth, Realtime)
- Zustand (state management)
- Vercel (hosting)
- PWA (service worker for offline play)

## Key files
- `SPEC.md` — Full game design document (the source of truth)
- `src/lib/game/` — Core game engine (dictionary, validator, solver, scorer)
- `src/components/game/` — Game UI components
- `public/data/` — Word lists and pre-computed graphs
- `supabase/migrations/` — Database schema
- `scripts/` — Build scripts for dictionary, word graph, puzzle generation

## Commands
- `npm run dev` — Start development server
- `npm run build` — Production build
- `npm run generate:dictionary` — Build word lists from source
- `npm run generate:graphs` — Build word adjacency graphs
- `npm run generate:puzzles` — Generate 90 days of daily puzzles

## Code style
- TypeScript strict mode
- Prefer named exports
- Components in PascalCase files
- Hooks prefixed with `use`
- All game logic in `src/lib/game/` (pure functions, no React dependencies)
- Keep components thin — delegate logic to hooks and lib functions
- Comment all non-obvious logic, especially in the solver and validator
- Mobile-first CSS (min-width breakpoints)
- Accessibility: all interactive elements must be keyboard navigable and have ARIA labels

## Architecture principles
- Game engine is framework-agnostic (pure TypeScript in `src/lib/game/`)
- All word validation happens client-side (dictionaries are bundled)
- BFS solver runs client-side for practice mode, server-side for daily puzzle par calculation
- Supabase is the single source of truth for user data, scores, and leaderboards
- Offline-first for Daily Chain: cache puzzles and dictionaries in service worker

## Design tokens
See SPEC.md Section 7.1 for the complete colour palette, typography, and spacing system.
- Gold accent: #C9A84C
- Dark background: #0F0F0F
- Fonts: Instrument Serif (display), JetBrains Mono (letters), DM Sans (UI)
```

---

## 14. DEVELOPMENT PHASES

### Phase 1 — MVP (Weeks 1–3)
Build the Daily Chain mode end-to-end.

**Deliverables:**
- [ ] Project scaffolding (Next.js 15, Tailwind, shadcn/ui, TypeScript)
- [ ] PWA setup (manifest, service worker, icons)
- [ ] Dictionary curation script + word list JSON files
- [ ] Word graph builder script + graph JSON files
- [ ] BFS solver (findShortestPath)
- [ ] Puzzle generator script + initial 90-day puzzle set
- [ ] Core game engine: dictionary.ts, validator.ts, solver.ts, scorer.ts
- [ ] Game UI: ChainBoard, LetterSlot, GameKeyboard, ChainRung
- [ ] Daily Chain game flow (load puzzle → play → complete → result)
- [ ] Result modal with share functionality
- [ ] Local storage for guest play (save progress, streaks)
- [ ] Light/dark theme toggle
- [ ] Home screen with Daily Chain card
- [ ] Responsive mobile layout (portrait, max 480px)
- [ ] Deploy to Vercel

### Phase 2 — Accounts & Leaderboards (Weeks 4–5)
Add user system and competitive features.

**Deliverables:**
- [ ] Supabase project setup + database schema migration
- [ ] Auth: magic link, Google OAuth, guest mode
- [ ] Profile page (username, stats, streak)
- [ ] Daily Chain leaderboard (global)
- [ ] Submit chain to Supabase on completion
- [ ] Guest-to-account conversion (merge local data)
- [ ] Friend system (add by username, friend leaderboard)
- [ ] Streak freeze logic

### Phase 3 — Sprint & Versus (Weeks 6–8)
Add the competitive game modes.

**Deliverables:**
- [ ] Sprint mode: timed 3-minute sessions, random pairs, scoring
- [ ] Sprint leaderboard (weekly, seasonal)
- [ ] Sprint rank tiers and Elo calculation
- [ ] Versus mode: create match, share link, join match
- [ ] Versus real-time via Supabase Realtime channels
- [ ] Versus Elo adjustments
- [ ] Practice mode (untimed, unranked, unlimited)

### Phase 4 — Polish & Retention (Weeks 9–10)
Add the features that make players stay.

**Deliverables:**
- [ ] Badge system (check + award after each action)
- [ ] Weekly recap modal
- [ ] Push notifications (Web Push API)
- [ ] Onboarding tutorial (first-time player walkthrough)
- [ ] Animations polish (chain-link, celebration, shake)
- [ ] Haptic feedback
- [ ] Performance optimisation (lazy load word graphs, code splitting)
- [ ] SEO and Open Graph metadata (for share links)
- [ ] Accessibility audit and fixes
- [ ] Final QA pass

---

## 15. SUCCESS METRICS

| Metric | 3-Month Target | 12-Month Target |
|--------|---------------|-----------------|
| Daily Active Users | 5,000 | 50,000 |
| Day 1 Retention | 45% | 50% |
| Day 7 Retention | 25% | 30% |
| Day 30 Retention | 12% | 18% |
| Daily Chain Completion Rate | 70% | 80% |
| Share Rate | 10% | 15% |
| Avg Session Length | 3.5 min | 5 min |
| Sprint Participation | 20% of DAU | 30% of DAU |

---

## 16. FUTURE CONSIDERATIONS (Post-Launch)

These are NOT in scope for the initial build but are noted for future reference:

- **Monetization:** Freemium subscription for unlimited Sprint, Versus ranked, full stats, ad-free, cosmetic chain styles
- **Native app:** Wrap PWA in Expo/EAS for App Store / Google Play distribution (when revenue justifies the $99/year + $25 fees)
- **6-letter Expert tier:** Unlock after completing 20 Advanced puzzles
- **Seasonal events:** Monthly themed challenges with exclusive badges
- **AI-generated puzzles:** Use Claude API to create thematic word pairs with narrative context
- **Localisation:** Support for other languages (French, Spanish, German word dictionaries)
- **Social features:** In-app chat in Versus, spectate mode, clans/groups

---

*This document is the single source of truth for SHFT. All development decisions should reference this spec. If something isn't covered here, ask before building.*
