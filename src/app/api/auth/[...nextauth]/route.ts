// app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { syncUserDirect } from "@/app/api/auth/sync-user/route";

const ADMIN_EMAIL = (process.env.ADM1N_EM41L || "zairtre@gmail.com")
  .toLowerCase()
  .trim();

const isProd = process.env.NODE_ENV === "production";
const COOKIE_DOMAIN = "zairtre.site";

export const authOptions: NextAuthOptions = {
  debug: true,
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },

  // ✅ recomendado en proxies/CDN/Cloud Run
  useSecureCookies: isProd,

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],

  // ✅ cookies consistentes para zairtre.site
  cookies: isProd
    ? {
        state: {
          name: "__Secure-next-auth.state",
          options: {
            httpOnly: true,
            sameSite: "lax",
            path: "/",
            secure: true,
            domain: `.${COOKIE_DOMAIN}`,
          },
        },
        pkceCodeVerifier: {
          name: "__Secure-next-auth.pkce.code_verifier",
          options: {
            httpOnly: true,
            sameSite: "lax",
            path: "/",
            secure: true,
            domain: `.${COOKIE_DOMAIN}`,
          },
        },
        callbackUrl: {
          name: "__Secure-next-auth.callback-url",
          options: {
            sameSite: "lax",
            path: "/",
            secure: true,
            domain: `.${COOKIE_DOMAIN}`,
          },
        },
        sessionToken: {
          name: "__Secure-next-auth.session-token",
          options: {
            httpOnly: true,
            sameSite: "lax",
            path: "/",
            secure: true,
            domain: `.${COOKIE_DOMAIN}`,
          },
        },
        // csrfToken: déjalo default (mejor no tocarlo)
      }
    : undefined,

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
        (session.user as any).role = (token as any).role;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      // ✅ evita que te “escape” a run.app u otros hosts
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
