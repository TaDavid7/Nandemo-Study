"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSocket } from "@/lib/socket";
import type { RoomState } from "@/types/versus";
import { authfetch } from "@/lib/authfetch";

export default function CreateRoomPage() {
  const [folders, setFolders] = useState<{ _id: string; name: string }[]>([]);
  const [folderId, setFolderId] = useState("");
  const [username, setUsername] = useState(
    () => (typeof window !== "undefined" ? localStorage.getItem("username") || "" : "")
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    authfetch(`/api/folders`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`${r.status}`))))
      .then((data) => setFolders(Array.isArray(data) ? data : []))
      .catch((e) => setError(`Failed to load folders: ${e.message || e}`));
  }, []);

  function onCreate() {
    const name = username.trim();
    if (!folderId || !name) return;

    localStorage.setItem("username", name);
    const socket = getSocket();
    setLoading(true);
    setError(null);

    const t = setTimeout(() => {
      setLoading(false);
      setError("Creating room timed out.");
    }, 10000);

    socket.emit(
      "createRoom",
      { folderId, username: name },
      (resp: { ok: boolean; code?: string; error?: string }) => {
        clearTimeout(t);
        if (!resp?.ok || !resp.code) {
          setLoading(false);
          setError(resp?.error || "Failed to create room");
          return;
        }
        router.push(`/versus/room/${resp.code}`);
      }
    );

    const onRoomState = (rs: RoomState) => {
      if (rs.code) {
        socket.off("roomState", onRoomState);
        router.push(`/versus/room/${rs.code}`);
      }
    };

    socket.on("roomState", onRoomState);
  }

  return (
    <div className="mx-auto max-w-xl p-6 space-y-6">
      <h1 className="text-2xl font-bold">Create a room</h1>

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
          <label className="block text-sm font-medium text-slate-700">Folder</label>
          <select
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            value={folderId}
            onChange={(e) => setFolderId(e.target.value)}
          >
            <option value="">Select a folder…</option>
            {folders.map((f) => (
              <option key={f._id} value={f._id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={onCreate}
          disabled={!username.trim() || !folderId || loading}
          className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Creating…" : "Create room"}
        </button>
      </div>
    </div>
  );
}
