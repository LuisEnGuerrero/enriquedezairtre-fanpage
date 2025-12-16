import NextAuth, { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { syncUserDirect } from "@/app/api/auth/sync-user/route"

// Codigo de prueba

// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define aquí los hosts permitidos
const allowedHosts = ["zairtre.site", "localhost:3000"];

export function middleware(req: NextRequest) {
  const host = req.headers.get("host");

  // Si el host no está en la lista de permitidos, redirige al dominio principal
  if (host && !allowedHosts.includes(host)) {
    return NextResponse.redirect(new URL("/", "https://zairtre.site"));
  }

  // Si el host es válido, continúa normalmente
  return NextResponse.next();
}

// Configuración opcional: aplica el middleware a todas las rutas
export const config = {
  matcher: "/:path*",
};



// Codigo de siempre:
const ADMIN_EMAIL = (process.env.ADM1N_EM41L || "zairtre@gmail.com")
  .toLowerCase()
  .trim()

const isProd = process.env.NODE_ENV === "production"
const COOKIE_DOMAIN = "zairtre.site" // <-- tu dominio (sin https)

export const authOptions: NextAuthOptions = {
  debug: true,

  // ✅ CLAVE en Cloud Run / proxies
   useSecureCookies: isProd,

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  session: { strategy: "jwt" },

  // ✅ CLAVE: cookies con domain consistente (para evitar "State cookie was missing")
  cookies: {
    state: {
      name: isProd ? "__Secure-next-auth.state" : "next-auth.state",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProd,
        domain: isProd ? `.${COOKIE_DOMAIN}` : undefined,
      },
    },
    pkceCodeVerifier: {
      name: isProd
        ? "__Secure-next-auth.pkce.code_verifier"
        : "next-auth.pkce.code_verifier",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProd,
        domain: isProd ? `.${COOKIE_DOMAIN}` : undefined,
      },
    },
    callbackUrl: {
      name: isProd ? "__Secure-next-auth.callback-url" : "next-auth.callback-url",
      options: {
        sameSite: "lax",
        path: "/",
        secure: isProd,
        domain: isProd ? `.${COOKIE_DOMAIN}` : undefined,
      },
    },
    sessionToken: {
      name: isProd
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProd,
        domain: isProd ? `.${COOKIE_DOMAIN}` : undefined,
      },
    },
    // 👇 csrfToken en prod suele usar __Host- (NO puede llevar domain). Mejor dejarlo default.
  },

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        try {
          const dbUser = await syncUserDirect({
            email: user.email,
            name: user.name,
            image: user.image,
          })
          user.id = dbUser.id
          ;(user as any).role = dbUser.role
        } catch (error) {
          console.error("🔥 Error syncing user:", error)
          const cleanEmail = user.email.toLowerCase().trim()
          ;(user as any).role = cleanEmail === ADMIN_EMAIL ? "admin" : "fan"
        }
      }
      return true
    },

    async jwt({ token, user }) {
      const email =
        (user?.email ? user.email.toLowerCase().trim() : undefined) ??
        (token.email ? String(token.email).toLowerCase().trim() : undefined)

      if (email) {
        token.role = email === ADMIN_EMAIL ? "admin" : "fan"
        token.email = email
      }
      if (!token.role) token.role = "fan"

      // si signIn setea role:
      if (user && (user as any).role) token.role = (user as any).role

      return token
    },

    async session({ session, token }) {
      if (session.user && token) {
        ;(session.user as any).id = token.sub
        ;(session.user as any).role = token.role
      }
      return session
    },

    // ✅ fuerza que TODO vuelva al mismo origen (evita saltos raros)
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`
      try {
        const u = new URL(url)
        if (u.origin === baseUrl) return url
      } catch {}
      return baseUrl
    },
  },

  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
