/**
 * Word Graph Builder
 *
 * For each word length, builds an adjacency list where two words are
 * connected if they differ by exactly one letter. Uses pattern-grouping
 * optimisation: group words by wildcard patterns (_old, c_ld, co_d, col_)
 * and only compare within groups.
 *
 * Usage: npm run generate:graphs
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "public", "data");

/**
 * Build adjacency list using pattern-grouping optimisation.
 * For each word, generate patterns with one letter replaced by "_".
 * Words sharing a pattern differ by exactly one letter at that position.
 */
function buildGraph(words: string[]): Record<string, string[]> {
  // Group words by wildcard pattern
  const patternGroups = new Map<string, string[]>();

  for (const word of words) {
    for (let i = 0; i < word.length; i++) {
      const pattern = word.slice(0, i) + "_" + word.slice(i + 1);
      if (!patternGroups.has(pattern)) {
        patternGroups.set(pattern, []);
      }
      patternGroups.get(pattern)!.push(word);
    }
  }

  // Build adjacency list from pattern groups
  const graph: Record<string, string[]> = {};

  // Initialize all words with empty arrays
  for (const word of words) {
    graph[word] = [];
  }

  // For each pattern group, all words in the group are neighbours
  for (const group of patternGroups.values()) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        graph[group[i]].push(group[j]);
        graph[group[j]].push(group[i]);
      }
    }
  }

  // Remove duplicates and sort each word's neighbours
  for (const word of words) {
    graph[word] = [...new Set(graph[word])].sort();
  }

  return graph;
}

function main() {
  for (const len of [3, 4, 5, 6]) {
    const wordsPath = join(DATA_DIR, `words-${len}.json`);
    const words: string[] = JSON.parse(readFileSync(wordsPath, "utf-8"));

    console.log(`Building graph for ${len}-letter words (${words.length} words)...`);
    const graph = buildGraph(words);

    // Count total edges
    let totalEdges = 0;
    for (const neighbours of Object.values(graph)) {
      totalEdges += neighbours.length;
    }
    totalEdges /= 2; // Each edge counted twice

    // Remove words with no neighbours to save space
    const prunedGraph: Record<string, string[]> = {};
    for (const [word, neighbours] of Object.entries(graph)) {
      if (neighbours.length > 0) {
        prunedGraph[word] = neighbours;
      }
    }

    const outPath = join(DATA_DIR, `graph-${len}.json`);
    writeFileSync(outPath, JSON.stringify(prunedGraph));

    const connectedWords = Object.keys(prunedGraph).length;
    console.log(
      `  graph-${len}.json: ${connectedWords} connected words, ${totalEdges} edges`
    );
  }

  console.log("\n✓ Word graphs built!");
}

main();
