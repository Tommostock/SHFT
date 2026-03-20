/* ===========================
   SHFT — TypeScript Interfaces
   =========================== */

/** A single puzzle definition */
export interface DailyPuzzle {
  id: number;
  date?: string; // Optional — continuous play puzzles don't use dates
  startWord: string;
  targetWord: string;
  wordLength: number;
  par: number;
  optimalPath: string[];
  difficulty?: "starter" | "standard" | "advanced" | "expert";
}

/** The full daily puzzles JSON file structure */
export type DailyPuzzlesData = DailyPuzzle[];

/** Word adjacency graph — maps each word to its neighbours */
export type WordGraph = Record<string, string[]>;

/** Word list — simple array of strings */
export type WordList = string[];

/** Chain quality based on steps vs par */
export type ChainQuality = "gold" | "silver" | "bronze" | "iron";

/** Game status */
export type GameStatus = "idle" | "playing" | "complete";

/** Score breakdown after completing a puzzle */
export interface ScoreResult {
  steps: number;
  par: number;
  efficiency: number; // percentage, capped at 100
  chainQuality: ChainQuality;
  isGenius: boolean; // true if steps <= par
  timeMs: number;
}

/** A single rung in the chain display */
export interface ChainRungData {
  word: string;
  isStart: boolean;
  isTarget: boolean;
  isLocked: boolean;
  isActive: boolean;
}

/** Local storage data for guest play */
export interface GuestData {
  /** Map of date string (YYYY-MM-DD) to completion data */
  completions: Record<string, GuestCompletion>;
  currentStreak: number;
  longestStreak: number;
  lastPlayedDate: string | null;
  theme: "light" | "dark";
}

/** A single puzzle completion stored locally */
export interface GuestCompletion {
  chain: string[];
  steps: number;
  par: number;
  efficiency: number;
  chainQuality: ChainQuality;
  timeMs: number;
  completedAt: string; // ISO timestamp
}
