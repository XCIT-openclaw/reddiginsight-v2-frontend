import type { Metadata } from "next";

export const SITE_URL = "https://reddiginsight.com";
export const SITE_NAME = "ReddigInsight";
export const HOME_TITLE =
  "AI Reddit Analyzer for Subreddit Insights | ReddigInsight";
export const HOME_DESCRIPTION =
  "Analyze Reddit communities with AI to uncover sentiment, trending topics, keywords, and actionable insights. Turn subreddit discussions into clear reports in minutes.";

export interface PublicSeoRoute {
  path: "/" | "/pricing" | "/privacy" | "/terms";
  title: string;
  llmsTitle: string;
  description: string;
  changeFrequency: "daily" | "weekly" | "monthly" | "yearly";
  priority: number;
}

export const PRIVATE_SEO_PATH_PREFIXES = [
  "/dashboard",
  "/chat",
  "/reports",
  "/settings",
  "/admin",
  "/login",
  "/signup",
  "/forgot-password",
] as const;



export const PUBLIC_SEO_ROUTES: PublicSeoRoute[] = [
  {
    path: "/",
    title: HOME_TITLE,
    llmsTitle: "Home",
    description: HOME_DESCRIPTION,
    changeFrequency: "weekly",
    priority: 1,
  },
  {
    path: "/pricing",
    title: "Pricing for AI Reddit & Subreddit Analysis | ReddigInsight",
    llmsTitle: "Pricing",
    description:
      "Compare Starter and Pro plans for AI-powered Reddit analysis, sentiment scoring, keyword extraction, and actionable subreddit insight reports.",
    changeFrequency: "weekly",
    priority: 0.9,
  },
  {
    path: "/privacy",
    title: "Privacy Policy | ReddigInsight",
    llmsTitle: "Privacy Policy",
    description:
      "Learn how ReddigInsight handles account data, Reddit content, AI processing, and analytics while protecting your privacy.",
    changeFrequency: "yearly",
    priority: 0.3,
  },
  {
    path: "/terms",
    title: "Terms of Service | ReddigInsight",
    llmsTitle: "Terms of Service",
    description:
      "Review the terms for using ReddigInsight AI-powered Reddit community analysis, credits, subscriptions, and generated reports.",
    changeFrequency: "yearly",
    priority: 0.3,
  },
];

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function buildSitemapXml(now: Date = new Date()): string {
  const urls = PUBLIC_SEO_ROUTES.map((route) => {
    const loc = SITE_URL + (route.path === "/" ? "/" : route.path);
    return [
      "  <url>",
      `    <loc>${escapeXml(loc)}</loc>`,
      `    <lastmod>${now.toISOString()}</lastmod>`,
      `    <changefreq>${route.changeFrequency}</changefreq>`,
      `    <priority>${route.priority.toFixed(1)}</priority>`,
      "  </url>",
    ].join("\n");
  }).join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    "</urlset>",
    "",
  ].join("\n");
}

export function buildRobotsTxt(): string {
  const crawlers = [
    "*",
    "GPTBot",
    "ClaudeBot",
    "PerplexityBot",
    "Google-Extended",
    "CCBot",
  ];

  return [
    ...crawlers.map((crawler) => `User-agent: ${crawler}`),
    "Allow: /",
    "Disallow: /dashboard",
    "Disallow: /chat",
    "Disallow: /reports",
    "Disallow: /settings",
    "Disallow: /admin",
    "Disallow: /login",
    "Disallow: /signup",
    "Disallow: /forgot-password",
    "Disallow: /api/",
    "",
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    "",
  ].join("\n");
}

export function buildLlmsTxt(): string {
  const pages = PUBLIC_SEO_ROUTES.map((route) => {
    const url = SITE_URL + (route.path === "/" ? "/" : route.path);
    return `- [${route.llmsTitle}](${url}): ${route.description}`;
  }).join("\n");

  return [
    `# ${SITE_NAME}`,
    "",
    "> AI-powered Reddit analyzer for subreddit insights, sentiment, trends, keywords, and actionable research reports.",
    "",
    "ReddigInsight helps marketers, founders, researchers, and community teams turn public Reddit discussions into structured analysis. It supports AI-guided search setup, subreddit sentiment analysis, keyword extraction, trend detection, and exportable insight reports.",
    "",
    "## Pages",
    pages,
    "",
    "## Product Capabilities",
    "- Analyze public subreddit discussions by keywords and time range.",
    "- Generate sentiment analysis, keyword extraction, trends, and AI insights.",
    "- Use AI chat to refine Reddit research queries.",
    "- Save and revisit subreddit analysis reports.",
    "- Export completed reports for research and collaboration.",
    "",
    "## AI Crawler Guidance",
    "- Public pages: /, /pricing, /privacy, /terms.",
    "- Private and account-specific pages are not intended for AI retrieval.",
    "- Respect robots.txt and do not infer user data or private report content from linked URLs.",
    "",
    "",
  ].join("\n");
}

export function createPublicMetadata(options: {
  title: string;
  description: string;
  path: PublicSeoRoute["path"];
  keywords?: string[];
}): Metadata {
  const url = SITE_URL + (options.path === "/" ? "/" : options.path);
  const fullTitle = options.title.includes(SITE_NAME)
    ? options.title
    : `${options.title} | ${SITE_NAME}`;

  return {
    title: options.title,
    description: options.description,
    keywords: options.keywords,
    alternates: { canonical: options.path },
    openGraph: {
      type: "website",
      url,
      siteName: SITE_NAME,
      title: fullTitle,
      description: options.description,
    },
    twitter: {
      card: "summary",
      title: fullTitle,
      description: options.description,
    },
  };
}
