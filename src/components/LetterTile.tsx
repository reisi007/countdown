"use client";

export function LetterTile({ letter, delay = 0, isEmpty = false, isActive = false, isUsed = false }: {
  letter?: string;
  delay?: number;
  isEmpty?: boolean;
  isActive?: boolean;
  isUsed?: boolean;
}) {
  if (isEmpty) {
    return (
      <div
        className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-lg border-2 border-dashed border-base-content/10 bg-base-300/20 opacity-30"
        aria-hidden
      />
    );
  }

  return (
    <div
      className={`flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-lg border-2 shadow-md transition-all duration-300 select-none
        ${isUsed
          ? "border-base-content/10 bg-blue-950/20 text-base-content/15 scale-90 opacity-25 grayscale"
          : isActive
            ? "border-warning bg-warning/20 text-warning scale-110 shadow-warning/20"
            : "border-blue-400 bg-blue-950/80 text-blue-50"
        }`}
      style={{
        animation: `tileIn 0.4s ease-out ${delay}ms both`,
        fontFamily: "'Lexend Deca', sans-serif",
      }}
    >
      <span className="text-3xl sm:text-4xl font-bold tracking-wider uppercase">
        {letter}
      </span>
    </div>
  );
}
