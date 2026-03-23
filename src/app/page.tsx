/**
 * Home Page — Landing screen with game mode cards.
 * Includes streak escalation and how-to-play tutorial.
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { getTodayUTC, getPuzzleNumber } from "@/lib/utils/dates";
import { getCurrentStreak } from "@/lib/stores/guestStore";
import {
  Flame,
  Zap,
  Clock,
  EyeOff,
  Target,
  ArrowRightLeft,
  CheckCircle,
  BookOpen,
  Trophy,
  Route,
  Construction,
  HelpCircle,
} from "lucide-react";
import { hasSeenTutorial, markTutorialSeen } from "@/lib/utils/tutorial";

/** Get number of flame icons based on streak length */
function getStreakFlames(streak: number): number {
  if (streak >= 100) return 3;
  if (streak >= 30) return 2;
  return 1;
}

/** Game mode card data */
const GAME_MODES = [
  {
    name: "Sprint",
    href: "/sprint",
    icon: Zap,
    description: "3-min rapid fire",
    color: "text-orange-400",
  },
  {
    name: "Blitz",
    href: "/blitz",
    icon: Clock,
    description: "60-sec single puzzle",
    color: "text-blue-400",
  },
  {
    name: "Blind",
    href: "/blind",
    icon: EyeOff,
    description: "Words fade away",
    color: "text-purple-400",
  },
  {
    name: "Par or Bust",
    href: "/par-or-bust",
    icon: Target,
    description: "Stay under par",
    color: "text-red-400",
  },
  {
    name: "Marathon",
    href: "/marathon",
    icon: Route,
    description: "Chain of chains",
    color: "text-emerald-400",
  },
  {
    name: "Bridges",
    href: "/bridges",
    icon: Construction,
    description: "Fill the gaps",
    color: "text-amber-400",
  },
];

export default function HomePage() {
  const [streak, setStreak] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    setStreak(getCurrentStreak());

    // Show tutorial if first visit (using tutorial utility)
    if (!hasSeenTutorial("home")) {
      setShowTutorial(true);
    }
  }, []);

  const today = getTodayUTC();
  const puzzleNumber = getPuzzleNumber(today);

  return (
    <div className="flex flex-col min-h-dvh">
      <Header
        rightContent={
          <button
            type="button"
            onClick={() => setShowTutorial(true)}
            aria-label="How to play"
            className="w-9 h-9 flex items-center justify-center rounded-[var(--radius-md)] bg-bg-elevated text-text-secondary hover:text-text-primary transition-colors"
          >
            <HelpCircle size={18} />
          </button>
        }
      />

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
                <Flame
                  key={i}
                  size={14}
                  className="text-accent-gold fill-accent-gold"
                />
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

        {/* Game Modes */}
        <h3 className="font-display text-base text-text-secondary px-1">
          Game Modes
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {GAME_MODES.map((mode) => (
            <Link
              key={mode.name}
              href={mode.href}
              className="
                p-4
                bg-bg-surface rounded-[var(--radius-md)]
                border border-border
                hover:border-accent-gold
                transition-colors duration-200
              "
            >
              <div className="flex items-center gap-2 mb-1">
                <mode.icon size={16} className={mode.color} />
                <h3 className="font-display text-base text-text-primary">
                  {mode.name}
                </h3>
              </div>
              <p className="text-xs text-text-secondary font-body">
                {mode.description}
              </p>
            </Link>
          ))}
        </div>
      </main>

      <BottomNav />

      {/* How to Play tutorial overlay — shown on first visit */}
      {showTutorial && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => {
            markTutorialSeen("home");
            setShowTutorial(false);
          }}
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
                <p>
                  Change{" "}
                  <span className="text-text-primary font-medium">
                    one letter
                  </span>{" "}
                  at a time to transform the start word into the target word.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-bg-elevated flex items-center justify-center shrink-0 mt-0.5">
                  <BookOpen size={14} className="text-text-primary" />
                </div>
                <p>
                  Every step must be a{" "}
                  <span className="text-text-primary font-medium">
                    real English word
                  </span>
                  .
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-bg-elevated flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle size={14} className="text-accent-green" />
                </div>
                <p>
                  <span className="text-accent-green font-medium">Green</span>{" "}
                  letters are in the correct position.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-bg-elevated flex items-center justify-center shrink-0 mt-0.5">
                  <Trophy size={14} className="text-accent-gold" />
                </div>
                <p>
                  Reach the target in as few steps as possible. Match par for a{" "}
                  <span className="text-accent-gold font-medium">
                    Gold Chain
                  </span>
                  .
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                markTutorialSeen("home");
                setShowTutorial(false);
              }}
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
