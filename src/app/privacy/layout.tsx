import type { ReactNode } from "react";
import { createPublicMetadata } from "@/lib/seo";

export const metadata = createPublicMetadata({
  title: "Privacy Policy",
  description:
    "Learn how ReddigInsight handles account data, Reddit content, AI processing, and analytics while protecting your privacy.",
  path: "/privacy",
});

export default function PrivacyLayout({ children }: { children: ReactNode }) {
  return children;
}
