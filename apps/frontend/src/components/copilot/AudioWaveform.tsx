"use client";

import { cn } from "@/lib/utils";

const BAR_COUNT = 28;
const BAR_MIN_H = 4;
const BAR_MAX_H = 20;

/** Simple deterministic heights from a seed string (e.g. message id). */
function barHeights(seed: string): number[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const out: number[] = [];
  for (let i = 0; i < BAR_COUNT; i++) {
    h = (h * 1664525 + 1013904223) >>> 0;
    out.push(BAR_MIN_H + (h % (BAR_MAX_H - BAR_MIN_H + 1)));
  }
  return out;
}

export function AudioWaveform({
  messageId,
  isPlaying,
  isLoading,
  progress,
  onPlay,
  className,
}: {
  messageId: string;
  isPlaying: boolean;
  isLoading: boolean;
  progress: number;
  onPlay?: () => void;
  className?: string;
}) {
  const heights = barHeights(messageId);

  return (
    <button
      type="button"
      onClick={onPlay}
      disabled={isLoading}
      className={cn(
        "flex items-end justify-center gap-0.5 rounded-lg py-2 px-1 min-h-[32px] w-full max-w-[240px]",
        "hover:opacity-90 transition-opacity disabled:opacity-70",
        className,
      )}
      aria-label={isPlaying ? "Reproduciendo" : "Reproducir"}
    >
      {heights.map((h, i) => {
        const filled = (i / BAR_COUNT) <= progress;
        return (
          <span
            key={i}
            className={cn(
              "w-1 rounded-full bg-current transition-all duration-75",
              isPlaying && filled && "opacity-100",
              isPlaying && !filled && "opacity-40",
              isLoading && "animate-pulse",
            )}
            style={{ height: isLoading ? 12 : h }}
          />
        );
      })}
    </button>
  );
}
