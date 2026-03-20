/**
 * Word Graph Builder
 *
 * For each word length, builds an adjacency list where two words are
 * connected if they differ by exactly one letter. Uses pattern-grouping
 * optimisation for performance.
 *
 * IMPORTANT: After building the graph, we filter to the LARGEST CONNECTED
 * COMPONENT only. This guarantees every word in the game can reach every
 * other word via single-letter changes. Words in disconnected islands
 * (like "iron" in 4-letter, or "pizza" in 5-letter) are removed.
 *
 * The filtered words are written back to words-{N}.json so the game's
 * dictionary only contains playable words.
 *
 * Usage: npm run generate:graphs
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "public", "data");

/**
 * Build adjacency list using pattern-grouping optimisation.
 */
function buildGraph(words: string[]): Record<string, string[]> {
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

  const graph: Record<string, string[]> = {};
  for (const word of words) {
    graph[word] = [];
  }

  for (const group of patternGroups.values()) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        graph[group[i]].push(group[j]);
        graph[group[j]].push(group[i]);
      }
    }
  }

  for (const word of words) {
    graph[word] = [...new Set(graph[word])].sort();
  }

  return graph;
}

/**
 * Find the largest connected component in the graph using BFS.
 * Returns the set of words in that component.
 */
function findLargestComponent(graph: Record<string, string[]>): Set<string> {
  const allWords = Object.keys(graph);
  const visited = new Set<string>();
  let largestComponent = new Set<string>();

  for (const startWord of allWords) {
    if (visited.has(startWord)) continue;

    // BFS to find this component
    const component = new Set<string>();
    const queue = [startWord];
    component.add(startWord);
    visited.add(startWord);

    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const neighbour of graph[current] || []) {
        if (!visited.has(neighbour)) {
          visited.add(neighbour);
          component.add(neighbour);
          queue.push(neighbour);
        }
      }
    }

    if (component.size > largestComponent.size) {
      largestComponent = component;
    }
  }

  return largestComponent;
}

function main() {
  for (const len of [3, 4, 5, 6]) {
    const wordsPath = join(DATA_DIR, `words-${len}.json`);
    const allWords: string[] = JSON.parse(readFileSync(wordsPath, "utf-8"));

    console.log(`Building graph for ${len}-letter words (${allWords.length} words)...`);
    const fullGraph = buildGraph(allWords);

    // Remove isolated words (no neighbours)
    const connectedGraph: Record<string, string[]> = {};
    for (const [word, neighbours] of Object.entries(fullGraph)) {
      if (neighbours.length > 0) {
        connectedGraph[word] = neighbours;
      }
    }

    // Find largest connected component
    const mainComponent = findLargestComponent(connectedGraph);
    const removedCount = Object.keys(connectedGraph).length - mainComponent.size;

    // Filter graph to main component only
    const filteredGraph: Record<string, string[]> = {};
    for (const word of mainComponent) {
      // Also filter each word's neighbours to only main component words
      filteredGraph[word] = connectedGraph[word].filter((n) => mainComponent.has(n));
    }

    // Count edges
    let totalEdges = 0;
    for (const neighbours of Object.values(filteredGraph)) {
      totalEdges += neighbours.length;
    }
    totalEdges /= 2;

    // Write filtered graph
    const graphPath = join(DATA_DIR, `graph-${len}.json`);
    writeFileSync(graphPath, JSON.stringify(filteredGraph));

    // Write filtered word list (only main component words)
    // This ensures the game dictionary only contains playable words
    const filteredWords = allWords.filter((w) => mainComponent.has(w));
    writeFileSync(wordsPath, JSON.stringify(filteredWords));

    // Write unchainable words list — real English words that can't participate
    // in word chains because they're in disconnected graph components.
    // The game shows a distinct message when a player types one of these.
    const unchainable = allWords.filter((w) => !mainComponent.has(w));
    if (unchainable.length > 0) {
      const unchainablePath = join(DATA_DIR, `unchainable-${len}.json`);
      writeFileSync(unchainablePath, JSON.stringify(unchainable));
      console.log(`  unchainable-${len}.json: ${unchainable.length} real but unchainable words`);
    }

    console.log(
      `  graph-${len}.json: ${mainComponent.size} words, ${totalEdges} edges`
    );
    if (removedCount > 0) {
      console.log(
        `  Removed ${removedCount} words in disconnected components`
      );
    }

    // Also filter common words to only main component
    const commonPath = join(DATA_DIR, `common-${len}.json`);
    try {
      const commonWords: string[] = JSON.parse(readFileSync(commonPath, "utf-8"));
      const filteredCommon = commonWords.filter((w) => mainComponent.has(w));
      const removedCommon = commonWords.length - filteredCommon.length;
      writeFileSync(commonPath, JSON.stringify(filteredCommon));
      if (removedCommon > 0) {
        console.log(
          `  Removed ${removedCommon} common words not in main component`
        );
      }
    } catch {
      // No common file for this length — ok
    }
  }

  console.log("\n✓ Word graphs built (main component only)!");
  console.log("✓ Word lists filtered to playable words only!");
}

main();
