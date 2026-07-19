"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  createNumbersGame,
  addLargeNumber,
  addSmallNumber,
  solveNumbers,
  canAddLarge,
  canAddSmall,
  type NumbersGameState,
  type NumbersSolution,
  type NumbersTileResult,
} from "@/lib/game/numbers";
import { NumberDrawer } from "@/components/NumberDrawer";
import { NumberPlayInteractive } from "@/components/NumberPlayInteractive";
import { SoloTimerSetup } from "@/components/SoloTimerSetup";
import { Timer } from "@/components/Timer";

type Op = "+" | "-" | "\u00d7" | "\u00f7";

const T = {
  "en-GB": {
    back: "Back",
    title: "Numbers Round",
    calculator: "Calculator",
    calcPlaceholder: "Type or click...",
    calcNotWhole: "Not a whole number",
    calcInvalid: "Invalid",
    errPositiveSub: "Subtraction must produce a positive result",
    errExactDiv: "Division must be exact",
    errPositiveResult: "Result must be positive",
    offByTry: "Off by {diff} \u2014 try again!",
    makeCalc: "Make at least one calculation",
    exact: "Exact!",
    offBy: "Off by {diff}",
    showSolution: "Show optimal solution",
    exactSolution: "Exact Solution",
    bestDiff: "Best (diff: {diff})",
    noSolution: "No solution found",
    newRound: "New Round",
    timer: "Timer",
  },
  "en-US": {
    back: "Back",
    title: "Numbers Round",
    calculator: "Calculator",
    calcPlaceholder: "Type or click...",
    calcNotWhole: "Not a whole number",
    calcInvalid: "Invalid",
    errPositiveSub: "Subtraction must produce a positive result",
    errExactDiv: "Division must be exact",
    errPositiveResult: "Result must be positive",
    offByTry: "Off by {diff} \u2014 try again!",
    makeCalc: "Make at least one calculation",
    exact: "Exact!",
    offBy: "Off by {diff}",
    showSolution: "Show optimal solution",
    exactSolution: "Exact Solution",
    bestDiff: "Best (diff: {diff})",
    noSolution: "No solution found",
    newRound: "New Round",
    timer: "Timer",
  },
  de: {
    back: "Zur\u00fcck",
    title: "Zahlenrunde",
    calculator: "Taschenrechner",
    calcPlaceholder: "Tippen oder klicken...",
    calcNotWhole: "Keine ganze Zahl",
    calcInvalid: "Ung\u00fcltig",
    errPositiveSub: "Subtraktion muss positives Ergebnis liefern",
    errExactDiv: "Division muss ganzzahlig sein",
    errPositiveResult: "Ergebnis muss positiv sein",
    offByTry: "Differenz {diff} \u2014 nochmal versuchen!",
    makeCalc: "F\u00fchre mindestens eine Rechnung aus",
    exact: "Genau!",
    offBy: "Differenz {diff}",
    showSolution: "Optimale L\u00f6sung anzeigen",
    exactSolution: "Exakte L\u00f6sung",
    bestDiff: "Beste (Diff: {diff})",
    noSolution: "Keine L\u00f6sung gefunden",
    newRound: "Neue Runde",
    timer: "Timer",
  },
};

type Locale = keyof typeof T;

