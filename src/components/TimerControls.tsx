"use client";

export function TimerControls({ isRunning, onStart, onPause, onReset }: {
  isRunning: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      {isRunning ? (
        <button className="btn btn-secondary" onClick={onPause}>
          Pause
        </button>
      ) : (
        <button className="btn btn-primary" onClick={onStart}>
          Start
        </button>
      )}
      <button className="btn btn-ghost" onClick={onReset}>
        Reset
      </button>
    </div>
  );
}
