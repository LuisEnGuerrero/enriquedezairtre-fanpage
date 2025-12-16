import NextAuth, { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { syncUserDirect } from "@/app/api/auth/sync-user/route"

const ADMIN_EMAIL = (process.env.ADM1N_EM41L || "zairtre@gmail.com")
  .toLowerCase()
  .trim()

export const authOptions: NextAuthOptions = {
  debug: process.env.NEXTAUTH_DEBUG === "true",

  // En Cloud Run + HTTPS + dominio custom
  useSecureCookies: true,

  // IMPORTANTE: si estás en NextAuth v4, el trust host lo haces por env:
  // NEXTAUTH_TRUST_HOST=true
  // (si fuera v5, sería trustHost: true)

  cookies: {
    sessionToken: {
      name: "__Secure-next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },
    callbackUrl: {
      name: "__Secure-next-auth.callback-url",
      options: {
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },
    csrfToken: {
      name: "__Secure-next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },

    // 🔥 ESTAS DOS SON LAS QUE TE ESTÁN MATANDO (state/pkce)
    state: {
      name: "__Secure-next-auth.state",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },
    pkceCodeVerifier: {
      name: "__Secure-next-auth.pkce.code_verifier",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },

    // (Opcional pero recomendado para Google OIDC)
    nonce: {
      name: "__Secure-next-auth.nonce",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },
  },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  session: { strategy: "jwt" },

  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user?.email) {
        const cleanEmail = user.email.toLowerCase().trim()
        token.role = cleanEmail === ADMIN_EMAIL ? "admin" : "fan"
      }
      if (!token.role) token.role = "fan"
      return token
    },

    async session({ session, token }) {
      if (session.user && token) {
        ;(session.user as any).id = token.sub
        ;(session.user as any).role = token.role
      }
      return session
    },

    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        try {
          const dbUser = await syncUserDirect({
            email: user.email,
            name: user.name,
            image: user.image,
          })

          ;(user as any).id = dbUser.id
          ;(user as any).role = dbUser.role
        } catch (error) {
          console.error("🔥 Error syncing user:", error)
          const cleanEmail = user.email.toLowerCase().trim()
          ;(user as any).role = cleanEmail === ADMIN_EMAIL ? "admin" : "fan"
        }
      }
      return true
    },
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
