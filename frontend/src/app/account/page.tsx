"use client";
import React, { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { getUsername } from "@/lib/api";
import { Button, Field, Notice, Panel, inputClass } from "@/components/ui";

export default function AccountPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [user, setUser] = useState<string | null>(null);

  useEffect(() => setUser(getUsername()), []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Sign in failed. Check your username and password.");
      localStorage.setItem("token", data.token);
      localStorage.setItem("username", data.username);
      router.push("/home");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const signOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    window.location.href = "/account"; // full reload so the header updates too
  };

  if (user) {
    return (
      <div className="mx-auto max-w-md pt-8">
        <Panel className="p-8 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-ink text-2xl font-semibold text-card">
            {user[0]?.toUpperCase()}
          </span>
          <h1 className="mt-4 text-2xl font-bold">{user}</h1>
          <p className="mt-1 text-muted">You&apos;re signed in.</p>
          <div className="mt-6 flex justify-center gap-2">
            <Button onClick={() => router.push("/home")}>Go to my decks</Button>
            <Button variant="secondary" onClick={signOut}>Sign out</Button>
          </div>
        </Panel>
      </div>
    );
  }

  const login = mode === "login";

  return (
    <div className="mx-auto max-w-md pt-8">
      <AnimatePresence mode="wait">
        <motion.h1
          key={mode}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="mb-6 text-4xl font-bold tracking-tight"
        >
          {login ? "Welcome back" : "Create your account"}
        </motion.h1>
      </AnimatePresence>

      <Panel className="p-7">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Username">
            <input autoFocus autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required className={inputClass} />
          </Field>
          <Field label="Password">
            <input
              type="password"
              autoComplete={login ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={inputClass}
            />
          </Field>
          {error && <Notice>{error}</Notice>}
          <Button size="lg" className="w-full" disabled={busy}>
            {busy ? "One moment…" : login ? "Sign in" : "Create account"}
          </Button>
        </form>
      </Panel>

      <p className="mt-5 text-center text-sm text-muted">
        {login ? "New to Nandemo?" : "Already have an account?"}{" "}
        <button onClick={() => { setMode(login ? "register" : "login"); setError(null); }} className="font-medium text-ink underline underline-offset-4">
          {login ? "Create an account" : "Sign in"}
        </button>
      </p>
    </div>
  );
}
