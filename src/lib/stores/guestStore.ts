/**
 * Guest Store — localStorage persistence for guest play.
 * Saves daily completions, streak data, and theme preference.
 */

import type { GuestData, GuestCompletion, ChainQuality } from "@/types";
import { STORAGE_KEYS } from "@/lib/utils/constants";
import { getTodayUTC, getYesterdayUTC } from "@/lib/utils/dates";

const DEFAULT_GUEST_DATA: GuestData = {
  completions: {},
  currentStreak: 0,
  longestStreak: 0,
  lastPlayedDate: null,
  theme: "dark",
};

/** Load guest data from localStorage */
export function loadGuestData(): GuestData {
  if (typeof window === "undefined") return DEFAULT_GUEST_DATA;

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.guestData);
    if (!raw) return DEFAULT_GUEST_DATA;
    return JSON.parse(raw) as GuestData;
  } catch {
    return DEFAULT_GUEST_DATA;
  }
}

/** Save guest data to localStorage */
export function saveGuestData(data: GuestData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.guestData, JSON.stringify(data));
  } catch {
    // localStorage might be full or disabled
  }
}

/** Check if today's puzzle has been completed */
export function isTodayCompleted(): boolean {
  const data = loadGuestData();
  const today = getTodayUTC();
  return today in data.completions;
}

/** Get today's completion data, if any */
export function getTodayCompletion(): GuestCompletion | null {
  const data = loadGuestData();
  const today = getTodayUTC();
  return data.completions[today] || null;
}

/**
 * Save a daily puzzle completion.
 * Updates streak and saves the chain.
 */
export function saveDailyCompletion(
  chain: string[],
  steps: number,
  par: number,
  efficiency: number,
  chainQuality: ChainQuality,
  timeMs: number
): void {
  const data = loadGuestData();
  const today = getTodayUTC();

  // Don't overwrite existing completion
  if (data.completions[today]) return;

  // Save completion
  data.completions[today] = {
    chain,
    steps,
    par,
    efficiency,
    chainQuality,
    timeMs,
    completedAt: new Date().toISOString(),
  };

  // Update streak
  const yesterdayStr = getYesterdayUTC();

  if (data.lastPlayedDate === yesterdayStr) {
    // Continuing a streak
    data.currentStreak += 1;
  } else if (data.lastPlayedDate !== today) {
    // Starting a new streak
    data.currentStreak = 1;
  }

  data.longestStreak = Math.max(data.longestStreak, data.currentStreak);
  data.lastPlayedDate = today;

  // Prune old completions (keep last 30 days)
  const cutoffDate = new Date(today + "T00:00:00Z");
  cutoffDate.setUTCDate(cutoffDate.getUTCDate() - 30);
  const cutoffStr = cutoffDate.toISOString().split("T")[0];

  for (const dateKey of Object.keys(data.completions)) {
    if (dateKey < cutoffStr) {
      delete data.completions[dateKey];
    }
  }

  saveGuestData(data);
}

/** Get the current streak count */
export function getCurrentStreak(): number {
  const data = loadGuestData();
  const today = getTodayUTC();
  const yesterdayStr = getYesterdayUTC();

  // Streak is valid if last played was today or yesterday
  if (
    data.lastPlayedDate === today ||
    data.lastPlayedDate === yesterdayStr
  ) {
    return data.currentStreak;
  }

  return 0;
}

/** Get/set theme preference */
export function getTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "dark";
  try {
    const theme = localStorage.getItem(STORAGE_KEYS.theme);
    return theme === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function setTheme(theme: "light" | "dark"): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.theme, theme);
  } catch {
    // Ignore
  }
}
