export type ConundrumState = {
  answer: string;
  scrambled: string;
  buzzerId: string | null;
  solution: string | null;
  phase: "scrambled" | "buzzed" | "solved" | "timeout";
  timeRemaining: number;
};

const CONUNDRUM_WORDS: Record<string, string[]> = {
  "en-GB": [
    "ADVENTURE", "BEAUTIFUL", "CHALLENGE", "DANGEROUS", "EDUCATION",
    "FOOTBALL", "HAPPINESS", "LANGUAGE", "MOUNTAIN", "QUESTION",
    "STRANGER", "TOGETHER", "TOMORROW", "WONDERFUL", "YESTERDAY",
    "BREAKFAST", "CHOCOLATE", "DIRECTION", "EVERYTHING", "FRIGHTEN",
    "GRADUALLY", "HURRICANE", "IMPORTANT", "JEWELLERY", "KNOWLEDGE",
    "LIGHTNING", "MARKETING", "NIGHTMARE", "OPERATION", "PASSENGER",
  ],
  "en-US": [
    "ADVENTURE", "BEAUTIFUL", "CHALLENGE", "DANGEROUS", "EDUCATION",
    "FAVORITE", "FOOTBALL", "HAPPINESS", "IMPORTANT", "LANGUAGE",
    "ORIGINAL", "QUESTION", "STRANGER", "TOGETHER", "WONDERFUL",
    "BREAKFAST", "CHOCOLATE", "DIRECTION", "EVERYTHING", "FRIGHTEN",
    "GRADUALLY", "HURRICANE", "JEWELRY", "KNOWLEDGE", "LIGHTNING",
    "MARKETING", "NIGHTMARE", "OPERATION", "PASSENGER", "TRAVELING",
  ],
  "de": [
    "ABENTEUER", "BEDEUTUNG", "BESTELLEN", "BEWERBUNG", "BEZIEHUNG",
    "BUCHSTABE", "DOKUMENTE", "EMPFANGEN", "ENTDECKEN", "ERFAHRUNG",
    "ERKLAERUNG", "ERZAEHLUNG", "FORSCHUNG", "GEHEIMNIS", "KARTOFFEL",
    "KRANKHEIT", "LANDKARTE", "LIEFERUNG", "LITERATUR", "NACHRICHT",
    "NATURLICH", "NOTWENDIG", "REGISIERUNG", "SCHICKSAL", "SCHWIERIG",
    "UNTERWEGS", "VERDIENEN", "VERSTEHEN", "VERWANDTE", "VORSCHLAG",
  ],
};

function fisherYatesShuffle(arr: string[], seed: number): string[] {
  const result = [...arr];
  let s = seed;
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    const tmp = result[i];
    result[i] = result[j];
    result[j] = tmp;
  }
  return result;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return hash;
}

export function scrambleWord(word: string): string {
  const upper = word.toUpperCase();
  const chars = upper.split("");
  const seed = hashString(upper);
  const shuffled = fisherYatesShuffle(chars, seed);

  if (shuffled.join("") === upper) {
    const tmp = shuffled[0];
    shuffled[0] = shuffled[1];
    shuffled[1] = tmp;
  }

  return shuffled.join("");
}

export function createConundrum(word: string): ConundrumState {
  return {
    answer: word.toUpperCase(),
    scrambled: scrambleWord(word),
    buzzerId: null,
    solution: null,
    phase: "scrambled",
    timeRemaining: 30,
  };
}

export function getConundrumWord(locale: string): string {
  const words = CONUNDRUM_WORDS[locale] || CONUNDRUM_WORDS["en-GB"];
  return words[Math.floor(Math.random() * words.length)];
}

export function checkSolution(state: ConundrumState, guess: string): boolean {
  return guess.toUpperCase().trim() === state.answer;
}
