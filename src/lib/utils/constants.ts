/* ===========================
   App-wide constants
   =========================== */

/** The date SHFT launched — puzzle #1 is this date */
export const LAUNCH_DATE = "2026-03-20";

/** Max content width for the mobile-first layout */
export const MAX_WIDTH = 480;

/** Fixed word length — SHFT is a 5-letter word game */
export const WORD_LENGTH = 5;

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
