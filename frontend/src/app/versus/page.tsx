"use client";
import Link from "next/link";

export default function VersusLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
            
        {/* Hero */}
        <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Versus</h1>
        <p className="mt-2 text-slate-600">Versus is a fast-paced multiplayer flashcard game where you can challenge friends to test your knowledge. 
            Pick a folder of flashcards, create a room or join one to answer questions correctly. 
            Every correct answer boosts your score but only the quickest players can stay ahead. Learn, compete, and see who comes out on top!</p>
        </div>
        <div className="rounded-2xl shadow-md bg-white ring-1 ring-black/5 p-6 sm:p-8">
          <div className="p-6 space-y-6"> 
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link href="/versus/create" className="rounded-2xl shadow p-6 hover:shadow-md">
                <div className="text-xl font-semibold">Create room</div>
                <div className="text-sm opacity-70">Pick a folder and host the match.</div>
              </Link>
              <Link href="/versus/join" className="rounded-2xl shadow p-6 hover:shadow-md">
                <div className="text-xl font-semibold">Join room</div>
                <div className="text-sm opacity-70">Enter a code and your name.</div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}