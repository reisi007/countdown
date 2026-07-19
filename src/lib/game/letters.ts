export type LetterTile = {
  letter: string;
  type: "vowel" | "consonant";
};

export type LettersGameState = {
  tiles: LetterTile[];
  phase: "drawing" | "playing" | "scoring";
  remainingVowels: number;
  remainingConsonants: number;
  timeRemaining: number;
  playerWord: string | null;
};

const VOWELS = ["A", "E", "I", "O", "U"];
const CONSONANTS = [
  "B", "C", "D", "F", "G", "H", "J", "K", "L", "M",
  "N", "P", "Q", "R", "S", "T", "V", "W", "X", "Y", "Z",
];

const MAX_VOWELS = 5;
const MAX_CONSONANTS = 6;
const TOTAL_TILES = 9;

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function createLettersGame(): LettersGameState {
  return {
    tiles: [],
    phase: "drawing",
    remainingVowels: MAX_VOWELS,
    remainingConsonants: MAX_CONSONANTS,
    timeRemaining: 30,
    playerWord: null,
  };
}

function countVowels(tiles: LetterTile[]): number {
  return tiles.filter((t) => t.type === "vowel").length;
}

function countConsonants(tiles: LetterTile[]): number {
  return tiles.filter((t) => t.type === "consonant").length;
}

export function canAddVowel(tiles: LetterTile[]): boolean {
  if (tiles.length >= TOTAL_TILES) return false;
  const v = countVowels(tiles);
  if (v >= MAX_VOWELS) return false;
  return true;
}

export function canAddConsonant(tiles: LetterTile[]): boolean {
  if (tiles.length >= TOTAL_TILES) return false;
  const c = countConsonants(tiles);
  if (c >= MAX_CONSONANTS) return false;
  return true;
}

export function addVowel(state: LettersGameState): LettersGameState {
  if (!canAddVowel(state.tiles)) return state;

  const letter = pickRandom(VOWELS);
  const tiles = [...state.tiles, { letter, type: "vowel" as const }];

  return {
    ...state,
    tiles,
    remainingVowels: MAX_VOWELS - countVowels(tiles),
    remainingConsonants: MAX_CONSONANTS - countConsonants(tiles),
    phase: tiles.length === TOTAL_TILES ? "playing" : "drawing",
    timeRemaining: tiles.length === TOTAL_TILES ? 30 : state.timeRemaining,
  };
}

export function addConsonant(state: LettersGameState): LettersGameState {
  if (!canAddConsonant(state.tiles)) return state;

  const letter = pickRandom(CONSONANTS);
  const tiles = [...state.tiles, { letter, type: "consonant" as const }];

  return {
    ...state,
    tiles,
    remainingVowels: MAX_VOWELS - countVowels(tiles),
    remainingConsonants: MAX_CONSONANTS - countConsonants(tiles),
    phase: tiles.length === TOTAL_TILES ? "playing" : "drawing",
    timeRemaining: tiles.length === TOTAL_TILES ? 30 : state.timeRemaining,
  };
}

export function normalizeGermanWord(word: string): string {
  return word
    .replace(/Ä/g, "AE")
    .replace(/Ö/g, "OE")
    .replace(/Ü/g, "UE")
    .replace(/ß/g, "SS")
    .replace(/ä/g, "AE")
    .replace(/ö/g, "OE")
    .replace(/ü/g, "UE");
}

export function canFormWord(tiles: LetterTile[], word: string): boolean {
  const normalizedWord = normalizeGermanWord(word).toUpperCase();
  const normalizedTiles = tiles
    .map((t) => normalizeGermanWord(t.letter.toUpperCase()).split(""))
    .flat();

  const needed = new Map<string, number>();
  for (const char of normalizedWord) {
    needed.set(char, (needed.get(char) || 0) + 1);
  }

  const available = new Map<string, number>();
  for (const char of normalizedTiles) {
    available.set(char, (available.get(char) || 0) + 1);
  }

  for (const [char, count] of needed) {
    if ((available.get(char) || 0) < count) return false;
  }

  return true;
}

export function getUsedTileIndices(tiles: LetterTile[], word: string): Set<number> {
  const used = new Set<number>();
  if (!word) return used;

  const normalizedWord = normalizeGermanWord(word).toUpperCase();
  const expanded = tiles.map((t) => normalizeGermanWord(t.letter.toUpperCase()));

  const needed = new Map<string, number>();
  for (const char of normalizedWord) {
    needed.set(char, (needed.get(char) || 0) + 1);
  }

  for (const [char, count] of needed) {
    let remaining = count;
    for (let i = 0; i < expanded.length; i++) {
      if (used.has(i)) continue;
      if (expanded[i] === char && remaining > 0) {
        used.add(i);
        remaining--;
      }
    }
  }

  return used;
}

export function getAvailableLetters(tiles: LetterTile[]): LetterTile[] {
  return tiles;
}

export function shuffleTiles(tiles: LetterTile[]): LetterTile[] {
  const result = [...tiles];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = result[i];
    result[i] = result[j];
    result[j] = tmp;
  }
  return result;
}

export function resetTiles(_tiles: LetterTile[]): LetterTile[] {
  return [..._tiles];
}
