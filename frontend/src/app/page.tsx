"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getToken } from "@/lib/api";
import { FlipCard } from "@/components/ui";

const SAMPLES = [
  { q: "なんでも (nandemo)", a: "Anything, whatever it is" },
  { q: "Mitochondria", a: "Where the cell makes most of its energy (ATP)" },
  { q: "Year the Berlin Wall fell", a: "1989" },
  { q: "d/dx sin x", a: "cos x" },
];

const MODES = [
  { name: "Decks", href: "/home", text: "Write cards by hand or turn a PDF of your notes into a full deck." },
  { name: "Daily", href: "/daily", text: "Spaced repetition picks the cards you're about to forget, every day." },
  { name: "Speedrun", href: "/speedrun", text: "Type answers against the clock. The deck reshuffles until time's up." },
  { name: "Versus", href: "/versus", text: "Share a room code and race friends to the right answer." },
];

export default function LandingPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    if (getToken()) router.replace("/home");
    else setReady(true);
  }, [router]);

  // The demo card flips, then moves to the next sample.
  useEffect(() => {
    if (!ready) return;
    const id = setTimeout(() => {
      if (!flipped) setFlipped(true);
      else { setFlipped(false); setI((n) => (n + 1) % SAMPLES.length); }
    }, flipped ? 2200 : 1800);
    return () => clearTimeout(id);
  }, [ready, flipped]);

  if (!ready) return null;

  return (
    <div>
      <section className="grid grid-cols-[1.05fr_1fr] items-center gap-16 pt-6">
        <div>
          <h1 className="text-6xl font-bold leading-[1.02] tracking-tight">
            Study anything.
            <br />
            Remember it next week.
          </h1>
          <p className="mt-6 max-w-md text-lg text-muted">
            Nandemo turns your notes into flashcards and schedules each review right before you&apos;d forget it.
          </p>
          <div className="mt-9 flex gap-3">
            <Link href="/account" className="inline-flex h-12 items-center rounded-lg bg-ink px-6 font-medium text-card transition hover:opacity-90">
              Create a free account
            </Link>
            <Link href="/account" className="inline-flex h-12 items-center rounded-lg border border-line bg-card px-6 font-medium transition hover:border-muted">
              Sign in
            </Link>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, rotate: 4, y: 30 }}
          animate={{ opacity: 1, rotate: -2, y: 0 }}
          transition={{ type: "spring", stiffness: 120, damping: 16 }}
          className="relative h-[320px]"
        >
          <div className="absolute inset-0 translate-x-4 translate-y-4 rotate-3 rounded-xl border border-line bg-card/60" />
          <div className="absolute inset-0 translate-x-2 translate-y-2 rotate-1 rounded-xl border border-line bg-card/80" />
          <motion.div key={i} className="absolute inset-0" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
            <FlipCard className="h-full" front={SAMPLES[i].q} back={SAMPLES[i].a} flipped={flipped} onFlip={() => setFlipped((f) => !f)} />
          </motion.div>
        </motion.div>
      </section>

      <section className="mt-28 grid grid-cols-4 border-t border-line">
        {MODES.map((m) => (
          <Link key={m.name} href={m.href} className="group border-line py-8 pr-8 [&:not(:first-child)]:border-l [&:not(:first-child)]:pl-8">
            <h2 className="text-xl font-semibold">
              <span className="bg-[linear-gradient(transparent_60%,var(--hl)_60%)] bg-[length:0%_100%] bg-no-repeat transition-[background-size] duration-300 group-hover:bg-[length:100%_100%]">
                {m.name}
              </span>
            </h2>
            <p className="mt-2 text-muted">{m.text}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
