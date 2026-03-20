/**
 * Practice Mode — /practice
 *
 * Unlimited, untimed, unranked play.
 * Player picks word length, then gets a random puzzle from the word graph.
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { useGameStore } from "@/lib/stores/gameStore";
import { loadWordList } from "@/lib/game/dictionary";
import { loadGraph, generateRandomPuzzle } from "@/lib/game/solver";
import { ChainBoard } from "@/components/game/ChainBoard";
import { GameKeyboard } from "@/components/game/GameKeyboard";
import { ResultModal } from "@/components/game/ResultModal";
import { Header } from "@/components/layout/Header";

type WordLength = 3 | 4 | 5;

export default function PracticePage() {
  const { loadCustomPuzzle, status, score, startWord, targetWord, par } =
    useGameStore();
  const [selectedLength, setSelectedLength] = useState<WordLength | null>(null);
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [puzzleCount, setPuzzleCount] = useState(0);

  const startPuzzle = useCallback(
    async (length: WordLength) => {
      setLoading(true);
      setShowResult(false);

      try {
        // Load word list and graph
        await loadWordList(length);
        const graph = await loadGraph(length);

        // Generate a random puzzle
        const puzzle = generateRandomPuzzle(graph, length === 3 ? 3 : 4);
        if (!puzzle) {
          alert("Could not generate a puzzle. Try a different word length.");
          setLoading(false);
          return;
        }

        loadCustomPuzzle(puzzle.start, puzzle.target, puzzle.par);
        setPuzzleCount((c) => c + 1);
      } catch (err) {
        alert("Error loading puzzle data. Please try again.");
      }

      setLoading(false);
    },
    [loadCustomPuzzle]
  );

  // Show result on completion
  useEffect(() => {
    if (status === "complete" && score) {
      setTimeout(() => setShowResult(true), 500);
    }
  }, [status, score]);

  // Handle keyboard events
  useEffect(() => {
    if (status !== "playing") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key.length === 1 && key >= "a" && key <= "z") {
        e.preventDefault();
        useGameStore.getState().inputLetter(key);
      } else if (key === "backspace") {
        e.preventDefault();
        useGameStore.getState().selectPosition(null);
      } else if (e.ctrlKey && key === "z") {
        e.preventDefault();
        useGameStore.getState().undoStep();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [status]);

  // Word length selection screen
  if (selectedLength === null) {
    return (
      <div className="flex flex-col min-h-dvh">
        <Header showBack centerText="Practice" />
        <main className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
          <div className="text-center">
            <h2 className="font-display text-2xl text-text-primary mb-2">
              Practice Mode
            </h2>
            <p className="text-sm text-text-secondary font-body">
              Choose a word length to start
            </p>
          </div>

          <div className="flex gap-3">
            {([3, 4, 5] as WordLength[]).map((len) => (
              <button
                key={len}
                type="button"
                onClick={() => {
                  setSelectedLength(len);
                  startPuzzle(len);
                }}
                className="
                  w-20 h-20
                  flex flex-col items-center justify-center
                  bg-bg-surface rounded-[var(--radius-md)]
                  border border-border
                  hover:border-accent-gold
                  transition-colors duration-200
                "
              >
                <span className="font-game text-2xl text-text-primary">
                  {len}
                </span>
                <span className="text-[10px] text-text-secondary font-body mt-1">
                  letters
                </span>
              </button>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-dvh">
        <Header showBack centerText="Practice" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-text-secondary font-body animate-pulse">
            Generating puzzle...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-dvh">
      <Header
        showBack
        centerText="Practice"
        rightContent={
          <button
            type="button"
            onClick={() => {
              setSelectedLength(null);
              useGameStore.getState().resetGame();
            }}
            className="text-xs text-text-secondary font-body hover:text-text-primary"
          >
            Change
          </button>
        }
      />

      <ChainBoard />

      <GameKeyboard />

      {showResult && score && (
        <ResultModal
          score={score}
          puzzleNumber={puzzleCount}
          startWord={startWord}
          targetWord={targetWord}
          streak={0}
          onClose={() => {
            setShowResult(false);
            startPuzzle(selectedLength);
          }}
          isPractice
        />
      )}
    </div>
  );
}
