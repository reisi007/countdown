"use client";

import { useEffect, useRef } from "react";

export function Timer({ timeRemaining, totalTime = 30, onTimeUp }: {
  timeRemaining: number;
  totalTime?: number;
  onTimeUp?: () => void;
}) {
  const onTimeUpRef = useRef(onTimeUp);
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  useEffect(() => {
    if (timeRemaining <= 0 && onTimeUpRef.current) {
      onTimeUpRef.current();
    }
  }, [timeRemaining]);

  const percentage = Math.max(0, Math.round((timeRemaining / totalTime) * 100));
  const colorClass =
    percentage > 50
      ? "text-success"
      : percentage > 20
        ? "text-warning"
        : "text-error";

  return (
    <div
      className={`radial-progress timer-radial ${colorClass}`}
      style={{
        "--value": percentage,
      } as React.CSSProperties}
      role="progressbar"
      aria-valuenow={percentage}
    >
      <span className="text-xl sm:text-2xl font-bold text-base-content">
        {timeRemaining}
      </span>
    </div>
  );
}
