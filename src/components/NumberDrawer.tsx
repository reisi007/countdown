"use client";

import { NumberTile } from "./NumberTile";

const T = {
  "en-GB": {
    large: "Large",
    small: "Small",
    waiting: "Waiting for host",
    hostPicking: "{host} is picking numbers...",
  },
  "en-US": {
    large: "Large",
    small: "Small",
    waiting: "Waiting for host",
    hostPicking: "{host} is picking numbers...",
  },
  de: {
    large: "Gro\u00df",
    small: "Klein",
    waiting: "Warten auf Host",
    hostPicking: "{host} w\u00e4hlt Zahlen...",
  },
};

type Locale = keyof typeof T;

export function NumberDrawer({
  locale,
  tiles,
  isHost,
  onPickLarge,
  onPickSmall,
  canPickLarge,
  canPickSmall,
  largeRemaining,
  smallRemaining,
  hostName,
}: {
  locale: string;
  tiles: number[];
  isHost: boolean;
  onPickLarge: () => void;
  onPickSmall: () => void;
  canPickLarge: boolean;
  canPickSmall: boolean;
  largeRemaining: number;
  smallRemaining: number;
  hostName?: string;
}) {
  const t = T[locale as Locale] ?? T["en-GB"];

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex flex-wrap justify-center gap-3">
        {tiles.map((v, i) => (
          <NumberTile key={i} value={v} delay={i * 80} />
        ))}
        {Array.from({ length: 6 - tiles.length }).map((_, i) => (
          <NumberTile key={`empty-${i}`} value={0} isEmpty delay={0} />
        ))}
      </div>

      {isHost ? (
        <div className="flex gap-3 sm:gap-4">
          <button
            className="btn btn-warning btn-lg min-w-28 sm:min-w-32"
            onClick={onPickLarge}
            disabled={!canPickLarge}
          >
            {t.large}{" "}
            <span className="badge badge-sm ml-1">{largeRemaining}</span>
          </button>
          <button
            className="btn btn-outline btn-warning btn-lg min-w-28 sm:min-w-32"
            onClick={onPickSmall}
            disabled={!canPickSmall}
          >
            {t.small}{" "}
            <span className="badge badge-sm ml-1">{smallRemaining}</span>
          </button>
        </div>
      ) : (
        <div className="card bg-base-200 w-full max-w-xs">
          <div className="card-body items-center">
            <h2 className="card-title">{t.waiting}</h2>
            <p className="text-base-content/60">
              {t.hostPicking.replace("{host}", hostName || "Host")}
            </p>
            <span className="loading loading-dots loading-md text-warning mt-2" />
          </div>
        </div>
      )}

      <div
        className="flex h-16 w-28 sm:h-20 sm:w-32 items-center justify-center rounded-lg border-2 border-dashed border-warning/30 bg-base-300/30 text-3xl sm:text-4xl font-bold italic select-none text-warning/40"
        aria-label="Target hidden until drawing is complete"
      >
        ???
      </div>
    </div>
  );
}
