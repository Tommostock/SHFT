/**
 * Bridges Mode — /bridges
 *
 * You're shown the full optimal path but with some words missing.
 * Fill in the blanks to complete the chain.
 * Tests word knowledge rather than pathfinding.
 *
 * Flow:
 * 1. Ready screen with rules + START button
 * 2. Show the optimal path with 2-3 words replaced by blanks
 * 3. Player taps a blank slot, then types letters to fill it
 * 4. Each blank must be a valid word that connects to its neighbours
 * 5. Fill all blanks → puzzle complete!
 * 6. Result screen with stats + PLAY AGAIN
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { loadWordList } from "@/lib/game/dictionary";
import { isValidStep } from "@/lib/game/validator";
import { isWord } from "@/lib/game/dictionary";
import { initPuzzlePool, getRandomPuzzle } from "@/lib/game/puzzlePool";
import { Header } from "@/components/layout/Header";
import { ShareButton } from "@/components/game/ShareButton";
import { Construction, RotateCcw } from "lucide-react";

/** A single slot in the bridge chain */
interface BridgeSlot {
  /** The correct word for this position */
  answer: string;
  /** Whether this slot is a gap (needs to be filled) */
  isGap: boolean;
  /** The player's current guess (only for gaps) */
  guess: string;
  /** Whether the player has correctly filled this gap */
  solved: boolean;
}

/** Generate bridge slots from an optimal path, removing 2-3 words */
function createBridgeSlots(path: string[]): BridgeSlot[] {
  // Never remove first or last word
  // Pick 2-3 random middle indices to blank out
  const middleIndices: number[] = [];
  for (let i = 1; i < path.length - 1; i++) {
    middleIndices.push(i);
  }

  // Shuffle and pick how many to remove
  const shuffled = middleIndices.sort(() => Math.random() - 0.5);
  const gapCount = Math.min(
    path.length <= 5 ? 2 : 3,
    middleIndices.length
  );
  const gapIndices = new Set(shuffled.slice(0, gapCount));

  return path.map((word, i) => ({
    answer: word,
    isGap: gapIndices.has(i),
    guess: gapIndices.has(i) ? "_".repeat(word.length) : word,
    solved: !gapIndices.has(i),
  }));
}

