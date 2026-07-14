import { describe, it, expect } from "vitest";
import {
  createConundrum,
  scrambleWord,
  getConundrumWord,
  checkSolution,
  type ConundrumState,
} from "@/lib/game/conundrum";

describe("createConundrum", () => {
  it("creates state with correct answer uppercased", () => {
    const state = createConundrum("adventure");
    expect(state.answer).toBe("ADVENTURE");
  });

  it("scrambled is different from answer", () => {
    const state = createConundrum("ADVENTURE");
    expect(state.scrambled).not.toBe(state.answer);
  });

  it("scrambled has same length as answer", () => {
    const state = createConundrum("CHALLENGE");
    expect(state.scrambled.length).toBe(state.answer.length);
  });

  it("scrambled contains same letters as answer", () => {
    const state = createConundrum("DANGEROUS");
    const sortLetters = (s: string) => s.split("").sort().join("");
    expect(sortLetters(state.scrambled)).toBe(sortLetters(state.answer));
  });

  it("phase is scrambled", () => {
    const state = createConundrum("QUESTION");
    expect(state.phase).toBe("scrambled");
  });

  it("buzzerId is null", () => {
    const state = createConundrum("MOUNTAIN");
    expect(state.buzzerId).toBeNull();
  });

  it("timeRemaining is 30", () => {
    const state = createConundrum("STRANGER");
    expect(state.timeRemaining).toBe(30);
  });

  it("given a specific word always produces the same scrambled version", () => {
    const a = createConundrum("TOGETHER");
    const b = createConundrum("TOGETHER");
    expect(a.scrambled).toBe(b.scrambled);
  });
});

describe("scrambleWord", () => {
  it("same word always produces same scrambled output", () => {
    expect(scrambleWord("TOMORROW")).toBe(scrambleWord("TOMORROW"));
  });

  it("different words produce different scrambles", () => {
    const a = scrambleWord("WONDERFUL");
    const b = scrambleWord("YESTERDAY");
    expect(a).not.toBe(b);
  });

  it("output contains exactly the same letters", () => {
    const word = "BEAUTIFUL";
    const scrambled = scrambleWord(word);
    const sort = (s: string) => s.split("").sort().join("");
    expect(sort(scrambled)).toBe(sort(word));
  });

  it("output is not the same as input", () => {
    const word = "ADVENTURE";
    expect(scrambleWord(word)).not.toBe(word);
  });

  it("returns empty string for empty input", () => {
    expect(scrambleWord("")).toBe("");
  });

  it("returns same character for single character input", () => {
    expect(scrambleWord("A")).toBe("A");
  });

  it("handles two identical characters correctly", () => {
    const result = scrambleWord("AA");
    expect(result).toHaveLength(2);
    expect(result).toBe("AA");
  });
});

describe("getConundrumWord", () => {
  it("returns a word for en-GB locale", () => {
    const word = getConundrumWord("en-GB");
    expect(typeof word).toBe("string");
    expect(word.length).toBeGreaterThan(0);
  });

  it("returns a word for en-US locale", () => {
    const word = getConundrumWord("en-US");
    expect(typeof word).toBe("string");
    expect(word.length).toBeGreaterThan(0);
  });

  it("returns a word for de locale", () => {
    const word = getConundrumWord("de");
    expect(typeof word).toBe("string");
    expect(word.length).toBeGreaterThan(0);
  });

  it("falls back to en-GB for unknown locale", () => {
    const word = getConundrumWord("fr");
    expect(typeof word).toBe("string");
    expect(word.length).toBeGreaterThan(0);
  });

  it("falls back to en-GB for empty string locale", () => {
    const word = getConundrumWord("");
    expect(typeof word).toBe("string");
    expect(word.length).toBeGreaterThan(0);
  });

  it("returns different words across multiple random calls", () => {
    const results = new Set<string>();
    for (let i = 0; i < 50; i++) {
      results.add(getConundrumWord("en-GB"));
    }
    expect(results.size).toBeGreaterThan(1);
  });
});

describe("checkSolution", () => {
  const baseState: ConundrumState = {
    answer: "ADVENTURE",
    scrambled: "NARVDEUTE",
    buzzerId: null,
    solution: null,
    phase: "scrambled",
    timeRemaining: 30,
  };

  it("returns true for exact match", () => {
    expect(checkSolution(baseState, "ADVENTURE")).toBe(true);
  });

  it("returns true for case-insensitive lowercase guess", () => {
    expect(checkSolution(baseState, "adventure")).toBe(true);
  });

  it("returns true for mixed case guess", () => {
    expect(checkSolution(baseState, "AdVeNtUrE")).toBe(true);
  });

  it("returns true when guess has leading spaces", () => {
    expect(checkSolution(baseState, " ADVENTURE")).toBe(true);
  });

  it("returns true when guess has trailing spaces", () => {
    expect(checkSolution(baseState, "ADVENTURE ")).toBe(true);
  });

  it("returns false for wrong word", () => {
    expect(checkSolution(baseState, "BEAUTIFUL")).toBe(false);
  });

  it("returns false for partially correct guess", () => {
    expect(checkSolution(baseState, "ADVENTUR")).toBe(false);
  });

  it("returns false for empty string guess", () => {
    expect(checkSolution(baseState, "")).toBe(false);
  });

  it("returns false when guess has numbers", () => {
    expect(checkSolution(baseState, "ADVENTURE1")).toBe(false);
  });

  it("returns false when guess has special characters", () => {
    expect(checkSolution(baseState, "ADVENTURE!")).toBe(false);
  });
});
