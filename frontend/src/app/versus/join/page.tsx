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

  return (
    <div className="mx-auto max-w-xl p-6 space-y-6">
      <h1 className="text-2xl font-bold">Join a room</h1>

      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-2xl border bg-white p-6 space-y-5 shadow-sm">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">Display name</label>
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            placeholder="Enter your name…"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">Room code</label>
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm uppercase tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-slate-300"
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
          className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Join room
        </button>
      </div>
    </div>
  );
}
