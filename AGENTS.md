# AGENTS.md

Countdown — a web-based clone of the classic TV game show with solo and WebRTC multiplayer modes.

## Tech Stack

| Layer | Choice | Version |
|-------|--------|---------|
| Framework | Next.js (App Router) | 15.x |
| Runtime | Node.js | 22 LTS |
| Server | Express (custom server) | 4.x |
| WebRTC Signaling | PeerJS | 1.x |
| Styling | Tailwind CSS v4 + daisyUI v5 | latest |
| Font | Lexend Deca (Google Fonts) | — |
| Language | TypeScript | 5.x |
| Package manager | pnpm | latest |
| Unit tests | Vitest | latest |
| E2E tests | Playwright | latest |
| CI/CD | GitHub Actions + Docker multi-stage | — |
| Registry | GitHub Container Registry (GHCR) | — |
| Deployment trigger | Portainer Webhook | — |

## Project Structure

```
countdown/
├── server.js              # Express custom server (Next.js + PeerJS on port 3000)
├── Dockerfile             # Multi-stage build
├── deploy/
│   ├── docker-compose.yml  # Production deployment config
│   └── README.md            # Deployment instructions
├── src/
│   ├── app/
│   │   └── [locale]/
│   │       ├── page.tsx           # Main menu
│   │       ├── solo/
│   │       │   ├── letters/
│   │       │   │   └── page.tsx   # Solo letters game
│   │       │   └── numbers/
│   │       │       └── page.tsx   # Solo numbers game
│   │       └── room/
│   │           └── [roomId]/
│   │               └── page.tsx   # P2P multiplayer lobby
│   ├── lib/
│   │   ├── game/
│   │   │   ├── letters.ts         # Letters round logic & validator
│   │   │   ├── numbers.ts         # Numbers round logic & recursive solver
│   │   │   └── conundrum.ts       # Conundrum anagram logic
│   │   ├── webrtc/
│   │   │   ├── peer.ts            # PeerJS wrapper & connection manager
│   │   │   └── leader-election.ts # Host election & failover logic
│   │   ├── i18n/
│   │   │   └── dictionaries/      # CSW (en-GB), NWL (en-US), German word lists
│   │   └── db.ts                  # In-memory store (no persistent DB)
│   ├── styles/
│   │   └── globals.css            # Tailwind v4 imports + daisyUI theme
│   └── middleware.ts              # Locale redirect & i18n routing
├── public/
│   └── locales/
│       ├── en-GB.json
│       ├── en-US.json
│       └── de.json
├── tests/
│   ├── unit/
│   │   ├── numbers-solver.test.ts
│   │   ├── letters-validator.test.ts
│   │   └── leader-election.test.ts
│   └── e2e/
│       └── multiplayer.spec.ts
├── .github/
│   └── workflows/
│       └── deploy.yml             # Build → push GHCR → Portainer webhook
├── vitest.config.ts
├── playwright.config.ts
├── tsconfig.json
├── next.config.ts
├── package.json
└── AGENTS.md
```

## Architecture Decisions

### Single-Artifact Container
All services run in one Docker container on port 3000:
- Express catches `/signaling/*` → forwards to integrated PeerJS server
- Express catches everything else → forwards to Next.js request handler
- No CORS needed, no inter-container networking, no external DB

### No Database
All state is in-memory. Multiplayer state lives ephemerally in the host browser.
Word dictionaries are loaded into memory on server start.

### Implicit Lobbies (Leader Election)
- Players join a room URL → each gets a `joinedAt` timestamp
- Oldest `joinedAt` wins host role
- On host disconnect, next-oldest takes over within milliseconds
- Host controls timer and round-start logic

### i18n via URL Locale Segment
- `/` → redirects to browser's preferred locale (e.g., `/de`)
- All pages use `[locale]` dynamic segment
- SSR-compatible, no cookie-based language switching
- German umlaut mapping: Ä→AE, Ö→OE, Ü→UE, ß→SS (both on board display and input)

