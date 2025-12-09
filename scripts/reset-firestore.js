/**
 * RESET FIRESTORE (Versión final y funcional)
 */

require("dotenv").config();
const { db } = require("./firebase-admin");

// Colecciones manejadas por la app
const COLLECTIONS = [
  "songs",
  "users",
  "playlists",
  "playlistSongs",
  "favorites",
  "activities",
  "rewards",
];

/**
 * Elimina documentos de una colección en lotes de 500
 */
async function deleteCollection(name) {
  console.log(`🗑️ Eliminando colección: ${name} ...`);

  const colRef = db.collection(name);

  while (true) {
    const snapshot = await colRef.limit(500).get();

    if (snapshot.empty) break;

    const batch = db.batch();

    snapshot.docs.forEach((doc) => batch.delete(doc.ref));

    await batch.commit();

    console.log(`   → Eliminados ${snapshot.size} documentos...`);
  }

  console.log(`✔ Colección ${name} eliminada completamente.\n`);
}

/**
 * Proceso principal
 */
async function main() {
  console.log("🔥 RESET DE FIRESTORE INICIADO...\n");

  if (!process.env.FIREBASE_PROJECT_ID) {
    console.error("❌ ERROR: FIREBASE_PROJECT_ID no está definido.");
    process.exit(1);
  }

  for (const col of COLLECTIONS) {
    try {
      await deleteCollection(col);
    } catch (err) {
      console.error(`❌ Error eliminando colección ${col}:`, err.message);
    }
  }

  console.log("🌪️ Firestore ha sido RESETEADO con éxito.");
  console.log("⚙️ Listo para ejecutar SEED nuevamente.\n");
}

main().catch((err) => {
  console.error("❌ Error crítico en RESET:", err);
  process.exit(1);
});
