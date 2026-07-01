"use client";
import Link from "next/link";

function PlusIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  );
}

export default function VersusLanding() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">Versus</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400 max-w-xl">
          Challenge friends to a live flashcard battle. Pick a folder, create or join a room,
          and race to answer correctly — every point counts.
        </p>
      </div>

      <div className="rounded-2xl shadow-md bg-white dark:bg-slate-800 ring-1 ring-black/5 dark:ring-white/10 p-6 sm:p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/versus/create"
            className="group rounded-2xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-700 transition-all"
          >
            <div className="mb-4 inline-flex items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/30 p-3 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
              <PlusIcon />
            </div>
            <div className="text-xl font-semibold text-slate-900 dark:text-white">Create room</div>
            <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">Pick a folder and host the match.</div>
          </Link>

          <Link
            href="/versus/join"
            className="group rounded-2xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-700 transition-all"
          >
            <div className="mb-4 inline-flex items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/30 p-3 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 transition-colors">
              <ArrowRightIcon />
            </div>
            <div className="text-xl font-semibold text-slate-900 dark:text-white">Join room</div>
            <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">Enter a code and jump in.</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
