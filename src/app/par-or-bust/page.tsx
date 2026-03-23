/**
 * Par or Bust — /par-or-bust
 *
 * Streak mode: solve each puzzle at or under par.
 * One failure (steps > par) = game over.
 * Undo IS allowed as a strategic tool.
 * Shows streak count, steps vs par, and color-coded feedback.
 */

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useGameStore } from "@/lib/stores/gameStore";
import { initPuzzlePool, getRandomPuzzle } from "@/lib/game/puzzlePool";
import { loadWordList } from "@/lib/game/dictionary";
import { ChainBoard } from "@/components/game/ChainBoard";
import { GameKeyboard } from "@/components/game/GameKeyboard";
import { ResultModal } from "@/components/game/ResultModal";
import { Header } from "@/components/layout/Header";
import { Target, Pause, HelpCircle } from "lucide-react";
import { hasSeenTutorial, markTutorialSeen } from "@/lib/utils/tutorial";

export default function ParOrBustPage() {
  const { loadCustomPuzzle, status, score, chain, startWord, targetWord, par } =
    useGameStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showPause, setShowPause] = useState(false);

  // --- Par or Bust state ---
  const [phase, setPhase] = useState<"rules" | "playing" | "gameover">("rules");
  const [showTutorial, setShowTutorial] = useState(!hasSeenTutorial("par-or-bust"));
  const [showHelp, setShowHelp] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [totalPar, setTotalPar] = useState(0);
  const [showGreenFlash, setShowGreenFlash] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);

  // Track whether we already handled the current completion
  const handledCompletionRef = useRef(false);

  // --- Load puzzle pool on mount ---
  useEffect(() => {
    async function load() {
      try {
        await loadWordList(5);
        await initPuzzlePool();
        setLoading(false);
      } catch {
        setError("Failed to load game data. Please try again.");
        setLoading(false);
      }
    }

    load();
  }, []);

  // --- Start a new run: load first puzzle ---
  const startRun = useCallback(() => {
    const puzzle = getRandomPuzzle(5, 7);
    if (!puzzle) return;

    loadCustomPuzzle(puzzle.startWord, puzzle.targetWord, puzzle.par);
    setStreak(0);
    setTotalSteps(0);
    setTotalPar(0);
    setShowResult(false);
    setShowGameOver(false);
    setPhase("playing");
    handledCompletionRef.current = false;
  }, [loadCustomPuzzle]);

  // Auto-start if tutorial already seen (skip rules screen)
  useEffect(() => {
    if (!loading && !error && phase === "rules" && !showTutorial && !showHelp) {
      startRun();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, error]);

  // --- Load next puzzle after a successful solve ---
  const loadNextPuzzle = useCallback(() => {
    const puzzle = getRandomPuzzle(5, 7);
    if (!puzzle) return;

    loadCustomPuzzle(puzzle.startWord, puzzle.targetWord, puzzle.par);
    setShowResult(false);
    setShowGreenFlash(false);
    handledCompletionRef.current = false;
  }, [loadCustomPuzzle]);

  // --- Handle completion: check if at/under par or busted ---
  useEffect(() => {
    if (status !== "complete" || !score || handledCompletionRef.current) return;
    handledCompletionRef.current = true;

    const steps = score.steps;
    const puzzlePar = score.par;

    if (steps > puzzlePar) {
      // BUSTED — game over
      const newBest = Math.max(bestStreak, streak);
      setBestStreak(newBest);
      setTotalSteps((t) => t + steps);
      setTotalPar((t) => t + puzzlePar);

      // Show game over after a brief delay
      setTimeout(() => {
        setShowGameOver(true);
        setPhase("gameover");
      }, 600);
    } else {
      // SUCCESS — increment streak, flash green, load next
      setStreak((s) => s + 1);
      setTotalSteps((t) => t + steps);
      setTotalPar((t) => t + puzzlePar);

      // Brief green flash, then load next puzzle
      setShowGreenFlash(true);
      setTimeout(() => {
        loadNextPuzzle();
      }, 1000);
    }
  }, [status, score, streak, bestStreak, loadNextPuzzle]);

  // --- Keyboard shortcuts ---
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

  // --- Loading state ---
  if (loading) {
    return (
      <div className="flex flex-col h-dvh">
        <Header showBack centerText="Par or Bust" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-text-secondary font-body animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  // --- Error state ---
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

  // --- Rules/tutorial screen ---
  if ((phase === "rules" && showTutorial) || showHelp) {
    return (
      <div className="flex flex-col h-dvh">
        <Header showBack centerText="Par or Bust" />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-6">
          <Target size={48} className="text-accent-gold" />
          <h1 className="font-display text-3xl text-text-primary">Par or Bust</h1>
          <div className="max-w-[320px] space-y-3">
            <p className="text-text-secondary font-body text-sm leading-relaxed">
              Solve each puzzle in <span className="text-accent-gold font-bold">par or fewer</span> steps.
            </p>
            <p className="text-text-secondary font-body text-sm leading-relaxed">
              One miss and it&apos;s over. How long can you keep the streak alive?
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (showTutorial) markTutorialSeen("par-or-bust");
              setShowTutorial(false);
              setShowHelp(false);
              startRun();
            }}
            className="mt-4 px-10 py-3 bg-accent-gold text-[#1A1A1A] font-body font-bold text-base rounded-[var(--radius-lg)] hover:opacity-90 transition-opacity"
          >
            START
          </button>
        </div>
      </div>
    );
  }

  const currentSteps = chain.length - 1;

  // Determine steps color based on proximity to par
  const getStepsColor = () => {
    if (currentSteps < par) return "text-accent-green"; // Under par — green
    if (currentSteps === par) return "text-accent-gold"; // At par — gold (one more = bust)
    return "text-accent-error"; // Over par — red (shouldn't happen during play, but safety)
  };

  return (
    <div className="flex flex-col h-dvh overflow-hidden">
      <Header
        showBack
        centerText="Par or Bust"
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

      {/* Stats bar — steps/par with color coding + streak */}
      <div className="flex justify-center gap-4 px-4 py-1.5 text-xs font-body text-text-secondary shrink-0">
        <span>
          Steps:{" "}
          <span className={`font-game ${getStepsColor()} transition-colors`}>
            {currentSteps}/{par}
          </span>
        </span>
        <span className="flex items-center gap-1">
          <Target size={12} className="text-accent-gold" />
          Streak: <span className="font-game text-text-primary">{streak}</span>
        </span>
      </div>

      {/* Green flash overlay when puzzle solved at/under par */}
      {showGreenFlash && (
        <div className="fixed inset-0 z-40 bg-accent-green/15 pointer-events-none animate-fade-out" />
      )}

      <ChainBoard />

      <GameKeyboard />

      {/* Game Over overlay */}
      {showGameOver && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => {}} // Prevent closing by clicking backdrop
        >
          <div
            className="bg-bg-surface rounded-[var(--radius-md)] shadow-lg w-[90%] max-w-[360px] p-6 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Title */}
            <div className="text-center mb-5">
              <h2 className="font-display text-3xl text-accent-error mb-1">GAME OVER</h2>
              <p className="text-text-secondary font-body text-sm">
                You went over par!
              </p>
            </div>

            {/* Last puzzle info */}
            {score && (
              <div className="text-center mb-4 space-y-1">
                <p className="font-game text-sm text-text-secondary uppercase">
                  {startWord.toUpperCase()} → {targetWord.toUpperCase()}
                </p>
                <p className="text-sm text-accent-error font-body font-medium">
                  {score.steps} step{score.steps !== 1 ? "s" : ""} / Par {score.par}
                </p>
              </div>
            )}

            {/* Stats */}
            <div className="bg-bg-elevated rounded-[var(--radius-md)] p-4 mb-5 space-y-2">
              <div className="flex justify-between text-sm font-body">
                <span className="text-text-secondary">Streak</span>
                <span className="text-text-primary font-game">{streak}</span>
              </div>
              <div className="flex justify-between text-sm font-body">
                <span className="text-text-secondary">Best Streak</span>
                <span className="text-text-primary font-game">{Math.max(bestStreak, streak)}</span>
              </div>
              <div className="flex justify-between text-sm font-body">
                <span className="text-text-secondary">Total Steps</span>
                <span className="text-text-primary font-game">{totalSteps}</span>
              </div>
              {totalPar > 0 && (
                <div className="flex justify-between text-sm font-body">
                  <span className="text-text-secondary">Avg Efficiency</span>
                  <span className="text-text-primary font-game">
                    {Math.round((totalPar / totalSteps) * 100)}%
                  </span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  setShowGameOver(false);
                  setPhase("rules");
                }}
                className="w-full py-3 bg-accent-gold text-[#1A1A1A] font-body font-bold text-base rounded-[var(--radius-lg)] hover:opacity-90 transition-opacity"
              >
                PLAY AGAIN
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
                onClick={() => {
                  setShowPause(false);
                  setShowGameOver(false);
                  setPhase("rules");
                }}
                className="w-full py-2.5 bg-bg-elevated text-text-primary font-body font-medium text-sm rounded-[var(--radius-lg)] hover:bg-border"
              >
                NEW RUN
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
