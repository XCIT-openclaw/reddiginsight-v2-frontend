import type { ReactNode } from "react";
import { createPublicMetadata } from "@/lib/seo";

export const metadata = createPublicMetadata({
  title: "Pricing for AI Reddit & Subreddit Analysis",
  description:
    "Compare Starter and Pro plans for AI-powered Reddit analysis, sentiment scoring, keyword extraction, and actionable subreddit insight reports.",
  path: "/pricing",
  keywords: [
    "Reddit analysis tool pricing",
    "AI subreddit analysis pricing",
    "Reddit sentiment analysis tool",
    "Reddit insights reports",
  ],
});

export default function PricingLayout({ children }: { children: ReactNode }) {
  return children;
}
