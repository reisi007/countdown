import { Peer, DataConnection } from "peerjs";

export type PeerMessage = {
  type: string;
  payload: unknown;
  senderId: string;
  timestamp: number;
};

export type PeerConfig = {
  peerId?: string;
  joinedAt?: number;
  host: string;
  port: number;
  path: string;
  onMessage: (msg: PeerMessage) => void;
  onPlayerJoin: (peerId: string) => void;
  onPlayerLeave: (peerId: string) => void;
};

const PEER_ID_KEY = "peerId";
const JOINED_AT_KEY = "joinedAt";

export function getStoredPeerId(): string | null {
  if (typeof sessionStorage === "undefined") return null;
  return sessionStorage.getItem(PEER_ID_KEY);
}

export function getStoredJoinedAt(): number | null {
  if (typeof sessionStorage === "undefined") return null;
  const raw = sessionStorage.getItem(JOINED_AT_KEY);
  return raw ? parseInt(raw, 10) : null;
}

function generateFreshId(): string {
  const id = Math.random().toString(36).substring(2, 10);
  if (typeof sessionStorage !== "undefined") sessionStorage.setItem(PEER_ID_KEY, id);
  return id;
}

function generateId(): string {
  const stored = getStoredPeerId();
  if (stored) return stored;
  return generateFreshId();
}

export class PeerManager {
  private peer!: Peer;
  private connections: Map<string, DataConnection>;
  private config: PeerConfig;
  private joinedAt: number;
  private destroyed = false;
  private roomReady = false;
  private connectResolve: (() => void) | null = null;
  private connectReject: ((err: Error) => void) | null = null;
  private connectTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(config: PeerConfig) {
    this.connections = new Map();
    this.config = config;
    if (config.joinedAt !== undefined) {
      this.joinedAt = config.joinedAt;
      if (typeof sessionStorage !== "undefined") sessionStorage.setItem(JOINED_AT_KEY, String(config.joinedAt));
    } else {
      const stored = getStoredJoinedAt();
      if (stored !== null) {
        this.joinedAt = stored;
      } else {
        this.joinedAt = Date.now();
        if (typeof sessionStorage !== "undefined") sessionStorage.setItem(JOINED_AT_KEY, String(this.joinedAt));
      }
    }

    const id = config.peerId ?? generateId();
    this.createPeer(id);
  }

  private createPeer(id: string) {
    this.peer = new Peer(id, {
      host: this.config.host,
      port: this.config.port,
      path: this.config.path,
      debug: 1,
    });

    this.peer.on("open", () => {
      this.roomReady = true;
      if (this.connectTimeout) {
        clearTimeout(this.connectTimeout);
        this.connectTimeout = null;
      }
      this.connectResolve?.();
      this.connectResolve = null;
      this.connectReject = null;
    });

    this.peer.on("connection", (conn) => {
      this.handleIncomingConnection(conn);
    });

    this.peer.on("disconnected", () => {
      if (!this.destroyed) this.peer.reconnect();
    });

    this.peer.on("error", (err) => {
      const errType = (err as { type?: string }).type;
      const msg = (err as { message?: string }).message ?? "";
      const isTaken = errType === "unavailable-id" || msg.includes("is taken");
      if (isTaken) {
        if (typeof sessionStorage !== "undefined") {
          sessionStorage.removeItem(PEER_ID_KEY);
          sessionStorage.removeItem(JOINED_AT_KEY);
        }
        this.destroyed = true;
        this.peer.destroy();
        this.connections.clear();
        this.destroyed = false;
        const newId = Math.random().toString(36).substring(2, 10);
        if (typeof sessionStorage !== "undefined") sessionStorage.setItem(PEER_ID_KEY, newId);
        this.joinedAt = Date.now();
        if (typeof sessionStorage !== "undefined") sessionStorage.setItem(JOINED_AT_KEY, String(this.joinedAt));
        this.createPeer(newId);
        return;
      }
      console.error("[PeerManager]", err);
    });
  }

  get peerId(): string {
    return this.peer.id;
  }

