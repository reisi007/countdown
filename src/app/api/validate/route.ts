import { NextRequest, NextResponse } from "next/server";
import { loadDictionary } from "@/lib/i18n/dictionaries";
import { normalizeGermanWord } from "@/lib/game/letters";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { word, locale, tiles, action } = body as {
      word?: string;
      locale: string;
      tiles?: string[];
      action?: string;
    };

    if (!locale) {
      return NextResponse.json(
        { valid: false, reason: "Missing required field: locale" },
        { status: 400 },
      );
    }

    if (action === "longest" && tiles && tiles.length > 0) {
      const dictionary = loadDictionary(locale);
      const normalizedLocale = locale.startsWith("de") ? "de" : "en";

      const availableCounts = new Map<string, number>();
      for (const char of tiles.map((t) => t.toUpperCase())) {
        if (normalizedLocale === "de") {
          const expanded = normalizeGermanWord(char).split("");
          for (const c of expanded) availableCounts.set(c, (availableCounts.get(c) || 0) + 1);
        } else {
          availableCounts.set(char, (availableCounts.get(char) || 0) + 1);
        }
      }

      let bestWord = "";
      let bestLen = 0;

      for (const dictWord of dictionary) {
        if (dictWord.length < 2 || dictWord.length <= bestLen) continue;
        if (dictWord.length > tiles.length) continue;

        let ok = true;
        const needed = new Map<string, number>();
        for (const char of dictWord) {
          needed.set(char, (needed.get(char) || 0) + 1);
        }

        for (const [char, count] of needed) {
          if ((availableCounts.get(char) || 0) < count) {
            ok = false;
            break;
          }
        }

        if (ok) {
          bestWord = dictWord;
          bestLen = dictWord.length;
        }
      }

      return NextResponse.json({ word: bestWord, length: bestLen });
    }

    if (!word || !tiles) {
      return NextResponse.json(
        { valid: false, reason: "Missing required fields: word, tiles" },
        { status: 400 },
      );
    }

    const normalizedWord = word.toUpperCase().trim();
    if (normalizedWord.length < 2) {
      return NextResponse.json(
        { valid: false, reason: "Word must be at least 2 letters long" },
        { status: 200 },
      );
    }

    const dictionary = loadDictionary(locale);
    if (!dictionary.has(normalizedWord)) {
      return NextResponse.json(
        { valid: false, reason: `"${normalizedWord}" is not in the dictionary` },
        { status: 200 },
      );
    }

    const needed = new Map<string, number>();
    for (const char of normalizedWord) {
      needed.set(char, (needed.get(char) || 0) + 1);
    }

    const available = new Map<string, number>();
    for (const char of tiles.map((t) => t.toUpperCase())) {
      available.set(char, (available.get(char) || 0) + 1);
    }

    for (const [char, count] of needed) {
      if ((available.get(char) || 0) < count) {
        return NextResponse.json(
          { valid: false, reason: `Word cannot be formed from the given tiles (missing: ${char})` },
          { status: 200 },
        );
      }
    }

    return NextResponse.json({ valid: true, word: normalizedWord, length: normalizedWord.length });
  } catch {
    return NextResponse.json(
      { valid: false, reason: "Invalid request" },
      { status: 400 },
    );
  }
}
