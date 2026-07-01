import React, { useState, useEffect, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface FlashcardType {
  _id: string;
  question: string;
  answer: string;
  folder: string;
}

interface QuizGameProps {
  flashcards: FlashcardType[];
  time: string;
  onQuit: () => void;
}

const Speedrun: React.FC<QuizGameProps> = ({ flashcards, time, onQuit }) => {
  const [current, setCurrent] = useState<number>(0);
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");
  const [feedbackCorrect, setFeedbackCorrect] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [incorrect, setIncorrect] = useState<number>(0);
  const [timer, setTimer] = useState<number>(0);
  const [initialTime, setInitialTime] = useState<number>(80);
  const [answered, setAnswered] = useState<boolean>(false);
  const [refresh, setRefresh] = useState<boolean>(false);
  const [showResults, setShowResults] = useState(false);
  const [shuffledFlashcards, setShuffledFlashcards] = useState<FlashcardType[]>([]);

  const reset = () => { window.location.reload(); };

  const shuffleArray = (arr: FlashcardType[]) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  useEffect(() => {
    setShuffledFlashcards(shuffleArray(flashcards));
  }, [refresh, flashcards]);

  useEffect(() => {
    if (showResults) return;
    const id = setInterval(() => {
      setTimer((t) => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [showResults]);

  useEffect(() => {
    if (timer === 0 && initialTime > 0) {
      setFeedback("Time's up!");
      setFeedbackCorrect(false);
      setAnswered(true);
      setShowResults(true);
    }
  }, [timer, initialTime]);

  useEffect(() => {
    const timeofsec = Number(time.trim());
    const t = Number.isFinite(timeofsec) && timeofsec > 0 ? timeofsec : 80;
    setTimer(t);
    setInitialTime(t);
  }, []);

  useEffect(() => {
    setAnswered(false);
    setUserAnswer("");
  }, [current]);

  const checkAnswer = async (e: FormEvent) => {
    e.preventDefault();
    if (answered || timer === 0) return;

    const correct = shuffledFlashcards[current].answer.trim().toLowerCase();
    const guess = userAnswer.trim().toLowerCase();

    if (guess === correct) {
      setFeedback("Correct!");
      setFeedbackCorrect(true);
      setScore((s) => s + 1);
    } else {
      setFeedback(`Incorrect — answer: ${shuffledFlashcards[current].answer}`);
      setFeedbackCorrect(false);
      setIncorrect((n) => n + 1);
    }
    setAnswered(true);

    await new Promise((resolve) => setTimeout(resolve, 500));

    if (current === shuffledFlashcards.length - 1) {
      setCurrent(0);
      setRefresh((r) => !r);
      setFeedback("");
    } else {
      setFeedback("");
      setCurrent((c) => c + 1);
    }
  };

  const timerColor =
    timer <= 10
      ? "text-red-500 font-bold"
      : timer <= 30
      ? "text-amber-500 font-semibold"
      : "text-emerald-500";

  const progressPct = initialTime > 0 ? (timer / initialTime) * 100 : 0;
  const progressColor =
    timer <= 10 ? "bg-red-500" : timer <= 30 ? "bg-amber-400" : "bg-emerald-500";

  if (!flashcards.length) {
    return (
      <div className="p-6 text-center space-y-4">
        <p className="text-slate-700 dark:text-slate-300">No flashcards available.</p>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded-2xl hover:bg-blue-600 transition"
          onClick={onQuit}
        >
          Quit Speedrun
        </button>
      </div>
    );
  }

  if (showResults) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md bg-white dark:bg-slate-800 p-8 max-w-xl mx-auto mt-10 space-y-4"
      >
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Speedrun Complete!</h2>
        <div className="space-y-1">
          <p className="text-lg text-slate-700 dark:text-slate-300">
            Correct: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{score}</span>
          </p>
          <p className="text-lg text-slate-700 dark:text-slate-300">
            Incorrect: <span className="text-rose-600 dark:text-rose-400 font-semibold">{incorrect}</span>
          </p>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            onClick={reset}
            className="bg-blue-500 text-white px-4 py-2 rounded-2xl hover:bg-blue-600 transition font-medium"
          >
            Take Again
          </button>
          <button
            className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-600 transition font-medium"
            onClick={onQuit}
          >
            Exit
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md bg-white dark:bg-slate-800 p-8 max-w-2xl mx-auto mt-10 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Speedrun Mode</h2>
        <span className={`text-2xl tabular-nums ${timerColor}`}>{timer}s</span>
      </div>

      <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${progressColor}`}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 1, ease: "linear" }}
        />
      </div>

      <div className="text-center min-h-[60px] flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={current}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="text-lg font-medium text-slate-800 dark:text-slate-100"
          >
            {shuffledFlashcards[current]?.question}
          </motion.p>
        </AnimatePresence>
      </div>

      <form onSubmit={checkAnswer} className="flex justify-center">
        <input
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          placeholder="Type your answer"
          className="w-64 px-3 py-2 border-2 border-gray-300 dark:border-slate-600 rounded-xl text-sm
                     bg-gray-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100
                     outline-none transition focus:border-indigo-500 dark:focus:border-indigo-400
                     placeholder-gray-400 dark:placeholder-slate-500"
          autoFocus
        />
      </form>

      <div className="min-h-[2rem] text-center">
        <AnimatePresence mode="wait">
          {feedback && (
            <motion.p
              key={feedback}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className={feedbackCorrect ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-rose-600 dark:text-rose-400 font-medium"}
            >
              {feedback}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="flex justify-center gap-3">
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded-2xl hover:bg-blue-600 transition font-medium"
          onClick={() => setShowResults(true)}
        >
          Finish
        </button>
        <button
          className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-600 transition font-medium"
          onClick={onQuit}
        >
          Exit
        </button>
      </div>
    </div>
  );
};

export default Speedrun;
