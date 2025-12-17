// app/api/auth/[...nextauth]/route.ts
import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { syncUserDirect } from "@/app/api/auth/sync-user/route";

const ADMIN_EMAIL = (process.env.ADM1N_EM41L || "zairtre@gmail.com")
  .toLowerCase()
  .trim();

export const authOptions: NextAuthOptions = {
  debug: true,
  secret: process.env.NEXTAUTH_SECRET,

  // En Cloud Run SIEMPRE estás en HTTPS hacia el usuario final,
  // aunque internamente haya proxy.
  useSecureCookies: true,

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],

  session: { strategy: "jwt" },

  // ✅ Importante: deja que NextAuth maneje cookies default.
  // Tus overrides de cookies/domain suelen ser la fuente del "state missing"
  // en setups con proxy + dominios.
  // cookies: { ... }   <-- NO

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        try {
          const dbUser = await syncUserDirect({
            email: user.email,
            name: user.name,
            image: user.image,
          });
          user.id = dbUser.id;
          (user as any).role = dbUser.role;
        } catch (error) {
          console.error("🔥 Error syncing user:", error);
          const cleanEmail = user.email.toLowerCase().trim();
          (user as any).role = cleanEmail === ADMIN_EMAIL ? "admin" : "fan";
        }
      }
      return true;
    },

    async jwt({ token, user }) {
      const email =
        (user?.email ? user.email.toLowerCase().trim() : undefined) ??
        (token.email ? String(token.email).toLowerCase().trim() : undefined);

      if (email) {
        token.email = email;
        token.role = email === ADMIN_EMAIL ? "admin" : "fan";
      }

      if (user && (user as any).role) token.role = (user as any).role;
      if (!token.role) token.role = "fan";

      return token;
    },

    async session({ session, token }) {
      if (session.user && token) {
        (session.user as any).id = token.sub;
        (session.user as any).role = token.role;
      }
      return session;
    },

    // ✅ Obliga a volver siempre al origen correcto
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      try {
        const u = new URL(url);
        if (u.origin === baseUrl) return url;
      } catch {}
      return baseUrl;
    },
  },

  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
