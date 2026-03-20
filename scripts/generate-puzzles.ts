/**
 * Puzzle Generator
 *
 * Generates 90 days of daily puzzles using BFS on the word graph.
 * CRITICAL: All words on the optimal path must be "common" — no obscure words.
 *
 * Weekly difficulty rotation:
 *   Mon-Thu: 4-letter (standard)
 *   Fri-Sat: 5-letter (advanced)
 *   Sunday:  3-letter (starter)
 *
 * Usage: npm run generate:puzzles
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "public", "data");

interface PuzzleEntry {
  id: number;
  date: string;
  startWord: string;
  targetWord: string;
  wordLength: number;
  par: number;
  optimalPath: string[];
  difficulty: string;
}

// Thematic word pairs — all must be common words
const THEMATIC_PAIRS: Record<number, [string, string][]> = {
  3: [
    ["cat", "dog"], ["hot", "wet"], ["cup", "mug"], ["hen", "fox"],
    ["old", "new"], ["sad", "mad"], ["boy", "man"], ["bay", "sea"],
    ["cow", "pig"], ["fan", "air"], ["big", "fat"], ["day", "dim"],
    ["dew", "fog"], ["bad", "sad"], ["sun", "fun"], ["bed", "cot"],
    ["hat", "cap"], ["run", "jog"], ["tip", "top"], ["pan", "pot"],
    ["ink", "pen"], ["nut", "pea"], ["oar", "row"], ["hug", "pat"],
  ],
  4: [
    ["cold", "warm"], ["love", "hate"], ["dawn", "dusk"], ["head", "tail"],
    ["dark", "glow"], ["fast", "slow"], ["hard", "soft"], ["fish", "bird"],
    ["lake", "pond"], ["cake", "tart"], ["bear", "deer"], ["boat", "ship"],
    ["bone", "skin"], ["coal", "gold"], ["dust", "sand"], ["gate", "door"],
    ["home", "fort"], ["iron", "rust"], ["rain", "snow"], ["star", "moon"],
    ["tame", "wild"], ["vine", "tree"], ["wolf", "lamb"], ["bold", "meek"],
    ["king", "duke"], ["milk", "wine"], ["mist", "haze"], ["book", "page"],
    ["card", "dice"], ["cave", "mine"], ["fork", "dish"], ["lamp", "glow"],
    ["nail", "bolt"], ["palm", "fist"], ["salt", "lime"], ["sand", "dirt"],
  ],
  5: [
    ["heart", "brain"], ["flame", "frost"], ["cloud", "storm"],
    ["stone", "water"], ["house", "cabin"], ["queen", "crown"],
    ["paint", "brush"], ["river", "creek"], ["tower", "manor"],
    ["voice", "shout"], ["world", "earth"], ["horse", "rider"],
    ["grape", "peach"], ["knife", "blade"], ["march", "dance"],
    ["smile", "frown"], ["brave", "timid"], ["feast", "table"],
    ["light", "black"], ["night", "dream"], ["giant", "dwarf"],
  ],
};

/** Check if two words share any letters in the same position */
function hasMatchingPositions(a: string, b: string): boolean {
  for (let i = 0; i < a.length; i++) {
    if (a[i] === b[i]) return true;
  }
  return false;
}

/** BFS to find shortest path, optionally restricted to common words only */
function bfs(
  start: string,
  target: string,
  graph: Record<string, string[]>,
  allowedWords?: Set<string>
): string[] | null {
  if (start === target) return [start];
  if (!graph[start] || !graph[target]) return null;

  const visited = new Set<string>([start]);
  const queue: [string, string[]][] = [[start, [start]]];

  while (queue.length > 0) {
    const [current, path] = queue.shift()!;
    const neighbours = graph[current] || [];

    for (const neighbour of neighbours) {
      if (visited.has(neighbour)) continue;
      // If restricted, only traverse through allowed words
      if (allowedWords && !allowedWords.has(neighbour) && neighbour !== target) continue;

      if (neighbour === target) {
        return [...path, target];
      }
      visited.add(neighbour);
      queue.push([neighbour, [...path, neighbour]]);
    }
  }

  return null;
}

function getDifficulty(len: number): string {
  if (len === 3) return "starter";
  if (len === 4) return "standard";
  if (len === 5) return "advanced";
  return "expert";
}

function getWordLengthForDay(dayOfWeek: number): number {
  if (dayOfWeek === 0) return 3;
  if (dayOfWeek >= 5) return 5;
  return 4;
}

