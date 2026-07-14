# Multiplayer Architecture

## Overview

Countdown uses WebRTC with PeerJS for peer-to-peer communication. Room state is maintained implicitly through leader election based on join timestamps.

## Connection Flow

1. Player opens room URL (e.g., `/en-GB/room/ABC123`)
2. PeerJS connects to signaling server at `ws://host:3000/signaling`
3. Player registers with `POST /api/rooms/:roomId` (action: "join")
4. Existing peers are discovered and mesh-connected

## Leader Election

- Each player has a `joinedAt` timestamp (Date.now() when PeerManager is constructed)
- Host = player with oldest `joinedAt`
- On host disconnect, next-oldest player takes over
- Host controls: timer start, tile drawing, round transitions

## Message Types

| Type | Direction | Payload |
|------|-----------|---------|
| `player-list` | Broadcast | Array of player records |
| `tiles-complete` | Host -> Peers | Final tile array |
| `word-submitted` | Player -> All | Word, length, timestamp |
| `num-submitted` | Player -> All | Expression, result, diff, timestamp |
| `timer-sync` | Host -> Peers | Remaining seconds |
| `host-change` | Broadcast | New host peerId |

## Room API

- `GET /api/rooms/:id` — Get room state
- `POST /api/rooms/:id` — Join (action: "join") or Leave (action: "leave")
- State stored in `src/lib/db.ts` (in-memory Map)

## Failover

- Host disconnects → remaining peers detect via PeerJS `close` event
- `handlePlayerLeave()` removes player, `electHost()` selects new host
- New host broadcasts `host-change` message
- Timer state cannot be recovered precisely; new host restarts

## Implementation

- `src/lib/webrtc/peer.ts` — PeerManager class wrapping PeerJS
- `src/lib/webrtc/leader-election.ts` — Pure functions for host election
- `src/lib/db.ts` — In-memory room store
