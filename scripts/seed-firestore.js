/**
 * =============================================================
 *  SEED FIRESTORE + SUBIDA A STORAGE (Versión final optimizada)
 * =============================================================
 */

const path = require("path");
const fs = require("fs");
const { admin, db, storageBucket } = require("./firebase-admin");

// ------------------ VALIDACIÓN STORAGE ------------------
if (!storageBucket || typeof storageBucket.upload !== "function") {
  console.error("❌ ERROR CRÍTICO: storageBucket no está inicializado.");
  console.error("   Asegúrate de que firebase-admin.js exporta storageBucket correctamente.");
  process.exit(1);
}

console.log("📦 Storage bucket cargado correctamente:", storageBucket.name);


// ------------------ CONFIGURACIÓN ------------------

const ASSETS_ROOT = path.join(__dirname, "..", "secrets", "assets");

const FALLBACK_COVER = "https://placehold.co/600x600?text=Cover";
const FALLBACK_AUDIO = "https://www2.cs.uic.edu/~i101/SoundFiles/StarWars3.wav";


// ------------------ LISTA DE CANCIONES ------------------

const SONGS = [
  { code: "cuando_aparecen_tus_ojos", title: "Cuando Aparecen Tus Ojos", artist: "Enrique de Zairtre", duration: 188, coverFile: "cover-cuando_aparecen_tus_ojos.jpg", audioFile: "audio-cuando_aparecen_tus_ojos.mp3", lyrics: "" },
  { code: "sin_alma", title: "Sin Alma", artist: "Enrique de Zairtre", duration: 229, coverFile: "cover-sin_alma.jpg", audioFile: "audio-sin_alma.mp3", lyrics: "" },
  { code: "rompiendo_la_distancia", title: "Rompiendo la Distancia", artist: "Enrique de Zairtre", duration: 213, coverFile: "cover-rompiendo_la_distancia.jpg", audioFile: "audio-rompiendo_la_distancia.mp3", lyrics: "" },
  { code: "la_sombra_del_silencio", title: "La Sombra del Silencio", artist: "Enrique de Zairtre", duration: 276, coverFile: "cover-la_sombra_del_silencio.jpg", audioFile: "audio-la_sombra_del_silencio.mp3", lyrics: "" },
  { code: "volvio_a_cantar", title: "Volvió a Cantar", artist: "Enrique de Zairtre", duration: 193, coverFile: "cover-volvio_a_cantar.jpg", audioFile: "audio-volvio_a_cantar.mp3", lyrics: "" },
  { code: "en_el_borde_del_abismo", title: "En el Borde del Abismo", artist: "Enrique de Zairtre", duration: 272, coverFile: "cover-en_el_borde_del_abismo.jpg", audioFile: "audio-en_el_borde_del_abismo.mp3", lyrics: "" },
  { code: "no_te_quedes_atras", title: "No Te Quedes Atrás", artist: "Enrique de Zairtre", duration: 356, coverFile: "cover-no_te_quedes_atras.jpg", audioFile: "audio-no_te_quedes_atras.mp3", lyrics: "" },
  { code: "ojala", title: "Ojalá", artist: "Enrique de Zairtre", duration: 279, coverFile: "cover-ojala.jpg", audioFile: "audio-ojala.mp3", lyrics: "" },
  { code: "vortex", title: "Vórtice", artist: "Enrique de Zairtre", duration: 297, coverFile: "cover-vortex.jpg", audioFile: "audio-vortex.mp3", lyrics: "" },
  { code: "falasteen_doncella_de_los_olivos", title: "Falasteen, Doncella de los Olivos", artist: "Enrique de Zairtre", duration: 284, coverFile: "cover-falasteen_doncella_de_los_olivos.jpg", audioFile: "audio-falasteen_doncella_de_los_olivos.mp3", lyrics: "" },
  { code: "entre_fuego_y_hielo", title: "Entre Fuego y Hielo", artist: "Enrique de Zairtre", duration: 379, coverFile: "cover-entre_fuego_y_hielo.jpg", audioFile: "audio-entre_fuego_y_hielo.mp3", lyrics: "" },
];


// ------------------ PLAYLISTS ------------------

const OFFICIAL_PLAYLISTS = [
  {
    code: "vortex",
    name: "Vortex",
    description: "Álbum completo Vortex.",
    songCodes: SONGS.map((s) => s.code),
  },
  {
    code: "baladas_oscuras",
    name: "Baladas Oscuras",
    description: "Para noches profundas.",
    songCodes: ["la_sombra_del_silencio", "en_el_borde_del_abismo", "ojala", "entre_fuego_y_hielo"],
  },
];


// ------------------ SUBIR ARCHIVOS A STORAGE ------------------

async function uploadOrFallback(localFile, destPath, contentType, fallbackUrl) {
  try {
    const localPath = path.join(ASSETS_ROOT, localFile);

    if (!fs.existsSync(localPath)) {
      console.warn(`⚠️ Archivo no encontrado: ${localPath}`);
      return fallbackUrl;
    }

    const [uploaded] = await storageBucket.upload(localPath, {
      destination: destPath,
      public: true,
      metadata: {
        contentType,
        cacheControl: "public,max-age=31536000",
      },
    });

    const publicUrl = `https://storage.googleapis.com/${storageBucket.name}/${uploaded.name}`;

    console.log(`   ✓ Subido: ${destPath}`);
    return publicUrl;

  } catch (err) {
    console.warn("⚠️ Error subiendo archivo:", err.message);
    return fallbackUrl;
  }
}


// ------------------ SEED PRINCIPAL ------------------

async function main() {
  console.log("🌱 Iniciando SEED...\n");

  const songDocs = [];

  for (const song of SONGS) {
    console.log(`🎶 Procesando: ${song.title}`);

    const coverUrl = await uploadOrFallback(
      song.coverFile,
      `songs/covers/${song.code}.jpg`,
      "image/jpeg",
      FALLBACK_COVER
    );

    const audioUrl = await uploadOrFallback(
      song.audioFile,
      `songs/audio/${song.code}.mp3`,
      "audio/mpeg",
      FALLBACK_AUDIO
    );

    const ref = db.collection("songs").doc(song.code);

    await ref.set({
      ...song,
      coverUrl,
      audioUrl,
      published: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    songDocs.push(song.code);
    console.log(`   ✓ Canción creada`);
  }

  console.log(`\n🎵 Total canciones creadas: ${songDocs.length}\n`);

  // ------------------ PLAYLISTS ------------------
  for (const pl of OFFICIAL_PLAYLISTS) {
    console.log(`🎧 Creando playlist: ${pl.name}`);

    await db.collection("playlists").doc(pl.code).set({
      name: pl.name,
      description: pl.description,
      isOfficial: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    let pos = 1;
    for (const code of pl.songCodes) {
      await db.collection("playlistSongs").add({
        playlistId: pl.code,
        songId: code,
        position: pos++,
        addedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    console.log(`   ✓ Playlist creada`);
  }

  console.log("\n🌳 SEED COMPLETADO.\n");
}


// ------------------ EJECUCIÓN ------------------

main()
  .catch((err) => {
    console.error("❌ Error en SEED:", err);
  })
  .finally(() => {
    try { admin.app().delete(); } catch (_) {}
  });
