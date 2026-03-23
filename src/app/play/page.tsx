/**
 * Play — /play
 *
 * Continuous play mode: loads a random puzzle, plays through,
 * shows result, then loads the next puzzle automatically.
 * Includes pause menu with new game and exit options.
 */

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useGameStore } from "@/lib/stores/gameStore";
import { loadWordList } from "@/lib/game/dictionary";
import { ChainBoard } from "@/components/game/ChainBoard";
import { GameKeyboard } from "@/components/game/GameKeyboard";
import { ResultModal } from "@/components/game/ResultModal";
import { Header } from "@/components/layout/Header";
import { getCurrentStreak } from "@/lib/stores/guestStore";
import { Pause, ArrowRightLeft, HelpCircle } from "lucide-react";
import { hasSeenTutorial, markTutorialSeen } from "@/lib/utils/tutorial";
import type { DailyPuzzle } from "@/types";

export default function PlayPage() {
  const { loadPuzzle, status, score, chain, startWord, targetWord, par } = useGameStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReady, setShowReady] = useState(!hasSeenTutorial("daily-chain"));
  const [showHelp, setShowHelp] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [showPause, setShowPause] = useState(false);
  const [streak, setStreak] = useState(0);
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const puzzlesRef = useRef<DailyPuzzle[]>([]);

  // Load puzzles on mount
  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/data/daily-puzzles.json");
        if (!response.ok) throw new Error("Failed to load puzzles");

        const puzzles: DailyPuzzle[] = await response.json();
        puzzlesRef.current = puzzles;

        await loadWordList(5);

        // Start with a random puzzle
        const startIdx = Math.floor(Math.random() * puzzles.length);
        setPuzzleIndex(startIdx);
        loadPuzzle(puzzles[startIdx]);
        setStreak(getCurrentStreak());
        setLoading(false);
      } catch {
        setError("Failed to load puzzles. Please try again.");
        setLoading(false);
      }
    }

    load();
  }, [loadPuzzle]);

  // Load next puzzle
  const loadNextPuzzle = useCallback(() => {
    const puzzles = puzzlesRef.current;
    if (puzzles.length === 0) return;

    const nextIdx = (puzzleIndex + 1) % puzzles.length;
    setPuzzleIndex(nextIdx);
    loadPuzzle(puzzles[nextIdx]);
    setShowResult(false);
    setGamesPlayed((g) => g + 1);
  }, [puzzleIndex, loadPuzzle]);

  // Load a new random puzzle (from pause menu)
  const loadNewGame = useCallback(() => {
    const puzzles = puzzlesRef.current;
    if (puzzles.length === 0) return;

    const randomIdx = Math.floor(Math.random() * puzzles.length);
    setPuzzleIndex(randomIdx);
    loadPuzzle(puzzles[randomIdx]);
    setShowResult(false);
    setShowPause(false);
    setGamesPlayed((g) => g + 1);
  }, [loadPuzzle]);

  // Show result when game completes
  useEffect(() => {
    if (status === "complete" && score) {
      setTimeout(() => setShowResult(true), 800);
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
      } else if (e.key === "Escape") {
        e.preventDefault();
        setShowPause((p) => !p);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [status]);

  if (loading) {
    return (
      <div className="flex flex-col h-dvh">
        <Header showBack centerText="SHFT" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-text-secondary font-body animate-pulse">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-dvh">
        <Header showBack />
        <div className="flex-1 flex items-center justify-center px-6 text-center">
          <p className="text-text-secondary font-body">{error}</p>
        </div>
      </div>
    );
  }

  // Ready/tutorial screen — rules before starting
  if (showReady || showHelp) {
    return (
      <div className="flex flex-col h-dvh">
        <Header showBack centerText="Daily Chain" />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-6">
          <div className="w-16 h-16 rounded-full bg-accent-gold/20 flex items-center justify-center">
            <ArrowRightLeft size={32} className="text-accent-gold" />
          </div>
          <h1 className="font-display text-3xl text-text-primary">Daily Chain</h1>
          <div className="space-y-2 text-text-secondary font-body text-sm max-w-[300px]">
            <p>Change <span className="text-text-primary font-medium">one letter</span> at a time to transform the start word into the target.</p>
            <p>Every step must be a <span className="text-text-primary font-medium">real English word</span>.</p>
            <p>Reach the target in as few steps as possible.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (showReady) markTutorialSeen("daily-chain");
              setShowReady(false);
              setShowHelp(false);
            }}
            className="px-10 py-3.5 mt-2 bg-accent-gold text-[#1A1A1A] font-body font-bold text-lg rounded-[var(--radius-lg)] hover:opacity-90 transition-opacity"
          >
            START
          </button>
        </div>
      </div>
    );
  }

  const currentSteps = chain.length - 1;

  return (
    <div className="flex flex-col h-dvh overflow-hidden">
      <Header
        showBack
        centerText={`Game ${gamesPlayed + 1}`}
        rightContent={
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowHelp(true)}
              aria-label="How to play"
              className="w-9 h-9 flex items-center justify-center rounded-[var(--radius-md)] bg-bg-elevated text-text-secondary hover:text-text-primary transition-colors"
            >
              <HelpCircle size={18} />
            </button>
            <button
              type="button"
              onClick={() => setShowPause(true)}
              aria-label="Pause"
              className="w-9 h-9 flex items-center justify-center rounded-[var(--radius-md)] bg-bg-elevated text-text-secondary hover:text-text-primary transition-colors"
            >
              <Pause size={18} />
            </button>
          </div>
        }
      />

      {/* Stats bar */}
      <div className="flex justify-center gap-4 px-4 py-1.5 text-xs font-body text-text-secondary shrink-0">
        <span>Steps: <span className="font-game text-text-primary">{currentSteps}</span></span>
        <span>Par: <span className="font-game text-text-primary">{par}</span></span>
      </div>

      <ChainBoard />

      <GameKeyboard />

      {/* Result modal — NEXT PUZZLE button for continuous play */}
      {showResult && score && (
        <ResultModal
          score={score}
          puzzleNumber={gamesPlayed + 1}
          startWord={startWord}
          targetWord={targetWord}
          streak={streak}
          onClose={loadNextPuzzle}
          nextButtonLabel="NEXT PUZZLE"
        />
      )}

      {/* Pause menu */}
      {showPause && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setShowPause(false)}
        >
          <div
            className="bg-bg-surface rounded-[var(--radius-md)] shadow-lg w-[80%] max-w-[300px] p-5 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-xl text-text-primary text-center mb-5">
              Paused
            </h2>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setShowPause(false)}
                className="w-full py-2.5 bg-accent-gold text-[#1A1A1A] font-body font-bold text-sm rounded-[var(--radius-lg)] hover:opacity-90"
              >
                RESUME
              </button>
              <button
                type="button"
                onClick={loadNewGame}
                className="w-full py-2.5 bg-bg-elevated text-text-primary font-body font-medium text-sm rounded-[var(--radius-lg)] hover:bg-border"
              >
                NEW GAME
              </button>
              <a
                href="/"
                className="block w-full py-2.5 bg-bg-elevated text-text-secondary font-body font-medium text-sm rounded-[var(--radius-lg)] hover:bg-border text-center"
              >
                EXIT
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
