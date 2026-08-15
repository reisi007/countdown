import { describe, it, expect } from "vitest";
import { isValidWord, loadDictionary } from "@/lib/i18n/dictionaries";

describe("German dictionary smoke", () => {
  it("validates common words and inflections", () => {
    for (const w of [
      "HAUS", "BAUM", "KIND", "SPIELT", "GEHT", "SCHÖN", "SCHÖNE",
      "HÄUSER", "KINDER", "MACHEN", "GUT", "LÄUFT", "LESEN", "SPIELEN",
      "MÄDCHEN", "KAFFEE", "FENSTER",
    ]) {
      expect(isValidWord("de", w), w).toBe(true);
    }
  });

  it("validates ASCII umlaut forms", () => {
    for (const w of ["FUER", "GRUEN", "STRASSE", "SCHUELER", "NATUERLICH", "UEBER"]) {
      expect(isValidWord("de", w), w).toBe(true);
    }
  });

  it("rejects junk fragments from the old scraper list", () => {
    for (const w of ["IE", "ND", "S", "AS", "ESCHICHTE", "MART", "XQZP", "HAUSAA"]) {
      expect(isValidWord("de", w), w).toBe(false);
    }
  });

  it("accepts real two-letter words", () => {
    for (const w of ["AB", "AN", "IM", "IN", "ZU", "ER", "OB", "ES", "AM", "UM", "DA", "JA", "WO"]) {
      expect(isValidWord("de", w), w).toBe(true);
    }
  });

  it("builds an index with both umlaut and ASCII forms", () => {
    const de = loadDictionary("de");
    expect(de.size).toBeGreaterThan(10000);
    expect(de.has("HAEUSER")).toBe(true);
    expect(de.has("HÄUSER")).toBe(true);
    expect(de.has("NATUERLICH")).toBe(true);
    expect(de.has("NATÜRLICH")).toBe(true);
  });

  it("english still validates", () => {
    expect(isValidWord("en-GB", "ADVENTURE")).toBe(true);
    expect(isValidWord("en-US", "FAVORITE")).toBe(true);
    expect(isValidWord("en-GB", "XQZP")).toBe(false);
  });
});
