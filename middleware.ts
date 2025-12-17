// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const CANONICAL_HOST = "zairtre.site";

function isCloudRunHost(host: string) {
  // cubre *.run.app y *.a.run.app
  return host.endsWith(".run.app") || host.endsWith(".a.run.app");
}

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const { pathname, search } = request.nextUrl;

  // 0) Si entra por Cloud Run domain -> redirigir al dominio canónico preservando path+query
  if (isCloudRunHost(host)) {
    const url = new URL(`https://${CANONICAL_HOST}${pathname}${search}`);
    return NextResponse.redirect(url, 308);
  }

  // 1) Proteger /admin/*
  if (pathname.startsWith("/admin")) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      const loginUrl = new URL("/auth/signin", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if ((token as any).role !== "admin") {
      const deniedUrl = new URL("/auth/error", request.url);
      deniedUrl.searchParams.set("error", "AccessDenied");
      return NextResponse.redirect(deniedUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // aplica a todo excepto assets estáticos típicos
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
