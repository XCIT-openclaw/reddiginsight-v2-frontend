import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "ReddigInsight - AI-Powered Reddit Analysis",
  description: "Analyze Reddit subreddits with AI to uncover insights, sentiment, and trending topics",
  keywords: ["Reddit", "AI", "Analysis", "Sentiment", "Social Media"],
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/images/apple-touch-icon.png",
    other: [
      { rel: "icon", url: "/images/icon-192.png", sizes: "192x192" },
      { rel: "icon", url: "/images/icon-512.png", sizes: "512x512" },
    ],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="min-h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
