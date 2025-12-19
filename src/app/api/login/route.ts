// src/app/api/login/route.ts
import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebaseAdmin";
import { syncUserDirect } from "@/app/api/auth/sync-user/route";

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "__session";
const SESSION_EXPIRES_DAYS = Number(process.env.SESSION_EXPIRES_DAYS || "7");

/**
 * Login:
 * Firebase ID Token (cliente) → Session Cookie httpOnly (servidor)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const idToken = body?.idToken as string | undefined;

    if (!idToken) {
      return NextResponse.json(
        { error: "idToken required" },
        { status: 400 }
      );
    }

    // 🔥 Inicializar Firebase Admin SOLO en runtime
    const app = getFirebaseAdmin();
    const auth = app.auth();

    // Verificar ID Token (Firebase Auth)
    const decoded = await auth.verifyIdToken(idToken);
    const email = (decoded.email || "").toLowerCase();

    if (!email) {
      return NextResponse.json(
        { error: "No email in token" },
        { status: 400 }
      );
    }

    // Sincronizar / crear usuario en Firestore
    const user = await syncUserDirect({
      email,
      name: decoded.name ?? null,
      image: decoded.picture ?? null,
    });

    // Crear Session Cookie (JWT Firebase)
    const expiresIn = SESSION_EXPIRES_DAYS * 24 * 60 * 60 * 1000;
    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn,
    });

    const res = NextResponse.json({ ok: true, user });

    res.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: Math.floor(expiresIn / 1000),
    });

    return res;
  } catch (error) {
    console.error("🔥 /api/login error:", error);

    // ⚠️ No exponer detalles internos
    return NextResponse.json(
      { error: "Login failed" },
      { status: 401 }
    );
  }
}
