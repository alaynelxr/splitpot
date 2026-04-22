import type { Metadata, Viewport } from "next";
import { Press_Start_2P, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const pressStart2P = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SplitPot — Bill Splitting for Shared Meals",
  description:
    "Photograph a restaurant bill, assign items to your group, and share a clean per-person breakdown in under 2 minutes.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a0420",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${pressStart2P.variable} ${jetbrainsMono.variable}`}>
      <body>
        <div id="app-shell">{children}</div>
      </body>
    </html>
  );
}
