// src/lib/firebaseAdmin.ts
import admin from "firebase-admin";

/**
 * Firebase Admin App (lazy)
 * Se inicializa SOLO en runtime, nunca en build-time.
 */
let firebaseAdminApp: admin.app.App | null = null;

/**
 * Normaliza la private key si viene escapada
 */
function getPrivateKey(): string | null {
  const pk = process.env.FIREBASE_PRIVATE_KEY;
  if (!pk) return null;
  return pk.replace(/\\n/g, "\n");
}

/**
 * Inicializa y retorna Firebase Admin App
 * - Safe para next build
 * - Falla SOLO en runtime si faltan env vars
 */
export function getFirebaseAdmin(): admin.app.App {
  if (firebaseAdminApp) {
    return firebaseAdminApp;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = getPrivateKey();

  // ⚠️ Durante build/dev, no inicializar ni fallar
  if (!projectId || !clientEmail || !privateKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "Firebase Admin env vars missing at runtime. " +
          "Required: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY"
      );
    }

    // En build o dev sin envs → no inicializamos
    throw new Error(
      "Firebase Admin not initialized (missing env vars in non-production environment)"
    );
  }

  firebaseAdminApp = admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });

  return firebaseAdminApp;
}

/**
 * Export opcional del namespace admin
 * (útil para tipos o utilidades)
 */
export { admin };
