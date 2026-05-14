import { updateSession } from "@/lib/supabase/middleware";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Gate all blog routes (public + admin) behind the feature flag.
  // Must run before updateSession so that disabled routes never touch the DB.
  if (!isFeatureEnabled("blog")) {
    const isBlogRoute =
      pathname === "/blog" ||
      pathname.startsWith("/blog/") ||
      pathname === "/dashboard/blog" ||
      pathname.startsWith("/dashboard/blog/");
    if (isBlogRoute) {
      return new NextResponse(null, { status: 404 });
    }
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