function main() {
  // Load graphs and common words
  const graphs: Record<number, Record<string, string[]>> = {};
  const commonWords: Record<number, Set<string>> = {};

  for (const len of [3, 4, 5]) {
    const graphPath = join(DATA_DIR, `graph-${len}.json`);
    graphs[len] = JSON.parse(readFileSync(graphPath, "utf-8"));
    console.log(`Loaded graph-${len}.json (${Object.keys(graphs[len]).length} words)`);

    const commonPath = join(DATA_DIR, `common-${len}.json`);
    if (existsSync(commonPath)) {
      const commonArr: string[] = JSON.parse(readFileSync(commonPath, "utf-8"));
      // Only include common words that are in the graph (have neighbours)
      commonWords[len] = new Set(commonArr.filter((w) => graphs[len][w]));
      console.log(`Loaded common-${len}.json (${commonWords[len].size} connected common words)`);
    } else {
      console.warn(`WARNING: common-${len}.json not found, using all graph words`);
      commonWords[len] = new Set(Object.keys(graphs[len]));
    }
  }

  const puzzles: PuzzleEntry[] = [];
  const usedPairs = new Set<string>();

  const startDate = new Date("2026-03-20T00:00:00Z");

  for (let dayOffset = 0; dayOffset < 90; dayOffset++) {
    const date = new Date(startDate.getTime() + dayOffset * 86400000);
    const dateStr = date.toISOString().split("T")[0];
    const dayOfWeek = date.getUTCDay();
    const wordLength = getWordLengthForDay(dayOfWeek);
    const graph = graphs[wordLength];
    const common = commonWords[wordLength];

    if (!graph || !common) {
      console.warn(`No data for length ${wordLength}, skipping ${dateStr}`);
      continue;
    }

    let foundPuzzle = false;

    // Try thematic pairs first — BFS restricted to common words only
    const thematicPairs = THEMATIC_PAIRS[wordLength] || [];
    for (const [start, target] of thematicPairs) {
      const pairKey = `${start}-${target}`;
      if (usedPairs.has(pairKey)) continue;
      if (!common.has(start) || !common.has(target)) continue;
      // Start and target must share no letters in the same position
      if (hasMatchingPositions(start, target)) continue;

      // BFS through common words only — ensures all-common path
      const path = bfs(start, target, graph, common);
      if (path && path.length >= 3 && path.length <= 8) {
        usedPairs.add(pairKey);
        puzzles.push({
          id: dayOffset + 1,
          date: dateStr,
          startWord: start,
          targetWord: target,
          wordLength,
          par: path.length - 1,
          optimalPath: path,
          difficulty: getDifficulty(wordLength),
        });
        foundPuzzle = true;
        break;
      }
    }

    // If no thematic pair worked, generate from common words with all-common paths
    if (!foundPuzzle) {
      const commonArr = [...common];

      for (let attempt = 0; attempt < 500; attempt++) {
        const startWord = commonArr[Math.floor(Math.random() * commonArr.length)];

        // BFS from start, restricted to common words, find targets at distance 3-6
        // Target must share no letters in the same position as start
        const path = findGoodTarget(startWord, graph, common, wordLength);
        if (path && !hasMatchingPositions(path[0], path[path.length - 1])) {
          const pairKey = `${path[0]}-${path[path.length - 1]}`;
          if (!usedPairs.has(pairKey)) {
            usedPairs.add(pairKey);
            puzzles.push({
              id: dayOffset + 1,
              date: dateStr,
              startWord: path[0],
              targetWord: path[path.length - 1],
              wordLength,
              par: path.length - 1,
              optimalPath: path,
              difficulty: getDifficulty(wordLength),
            });
            foundPuzzle = true;
            break;
          }
        }
      }

      if (!foundPuzzle) {
        console.warn(`Could not generate puzzle for ${dateStr}`);
      }
    }
  }

  const outPath = join(DATA_DIR, "daily-puzzles.json");
  writeFileSync(outPath, JSON.stringify(puzzles, null, 2));
  console.log(`\n✓ Generated ${puzzles.length} puzzles → daily-puzzles.json`);

  // Verify all paths use common words
  let allCommon = true;
  for (const p of puzzles) {
    const common = commonWords[p.wordLength];
    for (const word of p.optimalPath) {
      if (!common.has(word)) {
        console.warn(`  WARNING: Non-common word "${word}" in puzzle #${p.id} (${p.date})`);
        allCommon = false;
      }
    }
  }
  if (allCommon) {
    console.log("✓ All puzzle paths use only common words!");
  }
}

/**
 * BFS from start through common words only, finding targets at distance 3-6.
 */
function findGoodTarget(
  startWord: string,
  graph: Record<string, string[]>,
  common: Set<string>,
  wordLength: number
): string[] | null {
  const visited = new Map<string, string[]>();
  visited.set(startWord, [startWord]);
  const queue: [string, string[]][] = [[startWord, [startWord]]];
  const candidates: string[][] = [];

  while (queue.length > 0) {
    const [current, path] = queue.shift()!;
    if (path.length > 7) break;

    const neighbours = graph[current] || [];
    for (const neighbour of neighbours) {
      if (!visited.has(neighbour) && common.has(neighbour)) {
        const newPath = [...path, neighbour];
        visited.set(neighbour, newPath);
        queue.push([neighbour, newPath]);

        // Only consider targets with no matching positions to the start word
        if (newPath.length >= 4 && newPath.length <= 7 && !hasMatchingPositions(startWord, neighbour)) {
          candidates.push(newPath);
        }
      }
    }
  }

  if (candidates.length === 0) return null;

  const preferred = candidates.filter((p) => p.length >= 4 && p.length <= 6);
  const pool = preferred.length > 0 ? preferred : candidates;
  return pool[Math.floor(Math.random() * pool.length)];
}

main();
