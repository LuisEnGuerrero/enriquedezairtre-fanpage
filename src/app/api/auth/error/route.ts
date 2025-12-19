import { NextResponse } from "next/server";

// Algunos flujos redirigen aquí.
// Lo mandamos a tu login real.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const callbackUrl = url.searchParams.get("callbackUrl") || "/";
  const target = new URL(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`, url.origin);
  return NextResponse.redirect(target);
}
