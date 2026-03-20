/**
 * Profile — Placeholder for Phase 2.
 * Shows basic guest stats from localStorage.
 */

"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { loadGuestData, getCurrentStreak } from "@/lib/stores/guestStore";
import { User, Flame, Trophy, Link, Star, type LucideIcon } from "lucide-react";

export default function ProfilePage() {
  const [stats, setStats] = useState({
    streak: 0,
    longestStreak: 0,
    totalSolved: 0,
    goldCount: 0,
  });

  useEffect(() => {
    const data = loadGuestData();
    const completions = Object.values(data.completions);

    setStats({
      streak: getCurrentStreak(),
      longestStreak: data.longestStreak,
      totalSolved: completions.length,
      goldCount: completions.filter((c) => c.chainQuality === "gold").length,
    });
  }, []);

  return (
    <div className="flex flex-col min-h-dvh">
      <Header />
      <main className="flex-1 px-4 py-6 space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-bg-elevated flex items-center justify-center">
            <User size={28} className="text-text-secondary" />
          </div>
          <h2 className="font-display text-xl text-text-primary">Guest</h2>
          <p className="text-xs text-text-secondary font-body mt-1">
            Sign up in Phase 2 to save your progress
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Current Streak" value={`${stats.streak}`} Icon={Flame} color="text-accent-gold" />
          <StatCard label="Best Streak" value={`${stats.longestStreak}`} Icon={Trophy} color="text-accent-gold" />
          <StatCard label="Puzzles Solved" value={`${stats.totalSolved}`} Icon={Link} color="text-text-secondary" />
          <StatCard label="Genius Solves" value={`${stats.goldCount}`} Icon={Star} color="text-accent-gold" />
        </div>
      </main>
      <BottomNav />
    </div>
  );
}

function StatCard({
  label,
  value,
  Icon,
  color,
}: {
  label: string;
  value: string;
  Icon: LucideIcon;
  color: string;
}) {
  return (
    <div className="p-4 bg-bg-surface rounded-[var(--radius-md)] border border-border text-center">
      <Icon size={24} className={`mx-auto ${color}`} />
      <p className="font-game text-xl text-text-primary mt-1">{value}</p>
      <p className="text-[10px] text-text-secondary font-body mt-0.5 uppercase tracking-wide">
        {label}
      </p>
    </div>
  );
}
