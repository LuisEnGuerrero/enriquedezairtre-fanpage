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

  const { db } = require("./firebase-admin.js");

  async function run() {
    const snap = await db.collection("songs").get();
    console.log("SONGS:", snap.docs.map(d => d.data()));
  }

  run().catch(console.error);

}

main();
