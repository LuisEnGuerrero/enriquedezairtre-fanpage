import NextAuth, { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { syncUserDirect } from "@/app/api/auth/sync-user/route"

const ADMIN_EMAIL = (process.env.ADM1N_EM41L || "zairtre@gmail.com")
  .toLowerCase()
  .trim()

export const authOptions: NextAuthOptions = {
  debug: true,

  /**
   * 🔥 CRÍTICO PARA FIREBASE + CLOUD RUN
   */
  useSecureCookies: true,

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: "jwt",
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
        session.user.id = token.sub!
        session.user.role = token.role as string
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

          user.id = dbUser.id
          user.role = dbUser.role
        } catch (error) {
          console.error("🔥 Error syncing user:", error)
          const cleanEmail = user.email.toLowerCase().trim()
          user.role = cleanEmail === ADMIN_EMAIL ? "admin" : "fan"
        }
      }
      return true
    },
  },

  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
