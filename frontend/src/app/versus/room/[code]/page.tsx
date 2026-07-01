"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
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

const MEDALS = ["1st", "2nd", "3rd"];

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
  const [roomClosedMsg, setRoomClosedMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);
  const isHost = useMemo(() => !!room && !!socketId && room.hostId === socketId, [room, socketId]);

  const usernameFromStorage = () =>
    typeof window === "undefined" ? "Player" : localStorage.getItem("username") || "Player";
  const tokenExists = () =>
    typeof window === "undefined" ? false : !!localStorage.getItem("token");

  useEffect(() => {
    if (!tokenExists()) { router.push("/login"); return; }

    const socket = getSocket();
    socketRef.current = socket;

    if (socket.connected) setSocketId(socket.id || "");

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
      setRoomClosedMsg("The host closed the room. Redirecting…");
      setTimeout(() => router.push("/"), 2000);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("roomState", onRoomState);
    socket.on("revealAnswer", onReveal);
    socket.on("guessResult", onGuessResult);
    socket.on("results", onResults);
    socket.on("roomClosed", onRoomClosed);

    const join = () => socket.emit("joinRoom", { code: roomCode, username: usernameFromStorage() });
    if (socket.connected) {
      join();
      setJoining(false);
    } else {
      socket.once("connect", () => { join(); setJoining(false); });
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

  const startGame = () => socketRef.current?.emit("startGame", { code: roomCode });
  const nextQuestion = () => socketRef.current?.emit("nextQuestion", { code: roomCode });
  const revealAnswer = () => socketRef.current?.emit("revealAnswer", { code: roomCode });
  const exitGame = () => socketRef.current?.emit("exitGame", { code: roomCode });

  const submitGuess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim()) return;
    socketRef.current?.emit("submitGuess", { code: roomCode, guess });
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const playersSorted = useMemo(
    () => room?.players?.slice().sort((a, b) => b.score - a.score) ?? [],
    [room]
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-5">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Versus</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-slate-500 dark:text-slate-400">Room</span>
            <span className="font-mono text-sm font-semibold tracking-widest bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded px-2 py-0.5">
              {roomCode}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {room?.started ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              Live
            </span>
          ) : (
            <span className="inline-block rounded-full border border-slate-200 dark:border-slate-700 px-2.5 py-0.5 text-xs text-slate-500 dark:text-slate-400">
              Lobby
            </span>
          )}
          {isHost && (
            <span className="inline-block rounded-full border border-slate-200 dark:border-slate-700 px-2.5 py-0.5 text-xs text-slate-500 dark:text-slate-400">
              Host
            </span>
          )}
        </div>
      </header>

      {roomClosedMsg && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {roomClosedMsg}
        </div>
      )}

      {/* LOBBY */}
      {!room?.started && !finalResults && (
        <>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 text-center shadow-sm space-y-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">Share this code with friends</p>
            <p className="font-mono text-5xl font-bold tracking-[0.25em] text-slate-900 dark:text-white">
              {roomCode}
            </p>
            <button
              onClick={copyCode}
              className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline underline-offset-2 transition-colors"
            >
              {copied ? "Copied!" : "Copy code"}
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
            <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">
              Players joined ({playersSorted.length})
            </h2>
            <ul className="space-y-2">
              {playersSorted.map((p) => (
                <li key={p.socketId} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-400" />
                  <span className="font-medium text-slate-800 dark:text-slate-200">{p.username}</span>
                  {p.socketId === room?.hostId && (
                    <span className="text-xs text-slate-400">Host</span>
                  )}
                </li>
              ))}
              {!playersSorted.length && (
                <li className="text-sm text-slate-400">Waiting for players to join…</li>
              )}
            </ul>
          </div>

          {isHost ? (
            <button
              onClick={startGame}
              disabled={joining}
              className="w-full rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {joining ? "Connecting…" : "Start game"}
            </button>
          ) : (
            <p className="text-center text-sm text-slate-400">Waiting for the host to start…</p>
          )}
        </>
      )}

      {/* IN GAME */}
      {room?.started && currentCard && !finalResults && (
        <>
          <div className="flex flex-wrap gap-2">
            {playersSorted.map((p, i) => (
              <div
                key={p.socketId}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm ${
                  i === 0
                    ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-400 font-semibold"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                }`}
              >
                <span>{p.username}</span>
                <span className="font-bold">{p.score}</span>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm px-8 py-10 text-center space-y-3">
            <p className="text-xs uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Question {(room.currentIndex ?? 0) + 1}
            </p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white leading-snug">
              {currentCard.question}
            </p>
          </div>

          <AnimatePresence>
            {revealed && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-5 py-4"
              >
                <p className="text-xs uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Answer</p>
                <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">{currentCard.answer || "—"}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={submitGuess} className="flex gap-2">
            <input
              className="flex-1 rounded-xl border border-slate-300 dark:border-slate-600 px-4 py-2.5 text-sm
                         bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400
                         disabled:opacity-50 transition"
              placeholder="Type your answer…"
              value={guess}
              onChange={(e) => { setGuess(e.target.value); setGuessFeedback("idle"); }}
              disabled={revealed}
              autoFocus
            />
            <button
              type="submit"
              disabled={!guess.trim() || revealed}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Guess
            </button>
          </form>

          <AnimatePresence mode="wait">
            {guessFeedback !== "idle" && !revealed && (
              <motion.div
                key={guessFeedback}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className={`rounded-xl px-4 py-3 text-sm font-medium border ${
                  guessFeedback === "right"
                    ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400"
                    : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400"
                }`}
              >
                {guessFeedback === "right" ? "Correct!" : "Incorrect — try again"}
              </motion.div>
            )}
          </AnimatePresence>

          {isHost && (
            <div className="flex gap-2">
              <button
                onClick={revealAnswer}
                disabled={revealed}
                className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Reveal answer
              </button>
              <button
                onClick={nextQuestion}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* RESULTS */}
      {finalResults && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-8 space-y-6"
        >
          <div className="text-center space-y-1">
            <p className="text-xs uppercase tracking-widest text-slate-400 dark:text-slate-500">Game over</p>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
              {[...finalResults.players].sort((a, b) => b.score - a.score)[0]?.username} wins!
            </h2>
          </div>

          <ul className="space-y-2">
            {[...finalResults.players]
              .sort((a, b) => b.score - a.score)
              .map((p, i) => (
                <li
                  key={p.socketId}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                    i === 0
                      ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
                      : "bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <span className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
                    <span className="text-xs text-slate-500 dark:text-slate-400">{MEDALS[i] ?? `${i + 1}.`}</span>
                    {p.username}
                    {p.socketId === finalResults.hostId && (
                      <span className="text-xs text-slate-400">Host</span>
                    )}
                  </span>
                  <span className="font-bold text-lg text-slate-900 dark:text-white">{p.score}</span>
                </li>
              ))}
          </ul>

          <button
            onClick={() => router.push("/versus")}
            className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            Back to Versus
          </button>
        </motion.div>
      )}

      {isHost && (room?.started || finalResults) && (
        <div className="flex justify-end">
          <button
            onClick={exitGame}
            className="rounded-xl border border-red-200 dark:border-red-800 px-4 py-2 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            Close room
          </button>
        </div>
      )}
    </div>
  );
}
