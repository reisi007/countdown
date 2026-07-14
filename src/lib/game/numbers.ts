export type NumberTile = {
  value: number;
  type: "large" | "small";
};

export type NumbersStep = {
  a: number;
  b: number;
  operator: "+" | "-" | "×" | "÷";
  result: number;
};

export type NumbersSolution = {
  exact: boolean;
  difference: number;
  target: number;
  result: number;
  steps: NumbersStep[];
};

export type NumbersGameState = {
  target: number;
  tiles: NumberTile[];
  largeNumbers: number[];
  smallNumbers: number[];
  phase: "drawing" | "playing" | "scoring";
  timeRemaining: number;
};

export type ExpressionResult = {
  valid: boolean;
  error: string | null;
  result: number | null;
  usedNumbers: number[];
};

export type NumbersTileResult = {
  id: number;
  value: number;
  a: number;
  b: number;
  op: string;
  aIdx: number;
  bIdx: number;
};

export function computeUsedIndices(results: NumbersTileResult[]): Set<number> {
  const used = new Set<number>();
  for (const r of results) {
    used.add(r.aIdx);
    used.add(r.bIdx);
  }
  return used;
}

const LARGE_NUMBERS = [25, 50, 75, 100];
const SMALL_NUMBERS_POOL = [
  1, 1, 2, 2, 3, 3, 4, 4, 5, 5,
  6, 6, 7, 7, 8, 8, 9, 9, 10, 10,
];
const MAX_LARGE = 4;
const TOTAL_TILES = 6;

function countLarge(tiles: NumberTile[]): number {
  return tiles.filter((t) => t.type === "large").length;
}

export function canAddLarge(tiles: NumberTile[]): boolean {
  return tiles.length < TOTAL_TILES && countLarge(tiles) < MAX_LARGE;
}

export function canAddSmall(tiles: NumberTile[]): boolean {
  return tiles.length < TOTAL_TILES;
}

function pickIndex(arr: unknown[]): number {
  return Math.floor(Math.random() * arr.length);
}

export function createNumbersGame(): NumbersGameState {
  return {
    target: generateRandomTarget(),
    tiles: [],
    largeNumbers: [...LARGE_NUMBERS],
    smallNumbers: [...SMALL_NUMBERS_POOL],
    phase: "drawing",
    timeRemaining: 30,
  };
}

export function addLargeNumber(state: NumbersGameState): NumbersGameState {
  if (!canAddLarge(state.tiles)) return state;
  if (state.largeNumbers.length === 0) return state;

  const idx = pickIndex(state.largeNumbers);
  const value = state.largeNumbers[idx];
  const nextLarge = state.largeNumbers.filter((_, i) => i !== idx);
  const tiles = [...state.tiles, { value, type: "large" as const }];

  return {
    ...state,
    tiles,
    largeNumbers: nextLarge,
    phase: tiles.length === TOTAL_TILES ? "playing" : "drawing",
    timeRemaining: tiles.length === TOTAL_TILES ? 30 : state.timeRemaining,
  };
}

export function addSmallNumber(state: NumbersGameState): NumbersGameState {
  if (!canAddSmall(state.tiles)) return state;
  if (state.smallNumbers.length === 0) return state;

  const idx = pickIndex(state.smallNumbers);
  const value = state.smallNumbers[idx];
  const nextSmall = state.smallNumbers.filter((_, i) => i !== idx);
  const tiles = [...state.tiles, { value, type: "small" as const }];

  return {
    ...state,
    tiles,
    smallNumbers: nextSmall,
    phase: tiles.length === TOTAL_TILES ? "playing" : "drawing",
    timeRemaining: tiles.length === TOTAL_TILES ? 30 : state.timeRemaining,
  };
}

export function generateRandomTarget(): number {
  return Math.floor(Math.random() * 900) + 100;
}

export function isValidOperation(a: number, b: number, operator: string): boolean {
  switch (operator) {
    case "+":
      return true;
    case "-":
      return a > b;
    case "×":
      return true;
    case "÷":
      return b !== 0 && a >= b && a % b === 0;
    default:
      return false;
  }
}

const ALLOWED_EXPR_CHARS = /^[0-9+\-*/()\s.]+$/;

