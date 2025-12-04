// src/app/api/auth/[...nextauth]/route.ts

import NextAuth, { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { syncUserDB } from "@/lib/syncUser"

const ADMIN_EMAIL = process.env.ADM1N_EM41L

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    // 🔐 1. Se ejecuta en cada request para el token JWT
    async jwt({ token, user }) {
      // En el primer login, NextAuth pasa `user`
      if (user) {
        // Aseguramos que el token tenga el id de la DB, no el de Google
        if (user.id) {
          token.id = user.id
        }

        if (user.email) {
          // Si viene rol desde la DB, úsalo; si no, cae al correo admin
          const userRole =
            user.role || (user.email === ADMIN_EMAIL ? "admin" : "fan")
          token.role = userRole
        }
      }

      // Fallback por seguridad
      if (!token.role) {
        token.role = "fan"
      }

      return token
    },

    // 🧠 2. Se ejecuta cuando construye la session enviada al cliente
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) || token.sub || ""
        session.user.role = (token.role as string) || "fan"
      }
      return session
    },

    // 🚀 3. Se ejecuta al hacer signIn
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        try {
          // Sincronizamos usuario en la DB (fans y admin)
          const dbUser = await syncUserDB(user.email, user.name, user.image)

          // Nos aseguramos de que NextAuth conozca el id y el rol de la DB
          user.id = dbUser.id
          user.role = dbUser.role
        } catch (error) {
          console.error("Error en syncUserDB:", error)

          // Si la DB falla, NO bloqueamos login, pero inferimos rol por correo
          user.role = user.email === ADMIN_EMAIL ? "admin" : "fan"
        }
      }

      // Si quisieras bloquear por dominio, sería aquí
      // if (!user.email?.endsWith("@midominio.com")) return false;

      return true
    },
  },

  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },

  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
