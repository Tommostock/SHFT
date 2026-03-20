/**
 * ChainBoard — The main game area showing the chain from start to target.
 *
 * Features:
 *   - Chain grows upward from bottom toward the target
 *   - Green flash on all rungs when puzzle is complete
 *   - Smooth scrolling when chain grows
 *   - Tap a locked rung to highlight which letter changed
 *   - Toast messages for invalid/unchainable words
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { useGameStore } from "@/lib/stores/gameStore";
import { ChainRung } from "./ChainRung";

export function ChainBoard() {
  const {
    chain,
    activeWord,
    targetWord,
    selectedPosition,
    status,
    shakeActive,
    lockInAnimation,
    completeAnimation,
    unchainableWord,
    notAWord,
    selectPosition,
    clearShake,
    clearLockIn,
    clearUnchainable,
    clearNotAWord,
  } = useGameStore();

  const scrollRef = useRef<HTMLDivElement>(null);
  const [tappedRungIdx, setTappedRungIdx] = useState<number | null>(null);

  // Smooth-scroll to top when chain grows
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [chain.length]);

  // Clear shake animation after it plays
  useEffect(() => {
    if (shakeActive) {
      const timer = setTimeout(clearShake, 250);
      return () => clearTimeout(timer);
    }
  }, [shakeActive, clearShake]);

  // Clear lock-in animation after it plays
  useEffect(() => {
    if (lockInAnimation) {
      const timer = setTimeout(clearLockIn, 300);
      return () => clearTimeout(timer);
    }
  }, [lockInAnimation, clearLockIn]);

  // Clear unchainable word message after 2 seconds
  useEffect(() => {
    if (unchainableWord) {
      const timer = setTimeout(clearUnchainable, 2000);
      return () => clearTimeout(timer);
    }
  }, [unchainableWord, clearUnchainable]);

  // Clear "Not a word" message after 1.5 seconds
  useEffect(() => {
    if (notAWord) {
      const timer = setTimeout(clearNotAWord, 1500);
      return () => clearTimeout(timer);
    }
  }, [notAWord, clearNotAWord]);

  // Clear tapped rung highlight after 1.5 seconds
  useEffect(() => {
    if (tappedRungIdx !== null) {
      const timer = setTimeout(() => setTappedRungIdx(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [tappedRungIdx]);

  const isComplete = status === "complete";
  const lastLockedWord = chain[chain.length - 1];
  const showActiveRung = !isComplete && lastLockedWord !== targetWord;

  return (
    <div className="flex flex-col flex-1 px-4 py-2 overflow-hidden">
      {/* Target word — always at top */}
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

      {/* Toast messages */}
      {notAWord && (
        <div className="flex justify-center py-1.5 shrink-0 animate-slide-up">
          <div className="px-4 py-2 bg-bg-surface border border-accent-error/30 rounded-[var(--radius-md)] shadow-[var(--shadow)]">
            <p className="text-sm text-accent-error font-body font-medium text-center">
              Not a word
            </p>
          </div>
        </div>
      )}
      {unchainableWord && (
        <div className="flex justify-center py-1.5 shrink-0 animate-slide-up">
          <div className="px-3 py-1.5 bg-bg-surface border border-border rounded-[var(--radius-md)] shadow-[var(--shadow)]">
            <p className="text-xs text-text-secondary font-body text-center">
              <span className="font-medium text-text-primary uppercase">{unchainableWord}</span>
              {" "}is a real word but can&apos;t form chains
            </p>
          </div>
        </div>
      )}

      {/* Chain connector between target and chain when complete */}
      {isComplete && (
        <div className="flex justify-center py-0.5 shrink-0">
          <span className="text-accent-green text-xs">⛓️</span>
        </div>
      )}

      {/* Gap dots — showing distance to fill (only when playing) */}
      {showActiveRung && (
        <div className="flex justify-center py-1 shrink-0">
          <div className="flex flex-col items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-text-secondary opacity-30" />
            <span className="w-1.5 h-1.5 rounded-full bg-text-secondary opacity-30" />
            <span className="w-1.5 h-1.5 rounded-full bg-text-secondary opacity-30" />
          </div>
        </div>
      )}

      {/* Chain area — grows upward from bottom toward the target */}
      <div
        ref={scrollRef}
        className="flex-1 flex flex-col justify-end overflow-y-auto scroll-smooth-chain"
      >
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

          const showConnector =
            reverseIdx > 0 || (reverseIdx === 0 && showActiveRung && chain.length > 1);

          // Determine animation for this rung
          let animate: "lock-in" | "shake" | "gold-flash" | null = null;
          if (isLatestLock && lockInAnimation) animate = "lock-in";

          // When tapped, highlight the changed letter by showing it as "changed"
          const isTapped = tappedRungIdx === idx;

          return (
            <div key={`${idx}-${word}`}>
              {showConnector && (
                <div className="flex justify-center py-0.5">
                  <span className="text-accent-gold text-xs">⛓️</span>
                </div>
              )}
              <div
                className={`flex justify-center py-0.5 ${isComplete ? "animate-chain-flash-green" : ""}`}
                style={isComplete ? { animationDelay: `${reverseIdx * 80}ms` } : undefined}
                onClick={() => {
                  // Tap a locked rung to highlight which letter changed
                  if (idx > 0 && status !== "idle") {
                    setTappedRungIdx(isTapped ? null : idx);
                  }
                }}
              >
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
                  highlightChanged={isTapped}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
