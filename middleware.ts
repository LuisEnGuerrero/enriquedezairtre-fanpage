// middleware.ts

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Solo aplicamos lógica a rutas /admin/*
  if (pathname.startsWith("/admin")) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    // 1) No autenticado → enviar a login
    if (!token) {
      const loginUrl = new URL("/auth/signin", request.url)
      loginUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(loginUrl)
    }

    // 2) Autenticado pero sin rol admin → AccessDenied
    if (token.role !== "admin") {
      const deniedUrl = new URL("/auth/error", request.url)
      deniedUrl.searchParams.set("error", "AccessDenied")
      return NextResponse.redirect(deniedUrl)
    }
  }

  // Todas las demás rutas pasan normal
  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
