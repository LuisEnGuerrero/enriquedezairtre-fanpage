import { NextResponse } from "next/server";

// next-auth/react lo pide al iniciar (getProviders).
// No lo necesitas en Opción A, pero lo devolvemos para evitar 404.
export async function GET() {
  return NextResponse.json({});
}
