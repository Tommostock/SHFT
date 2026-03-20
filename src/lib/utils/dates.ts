/* ===========================
   Timezone-aware date helpers
   =========================== */

import { LAUNCH_DATE } from "./constants";

/** Get today's date as YYYY-MM-DD in UTC */
export function getTodayUTC(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

/** Get the puzzle number for a given date (days since launch) */
export function getPuzzleNumber(dateStr: string): number {
  const launch = new Date(LAUNCH_DATE + "T00:00:00Z");
  const date = new Date(dateStr + "T00:00:00Z");
  const diffMs = date.getTime() - launch.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

/** Get the day of week (0=Sun) for a given date string */
export function getDayOfWeek(dateStr: string): number {
  const date = new Date(dateStr + "T00:00:00Z");
  return date.getUTCDay();
}

/** Get yesterday's date as YYYY-MM-DD in UTC */
export function getYesterdayUTC(): string {
  const now = new Date();
  const yesterday = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() - 1
  ));
  return yesterday.toISOString().split("T")[0];
}

/** Format milliseconds as M:SS */
export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
