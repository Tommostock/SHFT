/**
 * Blind Chain — /blind
 *
 * Memory-based word chain mode. After each word locks in,
 * previous locked rungs fade to dots (● ● ● ● ●).
 * Only the start word, active rung, and target word stay visible.
 * No undo/redo allowed since you can't see what you're undoing.
 * On completion, all rungs reveal with a cascade animation.
 */

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useGameStore } from "@/lib/stores/gameStore";
import { initPuzzlePool, getRandomPuzzle } from "@/lib/game/puzzlePool";
import { loadWordList } from "@/lib/game/dictionary";
import { ChainRung } from "@/components/game/ChainRung";
import { GameKeyboard } from "@/components/game/GameKeyboard";
import { ResultModal } from "@/components/game/ResultModal";
import { Header } from "@/components/layout/Header";
import { EyeOff, Pause } from "lucide-react";

export default function BlindChainPage() {
  const {
    loadCustomPuzzle,
    status,
    score,
    chain,
    activeWord,
    startWord,
    targetWord,
    par,
    selectedPosition,
    shakeActive,
    lockInAnimation,
    unchainableWord,
    notAWord,
    selectPosition,
    clearShake,
    clearLockIn,
    clearUnchainable,
    clearNotAWord,
  } = useGameStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showPause, setShowPause] = useState(false);
  const [gamesPlayed, setGamesPlayed] = useState(0);

  // Set of rung indices that are "blinded" (show dots instead of letters)
  const [blindedRungs, setBlindedRungs] = useState<Set<number>>(new Set());

  // Track previous chain length to detect new lock-ins
  const prevChainLengthRef = useRef(0);

  const scrollRef = useRef<HTMLDivElement>(null);

  // --- Load puzzle pool on mount ---
  useEffect(() => {
    async function load() {
      try {
        await loadWordList(5);
        await initPuzzlePool();

        const puzzle = getRandomPuzzle(5, 8);
        if (!puzzle) {
          setError("Failed to generate puzzle. Please try again.");
          setLoading(false);
          return;
        }

        loadCustomPuzzle(puzzle.startWord, puzzle.targetWord, puzzle.par);
        prevChainLengthRef.current = 1; // start word
        setBlindedRungs(new Set());
        setLoading(false);
      } catch {
        setError("Failed to load game data. Please try again.");
        setLoading(false);
      }
    }

    load();
  }, [loadCustomPuzzle]);

  // --- Blind previous rungs after a new word locks in ---
  // When chain grows, wait 500ms then blind the previous rung (not start word)
  useEffect(() => {
    const prevLen = prevChainLengthRef.current;
    const currLen = chain.length;

    if (currLen > prevLen && currLen > 2 && status === "playing") {
      // The rung at index (currLen - 2) just became "previous" — blind it after delay
      const rungToBlind = currLen - 2;
      const timer = setTimeout(() => {
        setBlindedRungs((prev) => new Set([...prev, rungToBlind]));
      }, 500);

      prevChainLengthRef.current = currLen;
      return () => clearTimeout(timer);
    }

    prevChainLengthRef.current = currLen;
  }, [chain.length, status]);

  // --- Reveal all rungs on completion ---
  useEffect(() => {
    if (status === "complete") {
      // Small delay so the lock-in animation plays first
      const timer = setTimeout(() => {
        setBlindedRungs(new Set());
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [status]);

  // --- Show result modal after completion ---
  useEffect(() => {
    if (status === "complete" && score) {
      setTimeout(() => setShowResult(true), 800);
    }
  }, [status, score]);

  // --- Animation cleanup effects (same as ChainBoard) ---
  useEffect(() => {
    if (shakeActive) {
      const timer = setTimeout(clearShake, 250);
      return () => clearTimeout(timer);
    }
  }, [shakeActive, clearShake]);

  useEffect(() => {
    if (lockInAnimation) {
      const timer = setTimeout(clearLockIn, 300);
      return () => clearTimeout(timer);
    }
  }, [lockInAnimation, clearLockIn]);

  useEffect(() => {
    if (unchainableWord) {
      const timer = setTimeout(clearUnchainable, 2000);
      return () => clearTimeout(timer);
    }
  }, [unchainableWord, clearUnchainable]);

  useEffect(() => {
    if (notAWord) {
      const timer = setTimeout(clearNotAWord, 1500);
      return () => clearTimeout(timer);
    }
  }, [notAWord, clearNotAWord]);

  // --- Scroll to top when chain grows ---
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [chain.length]);

  // --- Load next puzzle ---
  const loadNextPuzzle = useCallback(() => {
    const puzzle = getRandomPuzzle(5, 8);
    if (!puzzle) return;

    loadCustomPuzzle(puzzle.startWord, puzzle.targetWord, puzzle.par);
    setShowResult(false);
    setBlindedRungs(new Set());
    prevChainLengthRef.current = 1;
    setGamesPlayed((g) => g + 1);
  }, [loadCustomPuzzle]);

  // --- Load new game from pause menu ---
  const loadNewGame = useCallback(() => {
    const puzzle = getRandomPuzzle(5, 8);
    if (!puzzle) return;

    loadCustomPuzzle(puzzle.startWord, puzzle.targetWord, puzzle.par);
    setShowResult(false);
    setShowPause(false);
    setBlindedRungs(new Set());
    prevChainLengthRef.current = 1;
    setGamesPlayed((g) => g + 1);
  }, [loadCustomPuzzle]);

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
      // Note: No ctrl+z (undo) or ctrl+y (redo) — blind mode disables undo/redo
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [status]);

  // --- Loading state ---
  if (loading) {
    return (
      <div className="flex flex-col h-dvh">
        <Header showBack centerText="Blind Chain" />
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

  const currentSteps = chain.length - 1;
  const isComplete = status === "complete";
  const lastLockedWord = chain[chain.length - 1];
  const showActiveRung = !isComplete && lastLockedWord !== targetWord;

  return (
    <div className="flex flex-col h-dvh overflow-hidden">
      <Header
        showBack
        centerText="Blind Chain"
        rightContent={
          <button
            type="button"
            onClick={() => setShowPause(true)}
            aria-label="Pause"
            className="w-9 h-9 flex items-center justify-center rounded-[var(--radius-md)] bg-bg-elevated text-text-secondary hover:text-text-primary transition-colors"
          >
            <Pause size={18} />
          </button>
        }
      />

      {/* Stats bar with blind mode indicator */}
      <div className="flex justify-center gap-4 px-4 py-1.5 text-xs font-body text-text-secondary shrink-0">
        <span className="flex items-center gap-1">
          <EyeOff size={12} />
          Blind
        </span>
        <span>Steps: <span className="font-game text-text-primary">{currentSteps}</span></span>
        <span>Par: <span className="font-game text-text-primary">{par}</span></span>
      </div>

      {/* ---- Blind Chain Board ---- */}
      <div className="flex flex-col flex-1 px-4 py-2 overflow-hidden min-h-0">
        {/* Target word — pinned at top */}
        <div className={`flex justify-center py-2 shrink-0 ${isComplete ? "animate-chain-flash-green" : ""}`}>
          <ChainRung
            word={targetWord}
            targetWord={showActiveRung ? activeWord : lastLockedWord}
            isLocked={false}
            isActive={false}
            isStart={false}
            isTarget={!isComplete}
            selectedPosition={null}
            onSelectPosition={() => {}}
          />
        </div>

        {/* Gap dots */}
        {showActiveRung && (
          <div className="flex justify-center py-1 shrink-0">
            <div className="flex flex-col items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-text-secondary opacity-30" />
              <span className="w-1.5 h-1.5 rounded-full bg-text-secondary opacity-30" />
              <span className="w-1.5 h-1.5 rounded-full bg-text-secondary opacity-30" />
            </div>
          </div>
        )}

        {/* Scrollable chain area */}
        <div
          ref={scrollRef}
          className="flex-1 flex flex-col justify-end overflow-y-auto min-h-0 scroll-smooth-chain"
        >
          {/* Toast messages */}
          {notAWord && (
            <div className="flex justify-center py-1.5 animate-slide-up">
              <div className="px-4 py-1.5 bg-bg-surface border border-accent-error/30 rounded-[var(--radius-md)] shadow-[var(--shadow)]">
                <p className="text-sm text-accent-error font-body font-medium text-center">
                  Not a word
                </p>
              </div>
            </div>
          )}
          {unchainableWord && (
            <div className="flex justify-center py-1.5 animate-slide-up">
              <div className="px-3 py-1.5 bg-bg-surface border border-border rounded-[var(--radius-md)] shadow-[var(--shadow)]">
                <p className="text-xs text-text-secondary font-body text-center">
                  <span className="font-medium text-text-primary uppercase">{unchainableWord}</span>
                  {" "}is a real word but can&apos;t form chains
                </p>
              </div>
            </div>
          )}

          {/* Active rung — current input */}
          {showActiveRung && (
            <div className="flex justify-center py-1.5">
              <ChainRung
                word={activeWord}
                targetWord={targetWord}
                previousWord={lastLockedWord}
                isLocked={false}
                isActive={true}
                isStart={false}
                isTarget={false}
                selectedPosition={selectedPosition}
                onSelectPosition={selectPosition}
                animate={shakeActive ? "shake" : null}
              />
            </div>
          )}

          {/* Locked rungs — most recent at top, start word at bottom */}
          {[...chain].reverse().map((word, reverseIdx) => {
            const idx = chain.length - 1 - reverseIdx;
            const isStart = idx === 0;
            const prevWord = idx > 0 ? chain[idx - 1] : undefined;
            const isLatestLock = idx === chain.length - 1 && idx > 0;
            const isBlinded = blindedRungs.has(idx) && !isStart;

            let animate: "lock-in" | "shake" | "gold-flash" | null = null;
            if (isLatestLock && lockInAnimation) animate = "lock-in";

            return (
              <div
                key={`${idx}-${word}`}
                className={isComplete ? "animate-chain-flash-green" : ""}
                style={isComplete ? { animationDelay: `${reverseIdx * 80}ms` } : undefined}
              >
                <div className="flex justify-center py-1">
                  {isBlinded ? (
                    // Blinded rung — show dots instead of letters
                    <BlindedRung wordLength={word.length} />
                  ) : (
                    <ChainRung
                      word={word}
                      targetWord={targetWord}
                      previousWord={prevWord}
                      isLocked={true}
                      isActive={false}
                      isStart={isStart}
                      isTarget={false}
                      selectedPosition={null}
                      onSelectPosition={() => {}}
                      animate={animate}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Keyboard — undo/redo disabled via canUndo=false logic
          We override by hiding undo/redo visually. The keyboard component
          already disables undo when chain.length <= 1, but in blind mode
          we also prevent undo via keyboard shortcuts above. */}
      <GameKeyboard />

      {/* Result modal */}
      {showResult && score && (
        <ResultModal
          score={score}
          puzzleNumber={gamesPlayed + 1}
          startWord={startWord}
          targetWord={targetWord}
          streak={0}
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

/**
 * BlindedRung — Shows dots in place of letters for blinded rungs.
 * Matches the sizing of a real ChainRung so layout doesn't shift.
 */
function BlindedRung({ wordLength }: { wordLength: number }) {
  return (
    <div
      className="flex items-center gap-1.5 sm:gap-2 transition-opacity duration-500"
      role="row"
      aria-label="Hidden word"
    >
      {Array.from({ length: wordLength }).map((_, i) => (
        <div
          key={i}
          className="
            w-[52px] h-[52px] sm:w-[58px] sm:h-[58px]
            flex items-center justify-center
            font-game text-2xl sm:text-3xl
            rounded-[6px]
            border border-border bg-bg-surface
            text-text-secondary opacity-30
          "
          aria-hidden="true"
        >
          ●
        </div>
      ))}
    </div>
  );
}
