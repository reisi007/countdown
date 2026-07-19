"use client";

import { LetterBoard } from "@/components/LetterBoard";
import { Timer } from "@/components/Timer";
import type { LetterTile } from "@/lib/game/letters";

type Submission = {
  peerId: string;
  word: string;
  length: number;
  nickname: string;
  submittedAt: number;
};

type LettersGameProps = {
  locale: string;
  tiles: LetterTile[];
  usedIndices: Set<number>;
  phase: "drawing" | "playing" | "submitted" | "scoring" | "finished";
  drawMode: "solo" | "host" | "spectator";
  onDrawVowel?: () => void;
  onDrawConsonant?: () => void;
  canDrawVowel: boolean;
  canDrawConsonant: boolean;
  tilesDrawn: number;
  playerWord: string;
  onPlayerWordChange: (word: string) => void;
  onSubmitWord: () => void;
  wordError?: string | null;
  timeRemaining?: number;
  timerDuration?: number;
  showTimer?: boolean;
  submissions?: Submission[];
  winner?: { nickname: string; word: string; length: number } | null;
  longestWord?: string | null;
  searching?: boolean;
  attempts?: Array<{ word: string; valid: boolean }>;
  onNewRound?: () => void;
  onFinishRound?: () => void;
  hostName?: string;
  onShuffle?: () => void;
  onReset?: () => void;
  canShuffle?: boolean;
};

const T: Record<string, Record<string, string>> = {
  "en-GB": {
    vowel: "Vowel",
    consonant: "Consonant",
    lettersDrawn: "Letters drawn",
    typeWord: "Type your word...",
    submit: "Submit",
    finishRound: "Finish round",
    submitted: "Submitted!",
    waiting: "Waiting for time to expire...",
    waitingForHost: "Waiting for host",
    hostPicking: "{hostName} is picking tiles...",
    longest: "Longest possible word",
    searching: "Searching dictionary...",
    noLongest: "Could not find longest word",
    newRound: "New Round",
    winner: "Winner",
    leaderboard: "Leaderboard",
    noWords: "No words submitted",
    valid: "Valid!",
    invalid: "Invalid",
    letters: "letters",
    yourWords: "Your words",
    shuffle: "Shuffle",
    reset: "Reset",
  },
  "en-US": {
    vowel: "Vowel",
    consonant: "Consonant",
    lettersDrawn: "Letters drawn",
    typeWord: "Type your word...",
    submit: "Submit",
    finishRound: "Finish round",
    submitted: "Submitted!",
    waiting: "Waiting for time to expire...",
    waitingForHost: "Waiting for host",
    hostPicking: "{hostName} is picking tiles...",
    longest: "Longest possible word",
    searching: "Searching dictionary...",
    noLongest: "Could not find longest word",
    newRound: "New Round",
    winner: "Winner",
    leaderboard: "Leaderboard",
    noWords: "No words submitted",
    valid: "Valid!",
    invalid: "Invalid",
    letters: "letters",
    yourWords: "Your words",
    shuffle: "Shuffle",
    reset: "Reset",
  },
  de: {
    vowel: "Vokal",
    consonant: "Konsonant",
    lettersDrawn: "Gezogene Buchstaben",
    typeWord: "Dein Wort...",
    submit: "Absenden",
    finishRound: "Runde beenden",
    submitted: "Gesendet!",
    waiting: "Warte auf Zeitablauf...",
    waitingForHost: "Warte auf Host",
    hostPicking: "{hostName} wählt Buchstaben...",
    longest: "Längstes mögliches Wort",
    searching: "Suche im Wörterbuch...",
    noLongest: "Längstes Wort konnte nicht gefunden werden",
    newRound: "Neue Runde",
    winner: "Gewinner",
    leaderboard: "Rangliste",
    noWords: "Keine Wörter eingereicht",
    valid: "Gültig!",
    invalid: "Ungültig",
    letters: "Buchstaben",
    yourWords: "Deine Wörter",
    shuffle: "Mischen",
    reset: "Zurücksetzen",
  },
};

