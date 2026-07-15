"use client";

import type { NumbersTileResult } from "@/lib/game/numbers";

const T = {
  "en-GB": {
    chooseOp: "Choose an operation",
    pickSecond: "pick a second number",
    offByTry: "Off by {diff} \u2014 try again!",
    bestOffBy: "Best: {result} (off by {diff})",
    undo: "Undo step",
    resetAll: "Reset all",
    submitValue: "Submit: {value}",
    giveUp: "Give up",
    errPositiveSub: "Subtraction must produce a positive result",
    errExactDiv: "Division must be exact",
    errPositiveResult: "Result must be positive",
    yourSteps: "Your steps",
  },
  "en-US": {
    chooseOp: "Choose an operation",
    pickSecond: "pick a second number",
    offByTry: "Off by {diff} \u2014 try again!",
    bestOffBy: "Best: {result} (off by {diff})",
    undo: "Undo step",
    resetAll: "Reset all",
    submitValue: "Submit: {value}",
    giveUp: "Give up",
    errPositiveSub: "Subtraction must produce a positive result",
    errExactDiv: "Division must be exact",
    errPositiveResult: "Result must be positive",
    yourSteps: "Your steps",
  },
  de: {
    chooseOp: "W\u00e4hle eine Rechenart",
    pickSecond: "zweite Zahl w\u00e4hlen",
    offByTry: "Differenz {diff} \u2014 nochmal versuchen!",
    bestOffBy: "Beste: {result} (Differenz {diff})",
    undo: "Schritt r\u00fcckg\u00e4ngig",
    resetAll: "Alles zur\u00fccksetzen",
    submitValue: "Absenden: {value}",
    giveUp: "Aufgeben",
    errPositiveSub: "Subtraktion muss positives Ergebnis liefern",
    errExactDiv: "Division muss ganzzahlig sein",
    errPositiveResult: "Ergebnis muss positiv sein",
    yourSteps: "Deine Schritte",
  },
};

type Locale = keyof typeof T;

const OPS = ["+", "-", "\u00d7", "\u00f7"] as const;
const OP_LABELS: Record<string, string> = {
  "+": "+",
  "-": "\u2212",
  "\u00d7": "\u00d7",
  "\u00f7": "\u00f7",
};

