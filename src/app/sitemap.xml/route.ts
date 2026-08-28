import { buildSitemapXml } from "@/lib/seo";

export const dynamic = "force-static";

export function GET() {
  return new Response(buildSitemapXml(), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-max-age=86400",
    },
  });
}
