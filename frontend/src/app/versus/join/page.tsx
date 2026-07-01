"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSocket } from "@/lib/socket";
import type { RoomState } from "@/types/versus";

export default function JoinRoomPage() {
  const [code, setCode] = useState("");
  const [username, setUsername] = useState(
    () => (typeof window !== "undefined" ? localStorage.getItem("username") || "" : "")
  );
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function onJoin() {
    const name = username.trim();
    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode || !name) {
      setError("Please enter both a room code and a display name.");
      return;
    }

    localStorage.setItem("username", name);
    const socket = getSocket();
    setError(null);

    socket.emit("joinRoom", { code: normalizedCode, username: name });

    const onRoomState = (rs: RoomState) => {
      if (rs.code?.toUpperCase() === normalizedCode) {
        socket.off("roomState", onRoomState);
        router.push(`/versus/room/${normalizedCode}`);
      }
    };

    socket.on("roomState", onRoomState);
  }

  const inputClass = `w-full rounded-xl border border-slate-300 dark:border-slate-600
    px-3 py-2 text-sm bg-white dark:bg-slate-700
    text-slate-800 dark:text-slate-100
    placeholder-slate-400 dark:placeholder-slate-500
    focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition`;

  return (
    <div className="mx-auto max-w-xl p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Join a room</h1>

      {error && (
        <div className="rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 space-y-5 shadow-sm">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Display name</label>
          <input
            className={inputClass}
            placeholder="Enter your name…"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Room code</label>
          <input
            className={`${inputClass} uppercase tracking-widest font-mono`}
            placeholder="XXXXXX"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onJoin()}
            maxLength={6}
          />
        </div>

        <button
          onClick={onJoin}
          disabled={!username.trim() || !code.trim()}
          className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Join room
        </button>
      </div>
    </div>
  );
}
