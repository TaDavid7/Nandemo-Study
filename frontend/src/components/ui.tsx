// Shared building blocks used by every page.
"use client";
import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

/* ── Button ───────────────────────────────────────────── */

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-card hover:opacity-90",
  secondary: "bg-card text-ink border border-line hover:border-muted",
  ghost: "text-muted hover:text-ink hover:bg-ink/5",
  danger: "text-bad border border-bad/40 hover:bg-bad/10",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" | "lg" }) {
  return (
    <button
      {...props}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition active:scale-[0.97]",
        "disabled:opacity-40 disabled:pointer-events-none",
        size === "sm" && "h-8 px-3 text-sm",
        size === "md" && "h-10 px-4 text-sm",
        size === "lg" && "h-12 px-6 text-base",
        variants[variant],
        className
      )}
    />
  );
}

/* ── Layout pieces ────────────────────────────────────── */

export function PageHeader({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-6">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
        {sub && <p className="mt-2 max-w-xl text-muted">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

export function Panel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cx("rounded-xl border border-line bg-card", className)} />;
}

export const inputClass =
  "h-10 w-full rounded-lg border border-line bg-desk/60 px-3 text-base text-ink placeholder:text-muted/70 outline-none transition focus:border-info focus:bg-card";

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

/** Toggle chip with a highlighter fill when selected. */
export function Chip({ active, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      {...props}
      aria-pressed={active}
      className={cx(
        "relative h-9 rounded-lg border px-3.5 text-sm font-medium transition",
        active ? "border-hl bg-hl text-hl-ink" : "border-line bg-card text-ink hover:border-muted",
        className
      )}
    />
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-line bg-card px-1 font-sans text-[11px] text-muted">
      {children}
    </kbd>
  );
}

export function Notice({ tone = "bad", children }: { tone?: "bad" | "good"; children: React.ReactNode }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cx("rounded-lg px-3 py-2 text-sm", tone === "bad" ? "bg-bad/10 text-bad" : "bg-good/10 text-good")}
    >
      {children}
    </motion.p>
  );
}

/* ── Modal ────────────────────────────────────────────── */

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="w-full max-w-lg rounded-xl border border-line bg-card p-6 shadow-2xl"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h2 className="mb-5 text-xl font-semibold">{title}</h2>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Flip card ────────────────────────────────────────── */
// The index card used for studying everywhere in the app.

export function FlipCard({
  front,
  back,
  flipped,
  onFlip,
  className,
}: {
  front: React.ReactNode;
  back: React.ReactNode;
  flipped: boolean;
  onFlip?: () => void;
  className?: string;
}) {
  const face =
    "index-card absolute inset-0 flex flex-col rounded-xl border border-line shadow-[0_1px_0_var(--line),0_12px_30px_-12px_rgb(0_0_0/0.25)] [backface-visibility:hidden]";
  return (
    <div className={cx("[perspective:1400px]", className)}>
      <motion.button
        type="button"
        onClick={onFlip}
        aria-label={flipped ? "Show question" : "Show answer"}
        className="relative h-full w-full cursor-pointer text-left [transform-style:preserve-3d]"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
      >
        <div className={face}>
          <span className="px-7 pt-5 text-sm text-muted">Question</span>
          <div className="flex flex-1 items-center justify-center px-10 pb-10 text-center font-card text-3xl leading-snug">
            {front}
          </div>
        </div>
        <div className={face} style={{ transform: "rotateY(180deg)" }}>
          <span className="px-7 pt-5 text-sm text-muted">Answer</span>
          <div className="flex flex-1 items-center justify-center px-10 pb-10 text-center font-card text-3xl leading-snug">
            {back}
          </div>
        </div>
      </motion.button>
    </div>
  );
}
