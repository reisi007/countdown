"use client";

export function NumberTile({ value, delay = 0, isEmpty = false, isUsed = false }: {
  value: number;
  delay?: number;
  isEmpty?: boolean;
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

  const isLarge = value >= 25;

  return (
    <div
      className={`flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-lg border-2 shadow-md transition-all duration-300 select-none
        ${isUsed
          ? "border-base-content/10 bg-blue-950/10 text-base-content/10 scale-90 opacity-25 grayscale"
          : isLarge
            ? "border-warning bg-warning/20 text-warning shadow-warning/10"
            : "border-blue-400 bg-blue-950/80 text-blue-50"
        }`}
      style={{
        animation: `tileIn 0.4s ease-out ${delay}ms both`,
        fontFamily: "'Lexend Deca', sans-serif",
      }}
    >
      <span className="text-2xl sm:text-3xl font-bold tabular-nums">
        {value}
      </span>
    </div>
  );
}
