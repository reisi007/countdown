# Numbers Round Rules

## Overview

The numbers round requires contestants to use basic arithmetic on six chosen numbers to exactly reach, or get as close as possible to, a randomly generated three-digit target number within 30 seconds.

## Constraints

### Number Pool

| Type | Numbers | Count |
|------|---------|-------|
| Large | 25, 50, 75, 100 | 4 total |
| Small | 1-10 (two of each) | 20 total |

### Selection

| Rule | Value |
|------|-------|
| Total tiles to pick | **6** |
| Maximum large numbers | **4** |
| Minimum large numbers | **0** |
| Remaining slots filled with small numbers | automatically |

### Target

- Random number between **100** and **999** (inclusive)

### Allowed Operations

| Operator | Symbol | Constraints |
|----------|--------|-------------|
| Addition | + | Always valid |
| Subtraction | - | Must produce positive integer (a > b) |
| Multiplication | * | Always valid, but can produce large numbers |
| Division | / | Must divide evenly (no fractions), a >= b, b != 0 |

### Expression Validation

- Each tile may be used **at most once**
- Parentheses `()` allowed for grouping
- Only digits, operators, parentheses, and spaces allowed
- Result must be a finite number

### Forbidden

- Powers, square roots, logarithms
- Decimal numbers or fractions
- Negative intermediate results
- Zero (unless a tile is 0, which doesn't exist in the pool)

### Timer

- **30 seconds** from when the 6th tile is placed

### Scoring

- Closest to target wins (lowest absolute difference)
- Ties broken by submission speed (earliest submission wins)

## Implementation

- Pure functions in `src/lib/game/numbers.ts`
- `canAddLarge()` enforces max 4 large numbers
- `evaluateExpression()` safely parses and evaluates player input
- `solveNumbers()` uses recursive backtracking to find optimal solution
- Expression validated server-side before acceptance
