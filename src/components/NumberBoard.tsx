"use client";

import { NumberTile } from "./NumberTile";

export function NumberBoard({ tiles, target, hideTarget = false, usedIndices }: {
  tiles: number[];
  target?: number;
  hideTarget?: boolean;
  usedIndices?: Set<number>;
}) {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        {tiles.map((value, index) => (
          <NumberTile
            key={index}
            value={value}
            delay={index * 80}
            isUsed={usedIndices?.has(index)}
          />
        ))}
        {tiles.length < 6 &&
          Array.from({ length: 6 - tiles.length }).map((_, i) => (
            <NumberTile key={`empty-${i}`} value={0} isEmpty delay={0} />
          ))}
      </div>

          {target !== undefined && (
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-base-content/40">
            Target
          </span>
          {hideTarget ? (
            <div
              className="flex h-20 w-32 items-center justify-center rounded-lg border-2 border-dashed border-warning/30 bg-base-300/30 text-4xl font-bold italic select-none text-warning/40"
              aria-label="Target is hidden until all numbers are drawn"
            >
              ???
            </div>
          ) : (
            <div
              className="flex h-20 w-32 items-center justify-center rounded-lg border-2 border-warning bg-warning/10 text-4xl font-bold tabular-nums text-warning shadow-lg shadow-warning/10"
              style={{ animation: "tileIn 0.5s ease-out 0.3s both" }}
            >
              {target}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
