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
          <Link href="/" className="font-display text-xl text-text-primary">
            SHFT
          </Link>
        )}
      </div>

      {/* Center: optional text */}
      {centerText && (
        <span className="font-body text-sm text-text-secondary font-medium">
          {centerText}
        </span>
      )}

      {/* Right: theme toggle or custom content */}
      <div className="flex items-center gap-2 min-w-[60px] justify-end">
        {rightContent ?? <ThemeToggle />}
      </div>
    </header>
  );
}
