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

  const pickNext = (prevWasNew: boolean): Card | null => {
    if (review.length && (!prevWasNew || Math.random() < 0.75)) {
      const [c, ...rest] = review;
      setReview(rest);
      return c;
    }
    if (news.length) {
      const [c, ...rest] = news;
      setNews(rest);
      return c;
    }
    return null;
  };

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
      <div className="flex justify-center items-center min-h-[60vh] text-gray-500">
        Loading daily practice...
      </div>
    );
  }

  if (err) {
    return <div className="p-6 text-red-600">{err}</div>;
  }

  if (!current) {
    return (
      <div className="p-6 max-w-xl mx-auto text-center space-y-2">
        <h2 className="text-2xl font-semibold">All done for today 🎉</h2>
        <p className="text-sm opacity-70">Come back tomorrow for more.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">Remaining: {remaining}</div>
        <button
          className="text-sm text-indigo-600 hover:underline"
          onClick={() => setFlipped(f => !f)}
        >
          {flipped ? "Hide answer" : "Show answer"}
        </button>
      </div>

      {/* Flashcard Flip Animation */}
      
      <motion.div
        className={`relative h-64 rounded-2xl border shadow-lg bg-white flex flex-col items-center justify-center cursor-pointer`}
        style={{
          transformStyle: "preserve-3d",
          perspective: 1000,
        }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.35, ease: "easeInOut" }}
        onClick={() => setFlipped(f => !f)}
      >
        <div
          className="absolute inset-0 flex flex-col items-center justify-center backface-hidden px-4"
          style={{ transform: "rotateY(0deg)" }}
        >
          <div className="text-xs uppercase text-gray-400 mb-2">Question</div>
          <div className="text-lg font-semibold text-center">{current.question}</div>
        </div>

        <div
          className="absolute inset-0 flex flex-col items-center justify-center backface-hidden px-4 bg-indigo-50"
          style={{ transform: "rotateY(180deg)" }}
        >
          <div className="text-xs uppercase text-gray-400 mb-2">Answer</div>
          <div className="text-lg text-center">{current.answer}</div>
        </div>
      </motion.div>


      {/* Grading buttons */}
      <div className="grid grid-cols-4 gap-3">
        <button
          onClick={() => grade4(0)}
          className="rounded-xl px-3 py-2 border border-red-300 bg-red-50 hover:bg-red-100 text-sm"
        >
          Again
        </button>
        <button
          onClick={() => grade4(1)}
          className="rounded-xl px-3 py-2 border border-yellow-300 bg-yellow-50 hover:bg-yellow-100 text-sm"
        >
          Hard
        </button>
        <button
          onClick={() => grade4(2)}
          className="rounded-xl px-3 py-2 border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-sm"
        >
          Good
        </button>
        <button
          onClick={() => grade4(3)}
          className="rounded-xl px-3 py-2 border border-blue-300 bg-blue-50 hover:bg-blue-100 text-sm"
        >
          Easy
        </button>
      </div>
    </div>
  );
}
