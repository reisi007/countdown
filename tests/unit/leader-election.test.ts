import { describe, it, expect } from "vitest";
import {
  electHost,
  handlePlayerJoin,
  handlePlayerLeave,
  createLeaderState,
  type PlayerInfo,
  type LeaderState,
} from "@/lib/webrtc/leader-election";

describe("createLeaderState", () => {
  it("returns object with null hostId and empty players array", () => {
    const state = createLeaderState();
    expect(state).toEqual({ hostId: null, players: [] });
  });
});

describe("electHost", () => {
  it("returns null for empty players list", () => {
    expect(electHost([])).toBeNull();
  });

  it("returns the peerId for a single player", () => {
    const players: PlayerInfo[] = [{ peerId: "p1", joinedAt: 100 }];
    expect(electHost(players)).toBe("p1");
  });

  it("returns the oldest player when two players join", () => {
    const players: PlayerInfo[] = [
      { peerId: "p1", joinedAt: 200 },
      { peerId: "p2", joinedAt: 100 },
    ];
    expect(electHost(players)).toBe("p2");
  });

  it("returns the oldest player when three players join", () => {
    const players: PlayerInfo[] = [
      { peerId: "p1", joinedAt: 300 },
      { peerId: "p2", joinedAt: 100 },
      { peerId: "p3", joinedAt: 200 },
    ];
    expect(electHost(players)).toBe("p2");
  });

  it("returns the first player when joinedAt timestamps are tied", () => {
    const players: PlayerInfo[] = [
      { peerId: "p1", joinedAt: 100 },
      { peerId: "p2", joinedAt: 100 },
    ];
    expect(electHost(players)).toBe("p1");
  });

  it("handles players with future timestamps gracefully", () => {
    const future = Date.now() + 100000;
    const players: PlayerInfo[] = [
      { peerId: "p1", joinedAt: future },
      { peerId: "p2", joinedAt: future + 1000 },
    ];
    expect(electHost(players)).toBe("p1");
  });

  it("correctly identifies the oldest among a large number of players", () => {
    const players: PlayerInfo[] = Array.from({ length: 100 }, (_, i) => ({
      peerId: `p${i}`,
      joinedAt: 1000 + i * 10,
    }));
    expect(electHost(players)).toBe("p0");
  });

  it("works with very large timestamp values", () => {
    const players: PlayerInfo[] = [
      { peerId: "p1", joinedAt: Number.MAX_SAFE_INTEGER },
      { peerId: "p2", joinedAt: Number.MAX_SAFE_INTEGER - 1 },
    ];
    expect(electHost(players)).toBe("p2");
  });
});

describe("handlePlayerJoin", () => {
  it("adds first player to empty state and elects as host", () => {
    const state = createLeaderState();
    const result = handlePlayerJoin(state, { peerId: "p1", joinedAt: 100 });
    expect(result.hostId).toBe("p1");
    expect(result.players).toHaveLength(1);
    expect(result.players[0]).toEqual({ peerId: "p1", joinedAt: 100 });
  });

  it("adds new player and keeps oldest as host", () => {
    const state: LeaderState = {
      hostId: "p1",
      players: [
        { peerId: "p1", joinedAt: 100 },
        { peerId: "p2", joinedAt: 200 },
      ],
    };
    const result = handlePlayerJoin(state, { peerId: "p3", joinedAt: 300 });
    expect(result.hostId).toBe("p1");
    expect(result.players).toHaveLength(3);
  });

  it("changes host when new player is the oldest", () => {
    const state: LeaderState = {
      hostId: "p2",
      players: [
        { peerId: "p2", joinedAt: 200 },
        { peerId: "p3", joinedAt: 300 },
      ],
    };
    const result = handlePlayerJoin(state, { peerId: "p1", joinedAt: 100 });
    expect(result.hostId).toBe("p1");
    expect(result.players).toHaveLength(3);
  });

  it("keeps host unchanged when new player is not the oldest", () => {
    const state: LeaderState = {
      hostId: "p1",
      players: [
        { peerId: "p1", joinedAt: 100 },
        { peerId: "p2", joinedAt: 200 },
      ],
    };
    const result = handlePlayerJoin(state, { peerId: "p3", joinedAt: 300 });
    expect(result.hostId).toBe("p1");
  });

  it("updates existing player entry when duplicate peerId joins", () => {
    const state: LeaderState = {
      hostId: "p1",
      players: [
        { peerId: "p1", joinedAt: 100 },
        { peerId: "p2", joinedAt: 200 },
      ],
    };
    const result = handlePlayerJoin(state, { peerId: "p2", joinedAt: 50 });
    expect(result.hostId).toBe("p2");
    expect(result.players).toHaveLength(2);
    expect(result.players.find((p) => p.peerId === "p2")?.joinedAt).toBe(50);
  });

  it("preserves existing players in the list when adding new ones", () => {
    const state: LeaderState = {
      hostId: "p1",
      players: [{ peerId: "p1", joinedAt: 100 }],
    };
    const result = handlePlayerJoin(state, { peerId: "p2", joinedAt: 200 });
    expect(result.players).toEqual(
      expect.arrayContaining([
        { peerId: "p1", joinedAt: 100 },
        { peerId: "p2", joinedAt: 200 },
      ]),
    );
  });
});