function MiniCalculator({ locale }: { locale: Locale }) {
  const t = T[locale] ?? T["en-GB"];
  const [calcExpr, setCalcExpr] = useState("");
  const [calcResult, setCalcResult] = useState<number | null>(null);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const append = (s: string) => {
    setCalcExpr((p) => p + s);
    setCalcError(null);
    setCalcResult(null);
  };

  const clearCalc = () => {
    setCalcExpr("");
    setCalcError(null);
    setCalcResult(null);
  };

  const evaluate = useCallback(() => {
    try {
      const cleaned = calcExpr.replace(/\s+/g, "");
      if (!cleaned) return;
      const r = Function(`"use strict"; return (${cleaned})`)() as number;
      if (r !== Math.round(r)) { setCalcError(t.calcNotWhole); setCalcResult(null); return; }
      setCalcResult(r);
      setCalcError(null);
    } catch { setCalcError(t.calcInvalid); setCalcResult(null); }
  }, [calcExpr, t]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); return; }
      if ("0123456789+-*/()".includes(e.key)) { e.preventDefault(); append(e.key); }
      else if (e.key === "Enter") { e.preventDefault(); evaluate(); }
      else if (e.key === "Backspace") { e.preventDefault(); setCalcExpr((p) => p.slice(0, -1)); setCalcResult(null); setCalcError(null); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, evaluate]);

  useEffect(() => { inputRef.current?.focus(); }, [open]);

  if (!open) return <button className="btn btn-outline btn-sm" onClick={() => setOpen(true)}>{t.calculator}</button>;

  return (
    <div className="card bg-base-200/80 border border-base-content/10 rounded-box w-full max-w-xs shadow-lg">
      <div className="card-body p-3 gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-base-content/50">{t.calculator}</span>
          <button className="btn btn-ghost btn-xs" onClick={() => setOpen(false)}>X</button>
        </div>
        <input ref={inputRef} type="text" className="input input-bordered input-sm w-full text-center font-mono text-base"
          value={calcExpr} onChange={(e) => { setCalcExpr(e.target.value); setCalcResult(null); setCalcError(null); }}
          onKeyDown={(e) => { if (e.key === "Enter") evaluate(); }} placeholder={t.calcPlaceholder} />
        {calcResult !== null && <div className="text-center font-mono text-lg font-bold text-success">= {calcResult}</div>}
        {calcError && <div className="text-center text-xs text-error">{calcError}</div>}
        {[["7","8","9","/"],["4","5","6","*"],["1","2","3","-"],["0","(",")","+"]].map((row, ri) => (
          <div key={ri} className="flex gap-1">
            {row.map((btn) => <button key={btn} className="btn btn-xs flex-1 font-mono" onClick={() => append(btn)}>{btn}</button>)}
          </div>
        ))}
        <div className="flex gap-1">
          <button className="btn btn-xs flex-1 btn-error" onClick={clearCalc}>C</button>
          <button className="btn btn-xs flex-1 btn-success" onClick={evaluate}>=</button>
        </div>
      </div>
    </div>
  );
}