export default function BridgesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReady, setShowReady] = useState(true);
  const [slots, setSlots] = useState<BridgeSlot[]>([]);
  const [activeGapIndex, setActiveGapIndex] = useState<number | null>(null);
  const [selectedPos, setSelectedPos] = useState<number | null>(null);
  const [shakeIndex, setShakeIndex] = useState<number | null>(null);
  const [gameComplete, setGameComplete] = useState(false);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [attempts, setAttempts] = useState(0);

  // Load puzzle pool
  useEffect(() => {
    async function load() {
      try {
        await loadWordList(5);
        await initPuzzlePool();
        loadNewPuzzle();
        setLoading(false);
      } catch {
        setError("Failed to load. Please try again.");
        setLoading(false);
      }
    }
    load();
  }, []);

  // Load a new puzzle
  const loadNewPuzzle = useCallback(() => {
    // Need paths of at least 5 words (par 4+) for meaningful gaps
    const puzzle = getRandomPuzzle(5, 8);
    if (!puzzle) return;

    const bridgeSlots = createBridgeSlots(puzzle.optimalPath);
    setSlots(bridgeSlots);
    setActiveGapIndex(null);
    setSelectedPos(null);
    setGameComplete(false);
    setAttempts(0);

    // Auto-select the first gap
    const firstGap = bridgeSlots.findIndex((s) => s.isGap);
    if (firstGap !== -1) setActiveGapIndex(firstGap);
  }, []);

  // Check if a filled gap is valid (connects to both neighbours)
  const checkGap = useCallback(
    (slotIndex: number, word: string) => {
      if (word.length !== 5) return false;
      if (!isWord(word)) return false;

      // Must connect to the word before it
      const before = slotIndex > 0 ? slots[slotIndex - 1] : null;
      const after =
        slotIndex < slots.length - 1 ? slots[slotIndex + 1] : null;

      const beforeWord = before ? (before.solved ? before.guess : null) : null;
      const afterWord = after ? (after.solved ? after.guess : null) : null;

      // Must be valid step from previous word (if it's solved)
      if (beforeWord && !isValidStep(beforeWord, word)) return false;
      // Must be valid step to next word (if it's solved)
      if (afterWord && !isValidStep(word, afterWord)) return false;

      return true;
    },
    [slots]
  );

  // Handle letter input from keyboard
  const handleKey = useCallback(
    (key: string) => {
      if (gameComplete || activeGapIndex === null) return;

      if (key === "undo" || key === "redo") return;

      const slot = slots[activeGapIndex];
      if (!slot || !slot.isGap || slot.solved) return;

      if (selectedPos === null) {
        // Auto-select first unfilled position
        const firstBlank = slot.guess.indexOf("_");
        if (firstBlank !== -1) setSelectedPos(firstBlank);
        else setSelectedPos(0);
        return;
      }

      // Place the letter
      const currentGuess = slot.guess.split("");
      currentGuess[selectedPos] = key;
      const newGuess = currentGuess.join("");

      const newSlots = [...slots];
      newSlots[activeGapIndex] = { ...slot, guess: newGuess };
      setSlots(newSlots);

      // If word is fully filled (no underscores), check it
      if (!newGuess.includes("_")) {
        setAttempts((a) => a + 1);
        if (checkGap(activeGapIndex, newGuess)) {
          // Correct!
          newSlots[activeGapIndex] = {
            ...newSlots[activeGapIndex],
            solved: true,
          };
          setSlots([...newSlots]);
          setSelectedPos(null);

          // Check if all gaps are filled
          const allSolved = newSlots.every((s) => s.solved);
          if (allSolved) {
            setGameComplete(true);
            setActiveGapIndex(null);
          } else {
            // Move to next unsolved gap
            const nextGap = newSlots.findIndex(
              (s, i) => s.isGap && !s.solved && i !== activeGapIndex
            );
            setActiveGapIndex(nextGap !== -1 ? nextGap : null);
          }
        } else {
          // Wrong — shake and reset this gap
          setShakeIndex(activeGapIndex);
          setTimeout(() => {
            newSlots[activeGapIndex] = {
              ...slot,
              guess: "_".repeat(5),
            };
            setSlots([...newSlots]);
            setShakeIndex(null);
            setSelectedPos(null);
          }, 400);
        }
      } else {
        // Move to next blank position
        const nextBlank = newGuess.indexOf("_", selectedPos + 1);
        if (nextBlank !== -1) {
          setSelectedPos(nextBlank);
        } else {
          // Look from beginning
          const firstBlank = newGuess.indexOf("_");
          if (firstBlank !== -1) setSelectedPos(firstBlank);
        }
      }
    },
    [gameComplete, activeGapIndex, selectedPos, slots, checkGap]
  );

  // Keyboard event handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameComplete) return;
      const key = e.key.toLowerCase();
      if (key.length === 1 && key >= "a" && key <= "z") {
        e.preventDefault();
        handleKey(key);
      } else if (key === "backspace" && activeGapIndex !== null) {
        e.preventDefault();
        // Clear current position and move back
        const slot = slots[activeGapIndex];
        if (slot && selectedPos !== null) {
          const currentGuess = slot.guess.split("");
          currentGuess[selectedPos] = "_";
          const newSlots = [...slots];
          newSlots[activeGapIndex] = { ...slot, guess: currentGuess.join("") };
          setSlots(newSlots);
          if (selectedPos > 0) setSelectedPos(selectedPos - 1);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameComplete, handleKey, activeGapIndex, slots, selectedPos]);

  // Play again
  const playAgain = useCallback(() => {
    loadNewPuzzle();
    setGamesPlayed((g) => g + 1);
  }, [loadNewPuzzle]);

  // Loading
  if (loading) {
    return (
      <div className="flex flex-col h-dvh">
        <Header showBack centerText="Bridges" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-text-secondary font-body animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="flex flex-col h-dvh">
        <Header showBack centerText="Bridges" />
        <div className="flex-1 flex items-center justify-center px-6 text-center">
          <p className="text-text-secondary font-body">{error}</p>
        </div>
      </div>
    );
  }

  // Ready screen
  if (showReady) {
    return (
      <div className="flex flex-col h-dvh">
        <Header showBack centerText="Bridges" />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-6">
          <div className="w-16 h-16 rounded-full bg-amber-400/20 flex items-center justify-center">
            <Construction size={32} className="text-amber-400" />
          </div>
          <h1 className="font-display text-3xl text-text-primary">Bridges</h1>
          <div className="space-y-2 text-text-secondary font-body text-sm max-w-[300px]">
            <p>
              You&apos;re shown a word chain with{" "}
              <span className="text-text-primary font-medium">
                missing words
              </span>
              .
            </p>
            <p>
              Fill in the blanks — each word must connect to its{" "}
              <span className="text-text-primary font-medium">neighbours</span>{" "}
              by changing one letter.
            </p>
            <p>Tests word knowledge, not pathfinding.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowReady(false)}
            className="px-10 py-3.5 mt-2 bg-accent-gold text-[#1A1A1A] font-body font-bold text-lg rounded-[var(--radius-lg)] hover:opacity-90 transition-opacity"
          >
            START
          </button>
        </div>
      </div>
    );
  }

  const totalGaps = slots.filter((s) => s.isGap).length;
  const solvedGaps = slots.filter((s) => s.isGap && s.solved).length;

  // Share text
  const shareText = `SHFT Bridges\n${totalGaps}/${totalGaps} gaps filled\n${attempts} attempts\nshft.game`;

  return (
    <div className="flex flex-col h-dvh overflow-hidden">
      <Header showBack centerText="Bridges" />

      {/* Stats bar */}
      <div className="flex justify-center gap-4 px-4 py-1.5 text-xs font-body text-text-secondary shrink-0">
        <span>
          Filled:{" "}
          <span className="font-game text-text-primary">
            {solvedGaps}/{totalGaps}
          </span>
        </span>
        <span>
          Attempts:{" "}
          <span className="font-game text-text-primary">{attempts}</span>
        </span>
      </div>

      {/* Chain display */}
      <div className="flex-1 flex flex-col items-center justify-center gap-2 px-4 min-h-0 overflow-y-auto py-4">
        {slots.map((slot, idx) => (
          <div key={idx} className="flex flex-col items-center">
            {/* Word slot */}
            <div
              className={`
                flex gap-1.5
                ${shakeIndex === idx ? "animate-shake" : ""}
                ${slot.solved && slot.isGap ? "animate-lock-in" : ""}
              `}
            >
              {slot.guess.split("").map((letter, letterIdx) => {
                const isActive = activeGapIndex === idx;
                const isSelected = isActive && selectedPos === letterIdx;
                const isBlank = letter === "_";
                const isSolvedGap = slot.isGap && slot.solved;
                const isGivenWord = !slot.isGap;

                return (
                  <button
                    key={letterIdx}
                    type="button"
                    onClick={() => {
                      if (slot.isGap && !slot.solved && !gameComplete) {
                        setActiveGapIndex(idx);
                        setSelectedPos(letterIdx);
                      }
                    }}
                    disabled={!slot.isGap || slot.solved || gameComplete}
                    className={`
                      w-[46px] h-[46px] sm:w-[52px] sm:h-[52px]
                      flex items-center justify-center
                      font-game text-xl sm:text-2xl font-bold uppercase
                      rounded-[6px] transition-all duration-200
                      ${
                        isSelected
                          ? "border-2 border-accent-gold bg-bg-elevated text-text-primary"
                          : isSolvedGap
                            ? "border border-accent-green bg-accent-green/20 text-accent-green"
                            : isGivenWord
                              ? "border border-border bg-bg-surface text-text-primary"
                              : isActive
                                ? "border border-accent-gold/50 bg-bg-surface text-text-primary cursor-pointer hover:bg-bg-elevated"
                                : "border border-dashed border-text-secondary/30 bg-bg-surface/50 text-text-secondary/50 cursor-pointer"
                      }
                    `}
                  >
                    {isBlank ? "" : letter}
                  </button>
                );
              })}
            </div>

            {/* Connector dot between words */}
            {idx < slots.length - 1 && (
              <div className="text-text-secondary/30 text-xs my-0.5">·</div>
            )}
          </div>
        ))}
      </div>

      {/* Keyboard — inline since Bridges doesn't use the game store */}
      {!gameComplete && (
        <BridgesKeyboard onKey={handleKey} />
      )}

      {/* Complete overlay */}
      {gameComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-bg-surface rounded-[var(--radius-md)] shadow-lg w-[90%] max-w-[340px] p-5 animate-slide-up">
            <h2 className="font-display text-2xl text-text-primary text-center mb-1">
              Bridges Complete
            </h2>

            <div className="text-center mb-4">
              <p className="font-game text-4xl text-accent-green font-bold">
                {totalGaps}/{totalGaps}
              </p>
              <p className="text-sm text-text-secondary font-body">
                gaps filled
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-bg-elevated rounded-[var(--radius-md)] p-3 text-center">
                <p className="font-game text-lg text-text-primary">
                  {attempts}
                </p>
                <p className="text-[10px] text-text-secondary font-body uppercase">
                  Attempts
                </p>
              </div>
              <div className="bg-bg-elevated rounded-[var(--radius-md)] p-3 text-center">
                <p className="font-game text-lg text-text-primary">
                  {attempts === totalGaps ? "Perfect" : "Good"}
                </p>
                <p className="text-[10px] text-text-secondary font-body uppercase">
                  Rating
                </p>
              </div>
            </div>

            <div className="mb-3">
              <ShareButton shareText={shareText} />
            </div>

            <button
              type="button"
              onClick={playAgain}
              className="w-full py-3 bg-bg-elevated text-text-primary font-body font-bold text-sm rounded-[var(--radius-lg)] hover:bg-border transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw size={16} />
              PLAY AGAIN
            </button>

            <a
              href="/"
              className="block w-full py-2.5 mt-2 text-text-secondary font-body font-medium text-sm text-center hover:text-text-primary transition-colors"
            >
              Back to Home
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

/** Simple QWERTY keyboard for Bridges mode (no game store dependency) */
const KB_ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m"],
];

function BridgesKeyboard({ onKey }: { onKey: (key: string) => void }) {
  const [pressedKey, setPressedKey] = useState<string | null>(null);

  const press = (key: string) => {
    setPressedKey(key);
    setTimeout(() => setPressedKey(null), 100);
    onKey(key);
  };

  return (
    <div className="px-1 pb-3 pt-1.5 shrink-0" role="group" aria-label="Keyboard">
      {KB_ROWS.map((row, rowIdx) => (
        <div key={rowIdx} className="flex justify-center gap-[5px] mb-[6px]">
          {row.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => press(key)}
              aria-label={key.toUpperCase()}
              style={{ width: "calc((100% - 54px) / 10)" }}
              className={`
                max-w-[36px] h-[42px]
                flex items-center justify-center
                rounded-[5px]
                font-body text-[15px] font-medium uppercase
                select-none transition-all duration-100
                ${pressedKey === key
                  ? "bg-text-primary text-bg-primary scale-95"
                  : "bg-bg-elevated text-text-primary active:bg-border"
                }
              `}
            >
              {key.toUpperCase()}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
