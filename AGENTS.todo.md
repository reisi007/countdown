# AGENTS.todo.md — Current Work

## Status

- 245 unit tests passing (`pnpm test`)
- 16 E2E tests passing (`pnpm test:e2e` after `pnpm build`)
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
| 5 | **Round continuity / scoring UI**: no round counter, no "best of N", no chooser rotation. Scores live only in `sessionStorage` (`scores_${roomId}`) and are not shown on the lobby or game pages after navigation. Missing persistent score panel + round rotation across letters/numbers/conundrum. | 🟡 medium |
| 8 | **E2E coverage for setup fix**: `numbers-multiplayer.spec.ts` now covers the host-sees-chooser-controls flow (host navigates lobby → numbers, Small button renders, target shown to both). Still missing: Playwright coverage for host navigating lobby → letters (Vowel/Consonant render) and for conundrum host auto-start (host lands on conundrum page and scrambled tiles appear without manual action). | 🟡 medium |
| 9 | **Heartbeat/staleness**: game pages heartbeat every 10s via `useMultiplayerRound`, but a backgrounded tab may be pruned (`STALE_TIMEOUT = 20s` in `db.ts`) and silently dropped from host election. Consider tying pruning to actual PeerJS connection state. | 🟢 low |
| 10 | **Single-solo-player conundrum**: when the host is the only participant, conundrum auto-starts immediately with no opponent to buzz against. Decide intended behaviour (allow solo solve, or require ≥2 players before auto-start). | 🟢 low |

## Progress Log

- 2026-07-14: All 46 tasks completed. 217 unit tests passing, 0 TypeScript errors. Express/Next.js/PeerJS server on port 3000.
- 2026-07-14 #2: Fixed multiplayer host game setup. Root cause: navigating lobby → round page wiped the peer identity (`PeerManager.disconnect()` cleared `peerId`/`joinedAt` from sessionStorage) and POSTed a roster `leave`, so each round page spun up a brand-new unregistered peer → `hostId === peer.peerId` was false for everyone → host saw "Waiting for host" in all three modes; additionally the round pages never re-established the P2P mesh (no `connectToPeer`) and the conundrum host's `startRound` only broadcast, never updated its own UI. Changes: (a) `PeerManager.disconnect({ clearIdentity })` now only wipes identity on a real leave; `joinedAt` is accepted via `PeerConfig`; (b) lobby cleanup preserves identity and no longer leaves the roster on unmount — a new `handleLeaveRoom` and `beforeunload` do the real teardown; (c) new `useMultiplayerRound` hook re-joins the roster, rebuilds the peer mesh, runs heartbeats, resolves real nickname and host identity for all three round pages; (d) conundrum `startRound` now self-updates the host UI and auto-starts from the hook's `onReady`. 217 unit tests still pass, 0 TypeScript errors.
- 2026-07-15: Cleaned up AGENTS.todo.md. Removed item "Timer duration selector" (implemented in lobby). Verified all remaining items against codebase. Added test tags block. Updated AGENTS.md with rule #12.
- 2026-07-15 #2: Completed items 4, 6, 7. **#4 (conundrum answer leak)**: removed `answer` from `conundrum-start` broadcast → peers now only receive the scrambled word; answer stays on host until guess result or timeout. **#6 (host-change dead code)**: removed `onHostChange` from `PeerConfig`, the `host-change` message branches from lobby + all 3 round pages, and the no-op in `useMultiplayerRound`. Host changes rely entirely on `player-list` recalculation. **#7 (dead imports)**: removed unused `handlePlayerJoin`, `handlePlayerLeave`, `createLeaderState` imports and dead `leaderStateRef` from lobby page.
- 2026-08-01: Completed items 11, 12, 13. **#11 (two players join)**: root cause was a test race — `waitForURL(/\/room\//)` matched `/room/new` before the lobby's `router.replace` to the real room id, so the guest created their own room. Fixed by waiting for a URL that contains `/room/` but does not end with `/room/new`. **#12 (failover locator)**: `text=host` matched both the `Host` badge and the `You are the host` paragraph → use `getByText("You are the host")`. Additionally, WebRTC peer connections do not close promptly on an abruptly killed tab, so the guest never detected host departure via P2P-close; the lobby now runs a 1s host watchdog polling `/signaling/peerjs/peers` and fails over (2 consecutive misses ≈ 2s) to the next-oldest player. **#13 (numbers drawing phase)**: several test bugs (ESM `__dirname` → `import.meta.dirname`, cwd pointed 3 levels too high, wrong "Choose an operation" assertion, strict-mode `text=Numbers Round`, host/guest role swap) fixed; the real implementation bug was PeerJS "ID is taken" when a round page created a new `Peer` with the same id while the lobby peer was still registered. Fixed with a shared session `PeerManager` singleton (`acquireSessionPeer`/`releaseSessionPeer` in `peer.ts`): one Peer instance (socket + P2P mesh) survives lobby↔round navigation, handlers are swapped via `setHandlers`, and a 10-minute stale watchdog releases dead sessions. `numbers-multiplayer.spec.ts` no longer spawns its own :3099 server — Playwright's shared `webServer` (with `reuseExistingServer`) handles it. 245 unit tests + 16 E2E tests pass; typecheck and build green.
- 2026-08-01 #2: Completed item 2 (E2E in CI). `build.yml` gained a parallel `e2e` job (`npx playwright install --with-deps chromium` → `pnpm build` → `pnpm test:e2e`, Playwright HTML report uploaded as artifact) running alongside `test`; `build-and-push` now needs both `test` and `e2e`.
- 2026-08-01 #3: Removed completed item 3 (numbers resubmit). `keepBestSubmission` (commit `b2ffa19`) lets players resubmit and keeps the closest result; covered by `scoring.test.ts`. Updated item 8 to note that `numbers-multiplayer.spec.ts` now covers the host-chooser flow. 245 unit tests + 16 E2E tests pass.
- 2026-08-07: Fixed CI E2E failures caused by the React Compiler not actually compiling under Next.js 16.3 + Turbopack (the Babel-based `reactCompiler` transform is only wired into webpack). The lobby page's `useEffect` deps (`recalculateHost`/`updateHost`/`updatePlayerState`) were recreated every render → infinite re-render loop (~3300 runs/5s) → host-failover and numbers-round-start E2E tests failed. Fix: enable `experimental.turbopackRustReactCompiler: true` in next.config.ts (native Rust compiler, introduced in Next 16.3) — verified active via `react.memo_cache_sentinel` in built chunks; hardened `numbers-multiplayer.spec.ts` with a role-based heading locator (the `text=Numbers Round` locator also matched the Next.js route announcer div). 245 unit + 16 E2E tests pass; typecheck, build, lint green. AGENTS.md updated with a note that both `reactCompiler: true` and `experimental.turbopackRustReactCompiler: true` are required under Turbopack.

## Rules
- Only open or unverified TODOs stay in this file
- Completed items are removed (not just marked done)
- The test tag block at the top is always present and must be run before any change
- A subagent must review the file at least once per session before modifying it
