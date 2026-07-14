import { NextRequest, NextResponse } from "next/server";
import { getConundrumWord, scrambleWord } from "@/lib/game/conundrum";
import { isValidWord } from "@/lib/i18n/dictionaries";

function scrambleToValidAnagram(word: string, locale: string): string {
  const answer = word.toUpperCase();
  const chars = answer.split("");

  function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    return hash;
  }

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

  const seed = hashString(answer);
  const candidates: string[] = [];

  for (let attempt = 0; attempt < 200; attempt++) {
    const perm = fisherYatesShuffle(chars, seed + attempt);
    const candidate = perm.join("");
    if (candidate === answer) continue;
    if (candidates.includes(candidate)) continue;

    if (isValidWord(locale, candidate)) {
      candidates.push(candidate);
    }
  }

  if (candidates.length > 0) {
    const pickIndex = Math.abs(seed * 7 + 13) % candidates.length;
    return candidates[pickIndex];
  }

  return scrambleWord(word);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") || "en-GB";

  const word = getConundrumWord(locale);
  const scrambled = scrambleToValidAnagram(word, locale);

  return NextResponse.json({
    answer: word.toUpperCase(),
    scrambled,
    timeRemaining: 30,
  });
}
