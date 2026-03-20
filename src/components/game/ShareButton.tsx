/**
 * ShareButton — Copies share text to clipboard or uses Web Share API.
 */

"use client";

import { useState } from "react";
import { shareResult } from "@/lib/game/sharer";

interface ShareButtonProps {
  shareText: string;
}

export function ShareButton({ shareText }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const success = await shareResult(shareText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className="
        w-full py-3 px-6
        bg-accent-gold text-[#1A1A1A] font-body font-bold text-base
        rounded-[var(--radius-lg)]
        hover:opacity-90 active:scale-[0.98]
        transition-all duration-150
      "
      aria-label="Share result"
    >
      {copied ? "Copied!" : "📤 SHARE"}
    </button>
  );
}
