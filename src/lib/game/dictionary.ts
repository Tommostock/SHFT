/**
 * Dictionary — Load and query word lists by length.
 * Word lists are bundled as JSON in public/data/.
 *
 * Two tiers:
 *   - words-{N}.json: chainable words (main connected component)
 *   - unchainable-{N}.json: real English words that can't form chains
 */

import type { WordList } from "@/types";

// In-memory cache of loaded word lists
const wordListCache = new Map<number, Set<string>>();
const unchainableCache = new Map<number, Set<string>>();

/**
 * Load the chainable word list for a given length.
 * Fetches from public/data/words-{length}.json and caches in memory.
 */
export async function loadWordList(length: number): Promise<Set<string>> {
  if (wordListCache.has(length)) {
    return wordListCache.get(length)!;
  }

  const response = await fetch(`/data/words-${length}.json`);
  if (!response.ok) {
    throw new Error(`Failed to load word list for length ${length}`);
  }

  const words: WordList = await response.json();
  const wordSet = new Set(words);
  wordListCache.set(length, wordSet);

  // Also load unchainable words in background
  loadUnchainableList(length);

  return wordSet;
}

/**
 * Load the unchainable word list for a given length.
 * These are real English words that can't participate in word chains.
 */
async function loadUnchainableList(length: number): Promise<Set<string>> {
  if (unchainableCache.has(length)) {
    return unchainableCache.get(length)!;
  }

  try {
    const response = await fetch(`/data/unchainable-${length}.json`);
    if (response.ok) {
      const words: WordList = await response.json();
      const wordSet = new Set(words);
      unchainableCache.set(length, wordSet);
      return wordSet;
    }
  } catch {
    // File might not exist for this length — that's fine
  }

  const empty = new Set<string>();
  unchainableCache.set(length, empty);
  return empty;
}

/**
 * Check if a word exists in the chainable dictionary for its length.
 * Returns false if the word list hasn't been loaded yet.
 */
export function isWord(word: string): boolean {
  const wordSet = wordListCache.get(word.length);
  if (!wordSet) return false;
  return wordSet.has(word.toLowerCase());
}

/**
 * Check if a word is a real English word but not chainable.
 * Returns true for words like "iron", "pizza", "ocean" that are valid
 * English but exist in disconnected graph components.
 */
export function isUnchainable(word: string): boolean {
  const unchainableSet = unchainableCache.get(word.length);
  if (!unchainableSet) return false;
  return unchainableSet.has(word.toLowerCase());
}

/**
 * Check if a word exists, loading the dictionary if needed.
 */
export async function isWordAsync(word: string): Promise<boolean> {
  const wordSet = await loadWordList(word.length);
  return wordSet.has(word.toLowerCase());
}

/**
 * Get a random word of a given length from the dictionary.
 */
export async function getRandomWord(length: number): Promise<string> {
  const wordSet = await loadWordList(length);
  const words = Array.from(wordSet);
  return words[Math.floor(Math.random() * words.length)];
}
