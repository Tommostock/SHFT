/**
 * Sharer — Generate spoiler-free share text.
 * See SPEC.md Section 5.5 for format.
 */

import type { ChainQuality } from "@/types";
import { CHAIN_EMOJI } from "@/lib/utils/constants";

/**
 * Generate the share text for a completed puzzle.
 *
 * Format:
 *   SHFT #247 🔗🔗🔗🔗 (4/4 par) ⭐
 *
 * Chain emoji: 🔗 for gold, ⛓️ for silver/bronze/iron
 * Star emoji only if solved at or under par (genius)
 */
export function generateShareText(
  puzzleNumber: number,
  steps: number,
  par: number,
  chainQuality: ChainQuality
): string {
  const emoji = CHAIN_EMOJI[chainQuality];
  const chainEmojis = Array(steps).fill(emoji).join("");
  const geniusStar = steps <= par ? " ⭐" : "";

  return `SHFT #${puzzleNumber} ${chainEmojis} (${steps}/${par} par)${geniusStar}`;
}

/**
 * Share the result using the Web Share API if available,
 * otherwise copy to clipboard.
 * Returns true if sharing/copying succeeded.
 */
export async function shareResult(text: string): Promise<boolean> {
  // Try Web Share API first (mobile)
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ text });
      return true;
    } catch {
      // User cancelled or API failed — fall through to clipboard
    }
  }

  // Fallback: copy to clipboard
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  return false;
}
