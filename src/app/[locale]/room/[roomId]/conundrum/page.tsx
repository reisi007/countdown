"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PeerManager, PeerMessage } from "@/lib/webrtc/peer";
import { useMultiplayerRound } from "@/lib/webrtc/useMultiplayerRound";
import { ConundrumGame } from "@/components/ConundrumGame";
import {
  checkSolution,
  getConundrumWord,
  scrambleWord,
  type ConundrumState,
} from "@/lib/game/conundrum";

const BUZZER_TIMEOUT = 5;
const ROUND_TIMEOUT = 30;

type BuzzEntry = {
  peerId: string;
  timestamp: number;
  nickname: string;
};

type GamePhase =
  | "waiting"
  | "playing"
  | "buzzed"
  | "answering"
  | "solved"
  | "timeout";

export default function MultiplayerConundrumPage() {
  const params = useParams();
  const locale = params.locale as string;
  const roomId = params.roomId as string;

  const [phase, setPhase] = useState<GamePhase>("waiting");
  const [scrambled, setScrambled] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(ROUND_TIMEOUT);
  const [buzzerName, setBuzzerName] = useState("");
  const [answerReveal, setAnswerReveal] = useState("");
  const [solvedByName, setSolvedByName] = useState("");
  const [guess, setGuess] = useState("");
  const [guessError, setGuessError] = useState<string | null>(null);

  const roundTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const answerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const answerRef = useRef("");
  const buzzerIdRef = useRef<string | null>(null);
  const hasBuzzedRef = useRef(false);
  const roundActiveRef = useRef(false);
  const phaseRef = useRef<GamePhase>("waiting");
  const isHostRef = useRef(false);
  const myPeerIdRef = useRef<string | null>(null);
  const myNicknameRef = useRef<string>("");
  const setIsHostFnRef = useRef<(v: boolean) => void>(() => {});

  const realHandlerRef = useRef<(msg: PeerMessage, peer: PeerManager) => void>(() => {});

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const startRound = useCallback((peer: PeerManager) => {
    const word = getConundrumWord(locale);
    const scrambledWord = scrambleWord(word);

    answerRef.current = word;
    roundActiveRef.current = true;
    buzzerIdRef.current = null;
    hasBuzzedRef.current = false;

    setScrambled(scrambledWord);
    setBuzzerName("");
    setAnswerReveal("");
    setSolvedByName("");
    setGuess("");
    setGuessError(null);
    setPhase("playing");
    startRoundTimer(peer);

    peer.broadcast({
      type: "conundrum-start",
      payload: { scrambled: scrambledWord },
    });
  }, [locale]);

  const handleMessage = useCallback((msg: PeerMessage, peer: PeerManager) => {
    switch (msg.type) {
      case "player-list": {
        const list = msg.payload as Array<{ peerId: string; joinedAt: number; nickname: string }>;
        const hostPeerId = list.length > 0
          ? list.reduce((oldest, p) => (p.joinedAt < oldest.joinedAt ? p : oldest)).peerId
          : null;
        setIsHostFnRef.current(hostPeerId === peer.peerId);
        if (phaseRef.current === "waiting" && hostPeerId === peer.peerId) {
          startRound(peer);
        }
        break;
      }
      case "conundrum-start": {
        const payload = msg.payload as { scrambled: string };
        setScrambled(payload.scrambled);
        buzzerIdRef.current = null;
        hasBuzzedRef.current = false;
        roundActiveRef.current = true;
        setBuzzerName("");
        setAnswerReveal("");
        setSolvedByName("");
        setGuess("");
        setGuessError(null);
        setPhase("playing");
        startRoundTimer(peer);
        break;
      }
      case "buzz": {
        if (!roundActiveRef.current) return;
        const buzz = msg.payload as BuzzEntry;
        if (isHostRef.current && buzzerIdRef.current === null) {
          buzzerIdRef.current = buzz.peerId;
          setBuzzerName(buzz.nickname);
          setPhase("buzzed");
          stopRoundTimer();
          peer.broadcast({
            type: "buzzer-granted",
            payload: { peerId: buzz.peerId, nickname: buzz.nickname },
          });
          startAnswerTimer(peer, buzz.peerId);
        }
        break;
      }
      case "buzzer-granted": {
        if (!roundActiveRef.current) return;
        const granted = msg.payload as { peerId: string; nickname: string };
        buzzerIdRef.current = granted.peerId;
        setBuzzerName(granted.nickname);
        setPhase("buzzed");
        stopRoundTimer();
        if (granted.peerId === myPeerIdRef.current) {
          setPhase("answering");
          setTimeRemaining(BUZZER_TIMEOUT);
          startAnswerTimer(peer, granted.peerId);
        }
        break;
      }
      case "conundrum-guess": {
        const guessPayload = msg.payload as { peerId: string; guess: string; nickname: string };
        if (!isHostRef.current) return;
        const correct = checkSolution(
          { answer: answerRef.current } as ConundrumState,
          guessPayload.guess,
        );
        clearAllTimers();
        roundActiveRef.current = false;
        setAnswerReveal(answerRef.current);
        peer.broadcast({
          type: "conundrum-result",
          payload: {
            peerId: guessPayload.peerId,
            guess: guessPayload.guess,
            correct,
            nickname: guessPayload.nickname,
            answer: answerRef.current,
          },
        });
        break;
      }
      case "conundrum-result": {
        clearAllTimers();
        roundActiveRef.current = false;
        const result = msg.payload as {
          peerId: string;
          guess: string;
          correct: boolean;
          nickname: string;
          answer: string;
        };
        setAnswerReveal(result.answer);
        if (result.correct) {
          setSolvedByName(result.peerId === myPeerIdRef.current ? "you" : result.nickname);
          setPhase("solved");
        } else {
          setPhase("timeout");
        }
        break;
      }
      case "conundrum-timeout": {
        clearAllTimers();
        roundActiveRef.current = false;
        setAnswerReveal((msg.payload as { answer: string }).answer);
        setPhase("timeout");
        break;
      }
      case "timer-sync": {
        if (phaseRef.current === "playing") {
          setTimeRemaining(msg.payload as number);
        }
        break;
      }
    }
  }, [startRound]);

  const { peerRef, isHost, setIsHost, myPeerId, myNickname, error } = useMultiplayerRound({
    roomId,
    onMessage: (msg, peer) => realHandlerRef.current(msg, peer),
    onReady: (round) => {
      if (round.isHost) startRound(round.peer);
    },
  });

  useEffect(() => {
    realHandlerRef.current = handleMessage;
  }, [handleMessage]);

  useEffect(() => {
    isHostRef.current = isHost;
  }, [isHost]);

  useEffect(() => { myPeerIdRef.current = myPeerId; }, [myPeerId]);
  useEffect(() => { myNicknameRef.current = myNickname; }, [myNickname]);
  useEffect(() => { setIsHostFnRef.current = setIsHost; }, [setIsHost]);

  function startRoundTimer(_peer: PeerManager) {
    clearAllTimers();
    setTimeRemaining(ROUND_TIMEOUT);

    const peer = peerRef.current;
    roundTimerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          if (peer && isHostRef.current) {
            roundActiveRef.current = false;
            peer.broadcast({ type: "conundrum-timeout", payload: { answer: answerRef.current } });
          }
          clearAllTimers();
          return 0;
        }
        if (peer && isHostRef.current) {
          peer.broadcast({ type: "timer-sync", payload: next });
        }
        return next;
      });
    }, 1000);
  }

  function stopRoundTimer() {
    if (roundTimerRef.current) {
      clearInterval(roundTimerRef.current);
      roundTimerRef.current = null;
    }
  }

  function startAnswerTimer(peer: PeerManager, _buzzerPeerId: string) {
    if (answerTimerRef.current) clearTimeout(answerTimerRef.current);

    answerTimerRef.current = setTimeout(() => {
      clearAllTimers();
      roundActiveRef.current = false;
      peer.broadcast({
        type: "conundrum-result",
        payload: {
          peerId: buzzerIdRef.current,
          guess: "",
          correct: false,
          nickname: buzzerName,
          answer: answerRef.current,
        },
      });
    }, BUZZER_TIMEOUT * 1000);
  }

  function clearAllTimers() {
    if (roundTimerRef.current) {
      clearInterval(roundTimerRef.current);
      roundTimerRef.current = null;
    }
    if (answerTimerRef.current) {
      clearTimeout(answerTimerRef.current);
      answerTimerRef.current = null;
    }
  }

  function buzz() {
    const peer = peerRef.current;
    if (!peer || !roundActiveRef.current || hasBuzzedRef.current) return;

    hasBuzzedRef.current = true;

    const entry: BuzzEntry = {
      peerId: peer.peerId,
      timestamp: Date.now(),
      nickname: myNicknameRef.current,
    };

    peer.broadcast({ type: "buzz", payload: entry });
  }

  function submitGuess() {
    const word = guess.trim().toUpperCase();
    if (!word) {
      setGuessError("Enter your answer");
      return;
    }
    setGuessError(null);

    const peer = peerRef.current;
    if (!peer) return;

    peer.broadcast({
      type: "conundrum-guess",
      payload: { peerId: peer.peerId, guess: word, nickname: myNicknameRef.current },
    });
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
        <div className="card bg-error/20 text-error-content max-w-md w-full">
          <div className="card-body items-center text-center">
            <h2 className="card-title text-error">Connection Error</h2>
            <p>{error}</p>
            <Link
              href={`/${locale}/room/${roomId}`}
              className="btn btn-primary mt-4"
            >
              Back to Lobby
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col p-4">
      <div className="navbar mb-4">
        <div className="flex-1">
          <Link
            href={`/${locale}/room/${roomId}`}
            className="btn btn-ghost btn-sm"
          >
            &larr; Lobby
          </Link>
        </div>
        <div className="flex-none">
          <h1 className="text-xl font-bold text-primary">Conundrum</h1>
        </div>
      </div>

      <div className="flex flex-col items-center gap-6 flex-1">
        <ConundrumGame
          locale={locale}
          scrambled={scrambled}
          phase={phase}
          guess={guess}
          onGuessChange={(value) => { setGuess(value.toUpperCase()); setGuessError(null); }}
          onSubmitGuess={submitGuess}
          guessError={guessError}
          timeRemaining={timeRemaining}
          timerDuration={phase === "answering" ? BUZZER_TIMEOUT : ROUND_TIMEOUT}
          onBuzz={buzz}
          hasBuzzed={hasBuzzedRef.current}
          buzzerName={buzzerName}
          isBuzzer={buzzerIdRef.current === myPeerIdRef.current}
          answerReveal={answerReveal}
          solvedByName={solvedByName}
          showBuzzButton={phase === "playing"}
          backLink={`/${locale}/room/${roomId}`}
        />
      </div>
    </div>
  );
}
