/**
 * =============================================================
 * CHECK-BUCKET.JS
 * Verifica si el bucket de Firebase Storage existe en tu proyecto
 *
 * Ejecutar:
 *   node scripts/check-bucket.js
 *
 * Requisitos:
 *   npm install @google-cloud/storage
 * =============================================================
 */

const path = require("path");
const fs = require("fs");

// Firebase Admin
const admin = require("firebase-admin");

// Google Cloud Storage SDK
const { Storage } = require("@google-cloud/storage");

// ---------------------------------------------------------------
// 1) CARGAR CREDENCIALES (igual que en firebase-admin.js)
// ---------------------------------------------------------------
const keyPath = path.join(__dirname, "../secrets/zairtre-admin.json");

let serviceAccount = null;

if (fs.existsSync(keyPath)) {
  console.log("🔐 Usando credenciales locales:", keyPath);
  serviceAccount = require(keyPath);
} else if (process.env.FIREBASE_PRIVATE_KEY) {
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
} else {
  console.error("❌ ERROR: No se encontraron credenciales de Firebase Admin.");
  process.exit(1);
}

// ---------------------------------------------------------------
// 2) INICIALIZAR ADMIN (solo si no está inicializado)
// ---------------------------------------------------------------
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const projectId = serviceAccount.project_id;
const storage = new Storage({
  projectId,
  credentials: serviceAccount,
});

// ---------------------------------------------------------------
// 3) BUCKET esperado por la aplicación
// ---------------------------------------------------------------
const EXPECTED_BUCKET = "zairtre-music.appspot.com";

console.log("\n===========================================");
console.log("🔍 Verificando bucket de Firebase Storage…");
console.log("Proyecto:", projectId);
console.log("Bucket esperado:", EXPECTED_BUCKET);
console.log("===========================================\n");

// ---------------------------------------------------------------
// 4) Intentar obtener metadata del bucket esperado
// ---------------------------------------------------------------
async function checkBucket() {
  try {
    const bucket = storage.bucket(EXPECTED_BUCKET);
    const [metadata] = await bucket.getMetadata();

    console.log("✅ EL BUCKET EXISTE");
    console.log("Nombre:     ", metadata.name);
    console.log("Ubicación:  ", metadata.location);
    console.log("Clase:      ", metadata.storageClass);
    return true;
  } catch (err) {
    console.log("⚠️ No se pudo obtener metadata del bucket esperado.");
    console.log("   Mensaje:", err.message);
  }

  return false;
}

// ---------------------------------------------------------------
// 5) Listar todos los buckets reales del proyecto
// ---------------------------------------------------------------
async function listBuckets() {
  console.log("\n📂 Listando buckets disponibles en el proyecto…");

  try {
    const [buckets] = await storage.getBuckets();

    if (buckets.length === 0) {
      console.log("⚠️ El proyecto NO tiene buckets creados.");
      return [];
    }

    console.log(`   Buckets encontrados (${buckets.length}):`);
    buckets.forEach((b) => console.log("   →", b.name));

    return buckets.map((b) => b.name);
  } catch (err) {
    console.error("❌ ERROR al listar buckets:", err.message);
    return [];
  }
}

// ---------------------------------------------------------------
// 6) MAIN
// ---------------------------------------------------------------
(async () => {
  console.log("🔧 Ejecutando comprobaciones...\n");

  const exists = await checkBucket();
  const allBuckets = await listBuckets();

  console.log("\n===========================================");
  console.log("🧪 RESULTADO FINAL");
  console.log("===========================================\n");

  if (exists) {
    console.log("🎉 Todo está correcto. El SEED puede usar este bucket.");
  } else {
    console.log("❌ PROBLEMA: El bucket configurado NO existe.");

    if (allBuckets.includes(EXPECTED_BUCKET)) {
      console.log("⚠️ PERO OJO: Sí aparece en la lista. Posible permisos o región.");
    } else {
      console.log("🟥 El bucket NO existe en tu proyecto.");
      console.log("👉 Debes crear manualmente el bucket en Firebase Storage:");
      console.log("   https://console.firebase.google.com/project/zairtre-music/storage");
    }
  }

  console.log("\n🚀 Comprobación completada.");
})();
