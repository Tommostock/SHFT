/**
 * Home Page — Landing screen with game mode cards.
 * Includes streak escalation, countdown timer, and how-to-play tutorial.
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { getTodayUTC, getPuzzleNumber, getDayOfWeek } from "@/lib/utils/dates";
import { DAY_WORD_LENGTH } from "@/lib/utils/constants";
import { getCurrentStreak, isTodayCompleted, loadGuestData } from "@/lib/stores/guestStore";

/** Get streak fire emoji based on streak length */
function getStreakEmoji(streak: number): string {
  if (streak >= 100) return "🔥🔥🔥";
  if (streak >= 30) return "🔥🔥";
  return "🔥";
}

/** Get time remaining until next UTC midnight */
function getCountdown(): string {
  const now = new Date();
  const tomorrow = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1
  ));
  const diffMs = tomorrow.getTime() - now.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

export default function HomePage() {
  const [streak, setStreak] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [countdown, setCountdown] = useState("");
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    setStreak(getCurrentStreak());
    setCompleted(isTodayCompleted());
    setCountdown(getCountdown());

    // Show tutorial if first visit ever (no completions)
    const data = loadGuestData();
    if (Object.keys(data.completions).length === 0 && !data.lastPlayedDate) {
      setShowTutorial(true);
    }

    // Update countdown every minute
    const interval = setInterval(() => setCountdown(getCountdown()), 60000);
    return () => clearInterval(interval);
  }, []);

  const today = getTodayUTC();
  const puzzleNumber = getPuzzleNumber(today);
  const dayOfWeek = getDayOfWeek(today);
  const wordLength = DAY_WORD_LENGTH[dayOfWeek] ?? 4;

  return (
    <div className="flex flex-col min-h-dvh">
      <Header />

      <main className="flex-1 px-4 py-6 space-y-4">
        {/* Daily Chain — Primary CTA */}
        <Link
          href="/play"
          className="
            block p-5
            bg-bg-surface rounded-[var(--radius-md)]
            border border-border
            shadow-[var(--shadow)]
            hover:border-accent-gold
            transition-colors duration-200
          "
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-display text-xl text-text-primary">
              Daily Chain
            </h2>
            {completed && (
              <span className="text-xs font-body text-accent-gold font-medium px-2 py-0.5 bg-accent-gold/10 rounded-full">
                Solved
              </span>
            )}
          </div>
          <p className="text-sm text-text-secondary font-body mb-3">
            #{puzzleNumber} · {wordLength} letters
          </p>
          {streak > 0 && (
            <p className="text-sm text-text-secondary font-body mb-3">
              {getStreakEmoji(streak)} {streak} day streak
            </p>
          )}
          {completed && (
            <p className="text-xs text-text-secondary font-body mb-3">
              Next puzzle in {countdown}
            </p>
          )}
          <div
            className="
              w-full py-2.5
              bg-accent-gold text-[#1A1A1A] font-body font-bold text-sm text-center
              rounded-[var(--radius-lg)]
            "
          >
            {completed ? "VIEW RESULT" : "PLAY"}
          </div>
        </Link>

        {/* Secondary mode cards — Sprint & Versus */}
        <div className="grid grid-cols-2 gap-3">
          <div
            className="
              p-4
              bg-bg-surface rounded-[var(--radius-md)]
              border border-border
              opacity-50
            "
          >
            <h3 className="font-display text-base text-text-primary mb-1">
              Sprint
            </h3>
            <p className="text-xs text-text-secondary font-body">🏆 3-min challenge</p>
            <p className="text-[10px] text-text-secondary font-body mt-2 uppercase tracking-wide">
              Coming Soon
            </p>
          </div>
          <div
            className="
              p-4
              bg-bg-surface rounded-[var(--radius-md)]
              border border-border
              opacity-50
            "
          >
            <h3 className="font-display text-base text-text-primary mb-1">
              Versus
            </h3>
            <p className="text-xs text-text-secondary font-body">⚔️ 1v1 matches</p>
            <p className="text-[10px] text-text-secondary font-body mt-2 uppercase tracking-wide">
              Coming Soon
            </p>
          </div>
        </div>

        {/* Practice card */}
        <Link
          href="/practice"
          className="
            block p-4
            bg-bg-surface rounded-[var(--radius-md)]
            border border-border
            hover:border-accent-gold
            transition-colors duration-200
          "
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-base text-text-primary">
                Practice
              </h3>
              <p className="text-xs text-text-secondary font-body">
                No pressure. Unlimited puzzles.
              </p>
            </div>
            <span className="text-text-secondary text-lg">›</span>
          </div>
        </Link>
      </main>

      <BottomNav />

      {/* How to Play tutorial overlay — shown on first visit */}
      {showTutorial && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setShowTutorial(false)}
        >
          <div
            className="bg-bg-surface rounded-[var(--radius-md)] shadow-lg w-[90%] max-w-[360px] p-6 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-xl text-text-primary text-center mb-4">
              How to Play
            </h2>

            <div className="space-y-4 text-sm text-text-secondary font-body">
              <div className="flex gap-3">
                <span className="text-lg shrink-0">1️⃣</span>
                <p>Change <span className="text-text-primary font-medium">one letter</span> at a time to transform the start word into the target word.</p>
              </div>
              <div className="flex gap-3">
                <span className="text-lg shrink-0">2️⃣</span>
                <p>Every step must be a <span className="text-text-primary font-medium">real English word</span>.</p>
              </div>
              <div className="flex gap-3">
                <span className="text-lg shrink-0">3️⃣</span>
                <p>Try to reach the target in as <span className="text-text-primary font-medium">few steps as possible</span>. Par is the shortest path.</p>
              </div>
              <div className="flex gap-3">
                <span className="text-lg shrink-0">🟩</span>
                <p><span className="text-accent-green font-medium">Green</span> letters are in the correct position.</p>
              </div>
              <div className="flex gap-3">
                <span className="text-lg shrink-0">🏆</span>
                <p>Match or beat par for a <span className="text-accent-gold font-medium">Gold Chain</span>!</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowTutorial(false)}
              className="
                w-full mt-6 py-2.5
                bg-accent-gold text-[#1A1A1A] font-body font-bold text-sm
                rounded-[var(--radius-lg)]
                hover:opacity-90
              "
            >
              GOT IT
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
