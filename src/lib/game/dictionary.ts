/**
 * Dictionary — Load and query word lists by length.
 * Word lists are bundled as JSON in public/data/.
 */

import type { WordList } from "@/types";

// In-memory cache of loaded word lists
const wordListCache = new Map<number, Set<string>>();

/**
 * Load the word list for a given length.
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
  return wordSet;
}

/**
 * Check if a word exists in the dictionary for its length.
 * Returns false if the word list hasn't been loaded yet.
 */
export function isWord(word: string): boolean {
  const wordSet = wordListCache.get(word.length);
  if (!wordSet) return false;
  return wordSet.has(word.toLowerCase());
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
