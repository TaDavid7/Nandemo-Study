"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const features = [
  {
    title: "Flashcards",
    description:
      "Build and organize cards by subject. Import entire note sets from a PDF using AI-powered extraction.",
    label: "Manage cards",
    href: "/home",
  },
  {
    title: "Daily Practice",
    description:
      "Spaced-repetition scheduling surfaces the exact cards you need to review — right before you'd forget them.",
    label: "Start daily",
    href: "/daily",
  },
  {
    title: "Speedrun",
    description:
      "Race against the clock. Answer as many questions as you can before time runs out and the deck recycles.",
    label: "Try speedrun",
    href: "/speedrun",
  },
  {
    title: "Versus",
    description:
      "Go head-to-head with a friend in real time. First to answer correctly takes the point.",
    label: "Play versus",
    href: "/versus",
  },
];

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.13 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function PromoPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("token")) {
      router.replace("/home");
    } else {
      setReady(true);
    }
  }, []);

  if (!ready) return null;

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white min-h-[calc(100vh-3.5rem)] transition-colors">
      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 text-center">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="max-w-3xl mx-auto space-y-7"
        >
          <motion.div variants={fadeUp} className="flex justify-center">
            <motion.div
              className="h-12 w-12 rounded-xl bg-indigo-600 shadow-lg shadow-indigo-200 dark:shadow-indigo-900"
              animate={{ scale: [1, 1.07, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.5 }}
            />
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight"
          >
            Build knowledge
            <br />
            <span className="text-indigo-600 dark:text-indigo-400">that actually sticks.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 leading-relaxed"
          >
            Nandemo is a modern study tool built around spaced repetition.
            Learn faster, retain longer, and make every session count.
          </motion.p>

          <motion.div variants={fadeUp} className="flex justify-center gap-4 pt-2">
            <Link
              href="/home"
              className="px-6 py-3 rounded-2xl bg-indigo-600 text-white font-semibold
                         hover:bg-indigo-500 transition shadow-lg shadow-indigo-100 dark:shadow-indigo-900/50"
            >
              Get Started
            </Link>
            <Link
              href="/account"
              className="px-6 py-3 rounded-2xl font-semibold transition
                         bg-transparent text-slate-700 dark:text-slate-300
                         ring-1 ring-slate-300 dark:ring-slate-700
                         hover:ring-slate-400 dark:hover:ring-slate-500
                         hover:text-slate-900 dark:hover:text-white"
            >
              Sign In
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Divider ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-t border-slate-200 dark:border-slate-800" />
      </div>

      {/* ── Features ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.p
          className="text-xs uppercase tracking-widest text-indigo-600 dark:text-indigo-500 font-semibold text-center mb-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          Four ways to study
        </motion.p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <Link
                href={f.href}
                className="group block rounded-2xl border p-7 transition
                           bg-white dark:bg-slate-900
                           border-slate-200 dark:border-slate-800
                           hover:border-indigo-200 dark:hover:border-indigo-800
                           hover:bg-slate-50 dark:hover:bg-slate-800/60
                           hover:shadow-md"
              >
                <h3 className="text-lg font-semibold mb-2
                               text-slate-900 dark:text-white
                               group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition">
                  {f.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-5">
                  {f.description}
                </p>
                <span className="text-xs font-medium text-indigo-600 dark:text-indigo-500 opacity-0 group-hover:opacity-100 transition">
                  {f.label} &rarr;
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <motion.div
          className="rounded-2xl border p-12 text-center space-y-5
                     bg-slate-50 dark:bg-slate-900
                     border-slate-200 dark:border-slate-800"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
        >
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Ready to start?</h2>
          <p className="text-slate-600 dark:text-slate-400 text-base max-w-md mx-auto">
            Create a free account and have your first deck ready in under a minute.
          </p>
          <Link
            href="/account"
            className="inline-block mt-2 px-8 py-3 rounded-2xl bg-indigo-600 text-white
                       font-semibold hover:bg-indigo-500 transition shadow-lg shadow-indigo-100 dark:shadow-indigo-900/50"
          >
            Create Account
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
