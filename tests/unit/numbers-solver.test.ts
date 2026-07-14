import { describe, it, expect } from "vitest";
import {
  createNumbersGame,
  addLargeNumber,
  addSmallNumber,
  generateRandomTarget,
  solveNumbers,
  formatSolution,
  evaluateExpression,
  getUsedNumberIndices,
  computeUsedIndices,
  type NumbersGameState,
  type NumbersTileResult,
} from "@/lib/game/numbers";

describe("createNumbersGame", () => {
  it("returns initial state with empty tiles and drawing phase", () => {
    const g = createNumbersGame();
    expect(g.tiles).toEqual([]);
    expect(g.phase).toBe("drawing");
    expect(g.timeRemaining).toBe(30);
  });

  it("generates target between 100 and 999", () => {
    for (let i = 0; i < 500; i++) {
      const t = createNumbersGame().target;
      expect(t).toBeGreaterThanOrEqual(100);
      expect(t).toBeLessThanOrEqual(999);
    }
  });

  it("has 4 large and 20 small numbers in pool", () => {
    const g = createNumbersGame();
    expect(g.largeNumbers).toEqual([25, 50, 75, 100]);
    expect(g.smallNumbers).toHaveLength(20);
  });
});

describe("addLargeNumber / addSmallNumber", () => {
  function base(overrides?: Partial<NumbersGameState>): NumbersGameState {
    return {
      target: 500, tiles: [],
      largeNumbers: [25, 50, 75, 100],
      smallNumbers: [1, 2, 3, 4, 5, 6],
      phase: "drawing", timeRemaining: 30,
      ...overrides,
    };
  }

  it("adds a large number and removes it from pool", () => {
    const n = addLargeNumber(base());
    expect(n.tiles).toHaveLength(1);
    expect(n.tiles[0].type).toBe("large");
    expect(n.largeNumbers).toHaveLength(3);
  });

  it("allows max 4 large numbers, then blocks", () => {
    let s = base();
    for (let i = 0; i < 4; i++) s = addLargeNumber(s);
    expect(s.tiles).toHaveLength(4);
    expect(addLargeNumber(s)).toBe(s);
  });

  it("does nothing when pool empty", () => {
    const emptyLarge = base({ largeNumbers: [] });
    const afterLarge = addLargeNumber(emptyLarge);
    expect(afterLarge.tiles).toEqual(emptyLarge.tiles);
    expect(afterLarge.largeNumbers).toEqual([]);

    const emptySmall = base({ smallNumbers: [] });
    const afterSmall = addSmallNumber(emptySmall);
    expect(afterSmall.tiles).toEqual(emptySmall.tiles);
    expect(afterSmall.smallNumbers).toEqual([]);
  });

  it("transitions to playing after 6 tiles", () => {
    let s = base({ smallNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] });
    for (let i = 0; i < 5; i++) s = addSmallNumber(s);
    s = addLargeNumber(s);
    expect(s.phase).toBe("playing");
    expect(s.timeRemaining).toBe(30);
  });
});

describe("generateRandomTarget", () => {
  it("returns values in [100, 999]", () => {
    for (let i = 0; i < 1000; i++) {
      const t = generateRandomTarget();
      expect(t).toBeGreaterThanOrEqual(100);
      expect(t).toBeLessThanOrEqual(999);
    }
  });

  it("produces varying values", () => {
    expect(new Set(Array.from({ length: 500 }, () => generateRandomTarget())).size).toBeGreaterThan(50);
  });
});

describe("evaluateExpression — validation", () => {
  it("rejects empty expression", () => {
    const r = evaluateExpression("", [1, 2]);
    expect(r.valid).toBe(false);
  });

  it("rejects illegal characters (letters)", () => {
    const r = evaluateExpression("3+a", [3, 1]);
    expect(r.valid).toBe(false);
  });

  it("rejects expression ending with operator", () => {
    const r = evaluateExpression("3+", [3, 1]);
    expect(r.valid).toBe(false);
  });

  it("rejects expression starting with operator", () => {
    const r = evaluateExpression("+3", [3, 1]);
    expect(r.valid).toBe(false);
  });

  it("rejects unmatched opening parenthesis", () => {
    expect(evaluateExpression("(3+4", [3, 4]).valid).toBe(false);
  });

  it("rejects unmatched closing parenthesis", () => {
    expect(evaluateExpression("3+4)", [3, 4]).valid).toBe(false);
  });
});

