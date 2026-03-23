/**
 * Tutorial persistence — tracks whether a user has seen
 * each game mode's tutorial screen via localStorage.
 */

const TUTORIAL_KEY_PREFIX = "shft-tutorial-seen-";

/** Check if the user has already seen this mode's tutorial */
export function hasSeenTutorial(mode: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(`${TUTORIAL_KEY_PREFIX}${mode}`) === "true";
}

/** Mark a mode's tutorial as seen */
export function markTutorialSeen(mode: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${TUTORIAL_KEY_PREFIX}${mode}`, "true");
}
