# Countdown

A web-based clone of the classic TV game show *Countdown*, featuring solo play and
peer-to-peer (WebRTC) multiplayer. Play the Letters, Numbers, and Conundrum rounds
alone or with friends in a live room — no account required.

## Features

- **Solo mode** — Letters, Numbers, and Conundrum rounds playable on your own.
- **Multiplayer mode** — Host a room and share the link; play together over WebRTC.
- **Implicit lobbies** — The oldest participant in a room automatically becomes the
  host. If the host leaves, the next participant takes over instantly.
- **International** — English (GB/US) and German locales, with proper dictionary
  validation per locale.
- **Self-hosted** — Single Docker container, no database, no external services.

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js (App Router) 15 |
| Runtime | Node.js 26 |
| Server | Express + PeerJS |
| Styling | Tailwind CSS v4 + daisyUI v5 |
| Language | TypeScript (strict) |
| Package manager | pnpm |
| Tests | Vitest (unit) + Playwright (E2E) |
| Deployment | Docker + GitHub Container Registry + Portainer |

## Getting Started (Local Dev)

```bash
pnpm install
pnpm dev      # Express + Next.js + PeerJS on http://localhost:3000
```

## Scripts

```bash
pnpm dev        # Start the dev server
pnpm build      # Production build
pnpm start      # Start the production server
pnpm test       # Run Vitest unit tests
pnpm test:e2e   # Run Playwright E2E tests (requires a built app)
pnpm typecheck  # TypeScript strict-mode type checking
```

## Project Structure

```
countdown/
├── server.js              # Express custom server (Next.js + PeerJS on port 3000)
├── src/
│   ├── app/[locale]/      # Localized routes (main menu, solo, room)
│   ├── lib/game/          # Letters, Numbers, Conundrum round logic
│   ├── lib/webrtc/        # PeerJS wrapper & leader election
│   ├── lib/i18n/          # Dictionaries (CSW, NWL, German)
│   └── middleware.ts      # Locale redirect & i18n routing
├── public/locales/        # UI translation files
├── tests/                 # Unit & E2E tests
└── deploy/                # Docker Compose deployment
```

## How It Works

- **Single-artifact container** — Express serves the Next.js app and the integrated
  PeerJS signaling server on a single port. No CORS, no inter-container networking.
- **No database** — All state is in-memory. Multiplayer state lives ephemerally in
  the host browser; word dictionaries are loaded into memory on startup.
- **Implicit lobbies (leader election)** — Players who open a room URL receive a
  `joinedAt` timestamp. The oldest participant is the host and controls the timer and
  round logic. On host disconnect, the next-oldest takes over within milliseconds.
- **i18n** — The URL locale segment (`/en-GB`, `/en-US`, `/de`) selects the language
  and dictionary. `/` redirects to the browser's preferred locale.

## Deployment

The app builds into a single Docker image and is pushed to GHCR on every push to
`main`. Portainer pulls the new image and restarts the container.

```bash
cd deploy
docker compose pull
docker compose up -d
```

The service runs behind a Caddy reverse proxy at `countdown.all-the.rest`.

See [`deploy/README.md`](deploy/README.md) for full deployment instructions.

## License

See repository for license details.
