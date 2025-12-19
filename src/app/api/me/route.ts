// src/app/api/me/route.ts
import { NextResponse } from "next/server";
import { getUserFromSessionCookie } from "@/lib/auth";

/**
 * Endpoint de identidad actual
 *
 * - Nunca lanza errores fatales
 * - Seguro para next build
 * - Usado por middleware y cliente
 */
export async function GET() {
  try {
    const user = await getUserFromSessionCookie();
    return NextResponse.json({ user: user ?? null });
  } catch (error) {
    // ⚠️ Nunca romper el flujo por errores de auth
    return NextResponse.json({ user: null });
  }
}
