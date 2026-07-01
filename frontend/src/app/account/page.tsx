"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("username");
    if (storedUser) setUser(storedUser);
  }, []);

  const submit = async () => {
    setError(null);
    const res = await fetch(`/api/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }
    localStorage.setItem("token", data.token);
    localStorage.setItem("username", data.username);
    setUser(data.username);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setUser(null);
    setUsername("");
    setPassword("");
  };

  if (user) {
    return (
      <div className="max-w-md mx-auto p-6 space-y-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome, {user}!</h1>
        <p className="text-slate-600 dark:text-slate-400">You are logged in.</p>
        <button
          onClick={logout}
          className="mt-2 bg-red-500 text-white px-4 py-2 rounded-xl hover:bg-red-600 transition font-medium"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-5">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
        {mode === "login" ? "Sign In" : "Create Account"}
      </h1>

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Username</label>
          <input
            type="text"
            placeholder="Enter username"
            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600
                       bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100
                       placeholder-slate-400 dark:placeholder-slate-500
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
          <input
            type="password"
            placeholder="Enter password"
            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600
                       bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100
                       placeholder-slate-400 dark:placeholder-slate-500
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
        </div>

        <button
          onClick={submit}
          className="w-full bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition font-medium"
        >
          {mode === "login" ? "Sign In" : "Create Account"}
        </button>
      </div>

      <p className="text-center text-sm text-slate-600 dark:text-slate-400">
        {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
        <button
          onClick={() => setMode(mode === "login" ? "register" : "login")}
          className="text-indigo-600 dark:text-indigo-400 underline hover:no-underline"
        >
          {mode === "login" ? "Register here" : "Sign in instead"}
        </button>
      </p>
    </div>
  );
}
