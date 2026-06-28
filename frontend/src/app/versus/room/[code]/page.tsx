"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSocket } from "@/lib/socket";

type Player = {
  socketId: string;
  username: string;
  score: number;
};

type RoomStateWire = {
  code: string;
  hostId: string;
  folderId: string | null;
  started: boolean;
  currentIndex: number;
  players: Player[];
  currentQuestion: { id: string; question: string } | null;
};

type GuessResult = { correct: boolean };
type RevealPayload = { index: number; answer: string };
type ResultsPayload = RoomStateWire;

export default function VersusRoomPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const roomCode = String(params?.code || "").toUpperCase();

  const [socketId, setSocketId] = useState<string>("");
  const [room, setRoom] = useState<RoomStateWire | null>(null);

  const [currentCard, setCurrentCard] = useState<{ id: string; question: string; answer: string } | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [guess, setGuess] = useState("");
  const [guessFeedback, setGuessFeedback] = useState<"idle" | "right" | "wrong">("idle");
  const [finalResults, setFinalResults] = useState<ResultsPayload | null>(null);
  const [joining, setJoining] = useState(true);

  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);

  const isHost = useMemo(() => (!!room && !!socketId && room.hostId === socketId), [room, socketId]);

  const [versusName, setVersusName] = useState(
    () => (typeof window !== "undefined" ? localStorage.getItem("versusName") || "" : "")
  );


  // helpers
  const usernameFromStorage = () => (typeof window === "undefined" ? "Player" : localStorage.getItem("username") || "Player");
  const tokenExists = () => (typeof window === "undefined" ? false : !!localStorage.getItem("token"));

  // socket wiring
  useEffect(() => {
    if (!tokenExists()) {
      router.push("/login");
      return;
    }

    const socket = getSocket();
    socketRef.current = socket;

    // keep our own socket id in state
    const setNowIfConnected = () => {
      if (socket.connected) setSocketId(socket.id || "");
    };
    setNowIfConnected();

    const onConnect = () => setSocketId(socket.id || "");
    const onDisconnect = () => setSocketId("");

    const onConnectError = (err: any) => console.error("[socket] connect_error", err);

    const onRoomState = (rs: RoomStateWire) => {
      setRoom(rs);
      setFinalResults(null);
      if (rs.currentQuestion) {
        setCurrentCard({ id: rs.currentQuestion.id, question: rs.currentQuestion.question, answer: "" });
      } else {
        setCurrentCard(null);
      }
      setRevealed(false);
      setGuess("");
      setGuessFeedback("idle");
    };

    const onReveal = (payload: RevealPayload) => {
      setRevealed(true);
      setCurrentCard((c) => (c ? { ...c, answer: payload.answer } : c));
    };

    const onGuessResult = (gr: GuessResult) => setGuessFeedback(gr.correct ? "right" : "wrong");
    const onResults = (payload: ResultsPayload) => setFinalResults(payload);

    const onRoomClosed = () => {
      alert("The host closed the room.");
      router.push("/");
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("roomState", onRoomState);
    socket.on("revealAnswer", onReveal);
    socket.on("guessResult", onGuessResult);
    socket.on("results", onResults);
    socket.on("roomClosed", onRoomClosed);

    // join once connected
    const join = () => socket.emit("joinRoom", { code: roomCode, username: usernameFromStorage() });
    if (socket.connected) {
      join();
      setJoining(false);
    } else {
      socket.once("connect", () => {
        join();
        setJoining(false);
      });
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("roomState", onRoomState);
      socket.off("revealAnswer", onReveal);
      socket.off("guessResult", onGuessResult);
      socket.off("results", onResults);
      socket.off("roomClosed", onRoomClosed);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode]);

  // host actions
  const startGame = () => socketRef.current?.emit("startGame", { code: roomCode });
  const nextQuestion = () => socketRef.current?.emit("nextQuestion", { code: roomCode });
  const revealAnswer = () => socketRef.current?.emit("revealAnswer", { code: roomCode });
  const exitGame = () => socketRef.current?.emit("exitGame", { code: roomCode });

  // player action
  const submitGuess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim()) return;
    socketRef.current?.emit("submitGuess", { code: roomCode, guess });
  };

  const playersSorted = useMemo(
    () => room?.players?.slice().sort((a, b) => b.score - a.score) ?? [],
    [room]
  );

  const chip = (s: React.ReactNode) => (
    <span className="inline-block rounded-full px-2 py-0.5 text-xs border">{s}</span>
  );

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Versus Room</h1>
          <p className="text-sm text-gray-500">
            Code: <strong>{roomCode}</strong>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {room?.started ? chip("In progress") : chip("Not started")}
          {isHost ? chip("Host") : chip("Player")}
        </div>
      </header>

      {/* players / scores */}
      <section className="border rounded-xl p-4">
        <h2 className="font-medium mb-3">Players</h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {playersSorted.map((p) => (
            <li
              key={p.socketId}
              className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                p.socketId === room?.hostId ? "bg-gray-50" : ""
              }`}
            >
              <span>
                {p.username} {p.socketId === room?.hostId && chip("Host")}
              </span>
              <span className="font-semibold">{p.score}</span>
            </li>
          ))}
          {!playersSorted.length && <li className="text-sm text-gray-500">Waiting for players…</li>}
        </ul>
      </section>

      {/* debug: who am i vs host */}
      <p className="text-xs text-gray-500">me:{socketId || "—"} host:{room?.hostId || "—"}</p>

      {/* main card */}
      <section className="border rounded-2xl p-6">
        {!room?.started && !finalResults && (
          <div className="text-sm text-gray-600">
            {isHost ? "Press Start when everyone has joined." : "Waiting for host to start the game…"}
          </div>
        )}

        {room?.started && currentCard && (
          <div className="space-y-4">
            <div className="text-xs uppercase tracking-wide text-gray-500">Question</div>
            <div className="text-lg">{currentCard.question}</div>

            <div className="mt-4">
              {revealed ? (
                <div className="rounded-lg bg-gray-50 border p-4">
                  <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Answer</div>
                  <div className="font-medium">{currentCard.answer || "—"}</div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">Answer hidden</div>
              )}
            </div>

            {/* guess box for players */}
            {(
              <form onSubmit={submitGuess} className="flex gap-2">
                <input
                  className="flex-1 rounded-lg border px-3 py-2"
                  placeholder="Type your guess…"
                  value={guess}
                  onChange={(e) => {
                    setGuess(e.target.value);
                    setGuessFeedback("idle");
                  }}
                  disabled={revealed}
                />
                <button type="submit" className="rounded-lg border px-4 py-2" disabled={!guess.trim() || revealed}>
                  Guess
                </button>
              </form>
            )}

            {/* feedback */}
            {guessFeedback !== "idle" && !revealed && (
              <div className={guessFeedback === "right" ? "text-green-600 text-sm" : "text-red-600 text-sm"}>
                {guessFeedback === "right" ? "✅ Correct!" : "❌ Try again"}
              </div>
            )}

            {/* host controls */}
            {isHost && (
              <div className="flex flex-wrap gap-2 pt-2">
                <button className="rounded-lg border px-4 py-2" onClick={revealAnswer} disabled={revealed}>
                  Reveal
                </button>
                <button className="rounded-lg border px-4 py-2" onClick={nextQuestion}>
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {finalResults && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Results</h3>
            <ul className="space-y-1">
              {finalResults.players
                .slice()
                .sort((a, b) => b.score - a.score)
                .map((p, i) => (
                  <li key={p.socketId} className="flex justify-between border rounded-lg px-3 py-2">
                    <span>
                      {i + 1}. {p.username} {p.socketId === finalResults.hostId && chip("Host")}
                    </span>
                    <span className="font-semibold">{p.score}</span>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </section>

      {/* top-level host controls */}
      <section className="flex flex-wrap gap-2">
        {isHost && !room?.started && !finalResults && (
          <button className="rounded-lg border px-4 py-2" onClick={startGame} disabled={joining}>
            Start
          </button>
        )}
        {isHost && (
          <button className="rounded-lg border px-4 py-2" onClick={exitGame}>
            Exit Room
          </button>
        )}
      </section>
    </div>
  );
}
