import "@fontsource-variable/schibsted-grotesk";
import "@fontsource-variable/newsreader";
import "./globals.css";
import type { Metadata } from "next";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Nandemo",
  description: "Flashcards and spaced repetition",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
