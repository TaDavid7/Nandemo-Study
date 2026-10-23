import "@fontsource-variable/schibsted-grotesk";
import "@fontsource-variable/newsreader";
import "./globals.css";
import type { Metadata, Viewport } from "next";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Tandemo",
  description: "Flashcards and spaced repetition",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // lets the bottom tab bar sit above the iPhone home indicator
};

// Picks the desktop or phone layout before the first paint (see useLayoutMode in AppShell).
const layoutScript = `try{var o=localStorage.getItem("layout");if(o==="mobile"||(o!=="desktop"&&matchMedia("(max-width: 767px)").matches))document.documentElement.setAttribute("data-mobile","")}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: layoutScript }} />
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
