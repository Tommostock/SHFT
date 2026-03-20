/**
 * BottomNav — Mobile bottom tab navigation.
 * Tabs: Home, Leaderboard, Profile
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/leaderboard", label: "Leaderboard", icon: "📊" },
  { href: "/profile", label: "Profile", icon: "👤" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="border-t border-border bg-bg-surface" aria-label="Main navigation">
      <div className="flex items-center justify-around py-2">
        {TABS.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`
                flex flex-col items-center gap-0.5 px-4 py-1
                transition-colors duration-150
                ${isActive ? "text-accent-gold" : "text-text-secondary hover:text-text-primary"}
              `}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="text-[10px] font-body font-medium">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