describe("evaluateExpression — addition", () => {
  it("simple addition", () => {
    const r = evaluateExpression("3+4", [3, 4]);
    expect(r.valid).toBe(true);
    expect(r.result).toBe(7);
  });

  it("multi-number addition", () => {
    expect(evaluateExpression("10+20+30", [10, 20, 30]).result).toBe(60);
  });

  it("addition with parentheses", () => {
    expect(evaluateExpression("(3+4)+5", [3, 4, 5]).result).toBe(12);
  });
});

describe("evaluateExpression — subtraction", () => {
  it("positive result is ok", () => {
    expect(evaluateExpression("10-3", [10, 3]).result).toBe(7);
  });

  it("rejects negative result (a < b)", () => {
    const r = evaluateExpression("3-10", [3, 10]);
    expect(r.valid).toBe(false);
  });

  it("rejects zero result (a === b)", () => {
    const r = evaluateExpression("5-5", [5]);
    expect(r.valid).toBe(false);
  });

  it("nested subtraction works", () => {
    expect(evaluateExpression("(20-5)-3", [20, 5, 3]).result).toBe(12);
  });

  it("rejects nested negative intermediate", () => {
    const r = evaluateExpression("(5-20)+30", [5, 20, 30]);
    expect(r.valid).toBe(false);
  });

  it("mixed add/sub with positive intermediates", () => {
    expect(evaluateExpression("100-25+10", [100, 25, 10]).result).toBe(85);
  });
});

describe("evaluateExpression — multiplication", () => {
  it("simple multiplication", () => {
    expect(evaluateExpression("6*7", [6, 7]).result).toBe(42);
  });

  it("chain multiplication", () => {
    expect(evaluateExpression("3*4*5", [3, 4, 5]).result).toBe(60);
  });

  it("multiplication with parentheses", () => {
    expect(evaluateExpression("(100+25)*3", [100, 25, 3]).result).toBe(375);
  });
});

describe("evaluateExpression — division (strict)", () => {
  it("exact division is ok", () => {
    expect(evaluateExpression("50/25", [50, 25]).result).toBe(2);
  });

  it("75/25 = 3", () => {
    expect(evaluateExpression("75/25", [75, 25]).result).toBe(3);
  });

  it("100/25 = 4", () => {
    expect(evaluateExpression("100/25", [100, 25]).result).toBe(4);
  });

  it("rejects non-exact division (remainder)", () => {
    expect(evaluateExpression("7/3", [7, 3]).valid).toBe(false);
  });

  it("rejects division by zero", () => {
    expect(evaluateExpression("5/0", [5, 0]).valid).toBe(false);
  });

  it("nested division works when exact", () => {
    expect(evaluateExpression("(100/25)/2", [100, 25, 2]).result).toBe(2);
  });

  it("rejects nested non-exact division", () => {
    expect(evaluateExpression("(100/25)/3", [100, 25, 3]).valid).toBe(false);
  });

  it("chain division (50/5/2)", () => {
    expect(evaluateExpression("50/5/2", [50, 5, 2]).result).toBe(5);
  });

  it("division before multiplication (left-to-right)", () => {
    expect(evaluateExpression("50/5*2", [50, 5, 2]).result).toBe(20);
  });
});

describe("evaluateExpression — complex expressions", () => {
  it("(100+75)*(50/25)-4", () => {
    const tiles = [25, 100, 50, 5, 4, 75];
    const r = evaluateExpression("(100+75)*(50/25)-4", tiles);
    expect(r.valid).toBe(true);
    expect(r.result).toBe((100 + 75) * (50 / 25) - 4);
  });

  it("25*4+50-75/5", () => {
    const r = evaluateExpression("25*4+50-75/5", [25, 4, 50, 75, 5]);
    expect(r.valid).toBe(true);
    expect(r.result).toBe(25 * 4 + 50 - 75 / 5);
  });

  it("100+75-50*25/5 is negative intermediate", () => {
    const r = evaluateExpression("100+75-50*25/5", [100, 75, 50, 25, 5]);
    expect(r.valid).toBe(false);
  });
});