describe("handlePlayerLeave", () => {
  it("elects next oldest player as new host when host leaves", () => {
    const state: LeaderState = {
      hostId: "p1",
      players: [
        { peerId: "p1", joinedAt: 100 },
        { peerId: "p2", joinedAt: 200 },
        { peerId: "p3", joinedAt: 300 },
      ],
    };
    const result = handlePlayerLeave(state, "p1");
    expect(result.hostId).toBe("p2");
    expect(result.players).toHaveLength(2);
  });

  it("keeps host unchanged when a non-host player leaves", () => {
    const state: LeaderState = {
      hostId: "p1",
      players: [
        { peerId: "p1", joinedAt: 100 },
        { peerId: "p2", joinedAt: 200 },
      ],
    };
    const result = handlePlayerLeave(state, "p2");
    expect(result.hostId).toBe("p1");
    expect(result.players).toHaveLength(1);
  });

  it("returns empty state when last player leaves", () => {
    const state: LeaderState = {
      hostId: "p1",
      players: [{ peerId: "p1", joinedAt: 100 }],
    };
    const result = handlePlayerLeave(state, "p1");
    expect(result.hostId).toBeNull();
    expect(result.players).toEqual([]);
  });

  it("returns unchanged state when leaving player does not exist", () => {
    const state: LeaderState = {
      hostId: "p1",
      players: [
        { peerId: "p1", joinedAt: 100 },
        { peerId: "p2", joinedAt: 200 },
      ],
    };
    const result = handlePlayerLeave(state, "p999");
    expect(result.hostId).toBe("p1");
    expect(result.players).toHaveLength(2);
  });

  it("makes the remaining player host when one of two leaves", () => {
    const state: LeaderState = {
      hostId: "p2",
      players: [
        { peerId: "p1", joinedAt: 100 },
        { peerId: "p2", joinedAt: 200 },
      ],
    };
    const result = handlePlayerLeave(state, "p2");
    expect(result.hostId).toBe("p1");
    expect(result.players).toHaveLength(1);
  });
});

describe("Combined scenarios", () => {
  it("full flow: create → join A → join B → join C → leave host B → verify C is new host", () => {
    let state = createLeaderState();
    expect(state.hostId).toBeNull();

    state = handlePlayerJoin(state, { peerId: "A", joinedAt: 300 });
    expect(state.hostId).toBe("A");

    state = handlePlayerJoin(state, { peerId: "B", joinedAt: 200 });
    expect(state.hostId).toBe("B");

    state = handlePlayerJoin(state, { peerId: "C", joinedAt: 100 });
    expect(state.hostId).toBe("C");

    state = handlePlayerLeave(state, "C");
    expect(state.hostId).toBe("B");
    expect(state.players).toHaveLength(2);
  });

  it("host failover with 5 players: oldest always takes over", () => {
    let state = createLeaderState();
    for (let i = 0; i < 5; i++) {
      state = handlePlayerJoin(state, {
        peerId: `p${i}`,
        joinedAt: 100 + i * 10,
      });
    }

    expect(state.hostId).toBe("p0");
    expect(state.players).toHaveLength(5);

    state = handlePlayerLeave(state, "p0");
    expect(state.hostId).toBe("p1");

    state = handlePlayerLeave(state, "p1");
    expect(state.hostId).toBe("p2");

    state = handlePlayerLeave(state, "p2");
    expect(state.hostId).toBe("p3");

    state = handlePlayerLeave(state, "p3");
    expect(state.hostId).toBe("p4");

    state = handlePlayerLeave(state, "p4");
    expect(state.hostId).toBeNull();
    expect(state.players).toEqual([]);
  });

  it("network jitter: players joining out of order, oldest always wins", () => {
    let state = createLeaderState();

    state = handlePlayerJoin(state, { peerId: "late", joinedAt: 500 });
    expect(state.hostId).toBe("late");

    state = handlePlayerJoin(state, { peerId: "early", joinedAt: 100 });
    expect(state.hostId).toBe("early");

    state = handlePlayerJoin(state, { peerId: "middle", joinedAt: 300 });
    expect(state.hostId).toBe("early");

    state = handlePlayerJoin(state, { peerId: "mid2", joinedAt: 200 });
    expect(state.hostId).toBe("early");

    state = handlePlayerLeave(state, "early");
    expect(state.hostId).toBe("mid2");
  });
});
