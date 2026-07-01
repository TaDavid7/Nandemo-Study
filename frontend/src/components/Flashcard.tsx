"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";

type Card = {
  _id: string;
  question: string;
  answer: string;
  folder: string;
};

type FlashcardProps = {
  card: Card;
  onDelete: (id: string) => void;
  onEdit: (id: string, question: string, answer: string) => void;
};

const Flashcard: React.FC<FlashcardProps> = ({ card, onDelete, onEdit }) => {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="flex-shrink-0 w-full max-w-2xl mx-auto">
      <motion.div
        className="relative h-[360px] w-full rounded-2xl cursor-pointer"
        style={{ transformStyle: "preserve-3d", perspective: 1200 }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.35, ease: "easeInOut" }}
        onClick={() => setFlipped((f) => !f)}
      >
        {/* Front – Question */}
        <div className="absolute inset-0 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 flex flex-col justify-center items-center px-8 backface-hidden shadow-sm">
          <div className="text-xs uppercase tracking-wide text-gray-400 dark:text-slate-500 mb-3">Question</div>
          <strong className="text-xl text-center font-semibold leading-snug">{card.question}</strong>
        </div>

        {/* Back – Answer */}
        <div
          className="absolute inset-0 rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/30 text-gray-700 dark:text-slate-200 flex flex-col justify-center items-center px-8 backface-hidden shadow-sm"
          style={{ transform: "rotateY(180deg)" }}
        >
          <div className="text-xs uppercase tracking-wide text-indigo-400 dark:text-indigo-400 mb-3">Answer</div>
          <strong className="text-xl text-center font-semibold leading-snug">{card.answer}</strong>
        </div>
      </motion.div>

      <div className="flex gap-3 justify-center mt-5">
        <button
          className="bg-blue-500 text-white rounded-2xl px-5 py-2 hover:bg-blue-600 transition text-sm font-medium"
          onClick={() => onEdit(card._id, card.question, card.answer)}
        >
          Edit
        </button>
        <button
          className="bg-red-500 text-white rounded-2xl px-5 py-2 hover:bg-red-600 transition text-sm font-medium"
          onClick={() => onDelete(card._id)}
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default Flashcard;
