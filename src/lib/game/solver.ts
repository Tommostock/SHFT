/**
 * Solver — BFS shortest path finder on the pre-computed word graph.
 * Used for calculating par and generating practice puzzles.
 */

import type { WordGraph } from "@/types";

// In-memory cache of loaded graphs
const graphCache = new Map<number, WordGraph>();

/**
 * Load the word graph for a given word length.
 * Fetches from public/data/graph-{length}.json and caches in memory.
 */
export async function loadGraph(length: number): Promise<WordGraph> {
  if (graphCache.has(length)) {
    return graphCache.get(length)!;
  }

  const response = await fetch(`/data/graph-${length}.json`);
  if (!response.ok) {
    throw new Error(`Failed to load graph for length ${length}`);
  }

  const graph: WordGraph = await response.json();
  graphCache.set(length, graph);
  return graph;
}

/**
 * Find the shortest path between two words using BFS.
 * Returns the full path including start and target, or null if no path exists.
 * Par = path.length - 1
 */
export function findShortestPath(
  start: string,
  target: string,
  graph: WordGraph
): string[] | null {
  if (start === target) return [start];
  if (!graph[start] || !graph[target]) return null;

  const visited = new Set<string>([start]);
  // Use a queue of [word, path] pairs
  const queue: [string, string[]][] = [[start, [start]]];

  while (queue.length > 0) {
    const [current, path] = queue.shift()!;
    const neighbours = graph[current] || [];

    for (const neighbour of neighbours) {
      if (neighbour === target) {
        return [...path, target];
      }
      if (!visited.has(neighbour)) {
        visited.add(neighbour);
        queue.push([neighbour, [...path, neighbour]]);
      }
    }
  }

  return null; // No path found
}

/**
 * Generate a random puzzle pair from the graph.
 * Picks a random start word, runs BFS, and finds a target at distance 3-6.
 * Returns [startWord, targetWord, optimalPath] or null if no good pair found.
 */
export function generateRandomPuzzle(
  graph: WordGraph,
  preferredDistance: number = 4
): { start: string; target: string; path: string[]; par: number } | null {
  const words = Object.keys(graph);
  if (words.length === 0) return null;

  // Try up to 50 random start words
  for (let attempt = 0; attempt < 50; attempt++) {
    const startWord = words[Math.floor(Math.random() * words.length)];

    // BFS to find words at the preferred distance
    const visited = new Map<string, string[]>();
    visited.set(startWord, [startWord]);
    const queue: [string, string[]][] = [[startWord, [startWord]]];
    const candidates: { word: string; path: string[] }[] = [];

    while (queue.length > 0) {
      const [current, path] = queue.shift()!;
      if (path.length > preferredDistance + 2) break;

      const neighbours = graph[current] || [];
      for (const neighbour of neighbours) {
        if (!visited.has(neighbour)) {
          const newPath = [...path, neighbour];
          visited.set(neighbour, newPath);
          queue.push([neighbour, newPath]);

          // Collect candidates at good distances
          const dist = newPath.length - 1;
          if (dist >= 3 && dist <= 6) {
            candidates.push({ word: neighbour, path: newPath });
          }
        }
      }
    }

    if (candidates.length > 0) {
      // Prefer candidates near the preferred distance
      const preferred = candidates.filter(
        (c) => Math.abs(c.path.length - 1 - preferredDistance) <= 1
      );
      const pool = preferred.length > 0 ? preferred : candidates;
      const chosen = pool[Math.floor(Math.random() * pool.length)];

      return {
        start: startWord,
        target: chosen.word,
        path: chosen.path,
        par: chosen.path.length - 1,
      };
    }
  }

  return null;
}
