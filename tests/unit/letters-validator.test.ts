import { describe, it, expect } from "vitest";
import {
  createLettersGame,
  addVowel,
  addConsonant,
  canAddVowel,
  canAddConsonant,
  normalizeGermanWord,
  canFormWord,
  type LetterTile,
} from "@/lib/game/letters";

const VOWEL_TILES_AVAILABLE = ["A", "E", "I", "O", "U"];

function vowelTile(letter: string): LetterTile {
  return { letter, type: "vowel" };
}

function consonantTile(letter: string): LetterTile {
  return { letter, type: "consonant" };
}

describe("createLettersGame", () => {
  it("returns initial state with empty tiles", () => {
    const state = createLettersGame();
    expect(state.tiles).toEqual([]);
  });

  it("starts in drawing phase", () => {
    const state = createLettersGame();
    expect(state.phase).toBe("drawing");
  });

  it("has 5 remaining vowels and 6 remaining consonants", () => {
    const state = createLettersGame();
    expect(state.remainingVowels).toBe(5);
    expect(state.remainingConsonants).toBe(6);
  });

  it("has 30 second timer", () => {
    const state = createLettersGame();
    expect(state.timeRemaining).toBe(30);
  });

  it("has null playerWord", () => {
    const state = createLettersGame();
    expect(state.playerWord).toBeNull();
  });
});

describe("canAddVowel / canAddConsonant", () => {
  it("allows adding vowel when less than 5 vowels", () => {
    expect(canAddVowel([vowelTile("A"), vowelTile("E")])).toBe(true);
  });

  it("blocks adding vowel when 5 vowels already drawn", () => {
    const tiles = [vowelTile("A"), vowelTile("E"), vowelTile("I"), vowelTile("O"), vowelTile("U")];
    expect(canAddVowel(tiles)).toBe(false);
  });

  it("allows adding consonant when less than 6 consonants", () => {
    expect(canAddConsonant([consonantTile("B")])).toBe(true);
  });

  it("blocks adding consonant when 6 consonants already drawn", () => {
    const tiles = [consonantTile("B"), consonantTile("C"), consonantTile("D"), consonantTile("F"), consonantTile("G"), consonantTile("H")];
    expect(canAddConsonant(tiles)).toBe(false);
  });

  it("blocks adding any tile when 9 tiles drawn", () => {
    const tiles = [...Array(9)].map(() => vowelTile("A"));
    expect(canAddVowel(tiles)).toBe(false);
    expect(canAddConsonant(tiles)).toBe(false);
  });
});

describe("addVowel", () => {
  it("adds a vowel tile to the tiles array", () => {
    const state = createLettersGame();
    const next = addVowel(state);
    expect(next.tiles.length).toBe(1);
    expect(next.tiles[0].type).toBe("vowel");
    expect(VOWEL_TILES_AVAILABLE).toContain(next.tiles[0].letter);
  });

  it("decrements remainingVowels by 1", () => {
    const state = createLettersGame();
    const next = addVowel(state);
    expect(next.remainingVowels).toBe(4);
  });

  it("does nothing when tiles.length >= 9", () => {
    const fullTiles: LetterTile[] = Array.from({ length: 9 }, () => vowelTile("A"));
    const state = createLettersGame();
    const fullState = { ...state, tiles: fullTiles };
    const next = addVowel(fullState);
    expect(next).toBe(fullState);
  });

  it("does nothing when max vowels reached", () => {
    const state = createLettersGame();
    let s = state;
    for (let i = 0; i < 5; i++) s = addVowel(s);
    const after = addVowel(s);
    expect(s.tiles.length).toBe(5);
    expect(after).toBe(s);
  });

  it("transitions to playing phase when 9 tiles total after mix", () => {
    let state = createLettersGame();
    for (let i = 0; i < 5; i++) state = addVowel(state);
    for (let i = 0; i < 3; i++) state = addConsonant(state);
    expect(state.phase).toBe("drawing");
    state = addConsonant(state);
    expect(state.phase).toBe("playing");
  });

  it("resets timer to 30 when phase transitions to playing", () => {
    let state = createLettersGame();
    for (let i = 0; i < 5; i++) state = addVowel(state);
    for (let i = 0; i < 4; i++) state = addConsonant(state);
    expect(state.timeRemaining).toBe(30);
  });

  it("does not reset timer when not at 9 tiles", () => {
    const state = createLettersGame();
    const next = addVowel(state);
    expect(next.timeRemaining).toBe(state.timeRemaining);
  });
});

describe("addConsonant", () => {
  it("adds a consonant tile to the tiles array", () => {
    const state = createLettersGame();
    const next = addConsonant(state);
    expect(next.tiles.length).toBe(1);
    expect(next.tiles[0].type).toBe("consonant");
  });

  it("decrements remainingConsonants by 1", () => {
    const state = createLettersGame();
    const next = addConsonant(state);
    expect(next.remainingConsonants).toBe(5);
  });

  it("does nothing when tiles.length >= 9", () => {
    const fullTiles: LetterTile[] = Array.from({ length: 9 }, () => vowelTile("A"));
    const state = createLettersGame();
    const fullState = { ...state, tiles: fullTiles };
    const next = addConsonant(fullState);
    expect(next).toBe(fullState);
  });

  it("does nothing when max consonants reached", () => {
    const state = createLettersGame();
    let s = state;
    for (let i = 0; i < 6; i++) s = addConsonant(s);
    const after = addConsonant(s);
    expect(s.tiles.length).toBe(6);
    expect(after).toBe(s);
  });

  it("transitions to playing phase when 9 tiles total after mix", () => {
    let state = createLettersGame();
    for (let i = 0; i < 3; i++) state = addVowel(state);
    for (let i = 0; i < 5; i++) state = addConsonant(state);
    expect(state.phase).toBe("drawing");
    state = addConsonant(state);
    expect(state.phase).toBe("playing");
  });

  it("resets timer to 30 when phase transitions to playing (with consonants)", () => {
    let state = createLettersGame();
    for (let i = 0; i < 3; i++) state = addVowel(state);
    for (let i = 0; i < 6; i++) state = addConsonant(state);
    expect(state.timeRemaining).toBe(30);
  });
});

