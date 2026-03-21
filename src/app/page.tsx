/**
 * Home Page — Landing screen with game mode cards.
 * Includes streak escalation, countdown timer, and how-to-play tutorial.
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { getTodayUTC, getPuzzleNumber } from "@/lib/utils/dates";
import { getCurrentStreak, isTodayCompleted, loadGuestData } from "@/lib/stores/guestStore";
import { Flame, Timer, Swords, Trophy, ArrowRightLeft, CheckCircle, BookOpen } from "lucide-react";

/** Get number of flame icons based on streak length */
function getStreakFlames(streak: number): number {
  if (streak >= 100) return 3;
  if (streak >= 30) return 2;
  return 1;
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
          </div>
          <p className="text-sm text-text-secondary font-body mb-3">
            #{puzzleNumber} · 5 letters
          </p>
          {streak > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-text-secondary font-body mb-3">
              {Array.from({ length: getStreakFlames(streak) }).map((_, i) => (
                <Flame key={i} size={14} className="text-accent-gold fill-accent-gold" />
              ))}
              <span>{streak} day streak</span>
            </div>
          )}
          <div
            className="
              w-full py-2.5
              bg-accent-gold text-[#1A1A1A] font-body font-bold text-sm text-center
              rounded-[var(--radius-lg)]
            "
          >
            PLAY
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
            <div className="flex items-center gap-1.5 text-xs text-text-secondary font-body"><Timer size={12} /> 3-min challenge</div>
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
            <div className="flex items-center gap-1.5 text-xs text-text-secondary font-body"><Swords size={12} /> 1v1 matches</div>
            <p className="text-[10px] text-text-secondary font-body mt-2 uppercase tracking-wide">
              Coming Soon
            </p>
          </div>
        </div>

        {/* Practice card — hidden during playtest */}
      </main>

      <BottomNav />

      {/* How to Play tutorial overlay — shown on first visit */}
      {showTutorial && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setShowTutorial(false)}
        >
          <div
            className="bg-bg-surface rounded-[var(--radius-md)] shadow-lg w-[90%] max-w-[340px] p-5 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-xl text-text-primary text-center mb-5">
              How to Play
            </h2>

            <div className="space-y-5 text-sm text-text-secondary font-body">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-bg-elevated flex items-center justify-center shrink-0 mt-0.5">
                  <ArrowRightLeft size={14} className="text-text-primary" />
                </div>
                <p>Change <span className="text-text-primary font-medium">one letter</span> at a time to transform the start word into the target word.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-bg-elevated flex items-center justify-center shrink-0 mt-0.5">
                  <BookOpen size={14} className="text-text-primary" />
                </div>
                <p>Every step must be a <span className="text-text-primary font-medium">real English word</span>.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-bg-elevated flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle size={14} className="text-accent-green" />
                </div>
                <p><span className="text-accent-green font-medium">Green</span> letters are in the correct position.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-bg-elevated flex items-center justify-center shrink-0 mt-0.5">
                  <Trophy size={14} className="text-accent-gold" />
                </div>
                <p>Reach the target in as few steps as possible. Match par for a <span className="text-accent-gold font-medium">Gold Chain</span>.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowTutorial(false)}
              className="
                w-full mt-5 py-2.5
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
