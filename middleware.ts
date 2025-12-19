// middleware.ts
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const CANONICAL_HOST = "zairtre.site"
const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "__session"

/* -------------------------
   Helpers de rutas
--------------------------*/
function isAdminPath(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/")
}

function isAdminApiPath(pathname: string) {
  return pathname.startsWith("/api/admin/")
}

function isAdminLogin(pathname: string) {
  return pathname === "/admin/login"
}

function isBypassPath(pathname: string) {
  // Next internals / assets
  if (pathname.startsWith("/_next")) return true
  if (pathname.startsWith("/favicon")) return true
  if (pathname.startsWith("/robots.txt")) return true
  if (pathname.startsWith("/sitemap")) return true

  // 🔥 AUTH PATHS (CRÍTICO)
  if (pathname.startsWith("/auth")) return true
  if (pathname.startsWith("/api/auth")) return true

  // Auth endpoints propios (Firebase)
  if (pathname.startsWith("/api/login")) return true
  if (pathname.startsWith("/api/logout")) return true
  if (pathname.startsWith("/api/me")) return true

  return false
}


/* -------------------------
   Middleware principal
--------------------------*/
export async function middleware(req: NextRequest) {
  const host = req.headers.get("host") || ""
  const { pathname, search } = req.nextUrl

  /* 1️⃣ Bypass inicial */
  if (isBypassPath(pathname)) {
    return NextResponse.next()
  }

  /* 2️⃣ Canonical host (tu lógica actual intacta) */
  if (host !== CANONICAL_HOST) {
    const url = new URL(`https://${CANONICAL_HOST}${pathname}${search}`)
    return NextResponse.redirect(url)
  }

  /* 3️⃣ Determinar si es zona admin */
  const protectAdminUI = isAdminPath(pathname) && !isAdminLogin(pathname)
  const protectAdminApi = isAdminApiPath(pathname)

  if (!protectAdminUI && !protectAdminApi) {
    return NextResponse.next()
  }

  /* 4️⃣ Requisito mínimo: cookie de sesión */
  const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value
  if (!sessionCookie) {
    if (protectAdminApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const loginUrl = req.nextUrl.clone()
    loginUrl.pathname = "/admin/login"
    loginUrl.searchParams.set(
      "callbackUrl",
      req.nextUrl.pathname + req.nextUrl.search
    )
    return NextResponse.redirect(loginUrl)
  }

  /* 5️⃣ Validar rol admin vía /api/me */
  try {
    const meUrl = req.nextUrl.clone()
    meUrl.pathname = "/api/me"
    meUrl.search = ""

    const meRes = await fetch(meUrl, {
      headers: {
        cookie: req.headers.get("cookie") || "",
      },
      cache: "no-store",
    })

    if (!meRes.ok) {
      if (protectAdminApi) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const loginUrl = req.nextUrl.clone()
      loginUrl.pathname = "/admin/login"
      loginUrl.searchParams.set(
        "callbackUrl",
        req.nextUrl.pathname + req.nextUrl.search
      )
      return NextResponse.redirect(loginUrl)
    }

    const data = await meRes.json()
    const role = data?.user?.role

    if (role !== "admin") {
      if (protectAdminApi) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      const loginUrl = req.nextUrl.clone()
      loginUrl.pathname = "/admin/login"
      loginUrl.searchParams.set(
        "callbackUrl",
        req.nextUrl.pathname + req.nextUrl.search
      )
      loginUrl.searchParams.set("error", "not_admin")
      return NextResponse.redirect(loginUrl)
    }

    /* 6️⃣ Admin OK */
    return NextResponse.next()
  } catch (err) {
    if (protectAdminApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const loginUrl = req.nextUrl.clone()
    loginUrl.pathname = "/admin/login"
    loginUrl.searchParams.set(
      "callbackUrl",
      req.nextUrl.pathname + req.nextUrl.search
    )
    return NextResponse.redirect(loginUrl)
  }
}

/* -------------------------
   Matcher
--------------------------*/
export const config = {
  matcher: ["/((?!_next).*)"],
}
