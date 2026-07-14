"use client";

import Link from "next/link";
import { Timer } from "@/components/Timer";

export type Phase = "waiting" | "playing" | "buzzed" | "answering" | "solved" | "timeout";

export type ConundrumGameProps = {
  locale: string;
  scrambled: string;
  phase: Phase;
  guess: string;
  onGuessChange: (value: string) => void;
  onSubmitGuess: () => void;
  guessError?: string | null;
  timeRemaining: number;
  timerDuration: number;
  onBuzz?: () => void;
  hasBuzzed?: boolean;
  buzzerName?: string;
  isBuzzer?: boolean;
  answerReveal?: string;
  solvedByName?: string;
  feedback?: "correct" | "wrong" | null;
  showBuzzButton?: boolean;
  onNewRound?: () => void;
  showNewRound?: boolean;
  backLink?: string;
};

const T: Record<string, {
  unscramble: string;
  submit: string;
  solve: string;
  timesUp: string;
  answerWas: string;
  solved: string;
  solvedBy: string;
  nobodySolved: string;
  couldNotSolve: string;
  youHaveTheFloor: string;
  waitingForAnswer: string;
  preparing: string;
  loading: string;
  back: string;
  newRound: string;
  typeAnswer: string;
  correct: string;
  wrong: string;
  pressedBuzzer: string;
  isAnswering: string;
}> = {
  "en-GB": {
    unscramble: "Unscramble:",
    submit: "Submit",
    solve: "Solve",
    timesUp: "Time's Up!",
    answerWas: "The answer was",
    solved: "Solved!",
    solvedBy: "Solved by",
    nobodySolved: "Nobody solved the conundrum",
    couldNotSolve: "could not solve it",
    youHaveTheFloor: "You have the floor!",
    waitingForAnswer: "Waiting for answer...",
    preparing: "Preparing Conundrum",
    loading: "Loading conundrum...",
    back: "Back",
    newRound: "New Round",
    typeAnswer: "Type the answer...",
    correct: "Correct!",
    wrong: "Wrong!",
    pressedBuzzer: "pressed the buzzer!",
    isAnswering: "is answering...",
  },
  "en-US": {
    unscramble: "Unscramble:",
    submit: "Submit",
    solve: "Solve",
    timesUp: "Time's Up!",
    answerWas: "The answer was",
    solved: "Solved!",
    solvedBy: "Solved by",
    nobodySolved: "Nobody solved the conundrum",
    couldNotSolve: "could not solve it",
    youHaveTheFloor: "You have the floor!",
    waitingForAnswer: "Waiting for answer...",
    preparing: "Preparing Conundrum",
    loading: "Loading conundrum...",
    back: "Back",
    newRound: "New Round",
    typeAnswer: "Type the answer...",
    correct: "Correct!",
    wrong: "Wrong!",
    pressedBuzzer: "pressed the buzzer!",
    isAnswering: "is answering...",
  },
  de: {
    unscramble: "Anagramm:",
    submit: "Absenden",
    solve: "L\u00f6sen",
    timesUp: "Zeit abgelaufen!",
    answerWas: "Die Antwort war",
    solved: "Gel\u00f6st!",
    solvedBy: "Gel\u00f6st von",
    nobodySolved: "Niemand hat das Conundrum gel\u00f6st",
    couldNotSolve: "konnte es nicht l\u00f6sen",
    youHaveTheFloor: "Du bist dran!",
    waitingForAnswer: "Warte auf Antwort...",
    preparing: "Conundrum wird vorbereitet",
    loading: "Lade Conundrum...",
    back: "Zur\u00fcck",
    newRound: "Neue Runde",
    typeAnswer: "L\u00f6sung eingeben...",
    correct: "Richtig!",
    wrong: "Falsch!",
    pressedBuzzer: "hat den Buzzer gedr\u00fcckt!",
    isAnswering: "antwortet...",
  },
};

