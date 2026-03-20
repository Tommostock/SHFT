/**
 * Leaderboard — Placeholder for Phase 2.
 */

import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";

export default function LeaderboardPage() {
  return (
    <div className="flex flex-col min-h-dvh">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <span className="text-4xl mb-4">📊</span>
        <h2 className="font-display text-xl text-text-primary mb-2">
          Leaderboard
        </h2>
        <p className="text-sm text-text-secondary font-body">
          Coming in Phase 2 — sign up to compete!
        </p>
      </main>
      <BottomNav />
    </div>
  );
}
