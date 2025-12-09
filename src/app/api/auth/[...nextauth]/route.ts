import NextAuth, { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { syncUserDirect } from '@/app/api/auth/sync-user/route'

/**
 * Normalizar el email del ADMIN para evitar fallos por mayúsculas
 */
const ADMIN_EMAIL = (process.env.ADM1N_EM41L || 'enrique.zairtre@example.com').toLowerCase().trim()

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],

  /**
   * 🔐 JWT Callback:
   * Se ejecuta:
   *  - en el primer login
   *  - en cada refresh del token
   *  - al obtener session en server components
   */
  callbacks: {
    async jwt({ token, user }) {
      // SOLO el primer login trae "user"
      if (user?.email) {
        const cleanEmail = user.email.toLowerCase().trim()
        token.role = cleanEmail === ADMIN_EMAIL ? 'admin' : 'fan'
      }

      // fallback por seguridad
      if (!token.role) token.role = 'fan'

      return token
    },

    /**
     * 🧠 Session Callback:
     * Lo que llegue aquí es lo que recibes en useSession()
     */
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
      }
      return session
    },

    /**
     * 🚀 signIn Callback:
     * 1) Valida ingreso
     * 2) Sincroniza DB automáticamente
     */
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user.email) {
        try {
          const dbUser = await syncUserDirect({
            email: user.email,
            name: user.name,
            image: user.image,
          })

          // Vincular info DB → sesión NextAuth
          user.id = dbUser.id
          user.role = dbUser.role

        } catch (error) {
          console.error('🔥 Error syncing user via direct DB call:', error)

          // fallback para no romper login
          const cleanEmail = user.email.toLowerCase().trim()
          user.role = cleanEmail === ADMIN_EMAIL ? 'admin' : 'fan'
        }
      }

      return true // permitir login siempre
    },
  },

  /**
   * Páginas personalizadas
   */
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },

  /**
   * Clave secreta del JWT
   */
  secret: process.env.NEXTAUTH_SECRET,

  /**
   * Importante para evitar errores de `session.strategy`
   * (por defecto usa 'jwt', que aquí es lo correcto)
   */
  session: {
    strategy: 'jwt',
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
