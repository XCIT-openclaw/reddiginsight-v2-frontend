import assert from "node:assert/strict";
import { test } from "node:test";
import {
  HOME_DESCRIPTION,
  HOME_TITLE,
  PUBLIC_SEO_ROUTES,
  SITE_NAME,
  SITE_URL,
  buildLlmsTxt,
  buildRobotsTxt,
  buildSitemapXml,
} from "./seo.ts";

test("defines the production site identity and public route inventory", () => {
  assert.equal(SITE_URL, "https://reddiginsight.com");
  assert.equal(SITE_NAME, "ReddigInsight");
  assert.equal(
    HOME_TITLE,
    "AI Reddit Analyzer for Subreddit Insights | ReddigInsight"
  );
  assert.equal(
    HOME_DESCRIPTION,
    "Analyze Reddit communities with AI to uncover sentiment, trending topics, keywords, and actionable insights. Turn subreddit discussions into clear reports in minutes."
  );
  assert.deepEqual(
    PUBLIC_SEO_ROUTES.map((route) => route.path),
    ["/", "/how-to-use", "/pricing", "/privacy", "/terms"]
  );
});

test("builds a sitemap from the public route inventory", () => {
  const xml = buildSitemapXml(new Date("2026-08-28T00:00:00.000Z"));

  assert.match(xml, /^<\?xml version="1.0" encoding="UTF-8"\?>/);
  assert.ok(xml.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'));
  assert.ok(xml.includes("<loc>https://reddiginsight.com/</loc>"));
  assert.ok(xml.includes("<loc>https://reddiginsight.com/pricing</loc>"));
  assert.ok(xml.includes("<loc>https://reddiginsight.com/how-to-use</loc>"));
  assert.ok(xml.includes("<loc>https://reddiginsight.com/privacy</loc>"));
  assert.ok(xml.includes("<loc>https://reddiginsight.com/terms</loc>"));
  assert.ok(xml.includes("<lastmod>2026-08-28T00:00:00.000Z</lastmod>"));
  assert.ok(!xml.includes("/dashboard"));
  assert.ok(!xml.includes("/reports"));
  assert.ok(!xml.includes("/settings"));
});

test("builds robots rules for search and AI crawlers", () => {
  const robots = buildRobotsTxt();

  assert.ok(robots.includes("User-agent: *"));
  assert.ok(robots.includes("User-agent: GPTBot"));
  assert.ok(robots.includes("User-agent: ClaudeBot"));
  assert.ok(robots.includes("User-agent: PerplexityBot"));
  assert.ok(robots.includes("Allow: /"));
  assert.ok(robots.includes("Disallow: /dashboard"));
  assert.ok(robots.includes("Disallow: /chat"));
  assert.ok(robots.includes("Disallow: /reports"));
  assert.ok(robots.includes("Disallow: /settings"));
  assert.ok(robots.includes("Disallow: /admin"));
  assert.ok(robots.includes("Disallow: /login"));
  assert.ok(robots.includes("Disallow: /signup"));
  assert.ok(robots.includes("Disallow: /forgot-password"));
  assert.ok(robots.includes("Disallow: /reset-password"));
  assert.ok(robots.includes("Disallow: /api/"));
  assert.ok(
    robots.includes("Sitemap: https://reddiginsight.com/sitemap.xml")
  );
});

test("builds an llms.txt overview for AI crawlers", () => {
  const llms = buildLlmsTxt();

  assert.match(llms, /^# ReddigInsight\n/);
  assert.ok(llms.includes("> AI-powered Reddit analyzer for subreddit insights"));
  assert.ok(llms.includes("[Home](https://reddiginsight.com/)"));
  assert.ok(llms.includes("[Pricing](https://reddiginsight.com/pricing)"));
  assert.ok(llms.includes("[How to Use](https://reddiginsight.com/how-to-use)"));
  assert.ok(llms.includes("[Privacy Policy](https://reddiginsight.com/privacy)"));
  assert.ok(llms.includes("[Terms of Service](https://reddiginsight.com/terms)"));
  assert.ok(llms.includes("## AI Crawler Guidance"));
  assert.ok(llms.includes("Public pages: /, /how-to-use, /pricing, /privacy, /terms"));
});
