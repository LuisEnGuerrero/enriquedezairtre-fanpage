// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const CANONICAL_HOST = "zairtre.site";

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") || "";
  const { pathname, search } = req.nextUrl;

  // No tocar NextAuth ni assets
  if (pathname.startsWith("/api/auth") || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  // Si llega por run.app u otro host, redirige al canónico
  if (host !== CANONICAL_HOST) {
    const url = new URL(`https://${CANONICAL_HOST}${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next).*)"],
};
