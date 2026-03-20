/**
 * Home Page — Landing screen with game mode cards.
 * See SPEC.md Section 7.2 for layout.
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { getTodayUTC, getPuzzleNumber, getDayOfWeek } from "@/lib/utils/dates";
import { DAY_WORD_LENGTH } from "@/lib/utils/constants";
import { getCurrentStreak, isTodayCompleted } from "@/lib/stores/guestStore";

export default function HomePage() {
  const [streak, setStreak] = useState(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    setStreak(getCurrentStreak());
    setCompleted(isTodayCompleted());
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
              🔥 {streak} day streak
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
    </div>
  );
}
