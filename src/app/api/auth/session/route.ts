import { NextResponse } from "next/server";
import { getUserFromSessionCookie } from "@/lib/auth";

// NextAuth-like session endpoint (shim)
// Evita 404 de next-auth/react y usa tu cookie (Opción A)
export async function GET() {
  try {
    const user = await getUserFromSessionCookie();

    if (!user) {
      // NextAuth devuelve null si no hay sesión
      return NextResponse.json(null);
    }

    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    return NextResponse.json({
      user: {
        name: user.name ?? null,
        email: user.email ?? null,
        image: user.image ?? null,
        role: user.role ?? null,
      },
      expires,
    });
  } catch {
    return NextResponse.json(null);
  }
}