export function NumberPlayInteractive({
  locale,
  tiles,
  target,
  results,
  usedIndices,
  selected,
  pendingOp,
  feedback,
  bestAttempt,
  onSelectNumber,
  onSelectOp,
  onUndo,
  onResetAll,
  onFinish,
  onGiveUp,
  steps,
}: {
  locale: string;
  tiles: number[];
  target: number;
  results: NumbersTileResult[];
  usedIndices: Set<number>;
  selected: number[];
  pendingOp: string | null;
  feedback: string | null;
  bestAttempt: { result: number; diff: number } | null;
  onSelectNumber: (index: number) => void;
  onSelectOp: (op: string) => void;
  onUndo: () => void;
  onResetAll: () => void;
  onFinish: () => void;
  onGiveUp: () => void;
  steps?: NumbersTileResult[];
}) {
  const t = T[locale as Locale] ?? T["en-GB"];
  const allNumbers = [...tiles, ...results.map((r) => r.value)];

  return (
    <div className="flex flex-1 flex-col lg:flex-row items-center lg:items-start justify-center gap-4 sm:gap-6 w-full">
      <div className="flex flex-col items-center gap-4 w-full max-w-xl">
        <div className="text-4xl sm:text-5xl font-bold tabular-nums text-warning">
          {target}
        </div>

        <div className="flex flex-col items-center gap-3 w-full">
          <div className="flex flex-wrap justify-center gap-3">
            {tiles.map((v, i) => {
              const sel = selected.includes(i);
              return (
                <button
                  key={`orig-${i}`}
                  className={`flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-lg border-2 shadow-md transition-all select-none font-bold text-2xl sm:text-3xl tabular-nums
                    ${
                      usedIndices.has(i)
                        ? "border-base-content/10 bg-blue-950/10 text-base-content/10 scale-90 opacity-25 cursor-not-allowed"
                        : sel
                          ? "border-warning bg-warning/30 text-warning scale-110 shadow-warning/20 cursor-pointer"
                          : "border-blue-400 bg-blue-950/80 text-blue-50 hover:border-warning/50 cursor-pointer"
                    }`}
                  onClick={() => onSelectNumber(i)}
                  disabled={usedIndices.has(i)}
                >
                  {v}
                </button>
              );
            })}
          </div>

          {results.length > 0 && (
            <div className="flex flex-wrap justify-center gap-3">
              {results.map((r, idx) => {
                const globalIdx = tiles.length + idx;
                const isUsed = usedIndices.has(globalIdx);
                const sel = selected.includes(globalIdx);
                return (
                  <button
                    key={r.id}
                    className={`flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-lg border-2 shadow-md transition-all select-none font-bold text-2xl sm:text-3xl tabular-nums
                      ${
                        isUsed
                          ? "border-base-content/10 bg-blue-950/10 text-base-content/10 scale-90 opacity-25 cursor-not-allowed"
                          : sel
                            ? "border-warning bg-warning/30 text-warning scale-110 shadow-warning/20 cursor-pointer"
                            : "border-success bg-success/20 text-success hover:border-warning/50 cursor-pointer"
                      }`}
                    style={{ animation: "popIn 0.3s ease-out" }}
                    onClick={() => onSelectNumber(globalIdx)}
                    disabled={isUsed}
                    title={
                      isUsed ? "" : `${r.a} ${r.op} ${r.b} = ${r.value}`
                    }
                  >
                    {r.value}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-3">
          {selected.length === 1 && !pendingOp && (
            <p className="text-sm text-base-content/50">{t.chooseOp}</p>
          )}
          {selected.length === 1 && pendingOp && (
            <p className="text-sm text-warning">
              {allNumbers[selected[0]]} {OP_LABELS[pendingOp] ?? pendingOp}?{" "}
              {"\u2014"} {t.pickSecond}
            </p>
          )}

          <div className="flex gap-2 sm:gap-3">
            {OPS.map((op) => (
              <button
                key={op}
                className={`btn btn-warning btn-lg w-14 sm:w-16 text-xl sm:text-2xl ${pendingOp === op ? "btn-active" : ""}`}
                onClick={() => onSelectOp(op)}
              >
                {OP_LABELS[op]}
              </button>
            ))}
          </div>

          {feedback && (
            <p className="text-sm text-error animate-pulse">{feedback}</p>
          )}

          {bestAttempt && (
            <p className="text-sm text-warning">
              {t.bestOffBy
                .replace("{result}", String(bestAttempt.result))
                .replace("{diff}", String(bestAttempt.diff))}
            </p>
          )}

          <div className="flex flex-wrap justify-center gap-2 mt-2">
            {results.length > 0 && (
              <button className="btn btn-ghost btn-sm text-warning" onClick={onUndo}>
                {t.undo}
              </button>
            )}
            {results.length > 0 && (
              <button className="btn btn-ghost btn-sm text-error" onClick={onResetAll}>
                {t.resetAll}
              </button>
            )}
            {results.length > 0 && (
              <button
                className="btn btn-primary btn-sm"
                onClick={onFinish}
              >
                {t.submitValue.replace(
                  "{value}",
                  String(results[results.length - 1].value),
                )}
              </button>
            )}
            {bestAttempt && (
              <button
                className="btn btn-ghost btn-sm text-base-content/50"
                onClick={onGiveUp}
              >
                {t.giveUp}
              </button>
            )}
          </div>
        </div>
      </div>

      {(steps ?? results).length > 0 && (
        <div className="w-full max-w-xs md:max-w-sm">
          <div className="card bg-base-200 sticky top-4">
            <div className="card-body p-4">
              <h3 className="card-title text-sm">{t.yourSteps}</h3>
              <div className="divider my-1" />
              <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto">
                {(steps ?? results).map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-2 rounded-btn bg-base-300 text-sm font-mono"
                  >
                    <span>
                      {r.a} {r.op} {r.b}
                    </span>
                    <span className="font-bold tabular-nums ml-2 text-success">
                      = {r.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