describe("normalizeGermanWord", () => {
  it("maps uppercase umlauts correctly", () => {
    expect(normalizeGermanWord("F\u00dcR")).toBe("FUER");
    expect(normalizeGermanWord("F\u00dcR")).not.toBe("F\u00dcR");
  });

  it("maps A to AE", () => {
    expect(normalizeGermanWord("B\u00c4R")).toBe("BAER");
  });

  it("maps O to OE", () => {
    expect(normalizeGermanWord("SCH\u00d6N")).toBe("SCHOEN");
  });

  it("maps U to UE", () => {
    expect(normalizeGermanWord("GR\u00dcN")).toBe("GRUEN");
  });

  it("maps ss to SS", () => {
    expect(normalizeGermanWord("STRA\u00dfE")).toBe("STRASSE");
  });

  it("maps lowercase a to AE", () => {
    expect(normalizeGermanWord("b\u00e4r")).toBe("bAEr");
  });

  it("handles words without umlauts unchanged", () => {
    expect(normalizeGermanWord("HELLO")).toBe("HELLO");
  });

  it("returns empty string for empty input", () => {
    expect(normalizeGermanWord("")).toBe("");
  });

  it("handles already normalized strings", () => {
    expect(normalizeGermanWord("AE")).toBe("AE");
  });

  it("handles mixed case correctly", () => {
    expect(normalizeGermanWord("\u00dcber")).toBe("UEber");
  });

  it("handles multiple umlauts in one word", () => {
    expect(normalizeGermanWord("\u00dcBERM\u00c4SSIG")).toBe("UEBERMAESSIG");
  });
});

describe("canFormWord", () => {
  it("exact match succeeds", () => {
    const tiles = [vowelTile("A"), consonantTile("B"), consonantTile("C")];
    expect(canFormWord(tiles, "CAB")).toBe(true);
  });

  it("case insensitive succeeds", () => {
    const tiles = [vowelTile("A"), consonantTile("B"), consonantTile("C")];
    expect(canFormWord(tiles, "cab")).toBe(true);
  });

  it("empty word returns true", () => {
    const tiles = [vowelTile("A")];
    expect(canFormWord(tiles, "")).toBe(true);
  });

  it("single letter in tiles succeeds", () => {
    const tiles = [vowelTile("A")];
    expect(canFormWord(tiles, "A")).toBe(true);
  });

  it("uses subset of available tiles", () => {
    const tiles = [vowelTile("A"), consonantTile("B"), consonantTile("C"), consonantTile("D")];
    expect(canFormWord(tiles, "BAD")).toBe(true);
  });

  it("fails when letter not available", () => {
    const tiles = [vowelTile("A"), consonantTile("B")];
    expect(canFormWord(tiles, "CAB")).toBe(false);
  });

  it("fails when not enough of a letter", () => {
    const tiles = [vowelTile("A"), consonantTile("B")];
    expect(canFormWord(tiles, "AA")).toBe(false);
  });

  it("correctly handles duplicate letter tiles", () => {
    const tiles = [vowelTile("A"), vowelTile("A"), vowelTile("E"), consonantTile("T")];
    expect(canFormWord(tiles, "AA")).toBe(true);
    expect(canFormWord(tiles, "TEAA")).toBe(true);
    expect(canFormWord(tiles, "AAA")).toBe(false);
  });

  it("uses all available tiles", () => {
    const tiles = [vowelTile("A"), consonantTile("B"), consonantTile("C")];
    expect(canFormWord(tiles, "ABC")).toBe(true);
  });
});

describe("integration: full game flow", () => {
  it("draws 3v 6c tiles successfully", () => {
    let state = createLettersGame();
    for (let i = 0; i < 3; i++) state = addVowel(state);
    for (let i = 0; i < 6; i++) state = addConsonant(state);
    expect(state.tiles.length).toBe(9);
    expect(state.phase).toBe("playing");
    expect(state.remainingVowels).toBe(2);
    expect(state.remainingConsonants).toBe(0);
  });

  it("draws 5v 4c tiles successfully", () => {
    let state = createLettersGame();
    for (let i = 0; i < 5; i++) state = addVowel(state);
    for (let i = 0; i < 4; i++) state = addConsonant(state);
    expect(state.tiles.length).toBe(9);
    expect(state.phase).toBe("playing");
  });

  it("cannot add vowel when max reached in 5v/4c combo", () => {
    let state = createLettersGame();
    for (let i = 0; i < 5; i++) state = addVowel(state);
    expect(canAddVowel(state.tiles)).toBe(false);
    for (let i = 0; i < 4; i++) state = addConsonant(state);
    expect(state.phase).toBe("playing");
  });

  it("cannot add consonant when max reached in 3v/6c combo", () => {
    let state = createLettersGame();
    for (let i = 0; i < 6; i++) state = addConsonant(state);
    expect(canAddConsonant(state.tiles)).toBe(false);
    for (let i = 0; i < 3; i++) state = addVowel(state);
    expect(state.phase).toBe("playing");
  });

  it("does not allow adding tiles after board is full", () => {
    let state = createLettersGame();
    for (let i = 0; i < 5; i++) state = addVowel(state);
    for (let i = 0; i < 4; i++) state = addConsonant(state);
    const full = state;
    const after = addVowel(full);
    expect(after).toBe(full);
  });
});
