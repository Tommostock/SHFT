/* ===========================
   App-wide constants
   =========================== */

/** The date SHFT launched — puzzle #1 is this date */
export const LAUNCH_DATE = "2026-03-20";

/** Max content width for the mobile-first layout */
export const MAX_WIDTH = 480;

/** Supported word lengths */
export const WORD_LENGTHS = [3, 4, 5, 6] as const;

/** Day-of-week to word length mapping (0=Sun, 1=Mon, ..., 6=Sat) */
export const DAY_WORD_LENGTH: Record<number, number> = {
  0: 3, // Sunday: starter (3-letter)
  1: 4, // Monday: standard (4-letter)
  2: 4, // Tuesday: standard
  3: 4, // Wednesday: standard
  4: 4, // Thursday: standard
  5: 5, // Friday: advanced (5-letter)
  6: 5, // Saturday: advanced
};

/** Chain quality thresholds (steps relative to par) */
export const QUALITY_THRESHOLDS = {
  gold: 0,   // steps <= par
  silver: 1, // par + 1
  bronze: 2, // par + 2
  // iron: par + 3+
} as const;

/** Local storage keys */
export const STORAGE_KEYS = {
  guestData: "shft-guest-data",
  theme: "shft-theme",
} as const;

/** Share text emojis */
export const CHAIN_EMOJI = {
  gold: "🔗",
  silver: "⛓️",
  bronze: "⛓️",
  iron: "⛓️",
} as const;
