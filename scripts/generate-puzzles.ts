/**
 * Puzzle Generator — 5-letter words only
 *
 * Generates 500 puzzles for continuous play.
 * Minimum par: 6 (harder puzzles).
 * All words on optimal path must be common.
 * Start and target must share no letters in the same position.
 *
 * Usage: npm run generate:puzzles
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "public", "data");
const WORD_LENGTH = 5;
const MIN_PAR = 6;
const MAX_PAR = 10;
const PUZZLE_COUNT = 500;

interface PuzzleEntry {
  id: number;
  startWord: string;
  targetWord: string;
  wordLength: number;
  par: number;
  optimalPath: string[];
}

/** Check if two words share any letters in the same position */
function hasMatchingPositions(a: string, b: string): boolean {
  for (let i = 0; i < a.length; i++) {
    if (a[i] === b[i]) return true;
  }
  return false;
}

/** BFS restricted to common words only */
function bfs(
  start: string,
  target: string,
  graph: Record<string, string[]>,
  allowedWords: Set<string>
): string[] | null {
  if (start === target) return [start];
  if (!graph[start] || !graph[target]) return null;

  const visited = new Set<string>([start]);
  const queue: [string, string[]][] = [[start, [start]]];

  while (queue.length > 0) {
    const [current, path] = queue.shift()!;
    if (path.length > MAX_PAR + 1) break;

    const neighbours = graph[current] || [];
    for (const neighbour of neighbours) {
      if (visited.has(neighbour)) continue;
      if (!allowedWords.has(neighbour) && neighbour !== target) continue;

      if (neighbour === target) {
        return [...path, target];
      }
      visited.add(neighbour);
      queue.push([neighbour, [...path, neighbour]]);
    }
  }

  return null;
}

/**
 * BFS from start through common words, finding targets at par MIN_PAR to MAX_PAR
 * with no matching positions.
 */
function findGoodTarget(
  startWord: string,
  graph: Record<string, string[]>,
  common: Set<string>
): string[] | null {
  const visited = new Map<string, string[]>();
  visited.set(startWord, [startWord]);
  const queue: [string, string[]][] = [[startWord, [startWord]]];
  const candidates: string[][] = [];

  while (queue.length > 0) {
    const [current, path] = queue.shift()!;
    if (path.length > MAX_PAR + 1) break;

    const neighbours = graph[current] || [];
    for (const neighbour of neighbours) {
      if (!visited.has(neighbour) && common.has(neighbour)) {
        const newPath = [...path, neighbour];
        visited.set(neighbour, newPath);
        queue.push([neighbour, newPath]);

        const par = newPath.length - 1;
        if (par >= MIN_PAR && par <= MAX_PAR && !hasMatchingPositions(startWord, neighbour)) {
          candidates.push(newPath);
        }
      }
    }
  }

  if (candidates.length === 0) return null;

  // Prefer harder puzzles (higher par)
  const harder = candidates.filter((p) => p.length - 1 >= MIN_PAR + 1);
  const pool = harder.length > 0 ? harder : candidates;
  return pool[Math.floor(Math.random() * pool.length)];
}

function main() {
  // Load graph and common words for 5-letter only
  const graphPath = join(DATA_DIR, `graph-${WORD_LENGTH}.json`);
  const graph: Record<string, string[]> = JSON.parse(readFileSync(graphPath, "utf-8"));
  console.log(`Loaded graph-${WORD_LENGTH}.json (${Object.keys(graph).length} words)`);

  const commonPath = join(DATA_DIR, `common-${WORD_LENGTH}.json`);
  let common: Set<string>;
  if (existsSync(commonPath)) {
    const commonArr: string[] = JSON.parse(readFileSync(commonPath, "utf-8"));
    common = new Set(commonArr.filter((w) => graph[w]));
    console.log(`Loaded common-${WORD_LENGTH}.json (${common.size} connected common words)`);
  } else {
    common = new Set(Object.keys(graph));
  }

  const puzzles: PuzzleEntry[] = [];
  const usedPairs = new Set<string>();
  const commonArr = [...common];

  console.log(`Generating ${PUZZLE_COUNT} puzzles (min par ${MIN_PAR})...`);

  let attempts = 0;
  while (puzzles.length < PUZZLE_COUNT && attempts < PUZZLE_COUNT * 20) {
    attempts++;
    const startWord = commonArr[Math.floor(Math.random() * commonArr.length)];

    const path = findGoodTarget(startWord, graph, common);
    if (path) {
      const pairKey = `${path[0]}-${path[path.length - 1]}`;
      if (!usedPairs.has(pairKey)) {
        usedPairs.add(pairKey);
        puzzles.push({
          id: puzzles.length + 1,
          startWord: path[0],
          targetWord: path[path.length - 1],
          wordLength: WORD_LENGTH,
          par: path.length - 1,
          optimalPath: path,
        });

        if (puzzles.length % 100 === 0) {
          console.log(`  ${puzzles.length} puzzles generated...`);
        }
      }
    }
  }

  const outPath = join(DATA_DIR, "daily-puzzles.json");
  writeFileSync(outPath, JSON.stringify(puzzles));
  console.log(`\n✓ Generated ${puzzles.length} puzzles → daily-puzzles.json`);

  // Stats
  const pars = puzzles.map((p) => p.par);
  const avgPar = (pars.reduce((a, b) => a + b, 0) / pars.length).toFixed(1);
  const parDist: Record<number, number> = {};
  pars.forEach((p) => { parDist[p] = (parDist[p] || 0) + 1; });
  console.log(`Average par: ${avgPar}`);
  console.log("Par distribution:");
  Object.keys(parDist).sort((a, b) => +a - +b).forEach((p) => {
    console.log(`  Par ${p}: ${parDist[+p]} puzzles`);
  });

  // Verify
  let allCommon = true;
  for (const p of puzzles) {
    for (const word of p.optimalPath) {
      if (!common.has(word)) {
        console.warn(`  WARNING: Non-common word "${word}" in puzzle #${p.id}`);
        allCommon = false;
      }
    }
  }
  if (allCommon) console.log("✓ All puzzle paths use only common words!");

  let noMatches = true;
  for (const p of puzzles) {
    if (hasMatchingPositions(p.startWord, p.targetWord)) {
      console.warn(`  WARNING: Matching positions in puzzle #${p.id}`);
      noMatches = false;
    }
  }
  if (noMatches) console.log("✓ No puzzles have matching start/target positions!");
}

main();
