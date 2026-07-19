import { describe, it, expect } from "vitest";
import {
  solveNumbers,
  computeUsedIndices,
  type NumbersTileResult,
} from "@/lib/game/numbers";

function autoSubmitExactMatch(results: NumbersTileResult[], target: number): boolean {
  if (results.length === 0) return false;
  const last = results[results.length - 1].value;
  return last === target;
}

function allPlayersSubmitted(
  submissions: string[],
  totalPlayers: number,
): boolean {
  const unique = new Set(submissions);
  return unique.size >= totalPlayers;
}

function shouldEndRound(
  submissions: string[],
  totalPlayers: number,
  hasExactMatch: boolean,
  timerDuration: number,
): boolean {
  if (timerDuration > 0) return false;
  if (hasExactMatch) return true;
  return allPlayersSubmitted(submissions, totalPlayers);
}

describe("auto-submit exact match", () => {
  it("returns true when last result equals target", () => {
    const results: NumbersTileResult[] = [
      { id: 1, value: 5, a: 3, b: 2, op: "+", aIdx: 0, bIdx: 1 },
      { id: 2, value: 100, a: 20, b: 5, op: "\u00d7", aIdx: 2, bIdx: 0 },
    ];
    expect(autoSubmitExactMatch(results, 5)).toBe(false);
    expect(autoSubmitExactMatch(results, 100)).toBe(true);
  });

  it("returns false for empty results", () => {
    expect(autoSubmitExactMatch([], 42)).toBe(false);
  });

  it("returns false when no result matches target", () => {
    const results: NumbersTileResult[] = [
      { id: 1, value: 9, a: 5, b: 4, op: "+", aIdx: 0, bIdx: 1 },
    ];
    expect(autoSubmitExactMatch(results, 10)).toBe(false);
  });

  it("returns true for exact match even with multiple results", () => {
    const results: NumbersTileResult[] = [
      { id: 1, value: 9, a: 5, b: 4, op: "+", aIdx: 0, bIdx: 1 },
      { id: 2, value: 100, a: 25, b: 4, op: "\u00d7", aIdx: 2, bIdx: 3 },
      { id: 3, value: 525, a: 500, b: 25, op: "+", aIdx: 4, bIdx: 5 },
    ];
    expect(autoSubmitExactMatch(results, 525)).toBe(true);
  });
});

describe("round-end conditions (timer-less)", () => {
  it("does not end round when timer is active", () => {
    expect(shouldEndRound(["a", "b"], 2, false, 30)).toBe(false);
    expect(shouldEndRound(["a", "b"], 2, true, 30)).toBe(false);
    expect(shouldEndRound(["a", "b"], 3, false, 30)).toBe(false);
  });

  it("ends round immediately on exact match when timer is off", () => {
    expect(shouldEndRound(["a"], 2, true, 0)).toBe(true);
  });

  it("ends round when all players submitted (no timer)", () => {
    expect(shouldEndRound(["a", "b"], 2, false, 0)).toBe(true);
  });

  it("does not end round when not all players submitted (no timer, no exact)", () => {
    expect(shouldEndRound(["a"], 2, false, 0)).toBe(false);
    expect(shouldEndRound(["a"], 3, false, 0)).toBe(false);
  });

  it("ends round on exact match even if not all submitted", () => {
    expect(shouldEndRound(["a"], 3, true, 0)).toBe(true);
  });

  it("ends round when all submitted and timer is off regardless of exact match", () => {
    expect(shouldEndRound(["a", "b"], 2, false, 0)).toBe(true);
    expect(shouldEndRound(["a", "b"], 2, true, 0)).toBe(true);
  });
});

describe("allPlayersSubmitted", () => {
  it("returns true when unique submissions match total players", () => {
    expect(allPlayersSubmitted(["peer1", "peer2"], 2)).toBe(true);
  });

  it("returns false when fewer unique submissions than players", () => {
    expect(allPlayersSubmitted(["peer1"], 2)).toBe(false);
  });

  it("deduplicates multiple submissions from same peer", () => {
    expect(allPlayersSubmitted(["peer1", "peer2", "peer1"], 2)).toBe(true);
  });

  it("handles zero players", () => {
    expect(allPlayersSubmitted([], 0)).toBe(true);
  });
});

describe("computeUsedIndices chaining", () => {
  it("integrates with auto-submit: chain to exact target marks exact match", () => {
    const target = 125;

    const step1: NumbersTileResult = { id: 1, value: 9, a: 5, b: 4, op: "+", aIdx: 3, bIdx: 4 };
    const step2: NumbersTileResult = { id: 2, value: 900, a: 9, b: 100, op: "\u00d7", aIdx: 5, bIdx: 1 };

    let used = computeUsedIndices([step1]);
    used = new Set([...used, ...computeUsedIndices([step2])]);

    expect(used.has(3)).toBe(true);
    expect(used.has(4)).toBe(true);
    expect(used.has(1)).toBe(true);

    expect(autoSubmitExactMatch([step1, step2], 900)).toBe(true);
    expect(autoSubmitExactMatch([step1, step2], target)).toBe(false);
  });
});

describe("auto-submit integration with solveNumbers", () => {
  it("recognizes exact match from known solvable puzzle", () => {
    const tiles = [50, 10, 5, 3, 2, 1];
    const target = 71;
    const solution = solveNumbers(tiles, target);
    expect(solution.exact).toBe(true);
    expect(solution.result).toBe(target);

    const lastResult: NumbersTileResult = {
      id: 99,
      value: solution.result,
      a: 50,
      b: 21,
      op: "+",
      aIdx: 0,
      bIdx: 99,
    };
    expect(autoSubmitExactMatch([lastResult], target)).toBe(true);
  });

  it("does not auto-submit when closest is off by 1", () => {
    const tiles = [1, 1, 1, 1, 1, 1];
    const target = 999;
    const solution = solveNumbers(tiles, target);
    expect(solution.exact).toBe(false);
    expect(solution.result).toBe(9);
    expect(autoSubmitExactMatch([{
      id: 99, value: solution.result, a: 1, b: 1, op: "+", aIdx: 0, bIdx: 1,
    }], target)).toBe(false);
  });
});
