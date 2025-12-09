const { admin, db } = require("./firebase-admin");

async function main() {
  console.log("🔥 Test de Firestore iniciado...");

  try {
    const ref = await db.collection("test").add({
      ok: true,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log("✅ Documento creado con ID:", ref.id);
  } catch (err) {
    console.error("❌ Error escribiendo en Firestore:", err);
  } finally {
    admin.app().delete();
  }
}

main();
