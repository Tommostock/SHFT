/**
 * ResultModal — Post-solve modal showing score, chain quality, and share button.
 * See SPEC.md Section 7.2 for layout.
 */

"use client";

import type { ScoreResult } from "@/types";
import { generateShareText } from "@/lib/game/sharer";
import { formatTime } from "@/lib/utils/dates";
import { ShareButton } from "./ShareButton";

interface ResultModalProps {
  score: ScoreResult;
  puzzleNumber: number;
  startWord: string;
  targetWord: string;
  streak: number;
  onClose: () => void;
  isPractice?: boolean;
}

const QUALITY_LABELS = {
  gold: "Gold Chain",
  silver: "Silver Chain",
  bronze: "Bronze Chain",
  iron: "Iron Chain",
} as const;

const QUALITY_EMOJI = {
  gold: "🔗",
  silver: "⛓️",
  bronze: "⛓️",
  iron: "⛓️",
} as const;

export function ResultModal({
  score,
  puzzleNumber,
  startWord,
  targetWord,
  streak,
  onClose,
  isPractice = false,
}: ResultModalProps) {
  const shareText = generateShareText(
    puzzleNumber,
    score.steps,
    score.par,
    score.chainQuality
  );

  const chainEmojis = Array(score.steps)
    .fill(QUALITY_EMOJI[score.chainQuality])
    .join("");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Puzzle result"
    >
      <div
        className="
          bg-bg-surface rounded-[var(--radius-md)] shadow-lg
          w-[90%] max-w-[360px] p-6
          animate-slide-up
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <div className="text-center mb-4">
          {score.isGenius ? (
            <div className="text-3xl animate-star-burst mb-1">⭐</div>
          ) : null}
          <h2 className="font-display text-2xl text-text-primary">
            {score.isGenius ? "GENIUS!" : "COMPLETE!"}
          </h2>
        </div>

        {/* Puzzle info */}
        <div className="text-center mb-4 space-y-1">
          <p className="font-game text-sm text-text-secondary uppercase">
            {startWord.toUpperCase()} → {targetWord.toUpperCase()}
          </p>
          <div className="flex justify-center gap-4 text-sm text-text-secondary font-body">
            <span>
              {score.steps} step{score.steps !== 1 ? "s" : ""}
            </span>
            <span>·</span>
            <span>Par: {score.par}</span>
          </div>
          <p className="text-sm text-text-secondary font-body">
            Efficiency: {score.efficiency}%
          </p>
          <p className="text-sm text-text-secondary font-body">
            Time: {formatTime(score.timeMs)}
          </p>
        </div>

        {/* Chain quality */}
        <div className="text-center mb-6">
          <p className="text-xl mb-1">{chainEmojis}</p>
          <p
            className={`font-body font-medium text-sm ${
              score.chainQuality === "gold"
                ? "text-accent-gold"
                : "text-text-secondary"
            }`}
          >
            {QUALITY_LABELS[score.chainQuality]}
          </p>
        </div>

        {/* Share button (not for practice) */}
        {!isPractice && (
          <div className="mb-4">
            <ShareButton shareText={shareText} />
          </div>
        )}

        {/* Streak */}
        {!isPractice && streak > 0 && (
          <p className="text-center text-sm text-text-secondary font-body animate-count-up">
            🔥 Streak: {streak} day{streak !== 1 ? "s" : ""}
          </p>
        )}

        {/* Close / play again for practice */}
        {isPractice && (
          <button
            type="button"
            onClick={onClose}
            className="
              w-full py-3 px-6 mt-2
              bg-bg-elevated text-text-primary font-body font-medium text-base
              rounded-[var(--radius-lg)]
              hover:opacity-90
              transition-opacity
            "
          >
            New Puzzle
          </button>
        )}
      </div>
    </div>
  );
}
