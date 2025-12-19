// src/app/api/admin/export/route.ts

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

import { firestore } from "@/lib/firebase";
import {
  collection,
  getDocs,
} from "firebase/firestore";

/**
 * GET → Exportar todos los datos principales de Firestore
 * en un JSON descargable (solo ADMIN).
 */
export async function GET() {
  try {
    // 🔐 Seguridad: solo administradores
    await requireAdmin();

    // -------------------------------------------
    // 1) SONGS
    // -------------------------------------------
    const songsSnap = await getDocs(collection(firestore, "songs"));
    const songs = songsSnap.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));

    // -------------------------------------------
    // 2) PLAYLISTS + subcolección SONGS
    // -------------------------------------------
    const playlistsSnap = await getDocs(collection(firestore, "playlists"));
    const playlists: any[] = [];

    for (const playlistDoc of playlistsSnap.docs) {
      const playlistId = playlistDoc.id;

      const playlistSongsSnap = await getDocs(
        collection(firestore, "playlists", playlistId, "songs")
      );

      const playlistSongs = playlistSongsSnap.docs.map(songDoc => ({
        id: songDoc.id,
        ...songDoc.data(),
      }));

      playlists.push({
        id: playlistId,
        ...playlistDoc.data(),
        songs: playlistSongs,
      });
    }

    // -------------------------------------------
    // 3) USERS
    // -------------------------------------------
    const usersSnap = await getDocs(collection(firestore, "users"));
    const users = usersSnap.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));

    // -------------------------------------------
    // 4) FAVORITES
    // -------------------------------------------
    const favoritesSnap = await getDocs(collection(firestore, "favorites"));
    const favorites = favoritesSnap.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));

    // -------------------------------------------
    // 5) REWARDS
    // -------------------------------------------
    const rewardsSnap = await getDocs(collection(firestore, "rewards"));
    const rewards = rewardsSnap.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));

    // -------------------------------------------
    // 6) ACTIVITIES
    // -------------------------------------------
    const activitiesSnap = await getDocs(collection(firestore, "activities"));
    const activities = activitiesSnap.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));

    // -------------------------------------------
    // 7) USER PLAYLISTS
    // -------------------------------------------
    const userPlaylistsSnap = await getDocs(
      collection(firestore, "userPlaylists")
    );
    const userPlaylists = userPlaylistsSnap.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));

    // -------------------------------------------
    // 8) USER PLAYLIST SONGS
    // -------------------------------------------
    const userPlaylistSongsSnap = await getDocs(
      collection(firestore, "userPlaylistSongs")
    );
    const userPlaylistSongs = userPlaylistSongsSnap.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));

    // -------------------------------------------
    // 9) ARMAR BACKUP
    // -------------------------------------------
    const exportData = {
      version: "2.0",
      engine: "firestore",
      exportedAt: new Date().toISOString(),
      environment: process.env.NODE_ENV ?? "unknown",
      data: {
        songs,
        playlists,
        users,
        favorites,
        rewards,
        activities,
        userPlaylists,
        userPlaylistSongs,
      },
    };

    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition":
          'attachment; filename="enrique-zairtre-backup.json"',
      },
    });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED" || error?.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("🔥 Error exporting data:", error);
    return NextResponse.json(
      { error: "Error exporting data" },
      { status: 500 }
    );
  }
}
