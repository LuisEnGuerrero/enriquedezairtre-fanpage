import NextAuth, { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { syncUserDirect } from '@/app/api/auth/sync-user/route'

/**
 * Normalizar el email del ADMIN para evitar fallos por mayúsculas
 */
const ADMIN_EMAIL = (process.env.ADM1N_EM41L || 'enrique.zairtre@example.com')
  .toLowerCase()
  .trim()

export const authOptions: NextAuthOptions = {
  debug: true,

  /**
   * 🔐 Proveedor Google
   */
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],

  /**
   * 🍪 CONFIGURACIÓN CRÍTICA DE COOKIES
   * Necesaria para Firebase Hosting → Cloud Run
   */
  cookies: {
    sessionToken: {
      name: '__Secure-next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'none',
        path: '/',
        secure: true,
      },
    },
    callbackUrl: {
      name: '__Secure-next-auth.callback-url',
      options: {
        sameSite: 'none',
        path: '/',
        secure: true,
      },
    },
    csrfToken: {
      name: '__Host-next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'none',
        path: '/',
        secure: true,
      },
    },
  },

  /**
   * 🔐 JWT Callback
   */
  callbacks: {
    async jwt({ token, user }) {
      if (user?.email) {
        const cleanEmail = user.email.toLowerCase().trim()
        token.role = cleanEmail === ADMIN_EMAIL ? 'admin' : 'fan'
      }

      if (!token.role) token.role = 'fan'
      return token
    },

    /**
     * 🧠 Session Callback
     */
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
      }
      return session
    },

    /**
     * 🚀 signIn Callback
     */
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user.email) {
        try {
          const dbUser = await syncUserDirect({
            email: user.email,
            name: user.name,
            image: user.image,
          })

          user.id = dbUser.id
          user.role = dbUser.role
        } catch (error) {
          console.error('🔥 Error syncing user:', error)
          const cleanEmail = user.email.toLowerCase().trim()
          user.role = cleanEmail === ADMIN_EMAIL ? 'admin' : 'fan'
        }
      }

      return true
    },
  },

  /**
   * 📄 Páginas personalizadas
   */
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },

  /**
   * 🔑 Secret
   */
  secret: process.env.NEXTAUTH_SECRET,

  /**
   * 📦 Sesión por JWT
   */
  session: {
    strategy: 'jwt',
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
