import type { ReactNode } from "react";
import { createPublicMetadata } from "@/lib/seo";

export const metadata = createPublicMetadata({
  title: "Terms of Service",
  description:
    "Review the terms for using ReddigInsight AI-powered Reddit community analysis, credits, subscriptions, and generated reports.",
  path: "/terms",
});

export default function TermsLayout({ children }: { children: ReactNode }) {
  return children;
}
