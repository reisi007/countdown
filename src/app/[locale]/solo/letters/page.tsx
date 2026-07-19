"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  createLettersGame,
  addVowel,
  addConsonant,
  canFormWord,
  canAddVowel,
  canAddConsonant,
  getUsedTileIndices,
  shuffleTiles,
  type LettersGameState,
  type LetterTile,
} from "@/lib/game/letters";
import { LettersGame } from "@/components/LettersGame";
import { SoloTimerSetup } from "@/components/SoloTimerSetup";

const T = {
  "en-GB": {
    title: "Letters Round",
    back: "Back",
    timer: "Timer",
  },
  "en-US": {
    title: "Letters Round",
    back: "Back",
    timer: "Timer",
  },
  de: {
    title: "Buchstabenrunde",
    back: "Zur\u00fcck",
    timer: "Timer",
  },
};

type Locale = keyof typeof T;

type WordAttempt = {
  word: string;
  valid: boolean;
};

export default function SoloLettersPage() {
  const params = useParams();
  const locale = (params.locale as Locale) ?? "en-GB";
  const t = T[locale] ?? T["en-GB"];

  const [game, setGame] = useState<LettersGameState>(createLettersGame);
  const [displayTiles, setDisplayTiles] = useState<LetterTile[]>([]);
  const [playerWord, setPlayerWord] = useState("");
  const [attempts, setAttempts] = useState<WordAttempt[]>([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [longestWord, setLongestWord] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerDuration, setTimerDuration] = useState(30);

  const finishRound = useCallback(() => {
    const word = playerWord.trim().toUpperCase();
    if (word && canFormWord(game.tiles, word)) {
      setAttempts((prev) => prev.some((a) => a.word === word) ? prev : [...prev, { word, valid: true }]);
    }
    setGame((g) => ({ ...g, phase: "scoring" }));
  }, [playerWord, game.tiles]);

  useEffect(() => {
    if (game.phase !== "playing") return;
    if (!timerEnabled) return;

    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          finishRound();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [game.phase, timerEnabled, finishRound]);

  useEffect(() => {
    queueMicrotask(() => {
      setTimeLeft(30);
      setLongestWord(null);
      setAttempts([]);
    });
  }, [game.tiles]);

  useEffect(() => {
    if (game.phase !== "scoring" || game.tiles.length === 0) return;
    if (longestWord !== null || searching) return;

    queueMicrotask(() => setSearching(true));
    const tileLetters = game.tiles.map((tile) => tile.letter);

    fetch("/api/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale, tiles: tileLetters, action: "longest" }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.word) {
          setLongestWord(data.word);
        } else {
          setLongestWord("");
        }
      })
      .catch(() => {
        setLongestWord("");
      })
      .finally(() => setSearching(false));
  }, [game.phase, game.tiles, locale, longestWord, searching]);

  const handleTileSelection = useCallback((type: "vowel" | "consonant") => {
    setGame((g) => {
      if (g.phase !== "drawing") return g;
      const next = type === "vowel" ? addVowel(g) : addConsonant(g);
      if (next.phase === "playing") setTimeLeft(timerDuration);
      setDisplayTiles(next.tiles);
      return next;
    });
    setPlayerWord("");
    setLongestWord(null);
    setAttempts([]);
  }, [timerDuration]);

  const handleShuffle = useCallback(() => {
    setDisplayTiles((d) => shuffleTiles(d));
  }, []);

  const handleReset = useCallback(() => {
    setDisplayTiles(game.tiles);
  }, [game.tiles]);

  const handleSubmit = useCallback(() => {
    const word = playerWord.trim().toUpperCase();
    if (!word) return;

    const formable = canFormWord(game.tiles, word);
    setAttempts((prev) => [...prev, { word, valid: formable }]);
    setPlayerWord("");
  }, [playerWord, game.tiles]);

  const handleNewRound = useCallback(() => {
    setGame(createLettersGame());
    setDisplayTiles([]);
    setPlayerWord("");
    setTimeLeft(timerDuration);
    setLongestWord(null);
    setAttempts([]);
  }, [timerDuration]);

  return (
    <div className="flex min-h-screen flex-col">
      <div className="navbar bg-base-200/50">
        <div className="flex-1">
          <Link href={`/${locale}/solo`} className="btn btn-ghost btn-sm">{t.back}</Link>
        </div>
        <div className="flex-none">
          <h1 className="text-base sm:text-lg font-bold text-primary">{t.title}</h1>
        </div>
        <div className="flex-1" />
      </div>

      <div className="flex flex-1 flex-col lg:flex-row items-center lg:items-start justify-center gap-4 sm:gap-6 p-4 sm:p-6">
        <div className="w-full max-w-lg rounded-box bg-base-200/60 p-4 sm:p-6 md:p-8 shadow-lg flex flex-col items-center gap-6">
          {game.phase === "drawing" && (
            <SoloTimerSetup
              enabled={timerEnabled}
              duration={timerDuration}
              onToggle={setTimerEnabled}
              onDurationChange={setTimerDuration}
              label={t.timer}
            />
          )}
          <LettersGame
            locale={locale}
            tiles={displayTiles}
            usedIndices={getUsedTileIndices(displayTiles, playerWord)}
            phase={game.phase === "playing" ? "playing" : game.phase}
            drawMode="solo"
            onDrawVowel={() => handleTileSelection("vowel")}
            onDrawConsonant={() => handleTileSelection("consonant")}
            canDrawVowel={canAddVowel(game.tiles)}
            canDrawConsonant={canAddConsonant(game.tiles)}
            tilesDrawn={game.tiles.length}
            playerWord={playerWord}
            onPlayerWordChange={(word) => setPlayerWord(word.toUpperCase().replace(/[^A-Z\u00C4\u00D6\u00DC\u00DF]/g, ""))}
            onSubmitWord={handleSubmit}
            timeRemaining={timeLeft}
            timerDuration={timerDuration}
            showTimer={timerEnabled && game.phase === "playing"}
            attempts={attempts}
            longestWord={longestWord}
            searching={searching}
            onNewRound={handleNewRound}
            onFinishRound={timerEnabled ? undefined : finishRound}
            onShuffle={handleShuffle}
            onReset={handleReset}
            canShuffle={game.tiles.length > 0}
          />
        </div>

        {attempts.length > 0 && (
          <div className="w-full max-w-xs md:max-w-sm">
            <div className="card bg-base-200 sticky top-4">
              <div className="card-body p-4">
                <h2 className="card-title text-sm">Your words <span className="badge badge-sm">{attempts.length}</span></h2>
                <div className="divider my-1" />
                <div className="flex flex-col gap-1 max-h-80 overflow-y-auto">
                  {[...attempts].reverse().map((a, i) => (
                    <div key={i} className={`flex justify-between items-center p-2 rounded-btn text-sm ${a.valid ? "bg-success/10" : "bg-error/10"}`}>
                      <span className="font-mono tracking-wider">{a.word}</span>
                      <span className={`text-xs font-bold ${a.valid ? "text-success" : "text-error"}`}>
                        {a.valid ? `${a.word.length}` : "\u2014"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
