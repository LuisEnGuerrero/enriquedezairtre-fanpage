import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // Add role to specific users
      if (user?.email === 'enrique.zairtre@example.com') {
        token.role = 'admin'
      } else {
        token.role = 'fan'
      }
      
      // Store user info in token for database operations
      if (user && account) {
        token.id = user.id
      }
      
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
      }
      return session
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' && user.email) {
        try {
          // Create or update user in database
          const response = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/sync-user`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: user.email,
              name: user.name,
              image: user.image,
            }),
          })

          if (!response.ok) {
            console.error('Failed to sync user to database')
            return false
          }

          const dbUser = await response.json()
          user.id = dbUser.id
          user.role = dbUser.role

          return true
        } catch (error) {
          console.error('Error syncing user:', error)
          return false
        }
      }
      return true
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }