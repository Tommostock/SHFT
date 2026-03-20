/**
 * GameKeyboard — Custom QWERTY keyboard for the SHFT game.
 * Compact layout with Undo (↩) and Backspace (⌫) keys.
 * Uses the game's custom styling, not the device keyboard.
 */

"use client";

import { useGameStore } from "@/lib/stores/gameStore";
import { useCallback, useState } from "react";

const ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["undo", "z", "x", "c", "v", "b", "n", "m", "back"],
];

export function GameKeyboard() {
  const { inputLetter, undoStep, status, selectedPosition, selectPosition, activeWord, wordLength } =
    useGameStore();
  const [pressedKey, setPressedKey] = useState<string | null>(null);

  const handleKey = useCallback(
    (key: string) => {
      if (status !== "playing") return;

      setPressedKey(key);
      setTimeout(() => setPressedKey(null), 100);

      if (key === "undo") {
        undoStep();
        return;
      }

      if (key === "back") {
        // Deselect the current position
        selectPosition(null);
        return;
      }

      // If no position selected, auto-select the first position that differs
      // from the start, or position 0
      if (selectedPosition === null) {
        selectPosition(0);
        // Small delay then input the letter
        setTimeout(() => inputLetter(key), 10);
        return;
      }

      inputLetter(key);

      // Auto-advance to next position if the current one was just filled
      // and the word isn't complete yet
    },
    [status, inputLetter, undoStep, selectedPosition, selectPosition]
  );

  return (
    <div
      className="px-1.5 pb-3 pt-1.5"
      role="group"
      aria-label="Game keyboard"
    >
      {ROWS.map((row, rowIdx) => (
        <div key={rowIdx} className="flex justify-center gap-[4px] mb-[4px]">
          {row.map((key) => {
            const isSpecial = key === "undo" || key === "back";
            const isPressed = pressedKey === key;

            return (
              <button
                key={key}
                type="button"
                onClick={() => handleKey(key)}
                disabled={status !== "playing"}
                aria-label={
                  key === "undo"
                    ? "Undo last step"
                    : key === "back"
                      ? "Backspace"
                      : key.toUpperCase()
                }
                className={`
                  ${isSpecial ? "flex-[1.5] min-w-[36px]" : "flex-1 min-w-[28px]"}
                  h-12
                  flex items-center justify-center
                  rounded-[var(--radius-sm)]
                  font-body text-sm font-medium uppercase
                  select-none
                  transition-all duration-100
                  ${isPressed
                    ? "bg-text-primary text-bg-primary scale-95"
                    : "bg-bg-elevated text-text-primary active:bg-border"
                  }
                  disabled:opacity-40
                `}
              >
                {key === "undo" ? "↩" : key === "back" ? "⌫" : key.toUpperCase()}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
