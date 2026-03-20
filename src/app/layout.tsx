import type { Metadata, Viewport } from "next";
import { Instrument_Serif, JetBrains_Mono, DM_Sans } from "next/font/google";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-game",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SHFT — The Daily Word Chain Puzzle",
  description:
    "Transform one word into another, one letter at a time. Every step must be a real word. Fewest steps wins.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SHFT",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#C9A84C",
};

/**
 * Theme initialization script — runs before React hydration to avoid flash.
 * Sets .dark class on <html> based on localStorage or system preference.
 */
/**
 * Inline script that runs before hydration:
 * 1. Sets dark/light theme from localStorage (no flash)
 * 2. Registers service worker for PWA
 */
const initScript = `
(function() {
  try {
    var theme = localStorage.getItem('shft-theme');
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch(e) {}
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/sw.js');
    });
  }
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${jetbrainsMono.variable} ${dmSans.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: initScript }} />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="bg-bg-primary text-text-primary font-body min-h-dvh">
        <div className="mx-auto max-w-[480px] min-h-dvh flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
