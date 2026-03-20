/**
 * GameKeyboard — Custom QWERTY keyboard for the SHFT game.
 * Layout matches standard iPhone keyboard with UNDO/REDO flanking the bottom row.
 */

"use client";

import { useGameStore } from "@/lib/stores/gameStore";
import { useCallback, useState } from "react";

const ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["undo", "z", "x", "c", "v", "b", "n", "m", "redo"],
];

export function GameKeyboard() {
  const { inputLetter, undoStep, redoStep, status, selectedPosition, selectPosition, chain, redoStack } =
    useGameStore();
  const [pressedKey, setPressedKey] = useState<string | null>(null);

  const canUndo = chain.length > 1;
  const canRedo = redoStack.length > 0;

  const handleKey = useCallback(
    (key: string) => {
      if (status !== "playing") return;

      setPressedKey(key);
      setTimeout(() => setPressedKey(null), 100);

      if (key === "undo") {
        undoStep();
        return;
      }

      if (key === "redo") {
        redoStep();
        return;
      }

      // If no position selected, auto-select position 0
      if (selectedPosition === null) {
        selectPosition(0);
        setTimeout(() => inputLetter(key), 10);
        return;
      }

      inputLetter(key);
    },
    [status, inputLetter, undoStep, redoStep, selectedPosition, selectPosition]
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
            const isUndo = key === "undo";
            const isRedo = key === "redo";
            const isSpecial = isUndo || isRedo;
            const isPressed = pressedKey === key;
            const isDisabled =
              status !== "playing" ||
              (isUndo && !canUndo) ||
              (isRedo && !canRedo);

            return (
              <button
                key={key}
                type="button"
                onClick={() => handleKey(key)}
                disabled={isDisabled}
                aria-label={
                  isUndo
                    ? "Undo last step"
                    : isRedo
                      ? "Redo step"
                      : key.toUpperCase()
                }
                className={`
                  ${isSpecial ? "flex-[1.5] min-w-[40px]" : "flex-1 min-w-[28px]"}
                  h-12
                  flex items-center justify-center
                  rounded-[var(--radius-sm)]
                  font-body ${isSpecial ? "text-[10px] tracking-wide" : "text-sm"} font-medium uppercase
                  select-none
                  transition-all duration-100
                  ${isPressed
                    ? "bg-text-primary text-bg-primary scale-95"
                    : "bg-bg-elevated text-text-primary active:bg-border"
                  }
                  disabled:opacity-30
                `}
              >
                {isUndo ? "UNDO" : isRedo ? "REDO" : key.toUpperCase()}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
