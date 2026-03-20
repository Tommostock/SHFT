/**
 * BottomNav — Mobile bottom tab navigation.
 * Tabs: Home, Leaderboard, Profile
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BarChart3, User } from "lucide-react";

const TABS = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/leaderboard", label: "Leaderboard", Icon: BarChart3 },
  { href: "/profile", label: "Profile", Icon: User },
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
              <tab.Icon size={20} />
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
