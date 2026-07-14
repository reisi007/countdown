export type Room = {
  roomId: string;
  players: PlayerRecord[];
  gameState: Record<string, unknown>;
  createdAt: number;
};

export type PlayerRecord = {
  peerId: string;
  joinedAt: number;
  nickname: string;
  lastHeartbeat?: number;
};

const store = new Map<string, Room>();

export function createRoom(roomId: string): Room {
  const room: Room = {
    roomId,
    players: [],
    gameState: {},
    createdAt: Date.now(),
  };
  store.set(roomId, room);
  return room;
}

export function getRoom(roomId: string): Room | undefined {
  return store.get(roomId);
}

export function updateRoom(roomId: string, update: Partial<Room>): Room | undefined {
  const room = store.get(roomId);
  if (!room) return undefined;

  const updated: Room = { ...room, ...update };
  store.set(roomId, updated);
  return updated;
}

export function deleteRoom(roomId: string): boolean {
  return store.delete(roomId);
}

export function getAllRooms(): Room[] {
  return Array.from(store.values());
}

export function clearAllRooms(): void {
  store.clear();
}

const STALE_TIMEOUT = 20_000;

export function pruneStalePlayers(room: Room): PlayerRecord[] {
  const now = Date.now();
  return room.players.filter(
    (p) => p.lastHeartbeat && now - p.lastHeartbeat < STALE_TIMEOUT,
  );
}
