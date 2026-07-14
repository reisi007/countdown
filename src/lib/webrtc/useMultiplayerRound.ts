"use client";
import { useEffect, useRef, useState } from "react";
import { PeerManager, PeerMessage, getStoredPeerId, getStoredJoinedAt } from "./peer";
import type { PlayerRecord } from "@/lib/db";

export type RoundPeer = {
  peer: PeerManager;
  myPeerId: string;
  myNickname: string;
  isHost: boolean;
  hostName: string;
};

export type UseMultiplayerRoundOptions = {
  roomId: string;
  onMessage: (msg: PeerMessage, peer: PeerManager) => void;
  /**
   * Invoked once the roster has been fetched and host identity resolved.
   * Useful for a host that needs to auto-start a round (e.g. conundrum).
   */
  onReady?: (round: RoundPeer) => void;
};

type RoomPlayer = { peerId: string; joinedAt: number; nickname: string };

function electHostFromList(players: RoomPlayer[]): string | null {
  if (players.length === 0) return null;
  return players.reduce((oldest, p) => (p.joinedAt < oldest.joinedAt ? p : oldest)).peerId;
}

/**
 * Shared connection lifecycle for an in-round multiplayer page
 * (letters / numbers / conundrum).
 *
 * On mount it builds a PeerManager using the identity persisted by the lobby,
 * re-registers that identity with the room roster, re-establishes the
 * peer-to-peer mesh, and keeps the roster warm via heartbeats. Host identity is
 * derived from the server roster so it stays consistent across navigation.
 */
export function useMultiplayerRound({ roomId, onMessage, onReady }: UseMultiplayerRoundOptions) {
  const [isHost, setIsHost] = useState(false);
  const [myPeerId, setMyPeerId] = useState<string | null>(null);
  const [myNickname, setMyNickname] = useState("");
  const [hostName, setHostName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const peerRef = useRef<PeerManager | null>(null);
  const messageHandlerRef = useRef(onMessage);
  const readyHandlerRef = useRef(onReady);

  useEffect(() => {
    messageHandlerRef.current = onMessage;
  }, [onMessage]);
  useEffect(() => {
    readyHandlerRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    const hostname = window.location.hostname;
    let peer: PeerManager;
    let mounted = true;

    async function init() {
      try {
        const storedPeerId = getStoredPeerId();
        const storedJoinedAt = getStoredJoinedAt();

        peer = new PeerManager({
          host: hostname,
          port: 3000,
          path: "/signaling",
          peerId: storedPeerId ?? undefined,
          joinedAt: storedJoinedAt ?? undefined,
          onMessage: (msg: PeerMessage) => {
            if (mounted) messageHandlerRef.current(msg, peer);
          },
          onPlayerJoin: () => {},
          onPlayerLeave: () => {},
        });

        peerRef.current = peer;
        await peer.connectToRoom(roomId);
        if (!mounted) return;

        const pid = peer.peerId;
        setMyPeerId(pid);

        // Re-register with the room roster so host election still sees us.
        const storedNick =
          typeof window !== "undefined" ? localStorage.getItem(`nickname_${roomId}`) : null;
        const nickname = storedNick ?? `Player-${pid.substring(0, 4)}`;
        setMyNickname(nickname);

        const joinRes = await fetch(`/api/rooms/${roomId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "join",
            player: {
              peerId: pid,
              joinedAt: peer.getJoinedAt(),
              nickname,
            },
          }),
        });
        const joinData = await joinRes.json();
        const roomPlayers = (joinData.players ?? []) as RoomPlayer[];

        const hostId = electHostFromList(roomPlayers);
        setIsHost(hostId === pid);
        const hostPlayer = roomPlayers.find((p) => p.peerId === hostId);
        if (hostPlayer) setHostName(hostPlayer.nickname);

        // Re-establish the peer-to-peer mesh with everyone already in the room.
        for (const p of roomPlayers) {
          if (p.peerId !== pid) {
            try {
              await peer.connectToPeer(p.peerId);
            } catch {
              // Peer may not be reachable yet; it will dial back via "connection".
            }
          }
        }

        if (mounted) {
          peer.broadcast({ type: "request-player-list", payload: null });
          readyHandlerRef.current?.({
            peer,
            myPeerId: pid,
            myNickname: nickname,
            isHost: hostId === pid,
            hostName: hostPlayer?.nickname ?? "",
          });
        }
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "Connection failed");
      }
    }

    init();

    const heartbeat = setInterval(() => {
      const p = peerRef.current;
      if (p) {
        fetch(`/api/rooms/${roomId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "heartbeat", peerId: p.peerId }),
        }).catch(() => {});
      }
    }, 10_000);

    function onUnload() {
      const p = peerRef.current;
      if (p) {
        const pid = p.peerId;
        navigator.sendBeacon(
          `/api/rooms/${roomId}`,
          new Blob([JSON.stringify({ action: "leave", peerId: pid })], { type: "application/json" }),
        );
        p.disconnect({ clearIdentity: true });
      }
    }
    window.addEventListener("beforeunload", onUnload);

    return () => {
      clearInterval(heartbeat);
      window.removeEventListener("beforeunload", onUnload);
      mounted = false;
      // Navigating back to the lobby or between rounds keeps the identity and
      // roster entry intact; only a real leave (beforeunload / Leave Room)
      // tears them down.
      if (peerRef.current) {
        peerRef.current.disconnect();
        peerRef.current = null;
      }
    };
  }, [roomId]);

  return {
    peerRef,
    isHost,
    setIsHost,
    myPeerId,
    myNickname,
    hostName,
    setHostName,
    error,
  };
}

export type PlayerListPayload = PlayerRecord[];
