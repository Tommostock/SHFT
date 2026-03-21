/**
 * Puzzle Pool — On-demand puzzle generation for game modes.
 *
 * Loads the word graph and common words once, then generates
 * puzzles instantly using BFS. Used by Sprint, Blitz,
 * Par or Bust, and Marathon modes.
 */

import type { WordGraph } from "@/types";
import { loadGraph, loadCommonWords, findShortestPath } from "./solver";

// Cached data — loaded once, used forever
let graph: WordGraph | null = null;
let commonWords: Set<string> | null = null;
let commonArr: string[] = [];
let isLoaded = false;

/**
 * Load graph and common words into memory.
 * Call this once before generating puzzles.
 */
export async function initPuzzlePool(): Promise<void> {
  if (isLoaded) return;

  graph = await loadGraph(5);
  commonWords = await loadCommonWords(5);

  // Build array of common words that exist in the graph
  commonArr = [...commonWords].filter((w) => graph![w]);
  isLoaded = true;
}

/** Check if no letters share the same position between two words */
function hasNoMatchingPositions(a: string, b: string): boolean {
  for (let i = 0; i < a.length; i++) {
    if (a[i] === b[i]) return true;
  }
  return false;
}

/**
 * Generate a random puzzle with par in the given range.
 * Returns null if no puzzle found (very unlikely).
 */
export function getRandomPuzzle(
  minPar: number = 4,
  maxPar: number = 7
): { startWord: string; targetWord: string; par: number; optimalPath: string[] } | null {
  if (!graph || !commonWords || commonArr.length === 0) return null;

  // Try up to 100 random start words
  for (let attempt = 0; attempt < 100; attempt++) {
    const startWord = commonArr[Math.floor(Math.random() * commonArr.length)];

    // BFS through common words to find targets at desired distance
    const visited = new Map<string, string[]>();
    visited.set(startWord, [startWord]);
    const queue: [string, string[]][] = [[startWord, [startWord]]];
    const candidates: string[][] = [];

    while (queue.length > 0) {
      const [current, path] = queue.shift()!;
      if (path.length > maxPar + 1) break;

      const neighbours = graph[current] || [];
      for (const neighbour of neighbours) {
        if (visited.has(neighbour)) continue;
        if (!commonWords!.has(neighbour)) continue;

        const newPath = [...path, neighbour];
        visited.set(neighbour, newPath);
        queue.push([neighbour, newPath]);

        const par = newPath.length - 1;
        if (par >= minPar && par <= maxPar) {
          candidates.push(newPath);
        }
      }
    }

    if (candidates.length > 0) {
      const path = candidates[Math.floor(Math.random() * candidates.length)];
      return {
        startWord: path[0],
        targetWord: path[path.length - 1],
        par: path.length - 1,
        optimalPath: path,
      };
    }
  }

  return null;
}

/**
 * Generate a puzzle starting from a specific word.
 * Used by Marathon mode where the target becomes the next start.
 */
export function getPuzzleFromStart(
  startWord: string,
  minPar: number = 4,
  maxPar: number = 8
): { startWord: string; targetWord: string; par: number; optimalPath: string[] } | null {
  if (!graph || !commonWords) return null;
  if (!graph[startWord]) return null;

  // BFS from start through common words
  const visited = new Map<string, string[]>();
  visited.set(startWord, [startWord]);
  const queue: [string, string[]][] = [[startWord, [startWord]]];
  const candidates: string[][] = [];

  while (queue.length > 0) {
    const [current, path] = queue.shift()!;
    if (path.length > maxPar + 1) break;

    const neighbours = graph[current] || [];
    for (const neighbour of neighbours) {
      if (visited.has(neighbour)) continue;
      if (!commonWords!.has(neighbour)) continue;

      const newPath = [...path, neighbour];
      visited.set(neighbour, newPath);
      queue.push([neighbour, newPath]);

      const par = newPath.length - 1;
      if (par >= minPar && par <= maxPar) {
        candidates.push(newPath);
      }
    }
  }

  if (candidates.length > 0) {
    const path = candidates[Math.floor(Math.random() * candidates.length)];
    return {
      startWord: path[0],
      targetWord: path[path.length - 1],
      par: path.length - 1,
      optimalPath: path,
    };
  }

  // Fallback: try a neighbour of the start word as a new start
  const neighbours = graph[startWord] || [];
  const commonNeighbours = neighbours.filter((n) => commonWords!.has(n));
  for (const neighbour of commonNeighbours) {
    const fallback = getRandomPuzzle(minPar, maxPar);
    if (fallback) return fallback;
  }

  return null;
}

/** Check if the pool is ready */
export function isPoolReady(): boolean {
  return isLoaded;
}
