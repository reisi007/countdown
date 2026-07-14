"use client";

export function Buzzer({ onBuzz, disabled, isBuzzed }: {
  onBuzz: () => void;
  disabled: boolean;
  isBuzzed: boolean;
}) {
  if (isBuzzed) {
    return (
      <button className="btn btn-lg btn-square btn-disabled" disabled>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        Locked
      </button>
    );
  }

  return (
    <button
      className={`btn btn-lg btn-square btn-error ${!disabled ? "animate-pulse" : ""}`}
      onClick={onBuzz}
      disabled={disabled}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
      Buzz
    </button>
  );
}