  getJoinedAt(): number {
    return this.joinedAt;
  }

  get connectedPeerIds(): string[] {
    return Array.from(this.connections.keys());
  }

  /**
   * Resolves once the underlying Peer connection is open. Idempotent: repeated
   * calls (e.g. React StrictMode double-mount in dev) resolve immediately after
   * the first open. Handles "unavailable-id" by regenerating the id and retrying
   * automatically.
   */
  connectToRoom(): Promise<void> {
    if (this.roomReady) return Promise.resolve();

    return new Promise<void>((resolve, reject) => {
      this.connectResolve = resolve;
      this.connectReject = reject;

      this.connectTimeout = setTimeout(() => {
        this.connectReject?.(new Error("Connection timed out"));
        this.connectResolve = null;
        this.connectReject = null;
        this.connectTimeout = null;
      }, 10000);

      if (this.peer.open) {
        this.roomReady = true;
        if (this.connectTimeout) {
          clearTimeout(this.connectTimeout);
          this.connectTimeout = null;
        }
        this.connectResolve?.();
        this.connectResolve = null;
        this.connectReject = null;
      }
    });
  }

  connectToPeer(peerId: string): Promise<DataConnection> {
    return new Promise((resolve, reject) => {
      if (this.connections.has(peerId)) {
        resolve(this.connections.get(peerId)!);
        return;
      }

      const conn = this.peer.connect(peerId, { reliable: true });

      const timeout = setTimeout(() => {
        reject(new Error(`Connection to ${peerId} timed out`));
      }, 10000);

      conn.on("open", () => {
        clearTimeout(timeout);
        if (!this.connections.has(peerId)) {
          this.connections.set(peerId, conn);
          this.setupConnection(conn, peerId);
        }
        resolve(conn);
      });

      conn.on("error", (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  }

  broadcast(message: Omit<PeerMessage, "senderId" | "timestamp">): void {
    const msg: PeerMessage = {
      ...message,
      senderId: this.peerId,
      timestamp: Date.now(),
    };

    for (const conn of this.connections.values()) {
      if (conn.open) {
        conn.send(msg);
      }
    }
  }

  sendTo(
    peerId: string,
    message: Omit<PeerMessage, "senderId" | "timestamp">,
  ): void {
    const conn = this.connections.get(peerId);
    if (conn?.open) {
      const msg: PeerMessage = {
        ...message,
        senderId: this.peerId,
        timestamp: Date.now(),
      };
      conn.send(msg);
    }
  }

  disconnect(options: { clearIdentity?: boolean } = {}): void {
    const { clearIdentity = false } = options;
    this.destroyed = true;
    this.roomReady = false;
    if (this.connectTimeout) {
      clearTimeout(this.connectTimeout);
      this.connectTimeout = null;
    }
    this.connectResolve = null;
    this.connectReject = null;
    for (const conn of this.connections.values()) {
      conn.close();
    }
    this.connections.clear();
    this.peer.destroy();
    if (clearIdentity && typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem(PEER_ID_KEY);
      sessionStorage.removeItem(JOINED_AT_KEY);
    }
  }

  private handleIncomingConnection(conn: DataConnection): void {
    const peerId = conn.peer;
    if (!this.connections.has(peerId)) {
      this.connections.set(peerId, conn);
      this.setupConnection(conn, peerId);
    }
    this.config.onPlayerJoin(peerId);
  }

  private setupConnection(conn: DataConnection, peerId: string): void {
    conn.on("data", (data) => {
      this.config.onMessage(data as PeerMessage);
    });

    conn.on("close", () => {
      this.handleDisconnect(peerId);
    });

    conn.on("error", (err) => {
      console.error(`[PeerManager] connection error with ${peerId}:`, err);
      this.handleDisconnect(peerId);
    });
  }

  private handleDisconnect(peerId: string): void {
    const conn = this.connections.get(peerId);
    if (conn) {
      conn.close();
      this.connections.delete(peerId);
    }
    this.config.onPlayerLeave(peerId);
  }
}
