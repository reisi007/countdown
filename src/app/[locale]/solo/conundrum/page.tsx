"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { checkSolution, type ConundrumState } from "@/lib/game/conundrum";
import { ConundrumGame } from "@/components/ConundrumGame";

const T = {
  "en-GB": {
    title: "Conundrum",
    back: "Back",
    loading: "Loading conundrum...",
  },
  "en-US": {
    title: "Conundrum",
    back: "Back",
    loading: "Loading conundrum...",
  },
  de: {
    title: "Conundrum",
    back: "Zur\u00fcck",
    loading: "Lade Conundrum...",
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
  const [loading, setLoading] = useState(true);

  const initRound = useCallback(async () => {
    setLoading(true);
    setGuess("");
    setTimeLeft(30);
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
  }, [locale]);

  useEffect(() => {
    initRound();
  }, [initRound]);

  useEffect(() => {
    if (!state || state.phase !== "scrambled") return;

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
  }, [state?.phase, state]);

  const handleSubmit = useCallback(() => {
    if (!state) return;
    const correct = checkSolution(state, guess);
    setFeedback(correct ? "correct" : "wrong");
    setState((s) => s ? { ...s, phase: "solved", solution: guess } : null);
  }, [state, guess]);

  if (loading || !state) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <span className="loading loading-spinner loading-lg text-accent" />
        <p className="text-base-content/50">{t.loading}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="navbar bg-base-200/50">
        <div className="flex-1">
          <Link href={`/${locale}/solo`} className="btn btn-ghost btn-sm">
            {t.back}
          </Link>
        </div>
        <div className="flex-none">
          <h1 className="text-lg font-bold text-accent">{t.title}</h1>
        </div>
        <div className="flex-1" />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 p-6">
        <div className="w-full max-w-lg rounded-box bg-base-200/60 p-8 shadow-lg">
          <ConundrumGame
            locale={locale}
            scrambled={state.scrambled}
            phase={state.phase === "scrambled" ? "playing" : state.phase === "solved" ? "solved" : state.phase === "timeout" ? "timeout" : "waiting"}
            guess={guess}
            onGuessChange={(value) => setGuess(value.toUpperCase().replace(/[^A-Z\u00C4\u00D6\u00DC\u00DF]/g, ""))}
            onSubmitGuess={handleSubmit}
            timeRemaining={timeLeft}
            timerDuration={30}
            showNewRound={state.phase === "solved" || state.phase === "timeout"}
            onNewRound={initRound}
            answerReveal={state.answer}
            feedback={feedback}
            backLink={`/${locale}/solo`}
          />
        </div>
      </div>
    </div>
  );
}
