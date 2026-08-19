"use client";

import { useEffect, useState } from "react";
import {
  readScores,
  readRoster,
  readRound,
  readBestOf,
  SCORES_EVENT,
} from "@/lib/scoreboard";

export function ScorePanel({
  roomId,
  myPeerId,
}: {
  roomId: string;
  myPeerId?: string | null;
}) {
  const [scores, setScores] = useState<Record<string, number>>({});
  const [roster, setRoster] = useState<Record<string, string>>({});
  const [round, setRound] = useState(0);
  const [bestOf, setBestOf] = useState(5);

  const refresh = () => {
    setScores(readScores(roomId));
    setRoster(readRoster(roomId));
    setRound(readRound(roomId));
    setBestOf(readBestOf(roomId));
  };

  useEffect(() => {
    refresh();
    window.addEventListener(SCORES_EVENT, refresh);
    return () => window.removeEventListener(SCORES_EVENT, refresh);
  }, [roomId]);

  const entries = Object.entries(scores)
    .map(([peerId, points]) => ({
      peerId,
      points,
      nickname: roster[peerId] ?? peerId,
    }))
    .sort((a, b) => b.points - a.points);

  const leader = entries[0];

  return (
    <div className="card bg-base-200 w-full">
      <div className="card-body p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="card-title text-sm">
            Scores
            <span className="badge badge-sm">{entries.length}</span>
          </h2>
          {round > 0 && (
            <span className="badge badge-secondary badge-sm">
              Round {round} / {bestOf}
            </span>
          )}
        </div>
        <div className="divider my-1" />

        {entries.length === 0 ? (
          <p className="text-base-content/40 text-sm text-center py-4">
            No scores yet
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {entries.map((e, i) => (
              <div
                key={e.peerId}
                className={`flex items-center gap-2 p-2 rounded-btn text-sm ${
                  i === 0 && e.points > 0 ? "bg-primary/20" : "bg-base-300"
                }`}
              >
                <span className="font-bold text-primary w-5 text-right">{i + 1}.</span>
                <span className="flex-1 truncate">
                  {e.nickname}
                  {e.peerId === myPeerId ? " (you)" : ""}
                </span>
                <span className="font-mono font-bold tabular-nums text-base-content/70">
                  {e.points}
                </span>
              </div>
            ))}
          </div>
        )}

        {leader && leader.points > 0 && (
          <p className="text-xs text-base-content/50 mt-2 text-center">
            Leading: {leader.nickname} ({leader.points})
          </p>
        )}
      </div>
    </div>
  );
}
