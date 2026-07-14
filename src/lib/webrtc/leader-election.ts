export type PlayerInfo = {
  peerId: string;
  joinedAt: number;
};

export type LeaderState = {
  hostId: string | null;
  players: PlayerInfo[];
};

export function electHost(players: PlayerInfo[]): string | null {
  if (players.length === 0) {
    return null;
  }

  return players.reduce((oldest, player) =>
    player.joinedAt < oldest.joinedAt ? player : oldest,
  ).peerId;
}

export function handlePlayerJoin(state: LeaderState, player: PlayerInfo): LeaderState {
  const existing = state.players.find((p) => p.peerId === player.peerId);
  const players = existing
    ? state.players.map((p) => (p.peerId === player.peerId ? player : p))
    : [...state.players, player];

  const hostId = electHost(players);

  return { hostId, players };
}

export function handlePlayerLeave(state: LeaderState, peerId: string): LeaderState {
  const players = state.players.filter((p) => p.peerId !== peerId);
  const hostId = electHost(players);

  return { hostId, players };
}

export function createLeaderState(): LeaderState {
  return { hostId: null, players: [] };
}
