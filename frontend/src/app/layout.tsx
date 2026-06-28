import "./globals.css";
import AppShell from "@/components/TabNavigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mem Study",
  description: "Flashcards and study tools",
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
