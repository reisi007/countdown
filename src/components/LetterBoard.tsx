"use client";

import { LetterTile } from "./LetterTile";

export function LetterBoard({ tiles, highlightIndex, usedIndices }: {
  tiles: (string | null)[];
  highlightIndex?: number;
  usedIndices?: Set<number>;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
        {tiles.map((letter, index) => (
          <LetterTile
            key={index}
            letter={letter ?? undefined}
            isEmpty={letter === null}
            delay={index * 80}
            isActive={highlightIndex === index}
            isUsed={usedIndices?.has(index)}
          />
        ))}
      </div>
    </div>
  );
}