export function ConundrumGame({
  locale,
  scrambled,
  phase,
  guess,
  onGuessChange,
  onSubmitGuess,
  guessError,
  timeRemaining,
  timerDuration,
  onBuzz,
  hasBuzzed,
  buzzerName,
  isBuzzer,
  answerReveal,
  solvedByName,
  feedback,
  showBuzzButton,
  onNewRound,
  showNewRound,
  backLink,
}: ConundrumGameProps) {
  const t = T[locale] ?? T["en-GB"];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const filtered = e.target.value
      .toUpperCase()
      .replace(/[^A-Z\u00C4\u00D6\u00DC\u00DF]/g, "");
    onGuessChange(filtered);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {phase === "waiting" && (
        <div className="card bg-base-200 w-full max-w-lg">
          <div className="card-body items-center">
            <h2 className="card-title">{t.preparing}</h2>
            <span className="loading loading-spinner loading-lg text-primary mt-2" />
          </div>
        </div>
      )}

      {(phase === "playing" ||
        phase === "buzzed" ||
        phase === "answering" ||
        phase === "solved" ||
        phase === "timeout") && (
        <>
          <div className="text-center">
            <p className="text-sm text-base-content/60 mb-2">{t.unscramble}</p>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {scrambled.split("").map((letter, i) => (
                <kbd
                  key={i}
                  className="kbd kbd-lg text-lg font-bold border-warning"
                >
                  {letter}
                </kbd>
              ))}
            </div>
          </div>

          <Timer timeRemaining={timeRemaining} totalTime={timerDuration} />

          {phase === "playing" && showBuzzButton && (
            <button
              className="btn btn-warning btn-lg btn-wide"
              onClick={onBuzz}
              disabled={hasBuzzed}
            >
              Buzzer
            </button>
          )}

          {phase === "playing" && !showBuzzButton && (
            <div className="join w-full max-w-md">
              <input
                type="text"
                className="input join-item input-bordered input-lg w-full text-center text-xl uppercase tracking-[0.2em] font-mono"
                value={guess}
                onChange={handleInputChange}
                placeholder={t.typeAnswer}
                maxLength={9}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSubmitGuess();
                }}
              />
              <button
                className="btn join-item btn-accent btn-lg px-6"
                onClick={onSubmitGuess}
              >
                {t.submit}
              </button>
            </div>
          )}

          {phase === "buzzed" && (
            <div className="card bg-base-200 w-full max-w-md">
              <div className="card-body items-center">
                <p className="text-lg font-bold text-warning">
                  {buzzerName} {t.pressedBuzzer}
                </p>
                <p className="text-base-content/60">{t.waitingForAnswer}</p>
                <span className="loading loading-dots loading-md" />
              </div>
            </div>
          )}

          {phase === "answering" && isBuzzer && (
            <div className="card bg-base-200 w-full max-w-md">
              <div className="card-body items-center gap-4">
                <p className="text-warning font-bold">{t.youHaveTheFloor}</p>
                <input
                  type="text"
                  className="input input-bordered input-lg w-full text-center text-xl uppercase tracking-wider"
                  value={guess}
                  onChange={handleInputChange}
                  placeholder={t.typeAnswer}
                  maxLength={9}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSubmitGuess();
                  }}
                />
                {guessError && (
                  <p className="text-error text-sm">{guessError}</p>
                )}
                <button
                  className="btn btn-primary btn-lg w-full"
                  onClick={onSubmitGuess}
                  disabled={!guess.trim()}
                >
                  {t.solve}
                </button>
              </div>
            </div>
          )}

          {phase === "answering" && !isBuzzer && (
            <div className="card bg-base-200 w-full max-w-md">
              <div className="card-body items-center">
                <p className="text-lg font-bold text-warning">
                  {buzzerName} {t.isAnswering}
                </p>
                <span className="loading loading-dots loading-md" />
              </div>
            </div>
          )}

          {phase === "solved" && (
            <div className="card bg-base-200 w-full max-w-lg">
              <div className="card-body items-center text-center">
                {feedback ? (
                  <p
                    className={`text-2xl font-bold ${feedback === "correct" ? "text-success" : "text-error"}`}
                  >
                    {feedback === "correct" ? t.correct : t.wrong}
                  </p>
                ) : (
                  <p className="text-3xl font-bold text-success">{t.solved}</p>
                )}
                <p className="text-2xl font-bold text-primary mt-4 tracking-widest">
                  {answerReveal}
                </p>
                {solvedByName && (
                  <p className="text-base-content/60 mt-2">
                    {t.solvedBy} {solvedByName}
                  </p>
                )}
                <div className="mt-6 flex gap-3">
                  {showNewRound && onNewRound && (
                    <button className="btn btn-accent btn-lg" onClick={onNewRound}>
                      {t.newRound}
                    </button>
                  )}
                  {backLink && (
                    <Link href={backLink} className="btn btn-primary">
                      {t.back}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}

          {phase === "timeout" && (
            <div className="card bg-base-200 w-full max-w-lg">
              <div className="card-body items-center text-center">
                <p className="text-3xl font-bold text-base-content/60">
                  {t.timesUp}
                </p>
                {answerReveal && (
                  <p className="text-2xl font-bold text-primary mt-4 tracking-widest">
                    {answerReveal}
                  </p>
                )}
                <p className="text-base-content/60 mt-2">
                  {buzzerName
                    ? `${buzzerName} ${t.couldNotSolve}`
                    : t.nobodySolved}
                </p>
                <div className="mt-6 flex gap-3">
                  {showNewRound && onNewRound && (
                    <button className="btn btn-accent btn-lg" onClick={onNewRound}>
                      {t.newRound}
                    </button>
                  )}
                  {backLink && (
                    <Link href={backLink} className="btn btn-primary">
                      {t.back}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
