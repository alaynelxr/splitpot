import type { Metadata, Viewport } from "next";
import { Press_Start_2P, Space_Mono, Inter } from "next/font/google";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

const pressStart2P = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
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
  themeColor: "#1A1A2E",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${pressStart2P.variable} ${spaceMono.variable} ${inter.variable} h-full`}
    >
      <body className="min-h-full bg-bg text-text font-body">
        <ToastProvider>
          <div id="app-shell">{children}</div>
        </ToastProvider>
      </body>
    </html>
  );
}
