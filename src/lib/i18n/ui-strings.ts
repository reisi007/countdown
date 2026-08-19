import fs from "fs";
import path from "path";

type Messages = Record<string, unknown>;

const cache = new Map<string, Messages>();

/**
 * Server-only loader for the static UI string tables under `public/locales`.
 * The menu page is a server component and needs localized copy without pulling
 * in the dictionary (word-list / nspell) machinery.
 */
export function getMessages(locale: string): Messages {
  if (cache.has(locale)) return cache.get(locale)!;

  const file = path.join(process.cwd(), "public", "locales", `${locale}.json`);
  let data: Messages = {};
  try {
    data = JSON.parse(fs.readFileSync(file, "utf-8")) as Messages;
  } catch {
    data = {};
  }
  cache.set(locale, data);
  return data;
}

function pick(scope: Messages | undefined, key: string, fallback: string): string {
  const value = scope?.[key];
  return typeof value === "string" ? value : fallback;
}

export function getMenuStrings(locale: string): {
  tagline: string;
  solo: string;
  multiplayer: string;
} {
  const messages = getMessages(locale);
  const menu = messages.menu as Messages | undefined;
  return {
    tagline: pick(messages, "tagline", "The Classic TV Game Show"),
    solo: pick(menu, "solo", "Solo Play"),
    multiplayer: pick(menu, "multiplayer", "Multiplayer"),
  };
}
