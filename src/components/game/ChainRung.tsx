/**
 * ChainRung — A row of LetterSlots representing one word in the chain.
 * Can be locked (completed step), active (being edited), start, or target.
 *
 * Compares each letter against the target word at the same position.
 * Matching letters turn gold to show progress.
 */

"use client";

import { LetterSlot } from "./LetterSlot";
import { WordDefinition } from "./WordDefinition";

interface ChainRungProps {
  word: string;
  targetWord: string; // The puzzle's target word, for position matching
  previousWord?: string; // To highlight which letter changed
  isLocked: boolean;
  isActive: boolean;
  isStart: boolean;
  isTarget: boolean;
  selectedPosition: number | null;
  onSelectPosition: (pos: number) => void;
  animate?: "lock-in" | "shake" | "gold-flash" | null;
  highlightChanged?: boolean; // When true, visually highlight the changed letter
}

export function ChainRung({
  word,
  targetWord,
  previousWord,
  isLocked,
  isActive,
  isStart,
  isTarget,
  selectedPosition,
  onSelectPosition,
  animate,
  highlightChanged = false,
}: ChainRungProps) {
  // Determine which letter changed from the previous word
  const changedPositions = new Set<number>();
  if (previousWord && previousWord.length === word.length) {
    for (let i = 0; i < word.length; i++) {
      if (word[i] !== previousWord[i]) {
        changedPositions.add(i);
      }
    }
  }

  const animationClass =
    animate === "lock-in"
      ? "animate-lock-in animate-gold-flash"
      : animate === "shake"
        ? "animate-shake"
        : "";

  return (
    <div
      className={`flex items-center gap-1 sm:gap-1.5 ${animationClass}`}
      role="row"
      aria-label={
        isStart
          ? `Start word: ${word}`
          : isTarget
            ? `Target word: ${word}`
            : isActive
              ? `Active word: ${word}`
              : `Locked word: ${word}`
      }
    >
      {word.split("").map((letter, i) => (
        <LetterSlot
          key={i}
          letter={letter}
          position={i}
          isSelected={isActive && selectedPosition === i}
          isLocked={isLocked}
          isStart={isStart}
          isTarget={isTarget}
          isChanged={changedPositions.has(i)}
          isHighlightedChange={highlightChanged && changedPositions.has(i)}
          matchesTarget={targetWord.length === word.length && letter === targetWord[i]}
          onSelect={onSelectPosition}
        />
      ))}
      {/* Definition button — shown on locked rungs and start/target words */}
      {(isLocked || isStart || isTarget) && (
        <WordDefinition word={word} />
      )}
    </div>
  );
}
