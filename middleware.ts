// middleware.ts
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

const PRIMARY_HOST = "zairtre.site"
const ALLOWED_HOSTS = new Set([PRIMARY_HOST, "localhost:3000"])

export async function middleware(req: NextRequest) {
  const url = req.nextUrl
  const host = req.headers.get("host") || ""

  // ✅ 1) Si llega por *.a.run.app (o cualquier host no permitido), redirige al dominio real
  //    (IMPORTANTE: conserva pathname + search)
  if (host && !ALLOWED_HOSTS.has(host)) {
    const dest = new URL(url.pathname + url.search, `https://${PRIMARY_HOST}`)
    return NextResponse.redirect(dest, 308)
  }

  // ✅ 2) Tu protección /admin (se mantiene)
  if (url.pathname.startsWith("/admin")) {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    })

    if (!token) {
      const loginUrl = new URL("/auth/signin", url.origin)
      loginUrl.searchParams.set("callbackUrl", url.pathname)
      return NextResponse.redirect(loginUrl)
    }

    if ((token as any).role !== "admin") {
      const deniedUrl = new URL("/auth/error", url.origin)
      deniedUrl.searchParams.set("error", "AccessDenied")
      return NextResponse.redirect(deniedUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  // ✅ importantísimo: incluye /api/auth/* para que el callback de Google NO se procese en *.a.run.app
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
