import { NextRequest, NextResponse } from "next/server";
import { createRoom, getRoom, updateRoom, pruneStalePlayers } from "@/lib/db";
import type { PlayerRecord, Room } from "@/lib/db";

function pruneStale(roomId: string) {
  const room = getRoom(roomId);
  if (!room) return;
  const alive = pruneStalePlayers(room);
  if (alive.length < room.players.length) {
    updateRoom(roomId, { players: alive });
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> },
) {
  const { roomId } = await params;
  pruneStale(roomId);
  const room = getRoom(roomId);
  return NextResponse.json({ players: room?.players ?? [] });
}

type JoinBody = { action: "join"; player: PlayerRecord };
type LeaveBody = { action: "leave"; peerId: string };
type HeartbeatBody = { action: "heartbeat"; peerId: string };

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> },
) {
  const { roomId } = await params;
  const body = (await request.json()) as JoinBody | LeaveBody | HeartbeatBody;

  let room = getRoom(roomId);
  if (!room) {
    room = createRoom(roomId);
  }

  if (body.action === "join") {
    const exists = room.players.some((p) => p.peerId === body.player.peerId);
    if (!exists) {
      updateRoom(roomId, {
        players: [...room.players, { ...body.player, lastHeartbeat: Date.now() }],
      });
    } else {
      updateRoom(roomId, {
        players: room.players.map((p) =>
          p.peerId === body.player.peerId ? { ...p, lastHeartbeat: Date.now() } : p,
        ),
      });
    }
  } else if (body.action === "leave") {
    updateRoom(roomId, {
      players: room.players.filter((p) => p.peerId !== body.peerId),
    });
    pruneStale(roomId);
  } else if (body.action === "heartbeat") {
    updateRoom(roomId, {
      players: room.players.map((p) =>
        p.peerId === body.peerId ? { ...p, lastHeartbeat: Date.now() } : p,
      ),
    });
    pruneStale(roomId);
  }

  const updated = getRoom(roomId);
  return NextResponse.json({ players: updated?.players ?? [] });
}