### Word Dictionaries (In-Memory)
| Locale | Dictionary |
|--------|-------------|
| en-GB | Collins Scrabble Words (CSW) |
| en-US | NASPA Word List (NWL) |
| de | German standard dictionary |

## UI Conventions (Tailwind CSS v4 + daisyUI v5)

### Global CSS (`globals.css`)
```css
@import "tailwindcss";
@plugin "daisyui";
@plugin "daisyui/theme" {
  name: "countdown";
  default: true;
  color-scheme: dark;
  --color-base-100: oklch(20% 0.04 260);   /* Deep Space Blue #0a192f */
  --color-primary: oklch(75% 0.18 75);       /* Countdown Gold #f59e0b */
  --color-secondary: oklch(50% 0.19 265);    /* Deep Studio Blue #1d4ed8 */
  /* ... remaining required color vars */
}
```

### daisyUI Rules
1. Use daisyUI semantic color names (`bg-primary`, `text-base-content`) — never raw Tailwind colors for themed elements
2. Use `base-100` for page backgrounds, `primary` for the single most important element on each page
3. No `dark:` prefix needed for daisyUI colors — they auto-adapt per theme
4. Prefer daisyUI component classes over custom CSS
5. If daisyUI doesn't have a matching component, build with Tailwind utilities
6. Tags are in English. No German in source code.

### Key Components
- **Letter/Number tiles**: `kbd` component with yellow border via Tailwind `border-warning`
- **Timer**: `radial-progress` component
- **Buzzer**: `btn` component
- **Layout**: `navbar` for top bar, responsive `grid` for game board

### Font
Lexend Deca loaded via `next/font/google` — applied as the primary sans-serif in the body.

## Code Conventions

- **Language**: All code, comments, variable names, commit messages in English
- **Types**: Always use strict TypeScript. No `any` except well-documented edge cases.
- **Exports**: Prefer named exports. Default exports only for Next.js pages and layouts.
- **Naming**: camelCase for variables/functions, PascalCase for components/classes, kebab-case for files
- **Imports**: Group imports: (1) Node builtins, (2) third-party, (3) internal `@/` aliases
- **Server components**: Default in Next.js App Router. Use `"use client"` only when needed (state, effects, browser APIs)
- **CSS**: Use Tailwind utility classes exclusively. No custom CSS files. No inline styles.
- **No comments**: Code should be self-documenting. Add comments only for non-obvious business logic.

## Testing Strategy

### Vitest (unit tests, CI)
- `numbers-solver.test.ts`: Verifies exact solutions, best approximations, no fractional intermediates
- `letters-validator.test.ts`: Subset checks, case sensitivity, umlaut mapping (de), dictionary lookups
- `leader-election.test.ts`: Simulates timestamps, verifies host election, failover ordering

### Playwright (E2E, local)
- Multi-client: Two browser contexts → lobby join → WebRTC connection verification
- Host failover: Close host window → verify remaining client takes over <1s

### Running Tests
```bash
pnpm test          # Vitest unit tests
pnpm test:e2e      # Playwright (requires built app)
```

## CI/CD Pipeline (GitHub Actions)

1. **Trigger**: Push to `main`
2. **Build VM**: Node 22, pnpm, install deps
3. **Test**: Run Vitest suite
4. **Docker Build** (multi-stage):
   - Stage 1 (Install): `pnpm install --frozen-lockfile`
   - Stage 2 (Build): `pnpm build` (Next.js production build)
   - Stage 3 (Prune): `pnpm install --prod --frozen-lockfile`
   - Stage 4 (Runner): Copy build artifacts + server.js + prod deps → slim `node:22-slim` image (~120-150 MB)
5. **Push**: `docker push` to GHCR (private repo → private image)
6. **Deploy**: POST webhook to Portainer → pull new image → restart container (<10s downtime)
7. **Local deploy**: `cd deploy && docker compose pull && docker compose up -d`

## Getting Started (Local Dev)