export default function SoloNumbersPage() {
  const params = useParams();
  const locale = (params.locale as Locale) ?? "en-GB";
  const t = T[locale] ?? T["en-GB"];

  const [game, setGame] = useState<NumbersGameState>(createNumbersGame);
  const [results, setResults] = useState<NumbersTileResult[]>([]);
  const [usedIndices, setUsedIndices] = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState<number[]>([]);
  const [pendingOp, setPendingOp] = useState<Op | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [solution, setSolution] = useState<NumbersSolution | null>(null);
  const [playerDiff, setPlayerDiff] = useState<number | null>(null);
  const [showSolver, setShowSolver] = useState(false);
  const [nextId, setNextId] = useState(1);
  const [bestAttempt, setBestAttempt] = useState<{ result: number; diff: number } | null>(null);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerDuration, setTimerDuration] = useState(30);
  const [timeLeft, setTimeLeft] = useState(30);

  const tiles = game.tiles.map((t) => t.value);

  const handleNewRound = useCallback(() => {
    setGame(createNumbersGame());
    setResults([]);
    setUsedIndices(new Set());
    setSelected([]);
    setPendingOp(null);
    setFeedback(null);
    setSolution(null);
    setPlayerDiff(null);
    setShowSolver(false);
    setNextId(1);
    setBestAttempt(null);
    setTimeLeft(timerDuration);
  }, [timerDuration]);

  const selectNumber = useCallback((index: number) => {
    if (game.phase !== "playing") return;
    if (showSolver) return;
    if (usedIndices.has(index)) return;
    setFeedback(null);
    const allNumbers = [...game.tiles.map((t) => t.value), ...results.map((r) => r.value)];

    if (pendingOp) {
      const aIdx = selected[0];
      const bIdx = index;
      const a = allNumbers[aIdx];
      const b = allNumbers[bIdx];
      const op = pendingOp;
      let result: number | null = null;
      switch (op) {
        case "+": result = a + b; break;
        case "-":
          if (a <= b) { setFeedback(t.errPositiveSub); setSelected([]); setPendingOp(null); return; }
          result = a - b;
          break;
        case "\u00d7": result = a * b; break;
        case "\u00f7":
          if (b === 0 || a % b !== 0) { setFeedback(t.errExactDiv); setSelected([]); setPendingOp(null); return; }
          result = a / b;
          break;
      }
      if (result === null || result <= 0) { setFeedback(t.errPositiveResult); setSelected([]); setPendingOp(null); return; }

      setUsedIndices((prev) => new Set([...prev, aIdx, bIdx]));
      setResults((prev) => [...prev, { id: nextId, value: result, a, b, op, aIdx, bIdx }]);
      setNextId((n) => n + 1);
      setSelected([]);
      setPendingOp(null);
      if (result === game.target) {
        setPlayerDiff(0);
        setBestAttempt(null);
        setFeedback(null);
        setGame((g) => ({ ...g, phase: "scoring" }));
      }
    } else {
      setSelected([index]);
      setPendingOp(null);
    }
  }, [game.phase, game.target, game.tiles, showSolver, usedIndices, pendingOp, selected, nextId, t, results]);

  const selectOp = useCallback((op: string) => {
    if (game.phase !== "playing") return;
    if (selected.length !== 1) { setFeedback("Select a number first"); return; }
    setPendingOp(op as Op);
    setFeedback(null);
  }, [game.phase, selected]);

  const handleUndo = useCallback(() => {
    if (results.length === 0) return;
    const remaining = results.slice(0, -1);
    setResults(remaining);
    const newUsed = new Set<number>();
    for (const r of remaining) {
      newUsed.add(r.aIdx);
      newUsed.add(r.bIdx);
    }
    setUsedIndices(newUsed);
    setSelected([]);
    setPendingOp(null);
    setFeedback(null);
  }, [results]);

  const handleGiveUp = useCallback(() => {
    if (!bestAttempt) return;
    setPlayerDiff(bestAttempt.diff);
    setGame((g) => ({ ...g, phase: "scoring" }));
  }, [bestAttempt]);

  const handleResetAll = useCallback(() => {
    setResults([]);
    setUsedIndices(new Set());
    setSelected([]);
    setPendingOp(null);
    setFeedback(null);
  }, []);

  const handleFinish = useCallback(() => {
    if (results.length === 0) { setFeedback(t.makeCalc); return; }
    const lastValue = results[results.length - 1].value;
    const diff = Math.abs(lastValue - game.target);
    if (diff === 0) {
      setPlayerDiff(0);
      setGame((g) => ({ ...g, phase: "scoring" }));
    } else {
      setBestAttempt({ result: lastValue, diff });
      setFeedback(t.offByTry.replace("{diff}", String(diff)));
    }
  }, [results, game.target, t]);

  const handleSolve = useCallback(() => {
    setShowSolver(true);
    setSolution(solveNumbers(tiles, game.target));
  }, [tiles, game.target]);

  const handleTimeout = useCallback(() => {
    setPlayerDiff((diff) => {
      if (diff !== null) return diff;
      return bestAttempt ? bestAttempt.diff : Math.abs((results[results.length - 1]?.value ?? 0) - game.target);
    });
    setGame((g) => ({ ...g, phase: "scoring" }));
  }, [bestAttempt, results, game.target]);

  useEffect(() => {
    if (game.phase === "playing") queueMicrotask(() => setTimeLeft(timerDuration));
  }, [game.phase, timerDuration]);

  useEffect(() => {
    if (game.phase !== "playing") return;
    if (!timerEnabled) return;

    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          handleTimeout();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [game.phase, timerEnabled, handleTimeout]);

  return (
    <div className="flex min-h-screen flex-col">
      <div className="navbar bg-base-200/50">
        <div className="flex-1">
          <Link href={`/${locale}/solo`} className="btn btn-ghost btn-sm">{t.back}</Link>
        </div>
        <div className="flex-none">
          <h1 className="text-base sm:text-lg font-bold text-warning">{t.title}</h1>
        </div>
        <div className="flex-1" />
      </div>

      <div className="flex flex-1 flex-col items-center gap-6 p-4 sm:p-6">
        <MiniCalculator locale={locale} />

        {game.phase === "drawing" && (
          <>
            <div className="w-full max-w-sm">
              <SoloTimerSetup
                enabled={timerEnabled}
                duration={timerDuration}
                onToggle={setTimerEnabled}
                onDurationChange={setTimerDuration}
                label={t.timer}
              />
            </div>
            <NumberDrawer
              locale={locale}
              tiles={tiles}
              isHost={true}
              onPickLarge={() => setGame((g) => addLargeNumber(g))}
              onPickSmall={() => setGame((g) => addSmallNumber(g))}
              canPickLarge={canAddLarge(game.tiles) && game.largeNumbers.length > 0}
              canPickSmall={canAddSmall(game.tiles) && game.smallNumbers.length > 0}
              largeRemaining={game.largeNumbers.length}
              smallRemaining={game.smallNumbers.length}
            />
          </>
        )}

        {(game.phase === "playing" || game.phase === "scoring") && (
          <>
            {timerEnabled && game.phase === "playing" && (
              <Timer timeRemaining={timeLeft} totalTime={timerDuration} />
            )}
            <NumberPlayInteractive
              locale={locale}
              tiles={tiles}
              target={game.target}
              results={results}
              usedIndices={usedIndices}
              selected={selected}
              pendingOp={pendingOp}
              feedback={feedback}
              bestAttempt={bestAttempt}
              onSelectNumber={selectNumber}
              onSelectOp={selectOp}
              onUndo={handleUndo}
              onResetAll={handleResetAll}
              onFinish={handleFinish}
              onGiveUp={handleGiveUp}
              steps={results}
            />
          </>
        )}

        {game.phase === "scoring" && playerDiff !== null && (
          <div className="w-full max-w-xl rounded-box bg-base-200/60 p-4 sm:p-6 md:p-8 shadow-lg flex flex-col items-center gap-6">
            <div className={`text-3xl font-bold tabular-nums ${playerDiff === 0 ? "text-success" : "text-warning"}`}>
              {playerDiff === 0 ? t.exact : t.offBy.replace("{diff}", String(playerDiff))}
            </div>
            {!showSolver && <button className="btn btn-outline btn-warning" onClick={handleSolve}>{t.showSolution}</button>}
            {showSolver && solution && (
              <div className="w-full max-w-sm rounded-box bg-base-300/50 p-4 text-center">
                <span className="text-xs uppercase tracking-[0.2em] text-base-content/40">
                  {solution.exact ? t.exactSolution : t.bestDiff.replace("{diff}", String(solution.difference))}
                </span>
                {solution.steps.length > 0 ? (
                  <div className="mt-3 space-y-1.5">
                    {solution.steps.map((step, i) => (
                      <div key={i} className="font-mono text-sm tabular-nums text-base-content/70">
                        {step.a} <span className="text-warning">{step.operator}</span> {step.b} = {step.result}
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-base-content/50 mt-2">{t.noSolution}</p>}
              </div>
            )}
            <button className="btn btn-warning btn-lg mt-4" onClick={handleNewRound}>{t.newRound}</button>
          </div>
        )}
      </div>
    </div>
  );
}
