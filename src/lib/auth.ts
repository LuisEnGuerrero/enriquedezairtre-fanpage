// src/lib/auth.ts
import { cookies } from "next/headers";
import { getFirebaseAdmin } from "@/lib/firebaseAdmin";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "__session";

export type AppUser = {
  id: string; // email en tu modelo
  email: string;
  role: "admin" | "fan";
  name?: string;
  image?: string;
};

/**
 * Obtiene el usuario a partir de la Session Cookie (Firebase).
 *
 * - Devuelve null si no hay sesión o no es válida.
 * - No debe romper builds (errores se manejan y retornan null).
 */
export async function getUserFromSessionCookie(): Promise<AppUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!sessionCookie) return null;

    // Inicializa Firebase Admin SOLO en runtime cuando realmente se usa
    const app = getFirebaseAdmin();
    const auth = app.auth();

    // checkRevoked=true recomendado en endpoints admin (más seguro)
    const decoded = await auth.verifySessionCookie(sessionCookie, true);

    // decoded.email suele venir en Google provider; fallback a uid
    const email = (decoded.email || decoded.uid || "").toLowerCase();
    if (!email) return null;

    // Users se guardan por email como docId
    const userRef = doc(firestore, "users", email);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return null;

    const data = snap.data() as any;

    return {
      id: email,
      email,
      role: (data.role || "fan") as "admin" | "fan",
      name: data.name,
      image: data.image,
    };
  } catch {
    // ⚠️ Cualquier error de cookie inválida, revocada, envs faltantes en build, etc.
    // debe traducirse a "no autenticado"
    return null;
  }
}

export async function requireUser(): Promise<AppUser> {
  const user = await getUserFromSessionCookie();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function requireAdmin(): Promise<AppUser> {
  const user = await requireUser();
  if (user.role !== "admin") throw new Error("FORBIDDEN");
  return user;
}
