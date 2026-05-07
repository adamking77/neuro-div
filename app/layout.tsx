import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import type { ReactNode } from "react";
import "./globals.css";
import { buildMetadata, SITE_NAME, SITE_TAGLINE } from "@/lib/site";

const geistSans = localFont({
  src: [
    { path: "../public/fonts/Geist-Regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/Geist-Medium.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/Geist-SemiBold.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-geist-sans",
});

const geistMono = localFont({
  src: [{ path: "../public/fonts/GeistMono-Regular.woff2", weight: "400", style: "normal" }],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = buildMetadata({
  title: `${SITE_NAME} | ${SITE_TAGLINE}`,
  description: SITE_TAGLINE,
});

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <div className="site-shell">
          <header className="site-header">
            <Link href="/" className="brand-lockup">
              <svg width="28" height="20" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <circle cx="12" cy="16" r="10" stroke="var(--teal)" strokeWidth="2" fill="none" />
                <circle cx="20" cy="16" r="10" stroke="var(--terracotta)" strokeWidth="2" fill="none" opacity="0.85" />
              </svg>
              <span>
                <strong>{SITE_NAME}</strong>
                <span>{SITE_TAGLINE}</span>
              </span>
            </Link>

            <nav className="site-nav" aria-label="Primary">
              <Link href="/context-builder">Context Builder</Link>
              <Link href="/process-designer">Process Designer</Link>
              <Link href="/category-scout">Category Scout</Link>
              <Link href="/distribution-strategy">Distribution Strategy</Link>
              <Link href="/skills">Skills</Link>
            </nav>
          </header>

          <main className="site-main">{children}</main>

          <footer className="site-footer">
            <span>Server-rendered routes, installable skills, and interactive ND-aware planning tools.</span>
            <span>
              <Link href="/llms.txt">llms.txt</Link>
              {" · "}
              <Link href="/skills.json">skills.json</Link>
            </span>
          </footer>
        </div>
      </body>
    </html>
  );
}
