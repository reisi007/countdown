import fs from "fs";
import wordListPath from "word-list";
import germanWords from "an-array-of-german-words";

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

function loadGermanWords(): Set<string> {
  return new Set((germanWords as string[]).map((w) => w.toUpperCase()));
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
  const dictionary = loadDictionary(locale);
  return dictionary.has(word.toUpperCase().trim());
}

export function getAvailableLocales(): string[] {
  return ["en-GB", "en-US", "de"];
}
