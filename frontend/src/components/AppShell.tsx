// App frame: theme, motion settings, top navigation and service worker.
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeProvider, useTheme } from "next-themes";
import { MotionConfig, motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { getUsername } from "@/lib/api";

const navItems = [
  { href: "/home", label: "Decks" },
  { href: "/daily", label: "Daily" },
  { href: "/speedrun", label: "Speedrun" },
  { href: "/versus", label: "Versus" },
];

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-9 w-9" />;
  const dark = resolvedTheme === "dark";
  return (
    <button
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      className="grid h-9 w-9 place-items-center rounded-lg text-muted transition hover:bg-ink/5 hover:text-ink"
    >
      <motion.svg
        key={dark ? "sun" : "moon"}
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        className="h-[18px] w-[18px]"
      >
        {dark ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
          </>
        ) : (
          <path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z" />
        )}
      </motion.svg>
    </button>
  );
}

function Header() {
  const pathname = usePathname();
  const [user, setUser] = useState<string | null>(null);
  useEffect(() => setUser(getUsername()), [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-desk/85 backdrop-blur">
      <div className="mx-auto grid h-16 max-w-6xl grid-cols-[1fr_auto_1fr] items-center px-8">
        <Link href="/" className="flex items-center gap-2.5 justify-self-start">
          <span className="grid h-7 w-7 -rotate-6 place-items-center rounded-md bg-hl text-sm font-bold text-hl-ink">
            な
          </span>
          <span className="text-lg font-semibold tracking-tight">Nandemo</span>
        </Link>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-4 py-2 text-[15px] font-medium transition ${active ? "text-hl-ink" : "text-muted hover:text-ink"}`}
              >
                {active && (
                  <motion.span
                    layoutId="nav-highlight"
                    className="absolute inset-x-1.5 inset-y-1.5 -skew-x-6 rounded-[5px] bg-hl"
                    transition={{ type: "spring", stiffness: 500, damping: 38 }}
                  />
                )}
                <span className="relative">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 justify-self-end">
          <ThemeToggle />
          <Link
            href="/account"
            className="flex h-9 items-center gap-2 rounded-lg border border-line bg-card px-3 text-sm font-medium transition hover:border-muted"
          >
            {user ? (
              <>
                <span className="grid h-5 w-5 place-items-center rounded-full bg-ink text-[11px] text-card">
                  {user[0]?.toUpperCase()}
                </span>
                {user}
              </>
            ) : (
              "Sign in"
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  // Offline app-shell caching (see docs/ADR1_offline_model). public/sw.js is still a stub.
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <MotionConfig reducedMotion="user">
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="mx-auto w-full max-w-6xl flex-1 px-8 py-12">{children}</main>
        </div>
      </MotionConfig>
    </ThemeProvider>
  );
}