export function getUsedNumberIndices(tiles: number[], expr: string): Set<number> {
  const used = new Set<number>();
  if (!expr) return used;

  const cleaned = expr.replace(/\s+/g, "");
  if (!ALLOWED_EXPR_CHARS.test(cleaned)) return used;

  const numberMatches = cleaned.match(/\d+/g) ?? [];
  const usedNumbers = numberMatches.map(Number);

  const available = tiles.map((t, i) => ({ value: t, index: i }));

  for (const n of usedNumbers) {
    for (let i = 0; i < available.length; i++) {
      if (used.has(available[i].index)) continue;
      if (available[i].value === n) {
        used.add(available[i].index);
        break;
      }
    }
  }

  return used;
}

export function evaluateExpression(expr: string, tiles: number[]): ExpressionResult {
  const cleaned = expr.replace(/\s+/g, "");

  if (cleaned.length === 0) {
    return { valid: false, error: "Expression is empty", result: null, usedNumbers: [] };
  }

  if (!ALLOWED_EXPR_CHARS.test(cleaned)) {
    return { valid: false, error: "Only digits, +, -, *, /, (, ) are allowed", result: null, usedNumbers: [] };
  }

  if (/[+\-*/]$/.test(cleaned) || /^[+\-*/]/.test(cleaned)) {
    return { valid: false, error: "Expression starts or ends with an operator", result: null, usedNumbers: [] };
  }

  let open = 0;
  for (const ch of cleaned) {
    if (ch === "(") open++;
    if (ch === ")") open--;
    if (open < 0) return { valid: false, error: "Unmatched closing parenthesis", result: null, usedNumbers: [] };
  }
  if (open !== 0) return { valid: false, error: "Unclosed opening parenthesis", result: null, usedNumbers: [] };

  const numberMatches = cleaned.match(/\d+/g) ?? [];
  const usedNumbers = numberMatches.map(Number);

  if (usedNumbers.length === 0) {
    return { valid: false, error: "No numbers in expression", result: null, usedNumbers: [] };
  }

  const tileCounts = new Map<number, number>();
  for (const n of tiles) tileCounts.set(n, (tileCounts.get(n) || 0) + 1);

  const usedCounts = new Map<number, number>();
  for (const n of usedNumbers) usedCounts.set(n, (usedCounts.get(n) || 0) + 1);

  for (const [num, count] of usedCounts) {
    const available = tileCounts.get(num) || 0;
    if (count > available) {
      return { valid: false, error: `Number ${num} used ${count}x, only ${available} available`, result: null, usedNumbers };
    }
  }

  const parseResult = parseAndEvaluate(cleaned);
  if (parseResult instanceof Error) {
    return { valid: false, error: parseResult.message, result: null, usedNumbers };
  }

  const result = parseResult;
  if (!Number.isFinite(result) || Number.isNaN(result)) {
    return { valid: false, error: "Result is not a valid number", result: null, usedNumbers };
  }
  if (result !== Math.round(result)) {
    return { valid: false, error: "Division must produce a whole number", result: null, usedNumbers };
  }
  if (result <= 0) {
    return { valid: false, error: "Result must be positive", result: null, usedNumbers };
  }

  return { valid: true, error: null, result, usedNumbers };
}

type Token = { type: "num"; value: number } | { type: "op"; value: string } | { type: "lparen" } | { type: "rparen" };

function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];
    if (ch >= "0" && ch <= "9") {
      let num = "";
      while (i < expr.length && expr[i] >= "0" && expr[i] <= "9") {
        num += expr[i];
        i++;
      }
      tokens.push({ type: "num", value: parseInt(num, 10) });
    } else if (ch === "+" || ch === "-" || ch === "*" || ch === "/") {
      tokens.push({ type: "op", value: ch });
      i++;
    } else if (ch === "(") {
      tokens.push({ type: "lparen" });
      i++;
    } else if (ch === ")") {
      tokens.push({ type: "rparen" });
      i++;
    } else {
      i++;
    }
  }
  return tokens;
}

