"use client";
import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { authfetch } from "@/lib/authfetch";

type Card = {
  _id: string;
  question: string;
  answer: string;
  folder: string;
  ease: number;
  interval: number;
  reps: number;
  lapses: number;
  due?: string;
};

export default function DailyPractice() {
  const [review, setReview] = useState<Card[]>([]);
  const [news, setNews] = useState<Card[]>([]);
  const [current, setCurrent] = useState<Card | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    authfetch("/api/daily")
      .then(r => {
        if (r.status === 401 || r.status === 403) throw new Error("Session expired.");
        return r.json();
      })
      .then(({ review = [], news = [] }) => {
        if (!mounted) return;
        setReview(review);
        setNews(news);
        setCurrent(review[0] || news[0] || null);
        setFlipped(false);
        setIsLoading(false);
      })
      .catch(e => {
        setErr(e.message);
        setIsLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  const remaining = useMemo(
    () => review.length + news.length,
    [review.length, news.length]
  );

  const grade4 = async (gradeValue: 0 | 1 | 2 | 3) => {
    if (!current) return;

    const wasNew = current.reps === 0;
    const newReview = review.filter(c => c._id !== current._id);
    const newNews = news.filter(c => c._id !== current._id);

    let next: Card | null = null;
    if (newReview.length && (!wasNew || Math.random() < 0.75)) {
      next = newReview[0];
    } else if (newNews.length) {
      next = newNews[0];
    }

    setReview(newReview);
    setNews(newNews);
    setCurrent(next);
    setFlipped(false);

    try {
      const res = await authfetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: current._id, grade: gradeValue }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `HTTP ${res.status}`);
      }

      const updated = await res.json();
      console.log(`Card ${current._id} rescheduled for`, updated.due);
    } catch (e: any) {
      console.error("Failed to record review:", e);
      setErr(e.message ?? "Failed to record review");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] text-slate-500 dark:text-slate-400">
        Loading daily practice...
      </div>
    );
  }

  if (err) {
    return <div className="p-6 text-red-600 dark:text-red-400">{err}</div>;
  }

  if (!current) {
    return (
      <div className="p-6 max-w-xl mx-auto text-center space-y-2">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">All done for today</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Come back tomorrow for more.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-500 dark:text-slate-400">Remaining: {remaining}</div>
        <button
          className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
          onClick={() => setFlipped(f => !f)}
        >
          {flipped ? "Hide answer" : "Show answer"}
        </button>
      </div>

      <motion.div
        className="relative h-64 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg bg-white dark:bg-slate-800 flex flex-col items-center justify-center cursor-pointer"
        style={{ transformStyle: "preserve-3d", perspective: 1000 }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.35, ease: "easeInOut" }}
        onClick={() => setFlipped(f => !f)}
      >
        <div
          className="absolute inset-0 flex flex-col items-center justify-center backface-hidden px-4"
          style={{ transform: "rotateY(0deg)" }}
        >
          <div className="text-xs uppercase text-slate-400 dark:text-slate-500 mb-2">Question</div>
          <div className="text-lg font-semibold text-center text-slate-800 dark:text-slate-100">{current.question}</div>
        </div>

        <div
          className="absolute inset-0 flex flex-col items-center justify-center backface-hidden px-4 bg-indigo-50 dark:bg-indigo-900/40 rounded-2xl"
          style={{ transform: "rotateY(180deg)" }}
        >
          <div className="text-xs uppercase text-slate-400 dark:text-slate-500 mb-2">Answer</div>
          <div className="text-lg text-center text-slate-800 dark:text-slate-100">{current.answer}</div>
        </div>
      </motion.div>

      <div className="grid grid-cols-4 gap-3">
        <button
          onClick={() => grade4(0)}
          className="rounded-xl px-3 py-2 border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-sm text-red-700 dark:text-red-400 transition"
        >
          Again
        </button>
        <button
          onClick={() => grade4(1)}
          className="rounded-xl px-3 py-2 border border-yellow-300 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 text-sm text-yellow-700 dark:text-yellow-400 transition"
        >
          Hard
        </button>
        <button
          onClick={() => grade4(2)}
          className="rounded-xl px-3 py-2 border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-sm text-emerald-700 dark:text-emerald-400 transition"
        >
          Good
        </button>
        <button
          onClick={() => grade4(3)}
          className="rounded-xl px-3 py-2 border border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-sm text-blue-700 dark:text-blue-400 transition"
        >
          Easy
        </button>
      </div>
    </div>
  );
}
