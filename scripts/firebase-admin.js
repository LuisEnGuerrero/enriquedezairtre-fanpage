/**
 * scripts/firebase-admin.js
 *
 * Inicialización de Firebase Admin EXCLUSIVA para scripts
 * (seed / reset / tareas administrativas).
 *
 * ⚠️ Este archivo NO se importa en Next.js runtime.
 * ⚠️ Aquí SÍ validamos credenciales de forma estricta.
 */

const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

// =====================================================
// 1️⃣ Cargar credenciales (local → env)
// =====================================================

const localKeyPath = path.join(__dirname, "../secrets/zairtre-admin.json");

let serviceAccount = null;

// 1) Credenciales locales (desarrollo)
if (fs.existsSync(localKeyPath)) {
  console.log("🔐 Firebase Admin: usando credenciales locales");
  serviceAccount = require(localKeyPath);
}

// 2) Variables de entorno (Cloud Run / CI)
if (!serviceAccount && process.env.FIREBASE_PRIVATE_KEY) {
  console.log("🔐 Firebase Admin: usando credenciales desde variables de entorno");

  serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    token_uri: "https://oauth2.googleapis.com/token",
  };
}

// 3) Validación estricta (scripts NO deben continuar sin credenciales)
if (!serviceAccount) {
  console.error("❌ Firebase Admin: no se encontraron credenciales válidas.");
  console.error("   - secrets/zairtre-admin.json");
  console.error("   - o variables de entorno FIREBASE_*");
  process.exit(1);
}

// =====================================================
// 2️⃣ Resolver bucket de Firebase Storage
// =====================================================
// Prioridad clara:
//   1) FIREBASE_STORAGE_BUCKET
//   2) NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
//   3) <project-id>.firebasestorage.app
const STORAGE_BUCKET =
  process.env.FIREBASE_STORAGE_BUCKET ||
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
  `${serviceAccount.project_id}.firebasestorage.app`;

// =====================================================
// 3️⃣ Inicializar Firebase Admin (una sola vez)
// =====================================================

if (!admin.apps.length) {
  console.log("🔥 Inicializando Firebase Admin (scripts)");
  console.log("   projectId     =", serviceAccount.project_id);
  console.log("   storageBucket =", STORAGE_BUCKET);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
    storageBucket: STORAGE_BUCKET,
  });
}

// =====================================================
// 4️⃣ Exportaciones para scripts
// =====================================================

const db = admin.firestore();
const storageBucket = admin.storage().bucket();

module.exports = {
  admin,
  db,
  storageBucket, // usado por seed-firestore.js y reset-firestore.js
};
