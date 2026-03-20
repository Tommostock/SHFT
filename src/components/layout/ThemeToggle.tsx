/**
 * ThemeToggle — Light/dark mode toggle.
 * Persists to localStorage and toggles .dark class on <html>.
 */

"use client";

import { useEffect, useState } from "react";
import { getTheme, setTheme } from "@/lib/stores/guestStore";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const currentTheme = getTheme();
    setIsDark(currentTheme === "dark");
  }, []);

  const toggle = () => {
    const newTheme = isDark ? "light" : "dark";
    setIsDark(!isDark);
    setTheme(newTheme);

    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="
        w-9 h-9
        flex items-center justify-center
        rounded-[var(--radius-md)]
        bg-bg-elevated text-text-secondary
        hover:text-text-primary
        transition-colors duration-150
      "
    >
      {isDark ? "☀️" : "🌙"}
    </button>
  );
}
