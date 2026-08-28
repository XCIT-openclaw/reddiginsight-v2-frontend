import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import {
  HOME_DESCRIPTION,
  HOME_TITLE,
  SITE_NAME,
  SITE_URL,
  createPublicMetadata,
} from "@/lib/seo";

const homepageMetadata = createPublicMetadata({
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  path: "/",
  keywords: [
    "AI Reddit analyzer",
    "Reddit sentiment analysis tool",
    "subreddit analysis tool",
    "Reddit community insights",
    "analyze subreddit trends",
    "Reddit market research tool",
  ],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: HOME_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: HOME_DESCRIPTION,
  keywords: homepageMetadata.keywords,
  alternates: { canonical: "/" },
  openGraph: homepageMetadata.openGraph,
  twitter: homepageMetadata.twitter,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/favicon.ico?v=20260818",
    shortcut: "/favicon.ico?v=20260818",
    apple: "/images/apple-touch-icon.png",
    other: [
      { rel: "icon", url: "/images/icon-192.png?v=20260818", sizes: "192x192" },
      { rel: "icon", url: "/images/icon-512.png?v=20260818", sizes: "512x512" },
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
