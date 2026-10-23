"use client";
import React, { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { getSocket, getUsername, RoomPlayer, RoomState, useRequireAuth } from "@/lib/api";
import { Button, Notice, Panel, inputClass } from "@/components/ui";

export default function VersusRoomPage() {
  const signedIn = useRequireAuth();
  const router = useRouter();
  const code = String(useParams<{ code: string }>()?.code || "").toUpperCase();

  const [socketId, setSocketId] = useState("");
  const [room, setRoom] = useState<RoomState | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [guess, setGuess] = useState("");
  const [feedback, setFeedback] = useState<"idle" | "right" | "wrong">("idle");
  const [results, setResults] = useState<RoomState | null>(null);
  const [connecting, setConnecting] = useState(true);
  const [closed, setClosed] = useState(false);
  const [copied, setCopied] = useState(false);
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);

  useEffect(() => {
    if (!signedIn) return;
    const socket = getSocket();
    socketRef.current = socket;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- each event has its own payload type
    const handlers: Record<string, (...args: any[]) => void> = {
      connect: () => setSocketId(socket.id || ""),
      disconnect: () => setSocketId(""),
      roomState: (rs: RoomState) => {
        setRoom(rs);
        setResults(null);
        setAnswer(null);
        setGuess("");
        setFeedback("idle");
      },
      revealAnswer: (p: { answer: string }) => setAnswer(p.answer),
      guessResult: (r: { correct: boolean }) => setFeedback(r.correct ? "right" : "wrong"),
      results: (rs: RoomState) => setResults(rs),
      roomClosed: () => { setClosed(true); setTimeout(() => router.push("/versus"), 2000); },
    };
    Object.entries(handlers).forEach(([e, h]) => socket.on(e, h));

    const join = () => {
      setSocketId(socket.id || "");
      socket.emit("joinRoom", { code, username: getUsername() || "Player" });
      setConnecting(false);
    };
    if (socket.connected) join();
    else socket.once("connect", join);

    return () => { Object.entries(handlers).forEach(([e, h]) => socket.off(e, h)); };
  }, [signedIn, code, router]);

  const emit = (event: string, extra = {}) => socketRef.current?.emit(event, { code, ...extra });
  const isHost = !!room && !!socketId && room.hostId === socketId;
  const players = useMemo(() => [...(room?.players ?? [])].sort((a, b) => b.score - a.score), [room]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (guess.trim()) emit("submitGuess", { guess });
  };

  if (!signedIn) return null;

  return (
    <div>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Versus</h1>
          <p className="mt-1.5 text-muted">
            Room <span className="font-semibold tracking-widest text-ink">{code}</span>
            <span className="mx-2">·</span>
            {results ? "Finished" : room?.started ? "Live" : "Waiting in lobby"}
            {isHost && <span className="ml-2 rounded bg-hl px-1.5 py-0.5 text-xs font-semibold text-hl-ink">You&apos;re hosting</span>}
          </p>
        </div>
        {isHost && (room?.started || results) && (
          <Button variant="danger" onClick={() => emit("exitGame")}>Close room</Button>
        )}
      </div>

      {closed && <div className="mb-6"><Notice>The host closed the room. Taking you back to Versus…</Notice></div>}

      <div className="grid grid-cols-[1fr_280px] gap-8">
        <div className="min-w-0">
          {results ? (
            <Results room={results} onDone={() => router.push("/versus")} />
          ) : room?.started && room.currentQuestion ? (
            <>
              <div className="index-card relative flex h-[280px] flex-col rounded-xl border border-line shadow-[0_12px_30px_-12px_rgb(0_0_0/0.25)]">
                <span className="px-7 pt-5 text-sm text-muted">Question {(room.currentIndex ?? 0) + 1}</span>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={room.currentQuestion.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    className="flex flex-1 items-center justify-center px-10 pb-10 text-center font-card text-3xl leading-snug"
                  >
                    {room.currentQuestion.question}
                  </motion.p>
                </AnimatePresence>
                <AnimatePresence>
                  {answer !== null && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute inset-x-6 bottom-5 rounded-lg bg-hl px-4 py-2 text-center text-hl-ink"
                    >
                      Answer: <span className="font-semibold">{answer || "—"}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <form onSubmit={submit} className="mt-6 flex gap-2">
                <input
                  autoFocus
                  value={guess}
                  onChange={(e) => { setGuess(e.target.value); setFeedback("idle"); }}
                  disabled={answer !== null}
                  placeholder="Type your answer and press Enter"
                  className={`${inputClass} h-12 text-lg ${feedback === "right" ? "border-good" : feedback === "wrong" ? "border-bad" : ""}`}
                />
                <Button size="lg" disabled={!guess.trim() || answer !== null}>Guess</Button>
              </form>
              <p className={`mt-2 h-5 text-sm ${feedback === "right" ? "text-good" : "text-bad"}`}>
                {feedback === "right" ? "Correct! Point is yours." : feedback === "wrong" ? "Not quite. Try again." : ""}
              </p>

              {isHost && (
                <div className="mt-6 flex gap-2">
                  <Button variant="secondary" disabled={answer !== null} onClick={() => emit("revealAnswer")}>Reveal answer</Button>
                  <Button onClick={() => emit("nextQuestion")}>Next question</Button>
                </div>
              )}
            </>
          ) : (
            <Panel className="flex h-[280px] flex-col items-center justify-center text-center">
              <p className="text-muted">Share this code with the people you&apos;re playing</p>
              <p className="my-3 font-card text-7xl tracking-[0.2em]">{code}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
              >
                {copied ? "Copied" : "Copy code"}
              </Button>
              <div className="mt-6">
                {isHost ? (
                  <Button size="lg" disabled={connecting || players.length < 1} onClick={() => emit("startGame")}>
                    {connecting ? "Connecting…" : "Start game"}
                  </Button>
                ) : (
                  <p className="text-sm text-muted">The host will start the game when everyone&apos;s in.</p>
                )}
              </div>
            </Panel>
          )}
        </div>

        <Scoreboard players={players} hostId={room?.hostId} me={socketId} />
      </div>
    </div>
  );
}

function Scoreboard({ players, hostId, me }: { players: RoomPlayer[]; hostId?: string; me: string }) {
  return (
    <aside>
      <h2 className="mb-3 text-sm font-medium text-muted">Players ({players.length})</h2>
      <ul className="space-y-2">
        <AnimatePresence initial={false}>
          {players.map((p, i) => (
            <motion.li
              key={p.socketId}
              layout
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 40 }}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${
                i === 0 && p.score > 0 ? "border-hl bg-hl/15" : "border-line bg-card"
              }`}
            >
              <span className="w-4 text-sm tabular-nums text-muted">{i + 1}</span>
              <span className="flex-1 truncate font-medium">
                {p.username}
                {p.socketId === me && <span className="ml-1.5 text-xs text-muted">(you)</span>}
                {p.socketId === hostId && <span className="ml-1.5 text-xs text-muted">host</span>}
              </span>
              <motion.span key={p.score} initial={{ scale: 1.4 }} animate={{ scale: 1 }} className="text-lg font-bold tabular-nums">
                {p.score}
              </motion.span>
            </motion.li>
          ))}
        </AnimatePresence>
        {!players.length && <li className="text-sm text-muted">Waiting for players…</li>}
      </ul>
    </aside>
  );
}

function Results({ room, onDone }: { room: RoomState; onDone: () => void }) {
  const ranked = [...room.players].sort((a, b) => b.score - a.score);
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Panel className="p-10 text-center">
        <p className="text-muted">Game over</p>
        <h2 className="mt-2 font-card text-5xl">
          <span className="bg-[linear-gradient(transparent_55%,var(--hl)_55%)] px-1">{ranked[0]?.username ?? "Nobody"} wins</span>
        </h2>
        <p className="mt-3 text-muted">with {ranked[0]?.score ?? 0} point{ranked[0]?.score === 1 ? "" : "s"}</p>
        <Button size="lg" className="mt-8" onClick={onDone}>Back to Versus</Button>
      </Panel>
    </motion.div>
  );
}
