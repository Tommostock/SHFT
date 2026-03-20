/**
 * Game Store — Zustand state management for the SHFT game.
 *
 * Manages: current chain, active rung word, selected position,
 * puzzle data, game status, timer, and undo history.
 */

"use client";

import { create } from "zustand";
import type { DailyPuzzle, GameStatus, ScoreResult } from "@/types";
import { isValidStep } from "@/lib/game/validator";
import { isWord, isUnchainable } from "@/lib/game/dictionary";
import { calculateScore } from "@/lib/game/scorer";

interface GameState {
  // Puzzle data
  puzzle: DailyPuzzle | null;
  startWord: string;
  targetWord: string;
  wordLength: number;
  par: number;

  // Chain state
  chain: string[]; // Locked words (starts with startWord)
  activeWord: string; // Current word being edited (initially same as last chain word)
  selectedPosition: number | null; // Which letter position is selected (0-indexed)

  // Game status
  status: GameStatus;
  score: ScoreResult | null;

  // Timer (milliseconds)
  startTime: number | null;
  endTime: number | null;

  // Animation triggers
  shakeActive: boolean;
  lockInAnimation: boolean;
  completeAnimation: boolean;

  // Unchainable word feedback — shown when player types a real word
  // that can't participate in word chains (e.g., "iron", "pizza")
  unchainableWord: string | null;

  // Actions
  loadPuzzle: (puzzle: DailyPuzzle) => void;
  loadCustomPuzzle: (start: string, target: string, par: number) => void;
  selectPosition: (pos: number | null) => void;
  inputLetter: (letter: string) => void;
  undoStep: () => void;
  resetGame: () => void;
  clearShake: () => void;
  clearLockIn: () => void;
  clearUnchainable: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  // Initial state
  puzzle: null,
  startWord: "",
  targetWord: "",
  wordLength: 0,
  par: 0,
  chain: [],
  activeWord: "",
  selectedPosition: null,
  status: "idle",
  score: null,
  startTime: null,
  endTime: null,
  shakeActive: false,
  lockInAnimation: false,
  completeAnimation: false,
  unchainableWord: null,

  /**
   * Load a daily puzzle into the store.
   */
  loadPuzzle: (puzzle: DailyPuzzle) => {
    set({
      puzzle,
      startWord: puzzle.startWord,
      targetWord: puzzle.targetWord,
      wordLength: puzzle.wordLength,
      par: puzzle.par,
      chain: [puzzle.startWord],
      activeWord: puzzle.startWord,
      selectedPosition: null,
      status: "playing",
      score: null,
      startTime: null,
      endTime: null,
      shakeActive: false,
      lockInAnimation: false,
      completeAnimation: false,
    });
  },

  /**
   * Load a custom puzzle (for practice mode).
   */
  loadCustomPuzzle: (start: string, target: string, par: number) => {
    set({
      puzzle: null,
      startWord: start,
      targetWord: target,
      wordLength: start.length,
      par,
      chain: [start],
      activeWord: start,
      selectedPosition: null,
      status: "playing",
      score: null,
      startTime: null,
      endTime: null,
      shakeActive: false,
      lockInAnimation: false,
      completeAnimation: false,
    });
  },

  /**
   * Select a letter position in the active word.
   */
  selectPosition: (pos: number | null) => {
    const { status, wordLength, chain } = get();
    if (status !== "playing") return;
    const lastLockedWord = chain[chain.length - 1];
    // Allow null to deselect
    if (pos === null || pos < 0) {
      set({ selectedPosition: null, activeWord: lastLockedWord });
      return;
    }
    if (pos >= wordLength) return;
    // Reset active word to the last locked word when selecting a new position
    set({ selectedPosition: pos, activeWord: lastLockedWord });
  },

  /**
   * Input a letter at the selected position.
   * If the resulting word is valid → lock it in and advance.
   * If invalid → trigger shake animation.
   */
  inputLetter: (letter: string) => {
    const state = get();
    if (state.status !== "playing") return;
    if (state.selectedPosition === null) return;

    const normalizedLetter = letter.toLowerCase();
    const pos = state.selectedPosition;
    const lastLockedWord = state.chain[state.chain.length - 1];

    // Build the new word by replacing one letter in the last locked word
    const newWord =
      lastLockedWord.slice(0, pos) +
      normalizedLetter +
      lastLockedWord.slice(pos + 1);

    // Start timer on first input
    const startTime = state.startTime ?? Date.now();

    // Update the active word immediately
    set({ activeWord: newWord, startTime });

    // If the new word is the same as the last locked word, do nothing more
    if (newWord === lastLockedWord) return;

    // Check if it's a valid step from the last locked word
    if (isValidStep(lastLockedWord, newWord)) {
      // Trigger haptic feedback
      triggerHaptic("valid");

      // Check if we've reached the target
      if (newWord === state.targetWord) {
        const endTime = Date.now();
        const fullChain = [...state.chain, newWord];
        const score = calculateScore(fullChain, state.par, endTime - startTime);

        set({
          chain: fullChain,
          activeWord: newWord,
          selectedPosition: null,
          status: "complete",
          score,
          endTime,
          lockInAnimation: true,
          completeAnimation: true,
        });
        triggerHaptic(score.isGenius ? "genius" : "complete");
        return;
      }

      // Lock in the valid word
      set({
        chain: [...state.chain, newWord],
        activeWord: newWord,
        selectedPosition: null,
        lockInAnimation: true,
      });
    } else if (newWord !== lastLockedWord) {
      const diffCount = countDiff(lastLockedWord, newWord);
      if (diffCount === 1 && !isWord(newWord)) {
        // Check if this is a real word that just can't form chains
        if (isUnchainable(newWord)) {
          set({ shakeActive: true, unchainableWord: newWord });
        } else {
          set({ shakeActive: true });
        }
        triggerHaptic("invalid");
      }
    }
  },

  /**
   * Undo the last locked step.
   */
  undoStep: () => {
    const { chain, status, startWord } = get();
    if (status !== "playing") return;
    if (chain.length <= 1) return; // Can't undo the start word

    const newChain = chain.slice(0, -1);
    const lastWord = newChain[newChain.length - 1];

    set({
      chain: newChain,
      activeWord: lastWord,
      selectedPosition: null,
    });
  },

  /**
   * Reset the game to initial state.
   */
  resetGame: () => {
    const { startWord } = get();
    if (!startWord) return;

    set({
      chain: [startWord],
      activeWord: startWord,
      selectedPosition: null,
      status: "playing",
      score: null,
      startTime: null,
      endTime: null,
      shakeActive: false,
      lockInAnimation: false,
      completeAnimation: false,
    });
  },

  clearShake: () => set({ shakeActive: false }),
  clearLockIn: () => set({ lockInAnimation: false }),
  clearUnchainable: () => set({ unchainableWord: null }),
}));

/** Count the number of differing characters between two same-length strings */
function countDiff(a: string, b: string): number {
  let count = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) count++;
  }
  return count;
}

/** Trigger haptic feedback using the Vibration API */
function triggerHaptic(type: "valid" | "invalid" | "complete" | "genius") {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;

  switch (type) {
    case "valid":
      navigator.vibrate(10);
      break;
    case "invalid":
      navigator.vibrate([10, 50, 10]);
      break;
    case "complete":
      navigator.vibrate(30);
      break;
    case "genius":
      navigator.vibrate([10, 30, 10, 30, 50]);
      break;
  }
}
