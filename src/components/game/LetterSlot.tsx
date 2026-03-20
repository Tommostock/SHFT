/**
 * LetterSlot — Individual letter display in a chain rung.
 * Tappable to select position for editing.
 */

"use client";

interface LetterSlotProps {
  letter: string;
  position: number;
  isSelected: boolean;
  isLocked: boolean;
  isStart: boolean;
  isTarget: boolean;
  isChanged: boolean; // This letter was the one that changed from previous word
  onSelect: (position: number) => void;
}

export function LetterSlot({
  letter,
  position,
  isSelected,
  isLocked,
  isStart,
  isTarget,
  isChanged,
  onSelect,
}: LetterSlotProps) {
  const canTap = !isLocked && !isStart && !isTarget;

  return (
    <button
      type="button"
      onClick={() => canTap && onSelect(position)}
      disabled={!canTap}
      aria-label={`Letter ${letter.toUpperCase()} at position ${position + 1}${isSelected ? ", selected" : ""}`}
      className={`
        w-10 h-10 sm:w-12 sm:h-12
        flex items-center justify-center
        font-game text-lg sm:text-xl font-bold uppercase
        rounded-[var(--radius-sm)]
        transition-all duration-150
        ${isSelected
          ? "border-2 border-accent-gold bg-bg-elevated animate-letter-pop text-text-primary"
          : isLocked
            ? "border border-border bg-bg-surface text-text-primary"
            : isStart || isTarget
              ? "border border-border bg-bg-surface text-text-secondary"
              : "border border-chain-active bg-bg-surface text-text-primary cursor-pointer hover:bg-bg-elevated"
        }
        ${isChanged && isLocked ? "text-accent-gold" : ""}
        ${isTarget ? "opacity-60" : ""}
      `}
    >
      {letter.toUpperCase()}
    </button>
  );
}
