# Conundrum Round Rules

## Overview

The conundrum is a 9-letter anagram puzzle. Players must unscramble the letters to find the hidden word. In multiplayer mode, the first player to buzz in gets to answer.

## Constraints

### Word Selection

- **9-letter words** from a curated list per locale
- en-GB, en-US: 30 words each
- de: 30 German words (8-9 letters)

### Scrambling

- Deterministic Fisher-Yates shuffle seeded from the word's hash
- Server-side: attempts to find valid dictionary anagrams for display
- Fallback: random shuffle that preserves letter frequencies

### Timer

- **30 seconds** from display

### Multiplayer Buzzer Rules

- First player to click buzzer locks the board
- Buzzer timestamp used for fairness (earliest wins)
- Answer window: **5 seconds** after buzzing

### Scoring

- Correct answer: point for the solver
- Incorrect answer: other players may try
- Timeout: no points awarded

## Implementation

- `src/lib/game/conundrum.ts` for game logic
- `/api/conundrum` for server-side valid-anagram generation
- `checkSolution()` performs case-insensitive trimmed comparison