describe("evaluateExpression — tile consumption", () => {
  it("uses exactly the available tiles", () => {
    const r = evaluateExpression("5+4", [25, 100, 50, 5, 4, 75]);
    expect(r.valid).toBe(true);
    const used = getUsedNumberIndices([25, 100, 50, 5, 4, 75], "5+4");
    expect(used.size).toBe(2);
    expect([...used].map((i) => [25, 100, 50, 5, 4, 75][i])).toContain(5);
    expect([...used].map((i) => [25, 100, 50, 5, 4, 75][i])).toContain(4);
  });

  it("rejects reusing a tile (5+5 with only one 5)", () => {
    const r = evaluateExpression("5+5", [5, 3]);
    expect(r.valid).toBe(false);
    expect(r.error).toContain("5");
  });

  it("allows using two identical tiles when two exist", () => {
    expect(evaluateExpression("5+5", [5, 5, 3]).valid).toBe(true);
  });

  it("rejects expression with numbers not in tiles", () => {
    expect(evaluateExpression("10+5", [3, 4]).valid).toBe(false);
  });

  it("allows partial use of tiles", () => {
    expect(evaluateExpression("3+4", [3, 4, 5, 6]).valid).toBe(true);
  });
});

describe("evaluateExpression — result constraints", () => {
  it("result must be positive integer", () => {
    const r = evaluateExpression("3-10", [3, 10]);
    expect(r.valid).toBe(false);
  });

  it("result must be finite", () => {
    expect(evaluateExpression("1/0", [1, 0]).valid).toBe(false);
  });
});

describe("solveNumbers", () => {
  it("adds exactly to target", () => {
    expect(solveNumbers([50, 10, 5, 3, 2, 1], 71).exact).toBe(true);
  });

  it("subtracts to target", () => {
    expect(solveNumbers([100, 25, 10, 5, 3, 1], 56).exact).toBe(true);
  });

  it("multiplies to target", () => {
    expect(solveNumbers([25, 4, 3, 2, 1, 1], 600).exact).toBe(true);
  });

  it("divides to target", () => {
    expect(solveNumbers([100, 50, 25, 5, 3, 2], 2).exact).toBe(true);
  });

  it("classic 678 puzzle", () => {
    expect(solveNumbers([50, 100, 25, 7, 3, 2], 678).exact).toBe(true);
  });

  it("classic 952 puzzle (approximate)", () => {
    const s = solveNumbers([25, 50, 75, 100, 3, 6], 952);
    expect(s.difference).toBeLessThan(20);
  });

  it("board [25, 50, 75, 3, 2, 3] → 463", () => {
    const s = solveNumbers([25, 50, 75, 3, 2, 3], 463);
    expect(s.exact).toBe(true);
  });

  it("closest when exact impossible (all ones → 999)", () => {
    const s = solveNumbers([1, 1, 1, 1, 1, 1], 999);
    expect(s.exact).toBe(false);
    expect(s.result).toBe(9);
    expect(s.difference).toBe(990);
  });

  it("single number equals target", () => {
    expect(solveNumbers([42], 42).exact).toBe(true);
  });

  it("single number close to target", () => {
    expect(solveNumbers([42], 50).difference).toBe(8);
  });

  it("two numbers via addition", () => {
    const s = solveNumbers([10, 5], 15);
    expect(s.steps).toHaveLength(1);
    expect(s.steps[0]).toEqual({ a: 10, b: 5, operator: "+", result: 15 });
  });

  it("all identical numbers to target", () => {
    expect(solveNumbers([7, 7, 7, 7, 7, 7], 42).exact).toBe(true);
  });

  it("all steps produce positive integers", () => {
    for (const s of solveNumbers([100, 75, 50, 25, 10, 9], 999).steps) {
      expect(Number.isInteger(s.result)).toBe(true);
      expect(s.result).toBeGreaterThan(0);
    }
  });

  it("does not reuse numbers across steps", () => {
    const tiles = [100, 75, 50, 25, 10, 9];
    const s = solveNumbers(tiles, 999);
    const avail = [...tiles];
    for (const step of s.steps) {
      expect(avail).toContain(step.a);
      expect(avail).toContain(step.b);
      avail.splice(avail.indexOf(step.a), 1);
      avail.splice(avail.indexOf(step.b), 1);
      avail.push(step.result);
    }
  });
});

describe("formatSolution", () => {
  it("no-solution message", () => {
    const o = formatSolution({ exact: false, difference: 990, target: 999, result: 9, steps: [] });
    expect(o).toContain("No solution");
    expect(o).toContain("990");
  });

  it("exact solution format", () => {
    const o = formatSolution({
      exact: true, difference: 0, target: 15, result: 15,
      steps: [{ a: 10, b: 5, operator: "+" as const, result: 15 }],
    });
    expect(o).toContain("Exact solution");
    expect(o).toContain("10 + 5 = 15");
  });

  it("approximation format", () => {
    const o = formatSolution({
      exact: false, difference: 2, target: 999, result: 997,
      steps: [{ a: 100, b: 50, operator: "+" as const, result: 150 }],
    });
    expect(o).toContain("Best approximation");
    expect(o).toContain("off by 2");
  });
});

