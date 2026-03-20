/**
 * ChainBoard — The main game area showing the chain from start to target.
 *
 * Layout (bottom to top):
 *   Start word (anchored at bottom)
 *   Locked rungs (stacking upward with chain connectors)
 *   Active rung (current input)
 *   Gap dots (showing distance to target)
 *   Target word (anchored at top)
 */

"use client";

import { useEffect, useRef } from "react";
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
    selectPosition,
    clearShake,
    clearLockIn,
  } = useGameStore();

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to keep active rung visible
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
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

  const isComplete = status === "complete";
  const lastLockedWord = chain[chain.length - 1];
  const showActiveRung = !isComplete && lastLockedWord !== targetWord;

  return (
    <div className="flex flex-col flex-1 px-4 py-2">
      {/* Target word — always at top */}
      <div className="flex justify-center py-2">
        <ChainRung
          word={targetWord}
          isLocked={false}
          isActive={false}
          isStart={false}
          isTarget={!isComplete}
          selectedPosition={null}
          onSelectPosition={() => {}}
        />
      </div>

      {/* Gap dots — showing distance to fill */}
      {showActiveRung && (
        <div className="flex justify-center py-2">
          <div className="flex flex-col items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-text-secondary opacity-30" />
            <span className="w-1.5 h-1.5 rounded-full bg-text-secondary opacity-30" />
            <span className="w-1.5 h-1.5 rounded-full bg-text-secondary opacity-30" />
          </div>
        </div>
      )}

      {/* Scrollable chain area */}
      <div
        ref={scrollRef}
        className="flex-1 flex flex-col-reverse justify-start gap-0 overflow-y-auto"
      >
        {/* Active rung — current input (shown above locked chain) */}
        {showActiveRung && (
          <div className="flex justify-center py-2">
            <ChainRung
              word={activeWord}
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

        {/* Locked rungs — stacked from bottom (most recent at top) */}
        {[...chain].reverse().map((word, reverseIdx) => {
          const idx = chain.length - 1 - reverseIdx;
          const isStart = idx === 0;
          const prevWord = idx > 0 ? chain[idx - 1] : undefined;
          const isLatestLock = idx === chain.length - 1 && idx > 0;

          return (
            <div key={`${idx}-${word}`}>
              {/* Chain connector between locked rungs */}
              {idx < chain.length - 1 && (
                <div className="flex justify-center py-0.5">
                  <div className="flex flex-col items-center">
                    <span className="text-accent-gold text-xs">⛓️</span>
                  </div>
                </div>
              )}
              <div className="flex justify-center py-1">
                <ChainRung
                  word={word}
                  previousWord={prevWord}
                  isLocked={true}
                  isActive={false}
                  isStart={isStart}
                  isTarget={false}
                  selectedPosition={null}
                  onSelectPosition={() => {}}
                  animate={isLatestLock && lockInAnimation ? "lock-in" : null}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
