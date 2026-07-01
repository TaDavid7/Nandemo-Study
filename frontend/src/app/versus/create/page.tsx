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

  const inputClass = `w-full rounded-xl border border-slate-300 dark:border-slate-600
    px-3 py-2 text-sm bg-white dark:bg-slate-700
    text-slate-800 dark:text-slate-100
    placeholder-slate-400 dark:placeholder-slate-500
    focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition`;

  return (
    <div className="mx-auto max-w-xl p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create a room</h1>

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
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Folder</label>
          <select
            className={inputClass}
            value={folderId}
            onChange={(e) => setFolderId(e.target.value)}
          >
            <option value="">Select a folder…</option>
            {folders.map((f) => (
              <option key={f._id} value={f._id}>{f.name}</option>
            ))}
          </select>
        </div>

        <button
          onClick={onCreate}
          disabled={!username.trim() || !folderId || loading}
          className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Creating…" : "Create room"}
        </button>
      </div>
    </div>
  );
}
