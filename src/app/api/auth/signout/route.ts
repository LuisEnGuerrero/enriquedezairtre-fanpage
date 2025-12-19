import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // Reusa tu logout real (Opción A)
  const url = new URL(req.url);
  const origin = url.origin;

  await fetch(`${origin}/api/logout`, { method: "POST" });

  // NextAuth suele devolver redirect o JSON; devolvemos JSON simple
  return NextResponse.json({ ok: true });
}
