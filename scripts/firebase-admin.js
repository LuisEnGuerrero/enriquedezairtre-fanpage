/**
 * scripts/firebase-admin.js
 * Versión FINAL, usando el bucket real de Firebase Storage
 */

const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

// Ruta al archivo local con credenciales
const localKeyPath = path.join(__dirname, "../secrets/zairtre-admin.json");

let serviceAccount = null;

// 1) Intentar cargar credenciales locales
if (fs.existsSync(localKeyPath)) {
  console.log("🔐 Usando credenciales locales desde secrets/zairtre-admin.json");
  serviceAccount = require(localKeyPath);
}

// 2) Si no existe archivo, usar variables de entorno (Render)
if (!serviceAccount && process.env.FIREBASE_PRIVATE_KEY) {
  console.log("🔐 Usando credenciales desde variables de entorno");

  serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    token_uri: "https://oauth2.googleapis.com/token",
  };
}

// 3) Error si no hay credenciales
if (!serviceAccount) {
  throw new Error("❌ No se encontraron credenciales de Firebase Admin.");
}

// =====================================================
// 🔥 RESOLVER *CORRECTAMENTE* EL BUCKET DE STORAGE
// =====================================================
// Prioridad:
//   1) FIREBASE_STORAGE_BUCKET
//   2) NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
//   3) `${project_id}.firebasestorage.app`
const STORAGE_BUCKET =
  process.env.FIREBASE_STORAGE_BUCKET ||
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
  `${serviceAccount.project_id}.firebasestorage.app`;

// Inicializar Firebase una sola vez
if (!admin.apps.length) {
  console.log("🔥 Inicializando Firebase Admin con:");
  console.log("   projectId        =", serviceAccount.project_id);
  console.log("   storageBucket    =", STORAGE_BUCKET);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
    storageBucket: STORAGE_BUCKET,
  });
}

// Exportaciones reales y correctas
const db = admin.firestore();
const bucket = admin.storage().bucket();

module.exports = {
  admin,
  db,
  storageBucket: bucket, // <- ESTE es el que usas en seed-firestore.js
};
