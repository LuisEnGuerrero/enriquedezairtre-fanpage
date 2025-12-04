import GoogleProvider from "next-auth/providers/google"
import { syncUserDirect } from "@/app/api/auth/sync-user/route"

const ADMIN_EMAIL = process.env.ADM1N_EM41L || 'enrique.zairtre@example.com'

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user?.email) {
        token.role = user.email === ADMIN_EMAIL ? 'admin' : 'fan'
      }

      return token
    },

    async session({ session, token }) {
      session.user.id = token.sub!
      session.user.role = token.role
      return session
    },

    async signIn({ user, account }) {
      if (account?.provider === 'google' && user.email) {
        try {
          const dbUser = await syncUserDirect({
            email: user.email,
            name: user.name,
            image: user.image,
          })

          user.id = dbUser.id
          user.role = dbUser.role ?? 'fan'
        } catch (err) {
          user.role = user.email === ADMIN_EMAIL ? 'admin' : 'fan'
        }
      }

      return true
    },
  },

  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },

  secret: process.env.NEXTAUTH_SECRET,
}
