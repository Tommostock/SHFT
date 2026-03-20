/**
 * Dictionary Curation Script
 *
 * Fetches a public domain English word list, filters to 3-6 letter words,
 * removes non-alphabetic entries, and outputs JSON files per word length.
 *
 * Usage: npm run generate:dictionary
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

const WORD_LIST_URL =
  "https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt";

const OUT_DIR = join(process.cwd(), "public", "data");

// Words to exclude (offensive, slurs, etc.)
const BLOCKLIST = new Set([
  "arse", "crap", "damn", "dumb", "fags", "hell", "homo",
  "japs", "kike", "mong", "paki", "piss", "slag", "slut",
  "spaz", "tits", "turd", "twat", "wank", "coon", "dyke",
  "gook", "gypo", "niga", "rape", "spic", "wops",
]);

async function main() {
  console.log("Fetching word list...");
  const response = await fetch(WORD_LIST_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch word list: ${response.status}`);
  }

  const text = await response.text();
  const allWords = text
    .split(/\r?\n/)
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length > 0);

  console.log(`Fetched ${allWords.length} total words`);

  // Ensure output directory exists
  if (!existsSync(OUT_DIR)) {
    mkdirSync(OUT_DIR, { recursive: true });
  }

  // Filter and output by word length
  for (const len of [3, 4, 5, 6]) {
    const words = allWords.filter((w) => {
      if (w.length !== len) return false;
      // Only pure lowercase alphabetic
      if (!/^[a-z]+$/.test(w)) return false;
      // Remove blocked words
      if (BLOCKLIST.has(w)) return false;
      return true;
    });

    // Sort alphabetically
    words.sort();

    const outPath = join(OUT_DIR, `words-${len}.json`);
    writeFileSync(outPath, JSON.stringify(words));
    console.log(`  words-${len}.json: ${words.length} words`);
  }

  console.log("\n✓ Dictionary curation complete!");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
