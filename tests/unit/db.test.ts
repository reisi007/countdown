import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import {
  createRoom,
  updateRoom,
  clearAllRooms,
  pruneStalePlayers,
} from "@/lib/db";
import type { Room, PlayerRecord } from "@/lib/db";
import { GET, POST } from "@/app/api/rooms/[roomId]/route";

function makeRoom(overrides?: Partial<Room>): Room {
  return {
    roomId: "test123",
    players: [],
    gameState: {},
    createdAt: 0,
    ...overrides,
  };
}

function player(
  peerId: string,
  overrides?: Partial<PlayerRecord>,
): PlayerRecord {
  return {
    peerId,
    joinedAt: 0,
    nickname: `Player-${peerId}`,
    ...overrides,
  };
}

describe("pruneStalePlayers", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(100_000);
  });

  it("keeps all players with recent heartbeats", () => {
    const room = makeRoom({
      players: [
        player("p1", { lastHeartbeat: 99_500 }),
        player("p2", { lastHeartbeat: 99_800 }),
        player("p3", { lastHeartbeat: 100_000 }),
      ],
    });

    const result = pruneStalePlayers(room);

    expect(result).toHaveLength(3);
  });

  it("removes players with stale heartbeats (>20s old)", () => {
    const room = makeRoom({
      players: [
        player("p1", { lastHeartbeat: 79_000 }),
        player("p2", { lastHeartbeat: 99_800 }),
        player("p3", { lastHeartbeat: 60_000 }),
      ],
    });

    const result = pruneStalePlayers(room);

    expect(result).toHaveLength(1);
    expect(result[0].peerId).toBe("p2");
  });

  it("removes players with no lastHeartbeat", () => {
    const room = makeRoom({
      players: [
        player("p1", { lastHeartbeat: undefined }),
        player("p2", { lastHeartbeat: 99_000 }),
      ],
    });

    const result = pruneStalePlayers(room);

    expect(result).toHaveLength(1);
    expect(result[0].peerId).toBe("p2");
  });

  it("returns empty array for empty player list", () => {
    const room = makeRoom({ players: [] });

    const result = pruneStalePlayers(room);

    expect(result).toEqual([]);
  });

  it("keeps single player with recent heartbeat", () => {
    const room = makeRoom({
      players: [player("p1", { lastHeartbeat: 95_000 })],
    });

    const result = pruneStalePlayers(room);

    expect(result).toHaveLength(1);
    expect(result[0].peerId).toBe("p1");
  });

  it("mixed: keeps only recent when others are stale or missing", () => {
    const room = makeRoom({
      players: [
        player("p1", { lastHeartbeat: 99_500 }),
        player("p2", { lastHeartbeat: 70_000 }),
        player("p3"),
      ],
    });

    const result = pruneStalePlayers(room);

    expect(result).toHaveLength(1);
    expect(result[0].peerId).toBe("p1");
  });
});

describe("POST /api/rooms/[roomId]", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(100_000);
    clearAllRooms();
  });

  async function post(
    roomId: string,
    body: unknown,
  ): Promise<Response> {
    const request = new NextRequest(
      `http://localhost:3000/api/rooms/${roomId}`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    );
    return POST(request, { params: Promise.resolve({ roomId }) });
  }

  it("join: adds a new player with heartbeat timestamp", async () => {
    const body = { action: "join", player: { peerId: "p1", joinedAt: 50_000, nickname: "Alice" } };
    const response = await post("test123", body);
    const data = await response.json();

    expect(data.players).toHaveLength(1);
    expect(data.players[0].peerId).toBe("p1");
    expect(data.players[0].nickname).toBe("Alice");
    expect(data.players[0].joinedAt).toBe(50_000);
    expect(data.players[0].lastHeartbeat).toBe(100_000);
  });

  it("join: existing player updates heartbeat but not duplicated", async () => {
    await post("test123", {
      action: "join",
      player: { peerId: "p1", joinedAt: 50_000, nickname: "Alice" },
    });

    vi.setSystemTime(110_000);

    const response = await post("test123", {
      action: "join",
      player: { peerId: "p1", joinedAt: 50_000, nickname: "Alice" },
    });
    const data = await response.json();

    expect(data.players).toHaveLength(1);
    expect(data.players[0].peerId).toBe("p1");
    expect(data.players[0].lastHeartbeat).toBe(110_000);
  });

  it("leave: removes the player", async () => {
    await post("test123", {
      action: "join",
      player: { peerId: "p1", joinedAt: 50_000, nickname: "Alice" },
    });

    const response = await post("test123", {
      action: "leave",
      peerId: "p1",
    });
    const data = await response.json();

    expect(data.players).toHaveLength(0);
  });

  it("heartbeat: updates lastHeartbeat", async () => {
    await post("test123", {
      action: "join",
      player: { peerId: "p1", joinedAt: 50_000, nickname: "Alice" },
    });

    vi.setSystemTime(120_000);

    const response = await post("test123", {
      action: "heartbeat",
      peerId: "p1",
    });
    const data = await response.json();

    expect(data.players).toHaveLength(1);
    expect(data.players[0].lastHeartbeat).toBe(120_000);
  });

  it("heartbeat: stale player is also removed", async () => {
    createRoom("test123");
    updateRoom("test123", {
      players: [
        { peerId: "p1", joinedAt: 50_000, nickname: "Alice", lastHeartbeat: 50_000 },
        { peerId: "p2", joinedAt: 99_500, nickname: "Bob", lastHeartbeat: 99_500 },
      ],
    });

    vi.setSystemTime(100_020);

    const response = await post("test123", {
      action: "heartbeat",
      peerId: "p2",
    });
    const data = await response.json();

    expect(data.players).toHaveLength(1);
    expect(data.players[0].peerId).toBe("p2");
    expect(data.players[0].lastHeartbeat).toBe(100_020);
  });
});

describe("GET /api/rooms/[roomId]", () => {
  beforeEach(() => {
    clearAllRooms();
  });

  async function get(roomId: string): Promise<Response> {
    const request = new NextRequest(
      `http://localhost:3000/api/rooms/${roomId}`,
    );
    return GET(request, { params: Promise.resolve({ roomId }) });
  }

  it("returns players list for existing room", async () => {
    createRoom("test123");
    updateRoom("test123", {
      players: [
        { peerId: "p1", joinedAt: 50_000, nickname: "Alice", lastHeartbeat: 99_500 },
      ],
    });

    const response = await get("test123");
    const data = await response.json();

    expect(data.players).toHaveLength(1);
    expect(data.players[0].peerId).toBe("p1");
  });

  it("returns empty array for non-existent room", async () => {
    const response = await get("nonexistent");
    const data = await response.json();

    expect(data.players).toEqual([]);
  });
});
