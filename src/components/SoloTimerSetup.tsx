"use client";

const PRESETS = [15, 30, 60];

export type SoloTimerSetupProps = {
  enabled: boolean;
  duration: number;
  onToggle: (enabled: boolean) => void;
  onDurationChange: (duration: number) => void;
  label: string;
};

export function SoloTimerSetup({
  enabled,
  duration,
  onToggle,
  onDurationChange,
  label,
}: SoloTimerSetupProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-base-content/70">{label}</span>
        <input
          type="checkbox"
          className="toggle toggle-sm toggle-primary"
          checked={enabled}
          onChange={(e) => onToggle(e.target.checked)}
          aria-label={label}
        />
      </div>
      {enabled && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="text-sm text-base-content/60 tabular-nums">{duration}s</span>
          <input
            type="range"
            min={10}
            max={120}
            step={5}
            value={duration}
            onChange={(e) => onDurationChange(Number(e.target.value))}
            className="range range-primary range-sm flex-1 min-w-24"
            aria-label={`${label} duration`}
          />
          <div className="flex gap-1">
            {PRESETS.map((d) => (
              <button
                key={d}
                className={`btn btn-xs ${duration === d ? "btn-primary" : "btn-ghost"}`}
                onClick={() => onDurationChange(d)}
              >
                {d}s
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
