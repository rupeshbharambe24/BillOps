import "./globals.css";

import Link from "next/link";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
});

export const metadata = {
  title: "Billing Event Processing System",
  description: "Event-driven billing ledger with dedupe and overdraft protection.",
};

const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/ingest", label: "Ingest" },
  { href: "/balances", label: "Balances" },
  { href: "/events", label: "Events" },
  { href: "/rejections", label: "Rejections" },
];

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${plexMono.variable}`}>
        <div className="min-h-screen">
          <header className="sticky top-0 z-10 border-b border-white/60 bg-white/70 backdrop-blur">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-soft">
                  $B
                </div>
                <div>
                  <p className="text-lg font-semibold">Billing Event Processing</p>
                  <p className="text-xs text-slate-500">Ledger-first, out-of-order safe</p>
                </div>
              </div>
              <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
                {navLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="transition hover:text-emerald-700">
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="mx-auto flex w-full max-w-6xl gap-3 overflow-x-auto px-4 pb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 md:hidden">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className="whitespace-nowrap hover:text-emerald-700">
                  {link.label}
                </Link>
              ))}
            </div>
          </header>
          <main className="mx-auto w-full max-w-6xl px-4 py-10">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
