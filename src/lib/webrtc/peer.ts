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
  /**
   * Fired when the signaling connection is lost and does not recover within a
   * short grace period. The host app uses this to drop the player from the
   * server roster immediately, tying pruning to the real PeerJS connection
   * state instead of waiting for the heartbeat timeout.
   */
  onSignalingDisconnect?: () => void;
  /**
   * Fired when the signaling connection recovers after a drop. The host app
   * uses this to re-register the player with the server roster.
   */
  onSignalingReconnect?: () => void;
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
  private currentId: string | null = null;
  private destroyed = false;
  private roomReady = false;
  private connectResolve: (() => void) | null = null;
  private connectReject: ((err: Error) => void) | null = null;
  private connectTimeout: ReturnType<typeof setTimeout> | null = null;
  private staleCleanup: (() => void) | null = null;
  private staleTimer: ReturnType<typeof setTimeout> | null = null;
  private staleTimeoutMs = 10 * 60 * 1000;
  private disconnectNotifyTimer: ReturnType<typeof setTimeout> | null = null;
  private wasDisconnected = false;

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
    this.currentId = id;
    this.peer = new Peer(id, {
      host: this.config.host,
      port: this.config.port,
      path: this.config.path,
      debug: 1,
    });

    this.peer.on("open", () => {
      this.roomReady = true;
      this.clearStaleTimer();
      this.clearDisconnectNotifyTimer();
      if (this.wasDisconnected) {
        this.wasDisconnected = false;
        this.config.onSignalingReconnect?.();
      }
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
      if (this.destroyed) return;
      // PeerJS nulls `_id` on disconnect and reconnects using `_lastServerId`.
      // Guard against a missing `_lastServerId` so the reconnect keeps the
      // same id (and therefore the same token the signaling server expects).
      const internal = this.peer as unknown as { _lastServerId?: string | null };
      if (!internal._lastServerId && this.currentId) {
        internal._lastServerId = this.currentId;
      }
      this.peer.reconnect();
      this.scheduleStaleCleanup();
      this.wasDisconnected = true;
      this.scheduleDisconnectNotify();
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
        this.clearStaleTimer();
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

  /**
   * Swaps the message/join/leave handlers. Used by the shared session peer so
   * pages can re-attach their own handlers as the user navigates between the
   * lobby and round pages without creating a new Peer instance.
   */
  setHandlers(config: PeerConfig): void {
    this.config = config;
  }

  /**
   * Registers a cleanup callback that fires when the peer has been disconnected
   * from the signaling server without reconnecting for `staleTimeoutMs`. Used
   * by the shared session peer to release a dead session so its id never blocks
   * a fresh one.
   */
  setStaleCleanup(fn: (() => void) | null): void {
    this.staleCleanup = fn;
  }

  private clearStaleTimer(): void {
    if (this.staleTimer) {
      clearTimeout(this.staleTimer);
      this.staleTimer = null;
    }
  }

  private scheduleStaleCleanup(): void {
    this.clearStaleTimer();
    this.staleTimer = setTimeout(() => {
      this.staleTimer = null;
      if (this.destroyed || this.peer.open) return;
      this.staleCleanup?.();
    }, this.staleTimeoutMs);
  }

  /**
   * After a signaling drop, wait a short grace period. If the connection has
   * not recovered (`open`) by then, the player is effectively gone, so notify
   * the host app to remove it from the server roster. A transient blip that
   * reconnects within the grace window never fires this.
   */
  private scheduleDisconnectNotify(): void {
    this.clearDisconnectNotifyTimer();
    this.disconnectNotifyTimer = setTimeout(() => {
      this.disconnectNotifyTimer = null;
      if (this.destroyed || this.peer.open) return;
      this.config.onSignalingDisconnect?.();
    }, 3000);
  }

  private clearDisconnectNotifyTimer(): void {
    if (this.disconnectNotifyTimer) {
      clearTimeout(this.disconnectNotifyTimer);
      this.disconnectNotifyTimer = null;
    }
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
   * the first open. If the signaling socket dropped, reconnects with the same
   * id instead of creating a new one. Handles "unavailable-id" by regenerating
   * the id and retrying automatically.
   */
  async connectToRoom(): Promise<void> {
    if (this.roomReady && this.peer.open) return Promise.resolve();
    if (!this.destroyed && this.peer.disconnected && this.currentId) {
      this.peer.reconnect();
    }

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
      const existing = this.connections.get(peerId);
      if (existing && existing.open) {
        resolve(existing);
        return;
      }
      if (existing) {
        this.connections.delete(peerId);
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
    this.clearStaleTimer();
    this.clearDisconnectNotifyTimer();
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

let sessionPeer: PeerManager | null = null;

/**
 * Returns the shared session PeerManager, creating it on first use. The peer
 * instance — its signaling socket and its P2P mesh — survives navigation
 * between the lobby and round pages. Reusing one instance avoids reconnecting
 * with the same id while the previous client is still registered with the
 * signaling server (which would surface as "ID is taken").
 */
export function acquireSessionPeer(config: PeerConfig): PeerManager {
  if (sessionPeer) {
    sessionPeer.setHandlers(config);
    return sessionPeer;
  }
  sessionPeer = new PeerManager(config);
  sessionPeer.setStaleCleanup(() => {
    // The session has been disconnected without a successful reconnect for
    // 10 minutes. Release it so the id and identity never block a fresh one.
    releaseSessionPeer();
  });
  return sessionPeer;
}

/**
 * Tears down the shared session peer and clears the persisted identity. Only
 * called on a real leave (Leave Room button, tab close), never on navigation.
 */
export function releaseSessionPeer(): void {
  if (sessionPeer) {
    sessionPeer.disconnect({ clearIdentity: true });
    sessionPeer = null;
  }
}
