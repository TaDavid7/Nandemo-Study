"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { authfetch } from "@/lib/authfetch";
import DailyPractice from "@/components/DailyPractice";

type Folder = {
  _id: string;
  name: string;
  schedule: boolean;
};

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function Daily() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [gameReady, setGameReady] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("token")) return;
    authfetch("/api/folders")
      .then(res => res.json())
      .then((data) => { if (Array.isArray(data)) setFolders(data); });
  }, []);

  const handleToggle = async (id: string, currentValue: boolean) => {
    setFolders(prev => prev.map(f => f._id === id ? { ...f, schedule: !currentValue } : f));
    try {
      const res = await authfetch(`/api/folders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedule: !currentValue }),
      });
      if (!res.ok) {
        setFolders(prev => prev.map(f => f._id === id ? { ...f, schedule: currentValue } : f));
        return;
      }
      const updated = await res.json();
      setFolders(prev => prev.map(f => f._id === id ? updated : f));
    } catch {
      setFolders(prev => prev.map(f => f._id === id ? { ...f, schedule: currentValue } : f));
    }
  };

  if (gameReady) return <DailyPractice />;

  const scheduled = folders.filter(f => f.schedule);
  const sorted = folders.slice().sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="max-w-2xl">
      {/* Hero */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">Daily Practice</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Choose which folders to include, then start your session.
        </p>
      </div>

      {/* Folder picker */}
      <div className="rounded-2xl bg-white dark:bg-slate-800 ring-1 ring-black/5 dark:ring-white/10 shadow-sm overflow-hidden">
        {/* Panel header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            Folders
          </span>
          {scheduled.length > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
              {scheduled.length} selected
            </span>
          )}
        </div>

        <div className="p-6">
          {sorted.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">
              No folders yet — create one on the Home page.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sorted.map((folder, i) => (
                <motion.button
                  key={folder._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.04 }}
                  onClick={() => handleToggle(folder._id, !!folder.schedule)}
                  className={[
                    "relative text-left rounded-xl border px-4 py-3.5 transition-all",
                    folder.schedule
                      ? "border-indigo-500 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-900/25 shadow-sm"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600",
                  ].join(" ")}
                >
                  <span className={`block text-sm font-medium ${folder.schedule ? "text-indigo-700 dark:text-indigo-300" : "text-slate-700 dark:text-slate-300"}`}>
                    {folder.name}
                  </span>
                  <span className={`block text-xs mt-0.5 ${folder.schedule ? "text-indigo-500 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"}`}>
                    {folder.schedule ? "Included" : "Excluded"}
                  </span>
                  {folder.schedule && (
                    <span className="absolute top-3 right-3 text-indigo-500 dark:text-indigo-400">
                      <CheckIcon />
                    </span>
                  )}
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Start */}
      <div className="mt-5">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={() => setGameReady(true)}
          disabled={scheduled.length === 0}
          className="w-full py-3.5 rounded-2xl bg-emerald-600 text-white font-semibold text-base
                     hover:bg-emerald-500 transition shadow-md shadow-emerald-100 dark:shadow-emerald-900/30
                     disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {scheduled.length === 0 ? "Select at least one folder" : `Start session`}
        </motion.button>
      </div>
    </div>
  );
}
