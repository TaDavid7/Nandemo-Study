"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Speedrun, { FlashcardType } from "@/components/speedrun";
import { authfetch } from "@/lib/authfetch";

type Folder = {
  _id: string;
  name: string;
};

const TIME_PRESETS = [
  { label: "30 s", value: "30" },
  { label: "1 min", value: "60" },
  { label: "2 min", value: "120" },
  { label: "5 min", value: "300" },
  { label: "Custom", value: "custom" },
];

export default function QuizPage() {
  const router = useRouter();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState("");
  const [flashcards, setFlashcards] = useState<FlashcardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState<string>("");
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [customTime, setCustomTime] = useState<string>("");
  const [gameReady, setGameReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/account"); return; }
    authfetch("/api/folders")
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setFolders(data); });
  }, []);

  useEffect(() => {
    if (!selectedFolder) { setFlashcards([]); setLoading(false); return; }
    setLoading(true);
    authfetch(`/api/flashcards?folderId=${selectedFolder}`)
      .then(res => res.json())
      .then((cards: FlashcardType[]) => { setFlashcards(cards); setLoading(false); });
  }, [selectedFolder]);

  const handlePreset = (value: string) => {
    setSelectedPreset(value);
    if (value !== "custom") {
      setTime(value);
      setCustomTime("");
    } else {
      setTime("");
    }
  };

  const handleCustomTime = (val: string) => {
    setCustomTime(val);
    setTime(val);
  };

  const exitingQuizGame = () => { setSelectedFolder(""); router.push("/home"); };

  const selectedFolderName = folders.find(f => f._id === selectedFolder)?.name;
  const isDisabled = !selectedFolder || !time || flashcards.length <= 4;
  const notEnoughCards = selectedFolder && flashcards.length > 0 && flashcards.length <= 4;

  if (gameReady) return <Speedrun flashcards={flashcards} time={time} onQuit={exitingQuizGame} />;

  return (
    <div className="max-w-xl">
      {/* Hero */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">Speedrun</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Answer as many cards as you can before time runs out. The deck shuffles and recycles.
        </p>
      </div>

      <div className="rounded-2xl bg-white dark:bg-slate-800 ring-1 ring-black/5 dark:ring-white/10 shadow-sm overflow-hidden">

        {/* Step 1 — Folder */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3">
            Step 1 — Pick a folder
          </p>
          {folders.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No folders found. Create one on the Home page.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {folders.map(folder => (
                <button
                  key={folder._id}
                  onClick={() => setSelectedFolder(folder._id)}
                  className={[
                    "px-3.5 py-1.5 rounded-xl text-sm font-medium transition border",
                    selectedFolder === folder._id
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                      : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800",
                  ].join(" ")}
                >
                  {folder.name}
                </button>
              ))}
            </div>
          )}
          {notEnoughCards && (
            <p className="mt-2 text-xs text-rose-500 dark:text-rose-400">
              This folder only has {flashcards.length} card{flashcards.length === 1 ? "" : "s"} — needs more than 4.
            </p>
          )}
          {selectedFolder && flashcards.length > 4 && (
            <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
              {flashcards.length} cards ready
            </p>
          )}
        </div>

        {/* Step 2 — Time */}
        <div className="px-6 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3">
            Step 2 — Set a time limit
          </p>
          <div className="flex flex-wrap gap-2">
            {TIME_PRESETS.map(preset => (
              <button
                key={preset.value}
                onClick={() => handlePreset(preset.value)}
                className={[
                  "px-3.5 py-1.5 rounded-xl text-sm font-medium transition border",
                  selectedPreset === preset.value
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                    : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800",
                ].join(" ")}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {selectedPreset === "custom" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.2 }}
              className="mt-3"
            >
              <input
                value={customTime}
                onChange={e => handleCustomTime(e.target.value)}
                placeholder="Seconds, e.g. 90"
                autoFocus
                className="w-44 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600
                           bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100
                           text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400
                           placeholder-slate-400 dark:placeholder-slate-500 transition"
              />
            </motion.div>
          )}
        </div>

        {/* Start */}
        <div className="px-6 pb-6">
          <motion.button
            whileHover={!isDisabled ? { scale: 1.01 } : {}}
            whileTap={!isDisabled ? { scale: 0.98 } : {}}
            disabled={isDisabled}
            onClick={() => setGameReady(true)}
            className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold
                       hover:bg-indigo-500 transition shadow-md shadow-indigo-100 dark:shadow-indigo-900/30
                       disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {selectedFolderName && time
              ? `Start — ${selectedFolderName} · ${selectedPreset === "custom" ? `${customTime}s` : TIME_PRESETS.find(p => p.value === selectedPreset)?.label}`
              : "Start Speedrun"}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
