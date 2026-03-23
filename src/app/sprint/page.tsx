/**
 * Sprint Mode — /sprint
 *
 * 3-minute countdown timer. Solve as many puzzles as possible.
 * Score = number of puzzles solved. No pausing allowed.
 *
 * Flow:
 * 1. "Ready?" screen with rules + START button
 * 2. Timer starts at 3:00, counting down
 * 3. Each completion flashes green briefly, then auto-loads next puzzle
 * 4. Timer hits 0:00 -> game over, show final stats
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
import { Zap, HelpCircle, Pause } from "lucide-react";
import { hasSeenTutorial, markTutorialSeen } from "@/lib/utils/tutorial";

/** How long the sprint lasts (in seconds) */
const SPRINT_DURATION = 180; // 3 minutes

export default function SprintPage() {
  const { loadCustomPuzzle, status, chain, par } = useGameStore();

  // --- Loading state ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Sprint lifecycle: "ready" | "playing" | "finished" ---
  const [phase, setPhase] = useState<"ready" | "playing" | "finished">("ready");
  const [showTutorial, setShowTutorial] = useState(!hasSeenTutorial("sprint"));
  const [showHelp, setShowHelp] = useState(false);
  const [showPause, setShowPause] = useState(false);

  // --- Stats we track across all puzzles ---
  const [puzzlesSolved, setPuzzlesSolved] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [totalPar, setTotalPar] = useState(0);

  // --- Green flash animation on completion ---
  const [flashGreen, setFlashGreen] = useState(false);

  // Ref to track the current puzzle's par (so we can add it to totalPar on solve)
  const currentParRef = useRef(0);

  // Prevent double-handling of a single completion
  const handledCompletionRef = useRef(false);

  // ──────────────────────────────────────
  // 1. Load dictionary + puzzle pool on mount
  // ──────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        await loadWordList(5);
        await initPuzzlePool();
        setLoading(false);
      } catch {
        setError("Failed to load word data. Please try again.");
        setLoading(false);
      }
    }
    load();
  }, []);

  // ──────────────────────────────────────
  // 2. Load a new puzzle from the pool
  // ──────────────────────────────────────
  const loadNextPuzzle = useCallback(() => {
    const puzzle = getRandomPuzzle(4, 6); // short-par puzzles for speed
    if (!puzzle) {
      setError("Could not generate a puzzle. Please reload.");
      return;
    }
    currentParRef.current = puzzle.par;
    handledCompletionRef.current = false;
    loadCustomPuzzle(puzzle.startWord, puzzle.targetWord, puzzle.par);
  }, [loadCustomPuzzle]);

  // ──────────────────────────────────────
  // 3. Start the sprint
  // ──────────────────────────────────────
  const startSprint = useCallback(() => {
    setPuzzlesSolved(0);
    setTotalSteps(0);
    setTotalPar(0);
    setPhase("playing");
    loadNextPuzzle();
  }, [loadNextPuzzle]);

  // Auto-start if tutorial already seen (skip ready screen)
  useEffect(() => {
    if (!loading && !error && phase === "ready" && !showTutorial && !showHelp) {
      startSprint();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, error]);

  // ──────────────────────────────────────
  // 4. When a puzzle is completed, flash green and load the next one
  // ──────────────────────────────────────
  useEffect(() => {
    if (status !== "complete" || phase !== "playing") return;
    if (handledCompletionRef.current) return;
    handledCompletionRef.current = true;

    // Record stats from this puzzle
    const stepsUsed = chain.length - 1;
    setPuzzlesSolved((prev) => prev + 1);
    setTotalSteps((prev) => prev + stepsUsed);
    setTotalPar((prev) => prev + currentParRef.current);

    // Flash green briefly, then load the next puzzle
    setFlashGreen(true);
    setTimeout(() => {
      setFlashGreen(false);
      loadNextPuzzle();
    }, 300);
  }, [status, phase, chain, loadNextPuzzle]);

  // ──────────────────────────────────────
  // 5. When the timer expires, end the sprint
  // ──────────────────────────────────────
  const handleTimerExpire = useCallback(() => {
    setPhase("finished");
  }, []);

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
      } else if (e.key === "Escape") {
        e.preventDefault();
        setShowPause((p) => !p);
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
  // Current puzzle stats (for display)
  // ──────────────────────────────────────
  const currentSteps = chain.length - 1;
  const avgSteps = puzzlesSolved > 0 ? (totalSteps / puzzlesSolved).toFixed(1) : "—";
  const avgEfficiency =
    puzzlesSolved > 0 && totalSteps > 0
      ? Math.round((totalPar / totalSteps) * 100)
      : 0;

  // ──────────────────────────────────────
  // RENDER: Loading
  // ──────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col h-dvh">
        <Header showBack centerText="Sprint" />
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
        <Header showBack centerText="Sprint" />
        <div className="flex-1 flex items-center justify-center px-6 text-center">
          <p className="text-text-secondary font-body">{error}</p>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────
  // RENDER: "Ready?" screen
  // ──────────────────────────────────────
  if ((phase === "ready" && showTutorial) || showHelp) {
    return (
      <div className="flex flex-col h-dvh">
        <Header showBack centerText="Sprint" />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-6">
          {/* Icon */}
          <div className="w-16 h-16 rounded-full bg-accent-gold/20 flex items-center justify-center">
            <Zap size={32} className="text-accent-gold" />
          </div>

          {/* Title */}
          <h1 className="font-display text-3xl text-text-primary">Sprint</h1>

          {/* Rules */}
          <div className="space-y-2 text-text-secondary font-body text-sm max-w-[300px]">
            <p>Solve as many puzzles as you can in 3 minutes.</p>
            <p>Each puzzle is a short word chain (par 4-6).</p>
            <p>No pausing — the clock keeps ticking!</p>
          </div>

          {/* Start button */}
          <button
            type="button"
            onClick={() => {
              if (showTutorial) markTutorialSeen("sprint");
              setShowTutorial(false);
              setShowHelp(false);
              startSprint();
            }}
            className="
              px-10 py-3.5 mt-2
              bg-accent-gold text-[#1A1A1A] font-body font-bold text-lg
              rounded-[var(--radius-lg)]
              hover:opacity-90 transition-opacity
            "
          >
            START
          </button>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────
  // RENDER: Finished — final results
  // ──────────────────────────────────────
  if (phase === "finished") {
    return (
      <div className="flex flex-col h-dvh">
        <Header showBack centerText="Sprint" />
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="bg-bg-surface rounded-[var(--radius-md)] shadow-lg w-[90%] max-w-[360px] p-6 animate-slide-up text-center">
            {/* Icon */}
            <div className="flex justify-center mb-3">
              <Zap size={32} className="text-accent-gold" />
            </div>

            {/* Big number */}
            <h2 className="font-display text-4xl text-text-primary mb-1">
              {puzzlesSolved}
            </h2>
            <p className="font-body text-text-secondary text-sm mb-6">
              puzzle{puzzlesSolved !== 1 ? "s" : ""} solved
            </p>

            {/* Stats */}
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm font-body text-text-secondary">
                <span>Total steps</span>
                <span className="font-game text-text-primary">{totalSteps}</span>
              </div>
              <div className="flex justify-between text-sm font-body text-text-secondary">
                <span>Total par</span>
                <span className="font-game text-text-primary">{totalPar}</span>
              </div>
              <div className="flex justify-between text-sm font-body text-text-secondary">
                <span>Avg steps</span>
                <span className="font-game text-text-primary">{avgSteps}</span>
              </div>
              <div className="flex justify-between text-sm font-body text-text-secondary">
                <span>Avg efficiency</span>
                <span className="font-game text-text-primary">{avgEfficiency}%</span>
              </div>
            </div>

            {/* Play again */}
            <button
              type="button"
              onClick={() => {
                setPhase("ready");
              }}
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
  // RENDER: Playing — active sprint
  // ──────────────────────────────────────
  return (
    <div
      className={`flex flex-col h-dvh overflow-hidden transition-colors duration-300 ${
        flashGreen ? "bg-green-500/10" : ""
      }`}
    >
      <Header
        showBack
        centerText="Sprint"
        rightContent={
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowPause(true)}
              aria-label="Pause"
              className="w-9 h-9 flex items-center justify-center rounded-[var(--radius-md)] bg-bg-elevated text-text-secondary hover:text-text-primary transition-colors"
            >
              <Pause size={18} />
            </button>
            <button
              type="button"
              onClick={() => setShowHelp(true)}
              aria-label="How to play"
              className="w-9 h-9 flex items-center justify-center rounded-[var(--radius-md)] bg-bg-elevated text-text-secondary hover:text-text-primary transition-colors"
            >
              <HelpCircle size={18} />
            </button>
          </div>
        }
      />

      {/* Stats bar: Timer | Solved | Par */}
      <div className="flex justify-center items-center gap-4 px-4 py-1.5 text-xs font-body text-text-secondary shrink-0">
        <Timer
          duration={SPRINT_DURATION}
          mode="countdown"
          running={true}
          paused={showPause}
          onExpire={handleTimerExpire}
          compact
        />
        <span>
          Solved: <span className="font-game text-text-primary">{puzzlesSolved}</span>
        </span>
        <span>
          Par: <span className="font-game text-text-primary">{par}</span>
        </span>
      </div>

      {/* Game board */}
      <ChainBoard />

      {/* Keyboard */}
      <GameKeyboard />

      {/* Pause overlay */}
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
                onClick={() => { setShowPause(false); setPhase("ready"); }}
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
