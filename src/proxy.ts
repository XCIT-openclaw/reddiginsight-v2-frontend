import { updateSession } from "@/lib/supabase/middleware";
import { PRIVATE_SEO_PATH_PREFIXES } from "@/lib/seo";
import { type NextRequest } from "next/server";

export default async function proxy(request: NextRequest) {
  const response = await updateSession(request);

  if (
    PRIVATE_SEO_PATH_PREFIXES.some(
      (path) => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(path + "/")
    )
  ) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
