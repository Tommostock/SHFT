/**
 * Blitz Mode — /blitz
 *
 * Single puzzle. 60-second countdown. Beat the clock.
 *
 * Flow:
 * 1. Puzzle loads, timer shows 1:00 but NOT counting yet
 * 2. Timer starts on FIRST letter input (detected via startTime in store)
 * 3. Solve before time runs out -> win screen with time remaining
 * 4. Time expires -> "Time's Up!" screen showing progress
 * 5. PLAY AGAIN loads a new puzzle
 */

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useGameStore } from "@/lib/stores/gameStore";
import { loadWordList } from "@/lib/game/dictionary";
import { initPuzzlePool, getRandomPuzzle } from "@/lib/game/puzzlePool";
import { ChainBoard } from "@/components/game/ChainBoard";
import { GameKeyboard } from "@/components/game/GameKeyboard";
import { Timer } from "@/components/game/Timer";
import { Header } from "@/components/layout/Header";
import { Clock } from "lucide-react";

/** How long the blitz lasts (in seconds) */
const BLITZ_DURATION = 60; // 1 minute

export default function BlitzPage() {
  const { loadCustomPuzzle, status, chain, par, startTime, score } = useGameStore();

  // --- Loading state ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Blitz lifecycle: "ready" | "playing" | "won" | "lost" ---
  const [phase, setPhase] = useState<"ready" | "playing" | "won" | "lost">("ready");

  // --- Has the player typed their first letter? (starts the timer) ---
  const [timerStarted, setTimerStarted] = useState(false);

  // --- Time remaining when the player won (in seconds) ---
  const [timeRemaining, setTimeRemaining] = useState(0);

  // --- Track the current puzzle's par ---
  const currentParRef = useRef(0);

  // Prevent double-handling of a completion
  const handledCompletionRef = useRef(false);

  // Timer start timestamp for calculating remaining time
  const timerStartTimeRef = useRef<number | null>(null);

  // ──────────────────────────────────────
  // 1. Load dictionary + puzzle pool on mount
  // ──────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        await loadWordList(5);
        await initPuzzlePool();
        loadNewPuzzle();
        setLoading(false);
      } catch {
        setError("Failed to load word data. Please try again.");
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ──────────────────────────────────────
  // 2. Load a new puzzle from the pool
  // ──────────────────────────────────────
  const loadNewPuzzle = useCallback(() => {
    const puzzle = getRandomPuzzle(5, 7); // medium-par puzzles
    if (!puzzle) {
      setError("Could not generate a puzzle. Please reload.");
      return;
    }
    currentParRef.current = puzzle.par;
    handledCompletionRef.current = false;
    loadCustomPuzzle(puzzle.startWord, puzzle.targetWord, puzzle.par);

    // Reset blitz state (don't override "ready" on first load)
    setTimerStarted(false);
    setTimeRemaining(0);
    timerStartTimeRef.current = null;
  }, [loadCustomPuzzle]);

  // ──────────────────────────────────────
  // 3. Watch for the first letter input (starts timer)
  //    The game store sets `startTime` on the first inputLetter call
  // ──────────────────────────────────────
  useEffect(() => {
    if (startTime !== null && !timerStarted && phase === "playing") {
      setTimerStarted(true);
      timerStartTimeRef.current = Date.now();
    }
  }, [startTime, timerStarted, phase]);

  // ──────────────────────────────────────
  // 4. When the puzzle is completed, show win screen
  // ──────────────────────────────────────
  useEffect(() => {
    if (status !== "complete" || phase !== "playing") return;
    if (handledCompletionRef.current) return;
    handledCompletionRef.current = true;

    // Calculate how much time was left
    if (timerStartTimeRef.current !== null) {
      const elapsedMs = Date.now() - timerStartTimeRef.current;
      const remainingSec = Math.max(0, BLITZ_DURATION - Math.floor(elapsedMs / 1000));
      setTimeRemaining(remainingSec);
    }

    setPhase("won");
  }, [status, phase]);

  // ──────────────────────────────────────
  // 5. When the timer expires, show loss screen
  // ──────────────────────────────────────
  const handleTimerExpire = useCallback(() => {
    if (phase !== "playing") return;
    setPhase("lost");
  }, [phase]);

  // ──────────────────────────────────────
  // 6. Keyboard controls (same pattern as play page)
  // ──────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (status !== "playing" || phase !== "playing") return;

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
  }, [status, phase]);

  // ──────────────────────────────────────
  // Stats for display
  // ──────────────────────────────────────
  const currentSteps = chain.length - 1;
  const efficiency =
    currentSteps > 0 ? Math.round((par / currentSteps) * 100) : 0;

  // ──────────────────────────────────────
  // RENDER: Loading
  // ──────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col h-dvh">
        <Header showBack centerText="Blitz" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-text-secondary font-body animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────
  // RENDER: Error
  // ──────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col h-dvh">
        <Header showBack centerText="Blitz" />
        <div className="flex-1 flex items-center justify-center px-6 text-center">
          <p className="text-text-secondary font-body">{error}</p>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────
  // RENDER: Ready screen — rules before starting
  // ──────────────────────────────────────
  if (phase === "ready") {
    return (
      <div className="flex flex-col h-dvh">
        <Header showBack centerText="Blitz" />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-6">
          <div className="w-16 h-16 rounded-full bg-blue-400/20 flex items-center justify-center">
            <Clock size={32} className="text-blue-400" />
          </div>
          <h1 className="font-display text-3xl text-text-primary">Blitz</h1>
          <div className="space-y-2 text-text-secondary font-body text-sm max-w-[300px]">
            <p>Solve one puzzle before the <span className="text-text-primary font-medium">60-second clock</span> runs out.</p>
            <p>The timer starts when you type your <span className="text-text-primary font-medium">first letter</span>.</p>
            <p>Faster solves earn a higher score.</p>
          </div>
          <button
            type="button"
            onClick={() => setPhase("playing")}
            className="px-10 py-3.5 mt-2 bg-accent-gold text-[#1A1A1A] font-body font-bold text-lg rounded-[var(--radius-lg)] hover:opacity-90 transition-opacity"
          >
            START
          </button>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────
  // RENDER: Win screen — puzzle solved before timer expired
  // ──────────────────────────────────────
  if (phase === "won") {
    return (
      <div className="flex flex-col h-dvh">
        <Header showBack centerText="Blitz" />
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="bg-bg-surface rounded-[var(--radius-md)] shadow-lg w-[90%] max-w-[360px] p-6 animate-slide-up text-center">
            {/* Icon */}
            <div className="flex justify-center mb-3">
              <Clock size={32} className="text-accent-gold" />
            </div>

            {/* Title */}
            <h2 className="font-display text-3xl text-text-primary mb-1">
              SOLVED!
            </h2>

            {/* Time remaining as bonus */}
            <p className="font-game text-2xl text-accent-gold mb-4">
              +{timeRemaining}s remaining
            </p>

            {/* Stats */}
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm font-body text-text-secondary">
                <span>Steps</span>
                <span className="font-game text-text-primary">{currentSteps}</span>
              </div>
              <div className="flex justify-between text-sm font-body text-text-secondary">
                <span>Par</span>
                <span className="font-game text-text-primary">{par}</span>
              </div>
              <div className="flex justify-between text-sm font-body text-text-secondary">
                <span>Efficiency</span>
                <span className="font-game text-text-primary">{efficiency}%</span>
              </div>
              {score && (
                <div className="flex justify-between text-sm font-body text-text-secondary">
                  <span>Chain quality</span>
                  <span className={`font-body font-medium capitalize ${
                    score.chainQuality === "gold" ? "text-accent-gold" : "text-text-primary"
                  }`}>
                    {score.chainQuality}
                  </span>
                </div>
              )}
            </div>

            {/* Play again */}
            <button
              type="button"
              onClick={() => { loadNewPuzzle(); setPhase("playing"); }}
              className="
                w-full py-3 px-6
                bg-accent-gold text-[#1A1A1A] font-body font-bold text-base
                rounded-[var(--radius-lg)]
                hover:opacity-90 transition-opacity
              "
            >
              PLAY AGAIN
            </button>

            {/* Exit link */}
            <a
              href="/"
              className="block mt-3 text-sm text-text-secondary font-body hover:text-text-primary transition-colors"
            >
              Back to menu
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────
  // RENDER: Loss screen — timer expired
  // ──────────────────────────────────────
  if (phase === "lost") {
    return (
      <div className="flex flex-col h-dvh">
        <Header showBack centerText="Blitz" />
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="bg-bg-surface rounded-[var(--radius-md)] shadow-lg w-[90%] max-w-[360px] p-6 animate-slide-up text-center">
            {/* Icon */}
            <div className="flex justify-center mb-3">
              <Clock size={32} className="text-accent-error" />
            </div>

            {/* Title */}
            <h2 className="font-display text-3xl text-text-primary mb-1">
              TIME&apos;S UP!
            </h2>

            {/* Progress info */}
            <p className="font-body text-text-secondary text-sm mb-4">
              You got {currentSteps} step{currentSteps !== 1 ? "s" : ""} into
              a par-{par} puzzle
            </p>

            {/* Stats */}
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm font-body text-text-secondary">
                <span>Steps taken</span>
                <span className="font-game text-text-primary">{currentSteps}</span>
              </div>
              <div className="flex justify-between text-sm font-body text-text-secondary">
                <span>Par</span>
                <span className="font-game text-text-primary">{par}</span>
              </div>
              <div className="flex justify-between text-sm font-body text-text-secondary">
                <span>Steps remaining (est.)</span>
                <span className="font-game text-text-primary">
                  {Math.max(0, par - currentSteps)}
                </span>
              </div>
            </div>

            {/* Play again */}
            <button
              type="button"
              onClick={() => { loadNewPuzzle(); setPhase("playing"); }}
              className="
                w-full py-3 px-6
                bg-accent-gold text-[#1A1A1A] font-body font-bold text-base
                rounded-[var(--radius-lg)]
                hover:opacity-90 transition-opacity
              "
            >
              PLAY AGAIN
            </button>

            {/* Exit link */}
            <a
              href="/"
              className="block mt-3 text-sm text-text-secondary font-body hover:text-text-primary transition-colors"
            >
              Back to menu
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────
  // RENDER: Playing — active blitz
  // ──────────────────────────────────────
  return (
    <div className="flex flex-col h-dvh overflow-hidden">
      <Header showBack centerText="Blitz" />

      {/* Stats bar: Timer | Steps | Par */}
      <div className="flex justify-center items-center gap-4 px-4 py-1.5 text-xs font-body text-text-secondary shrink-0">
        <Timer
          duration={BLITZ_DURATION}
          mode="countdown"
          running={timerStarted}
          onExpire={handleTimerExpire}
          compact
        />
        <span>
          Steps: <span className="font-game text-text-primary">{currentSteps}</span>
        </span>
        <span>
          Par: <span className="font-game text-text-primary">{par}</span>
        </span>
      </div>

      {/* Hint: timer not started yet */}
      {!timerStarted && (
        <div className="flex justify-center px-4 pb-1 shrink-0">
          <p className="text-xs text-text-secondary font-body italic">
            Timer starts when you type your first letter
          </p>
        </div>
      )}

      {/* Game board */}
      <ChainBoard />

      {/* Keyboard */}
      <GameKeyboard />
    </div>
  );
}
