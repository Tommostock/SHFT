/**
 * LetterSlot — Individual letter display in a chain rung.
 * Tappable to select position for editing.
 *
 * Visual states:
 *   - Selected letter: gold border (editing this position)
 *   - Correct position (matches target): green fill + green border, white text
 *   - Changed letter (just swapped): white text, no special styling
 *   - Default: white text, standard border
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
  isHighlightedChange?: boolean; // Tapped rung — show which letter changed
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
  isHighlightedChange = false,
  matchesTarget,
  onSelect,
}: LetterSlotProps) {
  const canTap = !isLocked && !isStart && !isTarget;

  const getSlotStyles = () => {
    // Currently selected for editing — gold border
    if (isSelected) {
      return "border-2 border-accent-gold bg-bg-elevated animate-letter-pop text-text-primary";
    }

    // Target word at the top
    if (isTarget) {
      if (matchesTarget) {
        // Correct position on target — green fill + green border
        return "border border-accent-green bg-accent-green/20 text-accent-green opacity-100";
      }
      // Non-matching target position — very dim
      return "border border-border bg-bg-surface text-text-secondary opacity-40";
    }

    // Locked rung or start word in the chain
    if (isLocked || isStart) {
      if (matchesTarget) {
        return "border border-accent-green bg-accent-green/20 text-text-primary";
      }
      // Highlighted changed letter (tapped to review) — gold text + gold border
      if (isHighlightedChange) {
        return "border-2 border-accent-gold bg-bg-surface text-accent-gold";
      }
      return "border border-border bg-bg-surface text-text-primary";
    }

    // Active rung (editable)
    if (matchesTarget) {
      return "border border-accent-green bg-accent-green/20 text-text-primary cursor-pointer hover:bg-accent-green/30";
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
