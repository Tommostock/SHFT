/**
 * Marathon Mode — /marathon
 *
 * Chain of chains: the target word of each puzzle becomes the
 * start word of the next. How far can you go?
 *
 * Score = total puzzles chained + total steps.
 * Count-up timer tracks total time.
 * Random difficulty per puzzle.
 */

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useGameStore } from "@/lib/stores/gameStore";
import { loadWordList } from "@/lib/game/dictionary";
import { ChainBoard } from "@/components/game/ChainBoard";
import { GameKeyboard } from "@/components/game/GameKeyboard";
import { Header } from "@/components/layout/Header";
import { ShareButton } from "@/components/game/ShareButton";
import { Timer } from "@/components/game/Timer";
import { initPuzzlePool, getRandomPuzzle, getPuzzleFromStart } from "@/lib/game/puzzlePool";
import { Route, ArrowRight, RotateCcw, HelpCircle } from "lucide-react";
import { hasSeenTutorial, markTutorialSeen } from "@/lib/utils/tutorial";

/** Session stats for the marathon run */
interface MarathonStats {
  chainsCompleted: number;
  totalSteps: number;
  totalPar: number;
}

export default function MarathonPage() {
  const { loadCustomPuzzle, status, score, chain, startWord, targetWord, par } =
    useGameStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReady, setShowReady] = useState(!hasSeenTutorial("marathon"));
  const [showHelp, setShowHelp] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [stats, setStats] = useState<MarathonStats>({
    chainsCompleted: 0,
    totalSteps: 0,
    totalPar: 0,
  });

  // Track the elapsed time ourselves for the result screen
  const timerStartRef = useRef<number>(0);
  const [finalTime, setFinalTime] = useState(0);

  // Initialize puzzle pool and load first puzzle
  useEffect(() => {
    async function init() {
      try {
        await loadWordList(5);
        await initPuzzlePool();

        const puzzle = getRandomPuzzle(4, 8);
        if (!puzzle) {
          setError("Failed to generate puzzle. Please try again.");
          setLoading(false);
          return;
        }

        loadCustomPuzzle(puzzle.startWord, puzzle.targetWord, puzzle.par);
        setLoading(false);
        // Timer starts when user clicks START on the ready screen
      } catch {
        setError("Failed to load game data.");
        setLoading(false);
      }
    }
    init();
  }, [loadCustomPuzzle]);

  // When a puzzle is solved, chain to the next one
  useEffect(() => {
    if (status !== "complete" || !score || gameOver) return;

    // Update stats
    setStats((prev) => ({
      chainsCompleted: prev.chainsCompleted + 1,
      totalSteps: prev.totalSteps + score.steps,
      totalPar: prev.totalPar + score.par,
    }));

    // After brief celebration (800ms), load next puzzle
    // Target word becomes the start word
    const timer = setTimeout(() => {
      const nextPuzzle = getPuzzleFromStart(targetWord, 4, 8);

      if (!nextPuzzle) {
        // Can't generate from this word — marathon ends
        setFinalTime(Date.now() - timerStartRef.current);
        setTimerRunning(false);
        setGameOver(true);
        return;
      }

      loadCustomPuzzle(
        nextPuzzle.startWord,
        nextPuzzle.targetWord,
        nextPuzzle.par
      );
    }, 800);

    return () => clearTimeout(timer);
  }, [status, score, targetWord, loadCustomPuzzle, gameOver]);

  // Handle giving up / ending the run
  const endRun = useCallback(() => {
    setFinalTime(Date.now() - timerStartRef.current);
    setTimerRunning(false);
    setGameOver(true);
  }, []);

  // Start a new marathon
  const playAgain = useCallback(() => {
    const puzzle = getRandomPuzzle(4, 8);
    if (!puzzle) return;

    setStats({ chainsCompleted: 0, totalSteps: 0, totalPar: 0 });
    setGameOver(false);
    setTimerRunning(true);
    timerStartRef.current = Date.now();
    loadCustomPuzzle(puzzle.startWord, puzzle.targetWord, puzzle.par);
  }, [loadCustomPuzzle]);

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (status !== "playing" || gameOver) return;

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
        if (pos !== null && pos < state.wordLength - 1)
          state.selectPosition(pos + 1);
        else if (pos === null) state.selectPosition(0);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [status, gameOver]);

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col h-dvh">
        <Header showBack centerText="Marathon" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-text-secondary font-body animate-pulse">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col h-dvh">
        <Header showBack centerText="Marathon" />
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
        <Header showBack centerText="Marathon" />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-6">
          <div className="w-16 h-16 rounded-full bg-emerald-400/20 flex items-center justify-center">
            <Route size={32} className="text-emerald-400" />
          </div>
          <h1 className="font-display text-3xl text-text-primary">Marathon</h1>
          <div className="space-y-2 text-text-secondary font-body text-sm max-w-[300px]">
            <p>Solve a puzzle, then the <span className="text-text-primary font-medium">target word becomes the start</span> of the next one.</p>
            <p>How many chains can you link together?</p>
            <p>Random difficulty each round. Pause anytime.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (showReady) markTutorialSeen("marathon");
              setShowReady(false);
              setShowHelp(false);
              setTimerRunning(true);
              timerStartRef.current = Date.now();
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

  // Format time for display
  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  // Share text for marathon
  const shareText = `SHFT Marathon\n${stats.chainsCompleted} chains linked\n${stats.totalSteps} total steps\n${formatTime(finalTime)} time\nshft.game`;

  return (
    <div className="flex flex-col h-dvh overflow-hidden">
      <Header
        showBack
        centerText="Marathon"
        rightContent={
          <button
            type="button"
            onClick={() => setShowHelp(true)}
            aria-label="How to play"
            className="w-9 h-9 flex items-center justify-center rounded-[var(--radius-md)] bg-bg-elevated text-text-secondary hover:text-text-primary transition-colors"
          >
            <HelpCircle size={18} />
          </button>
        }
      />

      {/* Stats bar */}
      <div className="flex justify-center gap-4 px-4 py-1.5 text-xs font-body text-text-secondary shrink-0">
        <span className="flex items-center gap-1">
          <Route size={12} />
          <span className="font-game text-text-primary">
            {stats.chainsCompleted}
          </span>
        </span>
        <span>
          Steps:{" "}
          <span className="font-game text-text-primary">{currentSteps}</span>
        </span>
        <span>
          Par:{" "}
          <span className="font-game text-text-primary">{par}</span>
        </span>
        <Timer
          duration={0}
          mode="countup"
          running={timerRunning}
          paused={paused}
          compact
        />
      </div>

      {/* Transition indicator between chains */}
      {status === "complete" && !gameOver && (
        <div className="flex justify-center py-2 animate-slide-up">
          <div className="flex items-center gap-2 px-4 py-1.5 bg-bg-surface border border-accent-gold/30 rounded-[var(--radius-md)]">
            <span className="font-game text-sm text-accent-gold uppercase">
              {targetWord}
            </span>
            <ArrowRight size={14} className="text-accent-gold" />
            <span className="font-game text-sm text-text-secondary">
              next start
            </span>
          </div>
        </div>
      )}

      <ChainBoard />

      {!gameOver && <GameKeyboard />}

      {/* Pause / end run overlay */}
      {!gameOver && (
        <div className="px-4 pb-2 shrink-0">
          <button
            type="button"
            onClick={endRun}
            className="w-full py-2 text-xs text-text-secondary font-body hover:text-text-primary transition-colors"
          >
            End Run
          </button>
        </div>
      )}

      {/* Game Over / Result Screen */}
      {gameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-bg-surface rounded-[var(--radius-md)] shadow-lg w-[90%] max-w-[340px] p-5 animate-slide-up">
            <h2 className="font-display text-2xl text-text-primary text-center mb-1">
              Marathon Complete
            </h2>

            {/* Big chain count */}
            <div className="text-center mb-4">
              <p className="font-game text-5xl text-accent-gold font-bold">
                {stats.chainsCompleted}
              </p>
              <p className="text-sm text-text-secondary font-body">
                chains linked
              </p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-bg-elevated rounded-[var(--radius-md)] p-3 text-center">
                <p className="font-game text-lg text-text-primary">
                  {stats.totalSteps}
                </p>
                <p className="text-[10px] text-text-secondary font-body uppercase">
                  Total Steps
                </p>
              </div>
              <div className="bg-bg-elevated rounded-[var(--radius-md)] p-3 text-center">
                <p className="font-game text-lg text-text-primary">
                  {formatTime(finalTime)}
                </p>
                <p className="text-[10px] text-text-secondary font-body uppercase">
                  Time
                </p>
              </div>
              <div className="bg-bg-elevated rounded-[var(--radius-md)] p-3 text-center">
                <p className="font-game text-lg text-text-primary">
                  {stats.totalPar > 0
                    ? Math.round((stats.totalPar / stats.totalSteps) * 100)
                    : 0}
                  %
                </p>
                <p className="text-[10px] text-text-secondary font-body uppercase">
                  Avg Efficiency
                </p>
              </div>
              <div className="bg-bg-elevated rounded-[var(--radius-md)] p-3 text-center">
                <p className="font-game text-lg text-text-primary">
                  {stats.chainsCompleted > 0
                    ? (stats.totalSteps / stats.chainsCompleted).toFixed(1)
                    : "–"}
                </p>
                <p className="text-[10px] text-text-secondary font-body uppercase">
                  Avg Steps
                </p>
              </div>
            </div>

            {/* Share */}
            <div className="mb-3">
              <ShareButton shareText={shareText} />
            </div>

            {/* Play again */}
            <button
              type="button"
              onClick={playAgain}
              className="w-full py-3 bg-bg-elevated text-text-primary font-body font-bold text-sm rounded-[var(--radius-lg)] hover:bg-border transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw size={16} />
              RUN AGAIN
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
