/**
 * LetterSlot — Individual letter display in a chain rung.
 * Tappable to select position for editing.
 *
 * When a letter matches the target word at the same position,
 * it turns gold to show progress toward the target.
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
  matchesTarget: boolean; // This letter matches the target word at this position
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
  matchesTarget,
  onSelect,
}: LetterSlotProps) {
  const canTap = !isLocked && !isStart && !isTarget;

  // Determine text color based on state priority:
  // 1. Selected → primary (white/black)
  // 2. Target word with match → gold (lit up)
  // 3. Target word without match → very dim
  // 4. Matches target in chain → gold
  // 5. Changed letter in locked rung → gold (existing behavior)
  // 6. Default → primary
  const getTextColor = () => {
    if (isSelected) return "text-text-primary";
    if (isTarget && matchesTarget) return "text-accent-gold";
    if (isTarget) return "text-text-secondary opacity-30";
    if (matchesTarget && (isLocked || isStart)) return "text-accent-gold";
    if (isChanged && isLocked) return "text-accent-gold";
    return "text-text-primary";
  };

  // Target word: matching letters are bright, non-matching are very dim
  const getTargetOpacity = () => {
    if (!isTarget) return "";
    return matchesTarget ? "opacity-100" : "opacity-40";
  };

  return (
    <button
      type="button"
      onClick={() => canTap && onSelect(position)}
      disabled={!canTap}
      aria-label={`Letter ${letter.toUpperCase()} at position ${position + 1}${isSelected ? ", selected" : ""}${matchesTarget ? ", matches target" : ""}`}
      className={`
        w-10 h-10 sm:w-12 sm:h-12
        flex items-center justify-center
        font-game text-lg sm:text-xl font-bold uppercase
        rounded-[var(--radius-sm)]
        transition-all duration-200
        ${isSelected
          ? "border-2 border-accent-gold bg-bg-elevated animate-letter-pop"
          : isLocked
            ? `border bg-bg-surface ${matchesTarget ? "border-accent-gold/40" : "border-border"}`
            : isStart
              ? `border bg-bg-surface ${matchesTarget ? "border-accent-gold/40" : "border-border"}`
              : isTarget
                ? `border bg-bg-surface ${matchesTarget ? "border-accent-gold/50" : "border-border"}`
                : "border border-chain-active bg-bg-surface cursor-pointer hover:bg-bg-elevated"
        }
        ${getTextColor()}
        ${getTargetOpacity()}
      `}
    >
      {letter.toUpperCase()}
    </button>
  );
}
