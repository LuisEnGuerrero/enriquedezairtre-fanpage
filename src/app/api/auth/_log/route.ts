import { NextResponse } from "next/server";

// Telemetría interna de NextAuth (no necesaria).
// Responder 204 evita ruido y 404.
export async function POST() {
  return new NextResponse(null, { status: 204 });
}
