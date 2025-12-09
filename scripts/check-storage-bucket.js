// scripts/check-storage-bucket.js
// Verifica si el bucket de Storage existe y con qué nombre está en el proyecto

require("dotenv").config();
const { admin, storageBucket } = require("./firebase-admin");

async function main() {
  console.log("🔍 Verificando configuración de Firebase Storage...\n");

  const appOptions = admin.app().options || {};
  console.log("   Proyecto (app.options.projectId):", appOptions.projectId || "(desconocido)");
  console.log(
    "   Bucket configurado en firebase-admin.js:",
    storageBucket ? storageBucket.name : "(storageBucket undefined)"
  );

  if (!storageBucket) {
    console.error("\n❌ ERROR: storageBucket es null/undefined.");
    console.error("   → Revisa firebase-admin.js y asegúrate de exportar `storageBucket: bucket`.");
    process.exit(1);
  }

  // 1) Probar directamente el bucket configurado
  console.log("\n1️⃣ Probando metadata del bucket configurado...");
  try {
    const [metadata] = await storageBucket.getMetadata();
    console.log("✅ El bucket configurado EXISTE y responde.");
    console.log("   id          :", metadata.id);
    console.log("   name        :", metadata.name);
    console.log("   location    :", metadata.location);
    console.log("   storageClass:", metadata.storageClass);
  } catch (err) {
    console.error("⚠️ No se pudo obtener metadata del bucket configurado.");
    console.error("   Mensaje:", err.message);
    if (err.code) {
      console.error("   Código  :", err.code);
    }
  }

  // 2) Listar todos los buckets del proyecto
  console.log("\n2️⃣ Listando todos los buckets del proyecto...");
  try {
    const [buckets] = await admin.storage().getBuckets();
    if (!buckets.length) {
      console.log("   (No se encontraron buckets; puede que Storage no esté inicializado en este proyecto).");
    } else {
      buckets.forEach((b) => {
        const mark = b.name === storageBucket.name ? " ⬅️ (bucket configurado)" : "";
        console.log(`   - ${b.name}${mark}`);
      });
    }
  } catch (err) {
    console.error("⚠️ Error al listar buckets del proyecto:");
    console.error("   Mensaje:", err.message);
    if (err.code) {
      console.error("   Código  :", err.code);
    }
  }

  // Cerrar app
  try {
    await admin.app().delete();
  } catch (_) {}
}

main().catch((err) => {
  console.error("❌ Error inesperado en check-storage-bucket:", err);
  process.exit(1);
});
