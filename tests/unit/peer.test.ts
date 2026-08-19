import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { FakePeer } = vi.hoisted(() => {
  class FakePeer {
    id: string;
    open = false;
    connected = false;
    destroyed = false;
    private handlers: Record<string, Array<(...args: unknown[]) => void>> = {};
    constructor(id: string) {
      this.id = id;
    }
    on(event: string, cb: (...args: unknown[]) => void) {
      (this.handlers[event] ??= []).push(cb);
    }
    emit(event: string, ...args: unknown[]) {
      (this.handlers[event] ?? []).forEach((cb) => cb(...args));
    }
    reconnect() {}
    destroy() {
      this.destroyed = true;
    }
    // connect() only used by connectToPeer, not exercised here.
    connect() {
      return {} as unknown;
    }
  }
  return { FakePeer };
});

vi.mock("peerjs", () => ({
  Peer: FakePeer,
  DataConnection: class {},
}));

import { PeerManager } from "@/lib/webrtc/peer";

type TestPeer = {
  open: boolean;
  emit: (event: string, ...args: unknown[]) => void;
};

describe("PeerManager connection-state callbacks", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("re-registers on reconnect and removes on a sustained drop", () => {
    const onDisconnect = vi.fn();
    const onReconnect = vi.fn();

    const pm = new PeerManager({
      host: "localhost",
      port: 3000,
      path: "/signaling",
      onMessage: () => {},
      onPlayerJoin: () => {},
      onPlayerLeave: () => {},
      onSignalingDisconnect: onDisconnect,
      onSignalingReconnect: onReconnect,
    });

    const peer = (pm as unknown as { peer: TestPeer }).peer;

    // Initial open must not fire the reconnect callback (nothing dropped yet).
    peer.open = true;
    peer.emit("open");
    expect(onReconnect).not.toHaveBeenCalled();
    expect(onDisconnect).not.toHaveBeenCalled();

    // Signaling drops but recovers within the 3s grace window: only a
    // re-register fires, never a disconnect.
    peer.open = false;
    peer.emit("disconnected");
    vi.advanceTimersByTime(1000);
    expect(onDisconnect).not.toHaveBeenCalled();

    peer.open = true;
    peer.emit("open");
    expect(onReconnect).toHaveBeenCalledTimes(1);
    expect(onDisconnect).not.toHaveBeenCalled();

    // A second drop that persists past the grace window removes the player.
    peer.open = false;
    peer.emit("disconnected");
    vi.advanceTimersByTime(3000);
    expect(onDisconnect).toHaveBeenCalledTimes(1);

    // A later recovery re-registers again.
    peer.open = true;
    peer.emit("open");
    expect(onReconnect).toHaveBeenCalledTimes(2);
  });

  it("does not fire disconnect for a transient blip under the grace window", () => {
    const onDisconnect = vi.fn();
    const onReconnect = vi.fn();

    const pm = new PeerManager({
      host: "localhost",
      port: 3000,
      path: "/signaling",
      onMessage: () => {},
      onPlayerJoin: () => {},
      onPlayerLeave: () => {},
      onSignalingDisconnect: onDisconnect,
      onSignalingReconnect: onReconnect,
    });

    const peer = (pm as unknown as { peer: TestPeer }).peer;
    peer.open = true;
    peer.emit("open");

    peer.open = false;
    peer.emit("disconnected");
    vi.advanceTimersByTime(2999);
    expect(onDisconnect).not.toHaveBeenCalled();

    peer.open = true;
    peer.emit("open");
    vi.advanceTimersByTime(10);
    expect(onDisconnect).not.toHaveBeenCalled();
    expect(onReconnect).toHaveBeenCalledTimes(1);
  });
});
