/**
 * Daily Chain — /play
 *
 * Loads today's puzzle, renders the game board + keyboard,
 * manages the full game flow: load → play → complete → result modal.
 * Saves result to localStorage on completion.
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { useGameStore } from "@/lib/stores/gameStore";
import { loadWordList } from "@/lib/game/dictionary";
import { ChainBoard } from "@/components/game/ChainBoard";
import { GameKeyboard } from "@/components/game/GameKeyboard";
import { ResultModal } from "@/components/game/ResultModal";
import { Header } from "@/components/layout/Header";
import { getTodayUTC, getPuzzleNumber, formatTime } from "@/lib/utils/dates";
import {
  isTodayCompleted,
  getTodayCompletion,
  saveDailyCompletion,
  getCurrentStreak,
} from "@/lib/stores/guestStore";
import type { DailyPuzzle } from "@/types";

export default function PlayPage() {
  const { loadPuzzle, status, score, startTime, puzzle, chain } = useGameStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [streak, setStreak] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  // Load today's puzzle
  useEffect(() => {
    async function load() {
      try {
        const today = getTodayUTC();

        // Check if already completed
        if (isTodayCompleted()) {
          setAlreadyCompleted(true);
          setLoading(false);
          return;
        }

        // Fetch daily puzzles
        const response = await fetch("/data/daily-puzzles.json");
        if (!response.ok) throw new Error("Failed to load puzzles");

        const puzzles: DailyPuzzle[] = await response.json();
        const todayPuzzle = puzzles.find((p) => p.date === today);

        if (!todayPuzzle) {
          setError("No puzzle available for today. Check back later!");
          setLoading(false);
          return;
        }

        // Pre-load the word list for this puzzle's word length
        await loadWordList(todayPuzzle.wordLength);

        // Load the puzzle into the game store
        loadPuzzle(todayPuzzle);
        setStreak(getCurrentStreak());
        setLoading(false);
      } catch (err) {
        setError("Failed to load today's puzzle. Please try again.");
        setLoading(false);
      }
    }

    load();
  }, [loadPuzzle]);

  // Timer
  useEffect(() => {
    if (status !== "playing" || !startTime) return;

    const interval = setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [status, startTime]);

  // Show result when game completes
  useEffect(() => {
    if (status === "complete" && score) {
      // Save to localStorage
      saveDailyCompletion(
        useGameStore.getState().chain,
        score.steps,
        score.par,
        score.efficiency,
        score.chainQuality,
        score.timeMs
      );
      setStreak(getCurrentStreak());

      // Small delay before showing modal
      setTimeout(() => setShowResult(true), 500);
    }
  }, [status, score]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (status !== "playing") return;

      const key = e.key.toLowerCase();
      const state = useGameStore.getState();
      if (key.length === 1 && key >= "a" && key <= "z") {
        e.preventDefault();
        state.inputLetter(key);
      } else if (key === "backspace") {
        e.preventDefault();
        state.selectPosition(null);
      } else if (e.ctrlKey && key === "z") {
        e.preventDefault();
        state.undoStep();
      } else if (e.ctrlKey && key === "y") {
        e.preventDefault();
        state.redoStep();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        const pos = state.selectedPosition;
        if (pos !== null && pos > 0) state.selectPosition(pos - 1);
        else if (pos === null) state.selectPosition(state.wordLength - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        const pos = state.selectedPosition;
        if (pos !== null && pos < state.wordLength - 1) state.selectPosition(pos + 1);
        else if (pos === null) state.selectPosition(0);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [status]);

  const today = getTodayUTC();
  const puzzleNumber = getPuzzleNumber(today);

  // Already completed today
  if (alreadyCompleted) {
    const completion = getTodayCompletion();
    return (
      <div className="flex flex-col min-h-dvh">
        <Header showBack centerText={`#${puzzleNumber}`} />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <h2 className="font-display text-2xl text-text-primary mb-2">
            Already Solved!
          </h2>
          <p className="text-text-secondary font-body text-sm mb-4">
            You&apos;ve already completed today&apos;s puzzle.
          </p>
          {completion && (
            <div className="space-y-1 text-sm text-text-secondary font-body">
              <p>
                {completion.steps} steps · Par {completion.par}
              </p>
              <p>Efficiency: {completion.efficiency}%</p>
              <p className="capitalize">{completion.chainQuality} Chain</p>
            </div>
          )}
          <p className="mt-4 text-sm text-text-secondary font-body">
            Come back tomorrow for a new puzzle!
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-dvh">
        <Header showBack centerText={`#${puzzleNumber}`} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-text-secondary font-body animate-pulse">
            Loading puzzle...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-dvh">
        <Header showBack />
        <div className="flex-1 flex items-center justify-center px-6 text-center">
          <p className="text-text-secondary font-body">{error}</p>
        </div>
      </div>
    );
  }

  const currentSteps = chain.length - 1;
  const puzzlePar = puzzle?.par ?? 0;

  return (
    <div className="flex flex-col h-dvh overflow-hidden">
      <Header
        showBack
        centerText={`#${puzzleNumber}`}
        rightContent={
          startTime ? (
            <span className="font-game text-sm text-text-secondary tabular-nums">
              {formatTime(elapsed)}
            </span>
          ) : (
            <span className="font-game text-sm text-text-secondary">
              ⏱ 0:00
            </span>
          )
        }
      />

      {/* Stats bar — steps taken and par */}
      <div className="flex justify-center gap-4 px-4 py-1.5 text-xs font-body text-text-secondary shrink-0">
        <span>Steps: <span className="font-game text-text-primary">{currentSteps}</span></span>
        <span>Par: <span className="font-game text-text-primary">{puzzlePar}</span></span>
      </div>

      <ChainBoard />

      <GameKeyboard />

      {/* Result modal */}
      {showResult && score && puzzle && (
        <ResultModal
          score={score}
          puzzleNumber={puzzleNumber}
          startWord={puzzle.startWord}
          targetWord={puzzle.targetWord}
          streak={streak}
          onClose={() => setShowResult(false)}
        />
      )}
    </div>
  );
}
