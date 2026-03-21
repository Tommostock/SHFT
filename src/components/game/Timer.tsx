/**
 * Timer — Countdown or count-up timer display
 *
 * Used by Sprint (3-min countdown), Blitz (60s countdown),
 * and Marathon (count-up).
 */

"use client";

import { useEffect, useRef, useState } from "react";

interface TimerProps {
  /** Total duration in seconds (countdown) or ignored (countup) */
  duration: number;
  /** "countdown" counts down to 0, "countup" counts from 0 */
  mode: "countdown" | "countup";
  /** Called when countdown reaches 0 */
  onExpire?: () => void;
  /** Pause the timer */
  paused?: boolean;
  /** Whether the timer is actively running */
  running: boolean;
  /** Optional: compact layout (smaller text) */
  compact?: boolean;
}

export function Timer({
  duration,
  mode,
  onExpire,
  paused = false,
  running,
  compact = false,
}: TimerProps) {
  // Track elapsed time in milliseconds for precision
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number | null>(null);
  const pausedElapsedRef = useRef(0);

  useEffect(() => {
    if (!running || paused) {
      // Save current elapsed when pausing
      if (paused && startRef.current !== null) {
        pausedElapsedRef.current = elapsed;
        startRef.current = null;
      }
      return;
    }

    // Start or resume timing
    const baseElapsed = pausedElapsedRef.current;
    startRef.current = Date.now() - baseElapsed;

    const interval = setInterval(() => {
      const now = Date.now();
      const newElapsed = now - (startRef.current ?? now);
      setElapsed(newElapsed);

      // Check expiry for countdown
      if (mode === "countdown" && newElapsed >= duration * 1000) {
        clearInterval(interval);
        setElapsed(duration * 1000);
        onExpire?.();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [running, paused, duration, mode, onExpire]);

  // Reset when not running
  useEffect(() => {
    if (!running) {
      setElapsed(0);
      pausedElapsedRef.current = 0;
      startRef.current = null;
    }
  }, [running]);

  // Calculate display time
  const remainingMs =
    mode === "countdown"
      ? Math.max(0, duration * 1000 - elapsed)
      : elapsed;

  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const display = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  // Colour: red when countdown < 10s
  const isUrgent = mode === "countdown" && remainingMs < 10000 && running;
  const textColor = isUrgent ? "text-accent-error" : "text-text-primary";

  return (
    <span
      className={`
        font-game font-bold tabular-nums
        ${compact ? "text-lg" : "text-2xl"}
        ${textColor}
        ${isUrgent ? "animate-pulse" : ""}
        transition-colors duration-300
      `}
    >
      {display}
    </span>
  );
}

/**
 * Hook to get elapsed seconds from the timer
 * (useful for score calculations)
 */
export function useTimer() {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = () => {
    startRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      if (startRef.current) {
        setElapsed(Date.now() - startRef.current);
      }
    }, 100);
  };

  const stop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return elapsed;
  };

  const reset = () => {
    stop();
    setElapsed(0);
    startRef.current = null;
  };

  return { elapsed, start, stop, reset };
}
