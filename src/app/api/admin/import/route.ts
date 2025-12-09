// src/app/api/admin/import/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

import { firestore } from "@/lib/firebase";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs
} from "firebase/firestore";

export const maxDuration = 300; // 5 min
export const dynamic = "force-dynamic";

/**
 * Helper → Borra todos los documentos de una colección
 */
async function clearCollection(path: string) {
  const snap = await getDocs(collection(firestore, path));
  for (const d of snap.docs) {
    await deleteDoc(doc(firestore, path, d.id));
  }
}

/**
 * Helper → Restaura una colección simple
 */
async function importCollection(path: string, items: any[]) {
  for (const item of items) {
    const { id, ...data } = item;

    await setDoc(doc(firestore, path, id), {
      ...data,
      restoredAt: Date.now(),
    });
  }
}

/**
 * Helper → Importa playlists y sus subcolecciones
 */
async function importPlaylists(playlists: any[]) {
  for (const playlist of playlists) {
    const { id, songs, ...data } = playlist;

    // Primero restauramos la playlist
    await setDoc(doc(firestore, "playlists", id), {
      ...data,
      restoredAt: Date.now(),
    });

    // Restaurar subcolección: playlists/{id}/songs
    if (songs && Array.isArray(songs)) {
      for (const song of songs) {
        const { id: songId, ...songData } = song;

        await setDoc(
          doc(firestore, "playlists", id, "songs", songId),
          {
            ...songData,
            restoredAt: Date.now(),
          }
        );
      }
    }
  }
}

/**
 * POST → Importación del backup JSON
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // El archivo viene como JSON
    const json = await request.json();

    if (!json?.data) {
      return NextResponse.json(
        { error: "Invalid backup file" },
        { status: 400 }
      );
    }

    const {
      songs = [],
      playlists = [],
      users = [],
      favorites = [],
      rewards = [],
      activities = [],
      userPlaylists = [],
      userPlaylistSongs = [],
    } = json.data;

    console.log("📦 Iniciando importación Firestore…");

    // OPCIONAL: limpiar colecciones antes de restaurar
    await clearCollection("songs");
    await clearCollection("playlists");
    await clearCollection("users");
    await clearCollection("favorites");
    await clearCollection("rewards");
    await clearCollection("activities");
    await clearCollection("userPlaylists");
    await clearCollection("userPlaylistSongs");

    // 1) Restaurar canciones
    await importCollection("songs", songs);

    // 2) Restaurar playlists + subcolecciones
    await importPlaylists(playlists);

    // 3) Usuarios
    await importCollection("users", users);

    // 4) Favorites
    await importCollection("favorites", favorites);

    // 5) Rewards
    await importCollection("rewards", rewards);

    // 6) Activities
    await importCollection("activities", activities);

    // 7) User Playlists (listas personales)
    await importCollection("userPlaylists", userPlaylists);

    // 8) Songs dentro de listas personales
    await importCollection("userPlaylistSongs", userPlaylistSongs);

    console.log("✅ Importación completada exitosamente");

    return NextResponse.json({
      success: true,
      message: "Backup imported successfully",
    });
  } catch (error: any) {
    console.error("🔥 Error importing backup:", error);
    return NextResponse.json(
      { error: "Error importing backup" },
      { status: 500 }
    );
  }
}