export function LettersGame({
  locale,
  tiles,
  usedIndices,
  phase,
  drawMode,
  onDrawVowel,
  onDrawConsonant,
  canDrawVowel,
  canDrawConsonant,
  tilesDrawn,
  playerWord,
  onPlayerWordChange,
  onSubmitWord,
  wordError,
  timeRemaining = 30,
  timerDuration = 30,
  showTimer = true,
  submissions = [],
  winner,
  longestWord,
  searching = false,
  attempts = [],
  onNewRound,
  onFinishRound,
  hostName,
  onShuffle,
  onReset,
  canShuffle = false,
}: LettersGameProps) {
  const t = T[locale] ?? T["en-GB"];

  const tileLetters: (string | null)[] = Array.from(
    { length: 9 },
    (_, i) => tiles[i]?.letter ?? null,
  );

  const bestAttempt = attempts
    .filter((a) => a.valid)
    .sort((a, b) => b.word.length - a.word.length)[0];

  const sortedSubmissions = [...submissions].sort(
    (a, b) => b.length - a.length || a.submittedAt - b.submittedAt,
  );

  return (
    <div className="flex flex-col items-center gap-6">
      {canShuffle && (
        <div className="join">
          <button
            className="btn btn-secondary btn-sm join-item"
            onClick={onShuffle}
            disabled={!onShuffle}
          >
            {t.shuffle}
          </button>
          <button
            className="btn btn-ghost btn-sm join-item"
            onClick={onReset}
            disabled={!onReset}
          >
            {t.reset}
          </button>
        </div>
      )}
      {phase === "drawing" && (
        <>
          <LetterBoard tiles={tileLetters} usedIndices={usedIndices} />

          {drawMode === "spectator" ? (
            <div className="card bg-base-200 w-full">
              <div className="card-body items-center text-center gap-3">
                <h2 className="card-title">{t.waitingForHost}</h2>
                <p className="text-base-content/60">
                  {t.hostPicking.replace(
                    "{hostName}",
                    hostName || "Host",
                  )}
                </p>
                <span className="loading loading-dots loading-md text-primary" />
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-base-content/50">
                {t.lettersDrawn}: {tilesDrawn}/9
              </p>
              <div className="flex gap-3 sm:gap-4">
                <button
                  className="btn btn-primary btn-lg min-w-32 sm:min-w-36"
                  onClick={onDrawVowel}
                  disabled={!canDrawVowel}
                >
                  {t.vowel}
                </button>
                <button
                  className="btn btn-secondary btn-lg min-w-32 sm:min-w-36"
                  onClick={onDrawConsonant}
                  disabled={!canDrawConsonant}
                >
                  {t.consonant}
                </button>
              </div>
            </>
          )}
        </>
      )}

      {phase === "playing" && (
        <>
          <LetterBoard tiles={tileLetters} usedIndices={usedIndices} />

          {showTimer && (
            <Timer
              timeRemaining={timeRemaining}
              totalTime={timerDuration}
            />
          )}

          <div className="card bg-base-200 w-full max-w-md">
            <div className="card-body items-center gap-3">
              <input
                type="text"
                className="input input-bordered input-lg w-full text-center text-lg sm:text-xl uppercase tracking-[0.2em] sm:tracking-[0.3em] font-mono"
                placeholder={t.typeWord}
                value={playerWord}
                onChange={(e) =>
                  onPlayerWordChange(
                    e.target.value
                      .toUpperCase()
                      .replace(/[^A-Z\u00C4\u00D6\u00DC\u00DF]/g, ""),
                  )
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" && playerWord.trim()) {
                    onSubmitWord();
                  }
                }}
                maxLength={9}
                autoFocus
              />
              {wordError && <p className="text-error text-sm">{wordError}</p>}
              <button
                className="btn btn-primary btn-lg w-full"
                onClick={onSubmitWord}
                disabled={!playerWord.trim()}
              >
                {t.submit}
              </button>
            </div>
          </div>

          {onFinishRound && (
            <button
              className="btn btn-ghost btn-sm text-base-content/50"
              onClick={onFinishRound}
            >
              {t.finishRound}
            </button>
          )}
        </>
      )}

      {phase === "submitted" && (
        <>
          <LetterBoard tiles={tileLetters} usedIndices={new Set()} />

          <div className="card bg-base-200 w-full max-w-md">
            <div className="card-body items-center text-center gap-3">
              <div className="text-success text-lg font-bold">{t.submitted}</div>
              <p className="text-base-content/60">{t.waiting}</p>
              <span className="loading loading-dots loading-md" />
            </div>
          </div>
        </>
      )}

      {(phase === "scoring" || phase === "finished") && (
        <>
          <LetterBoard tiles={tileLetters} usedIndices={new Set()} />

          {attempts.length > 0 && bestAttempt && (
            <div className="text-center">
              <div className="text-success text-xl font-bold">{t.valid}</div>
              <div className="font-mono text-2xl font-bold tracking-[0.2em] text-success mt-1">
                {bestAttempt.word}
              </div>
              <div className="text-sm text-base-content/50">
                {bestAttempt.word.length} {t.letters}
              </div>
            </div>
          )}

          {attempts.length === 0 && submissions.length === 0 && (
            <p className="text-base-content/40">{t.noWords}</p>
          )}

          {searching && (
            <div className="flex items-center gap-2 text-base-content/50">
              <span className="loading loading-spinner loading-sm" />
              <span className="text-sm">{t.searching}</span>
            </div>
          )}

          {!searching && longestWord != null && (
            <div
              className={`flex flex-col items-center gap-1 rounded-box px-6 py-3 ${
                longestWord.length > 0 ? "bg-base-300/50" : ""
              }`}
            >
              <span className="text-xs uppercase tracking-[0.2em] text-base-content/40">
                {t.longest}
              </span>
              {longestWord.length > 0 ? (
                <>
                  <span className="font-mono text-xl font-bold tracking-[0.2em] text-success">
                    {longestWord}
                  </span>
                  <span className="text-sm text-base-content/50">
                    {longestWord.length} {t.letters}
                  </span>
                </>
              ) : (
                <span className="text-sm text-base-content/40">
                  {t.noLongest}
                </span>
              )}
            </div>
          )}

          {winner && (
            <div className="text-center">
              <p className="text-lg font-bold text-warning">
                {t.winner}: {winner.nickname}
              </p>
              <p className="text-2xl font-bold text-primary tracking-wider font-mono">
                {winner.word}
              </p>
              <p className="text-sm text-base-content/60">
                {winner.length} {t.letters}
              </p>
            </div>
          )}

          {sortedSubmissions.length > 0 && (
            <div className="card bg-base-200 w-full max-w-md">
              <div className="card-body p-4">
                <h2 className="card-title text-sm">
                  {t.leaderboard}
                  <span className="badge badge-sm">{sortedSubmissions.length}</span>
                </h2>
                <div className="divider my-1" />
                <div className="flex flex-col gap-1.5">
                  {sortedSubmissions.map((s, i) => (
                    <div
                      key={s.peerId}
                      className={`flex items-center gap-2 p-2 rounded-btn text-sm ${
                        i === 0 && s.length > 0
                          ? "bg-warning/20"
                          : "bg-base-300"
                      }`}
                    >
                      <span className="font-bold text-warning w-5 text-right">
                        {i + 1}.
                      </span>
                      <span className="flex-1 truncate">{s.nickname}</span>
                      <span className="font-mono font-bold tabular-nums text-base-content/70">
                        {s.length > 0 ? s.length : "\u2014"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {attempts.length > 0 && (
            <div className="card bg-base-200 w-full max-w-md">
              <div className="card-body p-4">
                <h2 className="card-title text-sm">
                  {t.yourWords}{" "}
                  <span className="badge badge-sm">{attempts.length}</span>
                </h2>
                <div className="divider my-1" />
                <div className="flex flex-col gap-1 max-h-80 overflow-y-auto">
                  {[...attempts].reverse().map((a, i) => (
                    <div
                      key={i}
                      className={`flex justify-between items-center p-2 rounded-btn text-sm ${
                        a.valid ? "bg-success/10" : "bg-error/10"
                      }`}
                    >
                      <span className="font-mono tracking-wider">
                        {a.word}
                      </span>
                      <span
                        className={`text-xs font-bold ${
                          a.valid ? "text-success" : "text-error"
                        }`}
                      >
                        {a.valid ? `${a.word.length}` : "\u2014"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {onNewRound && (
            <button className="btn btn-primary btn-lg" onClick={onNewRound}>
              {t.newRound}
            </button>
          )}
        </>
      )}
    </div>
  );
}