function parseAndEvaluate(expr: string): number | Error {
  const tokens = tokenize(expr);
  let pos = 0;

  function peek(): Token | null {
    return pos < tokens.length ? tokens[pos] : null;
  }

  function consume(): Token {
    return tokens[pos++];
  }

  function expect(type: "num"): { type: "num"; value: number };
  function expect(type: "op"): { type: "op"; value: string };
  function expect(type: "lparen"): { type: "lparen" };
  function expect(type: "rparen"): { type: "rparen" };
  function expect(type: Token["type"]): Token {
    const t = peek();
    if (!t || t.type !== type) throw new Error("Unexpected token");
    return consume();
  }

  function parseExpression(): number {
    let left = parseTerm();
    let t = peek();
    while (t && t.type === "op" && (t.value === "+" || t.value === "-")) {
      consume();
      const op = t.value;
      const right = parseTerm();
      if (op === "+") left = left + right;
      else {
        left = left - right;
        if (left < 0) throw new Error("Intermediate result must not be negative");
      }
      t = peek();
    }
    return left;
  }

  function parseTerm(): number {
    let left = parseFactor();
    let t = peek();
    while (t && t.type === "op" && (t.value === "*" || t.value === "/")) {
      const op = t.value;
      consume();
      const right = parseFactor();
      if (op === "/") {
        if (right === 0) throw new Error("Division by zero");
        if (left % right !== 0) throw new Error("Division must produce a whole number, no remainder");
        left = left / right;
      } else {
        left = left * right;
      }
      t = peek();
    }
    return left;
  }

  function parseFactor(): number {
    if (peek()?.type === "lparen") {
      consume();
      const result = parseExpression();
      expect("rparen");
      return result;
    }
    const t = expect("num");
    return t.value;
  }

  try {
    const result = parseExpression();
    if (pos !== tokens.length) throw new Error("Unexpected tokens at end");
    return result;
  } catch (e) {
    return e instanceof Error ? e : new Error("Invalid expression");
  }
}

export function solveNumbers(tiles: number[], target: number): NumbersSolution {
  let best: NumbersSolution = {
    exact: false,
    difference: Infinity,
    target,
    result: 0,
    steps: [],
  };

  function solve(numbers: number[], steps: NumbersStep[]) {
    for (const n of numbers) {
      const diff = Math.abs(n - target);
      if (diff < best.difference || (diff === best.difference && steps.length < best.steps.length)) {
        best = {
          exact: diff === 0,
          difference: diff,
          target,
          result: n,
          steps: [...steps],
        };
      }
    }

    if (numbers.length < 2) return;

    for (let i = 0; i < numbers.length; i++) {
      for (let j = i + 1; j < numbers.length; j++) {
        const a = numbers[i];
        const b = numbers[j];
        const remaining = numbers.filter((_, k) => k !== i && k !== j);

        const combos: Array<{ operator: "+" | "-" | "×" | "÷"; result: number | null }> = [
          { operator: "+", result: a + b },
          { operator: "×", result: a * b },
        ];

        if (a !== b) {
          combos.push({ operator: "-", result: Math.max(a, b) - Math.min(a, b) });
        }

        const [larger, smaller] = a >= b ? [a, b] : [b, a];
        if (smaller !== 0 && larger % smaller === 0) {
          combos.push({ operator: "÷", result: larger / smaller });
        }

        for (const { operator, result } of combos) {
          if (result === null || result <= 0) continue;
          if (operator === "-") {
            const [big, small] = a > b ? [a, b] : [b, a];
            solve([...remaining, result], [...steps, { a: big, b: small, operator, result }]);
          } else if (operator === "÷") {
            const [big, small] = a >= b ? [a, b] : [b, a];
            solve([...remaining, result], [...steps, { a: big, b: small, operator, result }]);
          } else {
            solve([...remaining, result], [...steps, { a, b, operator, result }]);
          }
        }
      }
    }
  }

  solve(tiles, []);
  return best;
}

export function formatSolution(solution: NumbersSolution): string {
  if (solution.steps.length === 0) {
    return `No solution found. Closest: ${solution.result} (off by ${solution.difference})`;
  }

  const lines = solution.steps.map(
    (step) => `${step.a} ${step.operator} ${step.b} = ${step.result}`,
  );

  const tag = solution.exact
    ? "Exact solution"
    : `Best approximation (off by ${solution.difference})`;

  return `${tag}:\n${lines.join("\n")}\nResult: ${solution.result}`;
}
