/**
 * Validator — Check if chain steps and full chains are valid.
 * Pure functions, no side effects.
 */

import { isWord } from "./dictionary";

/**
 * Check if moving from `prev` to `next` is a valid step.
 * Rules:
 *   - Same length
 *   - Exactly one character position differs
 *   - `next` is a valid dictionary word
 */
export function isValidStep(prev: string, next: string): boolean {
  if (prev.length !== next.length) return false;

  let diffCount = 0;
  for (let i = 0; i < prev.length; i++) {
    if (prev[i] !== next[i]) {
      diffCount++;
      if (diffCount > 1) return false;
    }
  }

  // Must differ by exactly one letter
  if (diffCount !== 1) return false;

  // Must be a valid word
  return isWord(next);
}

/**
 * Count how many letters differ between two words of the same length.
 */
export function letterDiff(a: string, b: string): number {
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) diff++;
  }
  return diff;
}

/**
 * Check if a full chain is valid from start to target.
 * Every consecutive pair must pass isValidStep.
 */
export function isValidChain(
  chain: string[],
  startWord: string,
  targetWord: string
): boolean {
  if (chain.length < 2) return false;
  if (chain[0] !== startWord) return false;
  if (chain[chain.length - 1] !== targetWord) return false;

  for (let i = 0; i < chain.length - 1; i++) {
    if (!isValidStep(chain[i], chain[i + 1])) {
      return false;
    }
  }

  return true;
}

/**
 * Find the position that differs between two words.
 * Returns -1 if they don't differ by exactly one letter.
 */
export function findDiffPosition(prev: string, next: string): number {
  if (prev.length !== next.length) return -1;

  let diffPos = -1;
  let diffCount = 0;

  for (let i = 0; i < prev.length; i++) {
    if (prev[i] !== next[i]) {
      diffPos = i;
      diffCount++;
      if (diffCount > 1) return -1;
    }
  }

  return diffCount === 1 ? diffPos : -1;
}
