/**
 * Header — Top bar with SHFT logo and theme toggle.
 */

"use client";

import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

interface HeaderProps {
  /** Show back arrow instead of logo */
  showBack?: boolean;
  /** Title text to show in center (e.g., puzzle number) */
  centerText?: string;
  /** Right side content override */
  rightContent?: React.ReactNode;
}

export function Header({ showBack, centerText, rightContent }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-border">
      {/* Left: Logo or back button */}
      <div className="flex items-center gap-2 min-w-[60px]">
        {showBack ? (
          <Link
            href="/"
            className="text-text-secondary hover:text-text-primary transition-colors text-lg"
            aria-label="Go back"
          >
            ← Back
          </Link>
        ) : (
          <Link href="/" className="flex items-baseline gap-1.5">
            <span className="font-display text-xl text-text-primary">SHFT</span>
            <span className="font-display text-[10px] text-text-primary">Made by</span>
            <span
              className="text-[10px] tracking-wide"
              style={{ fontFamily: '"True Lies", sans-serif', color: "#D22223" }}
            >
              Spektator Games
            </span>
          </Link>
        )}
      </div>

      {/* Center: optional text */}
      {centerText && (
        <span className="font-body text-sm text-text-secondary font-medium">
          {centerText}
        </span>
      )}

      {/* Right: optional content + theme toggle */}
      <div className="flex items-center gap-1.5 min-w-[60px] justify-end">
        {rightContent}
        <ThemeToggle />
      </div>
    </header>
  );
}
