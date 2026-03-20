/**
 * LetterSlot — Individual letter display in a chain rung.
 * Tappable to select position for editing.
 *
 * Visual states:
 *   - Changed letter (just swapped): gold text + gold border, default background
 *   - Correct position (matches target): gold fill background + gold border, white text
 *   - Both changed AND correct: gold fill (correct takes priority)
 *   - Target word: matching positions lit up, non-matching very dim
 */

"use client";

interface LetterSlotProps {
  letter: string;
  position: number;
  isSelected: boolean;
  isLocked: boolean;
  isStart: boolean;
  isTarget: boolean;
  isChanged: boolean;
  matchesTarget: boolean;
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

  // Determine styles based on state
  const getSlotStyles = () => {
    // Currently selected for editing
    if (isSelected) {
      return "border-2 border-accent-gold bg-bg-elevated animate-letter-pop text-text-primary";
    }

    // Target word at the top
    if (isTarget) {
      if (matchesTarget) {
        return "border border-accent-gold/50 bg-bg-surface text-accent-gold opacity-100";
      }
      return "border border-border bg-bg-surface text-text-secondary opacity-40";
    }

    // Locked rung or start word in the chain
    if (isLocked || isStart) {
      // Correct position — gold fill, gold border, white text
      if (matchesTarget) {
        return "border border-accent-gold bg-accent-gold/20 text-text-primary";
      }
      // Changed letter — gold text, gold border, default background
      if (isChanged) {
        return "border border-accent-gold bg-bg-surface text-accent-gold";
      }
      // Default locked
      return "border border-border bg-bg-surface text-text-primary";
    }

    // Active rung (editable)
    if (matchesTarget) {
      return "border border-accent-gold bg-accent-gold/20 text-text-primary cursor-pointer hover:bg-accent-gold/30";
    }
    return "border border-chain-active bg-bg-surface text-text-primary cursor-pointer hover:bg-bg-elevated";
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
        ${getSlotStyles()}
      `}
    >
      {letter.toUpperCase()}
    </button>
  );
}
