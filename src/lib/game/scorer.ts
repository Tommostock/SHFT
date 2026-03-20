/**
 * Scorer — Calculate chain quality and scores.
 * Pure functions, no side effects.
 */

import type { ChainQuality, ScoreResult } from "@/types";

/**
 * Determine chain quality based on steps vs par.
 * Gold: steps <= par
 * Silver: par + 1
 * Bronze: par + 2
 * Iron: par + 3 or more
 */
export function getChainQuality(steps: number, par: number): ChainQuality {
  const diff = steps - par;
  if (diff <= 0) return "gold";
  if (diff === 1) return "silver";
  if (diff === 2) return "bronze";
  return "iron";
}

/**
 * Calculate the full score for a completed chain.
 */
export function calculateScore(
  chain: string[],
  par: number,
  timeMs: number
): ScoreResult {
  const steps = chain.length - 1;
  const efficiency = Math.min(100, Math.round((par / steps) * 100));
  const chainQuality = getChainQuality(steps, par);
  const isGenius = steps <= par;

  return {
    steps,
    par,
    efficiency,
    chainQuality,
    isGenius,
    timeMs,
  };
}
