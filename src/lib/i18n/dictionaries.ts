import fs from "fs";
import wordListPath from "word-list";
import nspell from "nspell";
import germanDictionary from "dictionary-de";
import { normalizeGermanWord } from "@/lib/game/letters";

const dictionaryCache: Map<string, Set<string>> = new Map();

const GERMAN_LOCALE_MAP: Record<string, string> = {
  "de-DE": "de",
  "de-AT": "de",
  "de-CH": "de",
};

const ENGLISH_LOCALES = new Set(["en-GB", "en-US", "en", "en-AU", "en-CA", "en-NZ", "en-IE"]);

function loadEnglishWords(): Set<string> {
  if (!fs.existsSync(wordListPath)) {
    console.warn(`English word list not found at: ${wordListPath}`);
    return new Set();
  }

  const content = fs.readFileSync(wordListPath, "utf-8");
  return new Set(
    content
      .split("\n")
      .map((w) => w.trim().toUpperCase())
      .filter((w) => w.length > 0),
  );
}

let germanSpeller: nspell | null = null;

function loadGermanSpeller(): nspell {
  if (!germanSpeller) {
    germanSpeller = nspell({
      aff: Buffer.from(germanDictionary.aff),
      dic: Buffer.from(germanDictionary.dic),
    });
  }
  return germanSpeller;
}

const GERMAN_DIGRAPHS: Array<[string, string]> = [
  ["AE", "\u00c4"],
  ["OE", "\u00d6"],
  ["UE", "\u00dc"],
  ["SS", "\u00df"],
];

/**
 * The letters game only draws A–Z tiles, so umlaut words arrive in their
 * ASCII form ("NATUERLICH" for "NATÜRLICH"). Map the digraphs back so the
 * hunspell dictionary can validate them.
 */
function asciiToGerman(word: string): string {
  return GERMAN_DIGRAPHS.reduce((acc, [from, to]) => acc.replaceAll(from, to), word);
}

/**
 * German validation uses the igerman98 hunspell dictionary via nspell, which
 * understands inflections ("GEHT", "SPIELTE", "SCHÖNE"). The returned Set is
 * a fast-path index over the base forms plus their ASCII variants; it powers
 * the longest-word solver, whose tiles are ASCII-only.
 */
function loadGermanWords(): Set<string> {
  const content = Buffer.from(germanDictionary.dic).toString("utf-8");
  const words = new Set<string>();

  for (const line of content.split("\n")) {
    const word = line.split(/[/\t]/)[0].trim();
    if (!/^[A-Za-z\u00c4\u00d6\u00dc\u00e4\u00f6\u00fc\u00df]{2,9}$/.test(word)) continue;
    const upper = word.toUpperCase();
    words.add(upper);
    words.add(normalizeGermanWord(upper));
  }

  return words;
}

export function resolveLocale(locale: string): string {
  if (locale in GERMAN_LOCALE_MAP) return "de";
  if (ENGLISH_LOCALES.has(locale)) return "en";
  if (locale.startsWith("de")) return "de";
  return "en";
}

export function loadDictionary(locale: string): Set<string> {
  const resolved = resolveLocale(locale);

  if (dictionaryCache.has(resolved)) {
    return dictionaryCache.get(resolved)!;
  }

  const words = resolved === "de" ? loadGermanWords() : loadEnglishWords();
  dictionaryCache.set(resolved, words);
  return words;
}

export function isValidWord(locale: string, word: string): boolean {
  const resolved = resolveLocale(locale);
  const clean = word.toUpperCase().trim();
  if (clean.length < 2) return false;

  if (resolved === "de") {
    const speller = loadGermanSpeller();
    if (speller.correct(clean)) return true;
    if (loadDictionary(locale).has(clean)) return true;
    if (/[\u00c4\u00d6\u00dc]/.test(clean)) return false;
    const converted = asciiToGerman(clean);
    if (converted !== clean) return speller.correct(converted);
    return false;
  }

  return loadDictionary(locale).has(clean);
}

export function getAvailableLocales(): string[] {
  return ["en-GB", "en-US", "de"];
}
