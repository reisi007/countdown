"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { checkSolution, type ConundrumState } from "@/lib/game/conundrum";
import { ConundrumGame } from "@/components/ConundrumGame";
import { SoloTimerSetup } from "@/components/SoloTimerSetup";

const T = {
  "en-GB": {
    title: "Conundrum",
    back: "Back",
    loading: "Loading conundrum...",
    timer: "Timer",
    start: "Start",
    setup: "Configure your round",
  },
  "en-US": {
    title: "Conundrum",
    back: "Back",
    loading: "Loading conundrum...",
    timer: "Timer",
    start: "Start",
    setup: "Configure your round",
  },
  de: {
    title: "Conundrum",
    back: "Zur\u00fcck",
    loading: "Lade Conundrum...",
    timer: "Timer",
    start: "Starten",
    setup: "Runde einstellen",
  },
};

type Locale = keyof typeof T;

export default function SoloConundrumPage() {
  const params = useParams();
  const locale = (params.locale as Locale) ?? "en-GB";
  const t = T[locale] ?? T["en-GB"];

  const [state, setState] = useState<ConundrumState | null>(null);
  const [guess, setGuess] = useState("");
  const [timeLeft, setTimeLeft] = useState(30);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerDuration, setTimerDuration] = useState(30);

  const initRound = useCallback(async () => {
    setLoading(true);
    setGuess("");
    setTimeLeft(timerDuration);
    setFeedback(null);

    try {
      const res = await fetch(`/api/conundrum?locale=${locale}`);
      const data = await res.json();
      setState({
        answer: data.answer,
        scrambled: data.scrambled,
        buzzerId: null,
        solution: null,
        phase: "scrambled",
        timeRemaining: data.timeRemaining || 30,
      });
    } catch {
      setState(null);
    } finally {
      setLoading(false);
    }
  }, [locale, timerDuration]);

  useEffect(() => {
    if (!started) return;
    initRound();
  }, [started, initRound]);

  useEffect(() => {
    if (!state || state.phase !== "scrambled") return;
    if (!timerEnabled) return;

    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          setState((s) => s ? { ...s, phase: "timeout" } : null);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [state?.phase, state, timerEnabled]);

  const handleSubmit = useCallback(() => {
    if (!state) return;
    const correct = checkSolution(state, guess);
    setFeedback(correct ? "correct" : "wrong");
    setState((s) => s ? { ...s, phase: "solved", solution: guess } : null);
  }, [state, guess]);

  const handleNewRound = useCallback(() => {
    setStarted(false);
    setState(null);
    setFeedback(null);
    setGuess("");
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <div className="navbar bg-base-200/50">
        <div className="flex-1">
          <Link href={`/${locale}/solo`} className="btn btn-ghost btn-sm">
            {t.back}
          </Link>
        </div>
        <div className="flex-none">
          <h1 className="text-base sm:text-lg font-bold text-accent">{t.title}</h1>
        </div>
        <div className="flex-1" />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 p-4 sm:p-6">
        <div className="w-full max-w-lg rounded-box bg-base-200/60 p-4 sm:p-6 md:p-8 shadow-lg">
          {!started ? (
            <div className="flex flex-col items-center gap-6">
              <h2 className="text-lg font-bold text-accent">{t.setup}</h2>
              <SoloTimerSetup
                enabled={timerEnabled}
                duration={timerDuration}
                onToggle={setTimerEnabled}
                onDurationChange={setTimerDuration}
                label={t.timer}
              />
              <button
                className="btn btn-accent btn-lg w-full"
                onClick={() => setStarted(true)}
              >
                {t.start}
              </button>
            </div>
          ) : !state ? (
            <div className="flex flex-col items-center gap-4">
              <span className="loading loading-spinner loading-lg text-accent" />
              <p className="text-base-content/50">{t.loading}</p>
            </div>
          ) : (
            <ConundrumGame
              locale={locale}
              scrambled={state.scrambled}
              phase={state.phase === "scrambled" ? "playing" : state.phase === "solved" ? "solved" : state.phase === "timeout" ? "timeout" : "waiting"}
              guess={guess}
              onGuessChange={(value) => setGuess(value.toUpperCase().replace(/[^A-Z\u00C4\u00D6\u00DC\u00DF]/g, ""))}
              onSubmitGuess={handleSubmit}
              timeRemaining={timeLeft}
              timerDuration={timerDuration}
              showTimer={timerEnabled}
              showNewRound={state.phase === "solved" || state.phase === "timeout"}
              onNewRound={handleNewRound}
              answerReveal={state.answer}
              feedback={feedback}
              backLink={`/${locale}/solo`}
            />
          )}
        </div>
      </div>
    </div>
  );
}
