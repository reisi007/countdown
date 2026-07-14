# AGENTS.todo.md — Current Work

## Status

- 217 unit tests passing (`pnpm test`)
- 0 TypeScript errors
- Express + Next.js + PeerJS server on port 3000

## Test Tags

Run the matching section before any change:

```
## Tests
#tag: all          -> pnpm test && pnpm typecheck
#tag: numbers      -> npx vitest run tests/unit/numbers-solver.test.ts
#tag: letters      -> npx vitest run tests/unit/letters-validator.test.ts
#tag: leader-elec  -> npx vitest run tests/unit/leader-election.test.ts
#tag: conundrum    -> npx vitest run tests/unit/conundrum.test.ts
#tag: db           -> npx vitest run tests/unit/db.test.ts
#tag: scoring      -> npx vitest run tests/unit/scoring.test.ts
```

## Active Work

| # | Description | Priority |
|---|-------------|----------|
| 1 | **Conundrum buzzer test**: the `conundrum/page.tsx` multiplayer state machine (buzz/grant/guess/result/timeout) has no automated test. The conundrum pure functions are tested (32 unit tests) but the message-driven game flow is not. | 🟡 medium |
| 2 | **E2E in CI**: E2E tests require `pnpm build` + `pnpm start`, not yet wired into CI. `multiplayer.spec.ts` only covers lobby join + failover. | 🟡 medium |
| 3 | **Resubmit for numbers**: `room/[roomId]/numbers/page.tsx` is one-shot — once `submitExpr` fires, phase moves to "scoring" then "finished". No "try again" or re-entry mechanism. | 🟢 low |
| 5 | **Round continuity / scoring UI**: no round counter, no "best of N", no chooser rotation. Scores live only in `sessionStorage` (`scores_${roomId}`) and are not shown on the lobby or game pages after navigation. Missing persistent score panel + round rotation across letters/numbers/conundrum. | 🟡 medium |
| 8 | **E2E coverage for setup fix**: no Playwright coverage for the host-now-sees-chooser-controls flow (host navigates lobby → letters/numbers and the Vowel/Consonant or Large/Small buttons render) or for conundrum host auto-start (host lands on conundrum page and scrambled tiles appear without manual action). | 🟡 medium |
| 9 | **Heartbeat/staleness**: game pages heartbeat every 10s via `useMultiplayerRound`, but a backgrounded tab may be pruned (`STALE_TIMEOUT = 20s` in `db.ts`) and silently dropped from host election. Consider tying pruning to actual PeerJS connection state. | 🟢 low |
| 10 | **Single-solo-player conundrum**: when the host is the only participant, conundrum auto-starts immediately with no opponent to buzz against. Decide intended behaviour (allow solo solve, or require ≥2 players before auto-start). | 🟢 low |

## Progress Log

- 2026-07-14: All 46 tasks completed. 217 unit tests passing, 0 TypeScript errors. Express/Next.js/PeerJS server on port 3000.
- 2026-07-14 #2: Fixed multiplayer host game setup. Root cause: navigating lobby → round page wiped the peer identity (`PeerManager.disconnect()` cleared `peerId`/`joinedAt` from sessionStorage) and POSTed a roster `leave`, so each round page spun up a brand-new unregistered peer → `hostId === peer.peerId` was false for everyone → host saw "Waiting for host" in all three modes; additionally the round pages never re-established the P2P mesh (no `connectToPeer`) and the conundrum host's `startRound` only broadcast, never updated its own UI. Changes: (a) `PeerManager.disconnect({ clearIdentity })` now only wipes identity on a real leave; `joinedAt` is accepted via `PeerConfig`; (b) lobby cleanup preserves identity and no longer leaves the roster on unmount — a new `handleLeaveRoom` and `beforeunload` do the real teardown; (c) new `useMultiplayerRound` hook re-joins the roster, rebuilds the peer mesh, runs heartbeats, resolves real nickname and host identity for all three round pages; (d) conundrum `startRound` now self-updates the host UI and auto-starts from the hook's `onReady`. 217 unit tests still pass, 0 TypeScript errors.
- 2026-07-15: Cleaned up AGENTS.todo.md. Removed item "Timer duration selector" (implemented in lobby). Verified all remaining items against codebase. Added test tags block. Updated AGENTS.md with rule #12.
- 2026-07-15 #2: Completed items 4, 6, 7. **#4 (conundrum answer leak)**: removed `answer` from `conundrum-start` broadcast → peers now only receive the scrambled word; answer stays on host until guess result or timeout. **#6 (host-change dead code)**: removed `onHostChange` from `PeerConfig`, the `host-change` message branches from lobby + all 3 round pages, and the no-op in `useMultiplayerRound`. Host changes rely entirely on `player-list` recalculation. **#7 (dead imports)**: removed unused `handlePlayerJoin`, `handlePlayerLeave`, `createLeaderState` imports and dead `leaderStateRef` from lobby page.

## Rules
- Only open or unverified TODOs stay in this file
- Completed items are removed (not just marked done)
- The test tag block at the top is always present and must be run before any change
- A subagent must review the file at least once per session before modifying it
