/**
 * WordDefinition — Button that reveals a short definition of a word.
 * Uses the Free Dictionary API (https://dictionaryapi.dev/).
 */

"use client";

import { useState } from "react";

interface WordDefinitionProps {
  word: string;
}

export function WordDefinition({ word }: WordDefinitionProps) {
  const [definition, setDefinition] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shown, setShown] = useState(false);

  const fetchDefinition = async () => {
    if (definition !== null) {
      // Already fetched — just toggle visibility
      setShown(!shown);
      return;
    }

    setLoading(true);
    setShown(true);
    try {
      const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`
      );
      if (response.ok) {
        const data = await response.json();
        // Get the first short definition
        const firstMeaning = data[0]?.meanings?.[0];
        const firstDef = firstMeaning?.definitions?.[0]?.definition;
        setDefinition(firstDef || "No definition found");
      } else {
        setDefinition("No definition found");
      }
    } catch {
      setDefinition("Couldn't load definition");
    }
    setLoading(false);
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={fetchDefinition}
        aria-label={`Define ${word}`}
        className="
          w-5 h-5 ml-1.5
          flex items-center justify-center
          rounded-full
          text-[10px] font-body font-bold
          bg-bg-elevated text-text-secondary
          hover:text-text-primary hover:bg-border
          transition-colors duration-150
        "
      >
        ?
      </button>
      {shown && (
        <div className="absolute left-8 top-1/2 -translate-y-1/2 z-10 w-48 px-2.5 py-1.5 bg-bg-surface border border-border rounded-[var(--radius-md)] shadow-[var(--shadow)]">
          <p className="text-[10px] text-text-secondary font-body leading-snug">
            {loading ? "Loading..." : definition}
          </p>
        </div>
      )}
    </div>
  );
}
