"use client";

import { LetterTile } from "./LetterTile";

export function LetterBoard({ tiles, highlightIndex, usedIndices }: {
  tiles: (string | null)[];
  highlightIndex?: number;
  usedIndices?: Set<number>;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
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
      <style jsx>{`
        @keyframes tileIn {
          0% { opacity: 0; transform: scale(0.6) rotateX(90deg); }
          50% { opacity: 1; transform: scale(1.15) rotateX(-20deg); }
          100% { opacity: 1; transform: scale(1) rotateX(0deg); }
        }
      `}</style>
    </div>
  );
}
