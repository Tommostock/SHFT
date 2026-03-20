/**
 * ChainRung — A row of LetterSlots representing one word in the chain.
 * Can be locked (completed step), active (being edited), start, or target.
 */

"use client";

import { LetterSlot } from "./LetterSlot";

interface ChainRungProps {
  word: string;
  previousWord?: string; // To highlight which letter changed
  isLocked: boolean;
  isActive: boolean;
  isStart: boolean;
  isTarget: boolean;
  selectedPosition: number | null;
  onSelectPosition: (pos: number) => void;
  animate?: "lock-in" | "shake" | "gold-flash" | null;
}

export function ChainRung({
  word,
  previousWord,
  isLocked,
  isActive,
  isStart,
  isTarget,
  selectedPosition,
  onSelectPosition,
  animate,
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
          onSelect={onSelectPosition}
        />
      ))}
    </div>
  );
}
