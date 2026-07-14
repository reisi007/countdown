# Letters Round Rules

## Overview

The letters round requires contestants to find the longest possible word from a random selection of nine individual letters within 30 seconds.

## Constraints

### Tile Selection

| Rule | Value |
|------|-------|
| Total tiles | Exactly **9** |
| Minimum vowels | **3** |
| Maximum vowels | **5** |
| Minimum consonants | **4** |
| Maximum consonants | **6** |

Valid tile distributions: `3V/6C`, `4V/5C`, `5V/4C`

### Letter Pools

- Vowels: `A, E, I, O, U`
- Consonants: `B, C, D, F, G, H, J, K, L, M, N, P, Q, R, S, T, V, W, X, Y, Z`

### Word Validation

- Each tile may be used **at most once** per word
- To use a letter twice, two identical tiles must be drawn
- Words validated against locale-specific dictionary (CSW for en-GB, NWL for en-US, standard German for de)
- No proper nouns, hyphenated words, or abbreviations

### German Umlaut Mapping

| Input | Mapping |
|-------|---------|
| A | AE |
| O | OE |
| U | UE |
| ss | SS |

Applied to both board display and player input.

### Timer

- **30 seconds** from when the 9th tile is placed

### Scoring

- Longest valid word wins
- Ties broken by submission speed (earliest submission wins)

## Implementation

- Pure functions in `src/lib/game/letters.ts`
- `canAddVowel()` / `canAddConsonant()` enforce minimum/maximum counts
- `canFormWord()` performs frequency-based validation with umlaut normalization
- Server-side dictionary lookup via `/api/validate`