describe("step-by-step tile consumption", () => {
  it("5+4=9, 100*9=900, 900+25=925 — no reuse", () => {
    const tiles = [25, 100, 50, 5, 4, 75];

    const s1 = evaluateExpression("5+4", tiles);
    expect(s1.valid).toBe(true);
    expect(s1.result).toBe(9);

    const u1 = getUsedNumberIndices(tiles, "5+4");
    expect(u1.size).toBe(2);

    const rest1 = tiles.filter((_, i) => !u1.has(i));
    expect(rest1).toEqual([25, 100, 50, 75]);

    const s2 = evaluateExpression("100*9", [...rest1, 9]);
    expect(s2.valid).toBe(true);
    expect(s2.result).toBe(900);

    const all2 = [...rest1, 9];
    const u2 = getUsedNumberIndices(all2, "100*9");
    expect(u2.size).toBe(2);

    const rest2 = all2.filter((_, i) => !u2.has(i));
    expect(rest2).toEqual([25, 50, 75]);

    const s3 = evaluateExpression("900+25", [...rest2, 900]);
    expect(s3.valid).toBe(true);
    expect(s3.result).toBe(925);
  });

  it("rejects reuse of consumed tile in next step", () => {
    const tiles = [25, 100, 50, 5, 4, 75];
    const u1 = getUsedNumberIndices(tiles, "5+4");
    const rest = tiles.filter((_, i) => !u1.has(i));

    const s3 = evaluateExpression("900+5", [...rest, 900]);
    expect(s3.valid).toBe(false);
    expect(s3.error).toContain("5");
  });
});

describe("computeUsedIndices", () => {
  it("returns empty set for empty array", () => {
    expect(computeUsedIndices([])).toEqual(new Set());
  });

  it("collects both indices from a single result", () => {
    const results: NumbersTileResult[] = [
      { id: 2, value: 9, a: 5, b: 4, op: "+", aIdx: 0, bIdx: 1 },
    ];
    expect(computeUsedIndices(results)).toEqual(new Set([0, 1]));
  });

  it("collects all indices from two results with distinct operands", () => {
    const results: NumbersTileResult[] = [
      { id: 2, value: 9, a: 5, b: 4, op: "+", aIdx: 0, bIdx: 1 },
      { id: 3, value: 900, a: 100, b: 9, op: "*", aIdx: 2, bIdx: 3 },
    ];
    expect(computeUsedIndices(results)).toEqual(new Set([0, 1, 2, 3]));
  });

  it("tracks chained indices where a later result reuses an earlier index", () => {
    const results: NumbersTileResult[] = [
      { id: 2, value: 9, a: 5, b: 4, op: "+", aIdx: 0, bIdx: 1 },
      { id: 3, value: 900, a: 100, b: 9, op: "*", aIdx: 2, bIdx: 0 },
    ];
    expect(computeUsedIndices(results)).toEqual(new Set([0, 1, 2]));
  });

  it("deduplicates overlapping indices across multiple results", () => {
    const results: NumbersTileResult[] = [
      { id: 2, value: 9, a: 5, b: 4, op: "+", aIdx: 0, bIdx: 1 },
      { id: 3, value: 900, a: 100, b: 9, op: "*", aIdx: 1, bIdx: 2 },
      { id: 4, value: 925, a: 900, b: 25, op: "+", aIdx: 2, bIdx: 3 },
    ];
    expect(computeUsedIndices(results)).toEqual(new Set([0, 1, 2, 3]));
  });

  it("stores same aIdx and bIdx only once", () => {
    const results: NumbersTileResult[] = [
      { id: 2, value: 6, a: 3, b: 3, op: "*", aIdx: 0, bIdx: 0 },
    ];
    expect(computeUsedIndices(results)).toEqual(new Set([0]));
  });

  it("handles a large number of results correctly", () => {
    const results: NumbersTileResult[] = Array.from({ length: 100 }, (_, i) => ({
      id: i + 6,
      value: i * 2,
      a: i,
      b: i + 1,
      op: "+",
      aIdx: i,
      bIdx: i + 1,
    }));
    const used = computeUsedIndices(results);
    expect(used.size).toBe(101);
    for (let i = 0; i <= 100; i++) {
      expect(used.has(i)).toBe(true);
    }
  });
});