```bash
pnpm install
pnpm dev          # Starts Express + Next.js + PeerJS on :3000
pnpm build        # Production build
pnpm start        # Production start
pnpm test         # Vitest
pnpm test:e2e     # Playwright
```

## Deployment

```bash
cd deploy
docker compose pull
docker compose up -d
```

The service runs at `countdown.all-the.rest` behind a Caddy reverse proxy.

## Key Rules for Agents

1. Read `AGENTS.md` first before making any changes
2. Follow the project structure exactly
3. Write all code in English (comments, logs, UI strings via i18n)
4. Use daisyUI components whenever possible — read component docs before coding
5. Always use semantic daisyUI color names, never raw Tailwind colors for themed UI
6. No persistent database — everything is in-memory
7. TypeScript strict mode, no `any`
8. Keep Docker image under 150 MB
9. All game logic must be pure functions where possible (testable)
10. WebRTC/PeerJS code must handle disconnects gracefully (leader election)
11. Run implementation and verification in parallel when using subagents — never wait for one to finish before starting the other
12. **AGENTS.todo.md discipline**: Only open or unverified TODOs live in `AGENTS.todo.md`. Completed items are removed, not checked off. Before any change, run the `#tag: all` tests (or a targeted tag). Have a subagent review any new TODO before adding it.

## Mandatory Verification

After every code change, run these commands **in order** and ensure they all pass:

```bash
pnpm typecheck    # TypeScript strict mode — must exit 0
pnpm test         # Vitest unit tests — all 216+ tests must pass
pnpm build        # Production build — must complete without errors
```

If any command fails, fix the errors before marking work as done. No exceptions.

## Forbidden Patterns

| Pattern | Why | Fix |
|---------|-----|-----|
| `<style jsx>` in components | Causes `__webpack_require__.n is not a function` crash on soft navigation in Next.js 15 App Router | Define `@keyframes` in `globals.css` and reference by name in inline `style` or Tailwind `animate-*` utility |
| Calling `useMultiplayerRound` after defining callbacks that use its return values | Temporal dead zone — TypeScript errors and potential runtime crashes | Use ref-delegation: pass `(msg, peer) => realHandlerRef.current(msg, peer)` as `onMessage`, define the real handler **after** the hook call, sync with `useEffect(() => { realHandlerRef.current = realHandler; }, [realHandler])` |
| Inline styles for themed colors | Bypasses daisyUI theming | Use daisyUI color classes (`bg-primary`, `text-base-content`, etc.) |
| `dark:` prefix for themed elements | daisyUI auto-adapts per theme | Use semantic color names without `dark:` prefix |

## useMultiplayerRound Ref-Delegate Pattern

When a multiplayer page's `handleMessage` needs values from `useMultiplayerRound` (e.g. `setIsHost`, `myPeerId`, `setHostName`), use this pattern to avoid the temporal dead zone:

```typescript
// 1. Create refs for values needed before hook call
const realHandlerRef = useRef<(msg: PeerMessage, peer: PeerManager) => void>(() => {});
const myPeerIdRef = useRef<string | null>(null);
const setIsHostFnRef = useRef<(v: boolean) => void>(() => {});

// 2. Call hook with a wrapper that delegates to the ref
const { peerRef, isHost, setIsHost, myPeerId, ... } = useMultiplayerRound({
  roomId,
  onMessage: (msg, peer) => realHandlerRef.current(msg, peer),
});

// 3. Sync refs after hook
useEffect(() => { myPeerIdRef.current = myPeerId; }, [myPeerId]);
useEffect(() => { setIsHostFnRef.current = setIsHost; }, [setIsHost]);

// 4. Define the real handler NOW (after hook), using refs
const handleMessage = useCallback((msg, peer) => {
  setIsHostFnRef.current(...);    // safe — via ref
  if (msg.peerId === myPeerIdRef.current) { ... }  // safe — via ref
}, [/* deps */]);

// 5. Wire up
useEffect(() => { realHandlerRef.current = handleMessage; }, [handleMessage]);
```
