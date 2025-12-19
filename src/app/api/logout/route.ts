// src/app/api/logout/route.ts
import { NextResponse } from "next/server";

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "__session";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
