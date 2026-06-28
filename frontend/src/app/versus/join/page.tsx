"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSocket } from "@/lib/socket";
import type { RoomState } from "@/types/versus";

export default function JoinRoomPage() {
  const [code, setCode] = useState("");
  const [username, setUsername] = useState("a");
  const router = useRouter();

  function onJoin() {
    if (!code || !username) return;
    const socket = getSocket();

    const normalizedCode = code.trim().toUpperCase();
    socket.emit("joinRoom", { code: normalizedCode, username });

    const onRoomState = (rs: RoomState) => {
      // Compare to normalized code from the input
      if (rs.code?.toUpperCase() === normalizedCode) {
        socket.off("roomState", onRoomState);
        router.push(`/versus/room/${normalizedCode}?me=${encodeURIComponent(username)}`);
      }
    };

    socket.on("roomState", onRoomState);
  }

  return (
    <div className="mx-auto max-w-xl p-6 space-y-6">
      <h1 className="text-2xl font-bold">Join a room</h1>
      <div className="space-y-3">
        <label className="block text-sm">Room code</label>
        <input
          className="border rounded p-2 w-full uppercase tracking-widest"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      </div>
      
      <button onClick={onJoin} className="rounded-2xl px-4 py-2 shadow hover:shadow-md">Join room</button>
    </div>
  );
}