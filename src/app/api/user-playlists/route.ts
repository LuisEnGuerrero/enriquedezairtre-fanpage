// src/app/api/user-playlists/route.ts

import { requireUser } from "@/lib/auth";
import { NextResponse } from "next/server";

import { firestore } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  orderBy,
} from "firebase/firestore";

/* ============================================================
   Helper para timestamp
   ============================================================ */
const now = () => Date.now();

/* ============================================================
   GET → Obtener playlists del usuario
   ============================================================ */
export async function GET() {
  try {
    // 🔐 Autenticación
    const user = await requireUser();
    const userId = user.id;

    /* ------------------------------------------------------------
       1) Buscar playlists del usuario
       ------------------------------------------------------------ */
    const playlistsRef = collection(firestore, "userPlaylists");
    const plQuery = query(
      playlistsRef,
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const plSnap = await getDocs(plQuery);
    if (plSnap.empty) return NextResponse.json([]);

    const playlists: any[] = [];

    for (const plDoc of plSnap.docs) {
      const plData = plDoc.data();

      /* ------------------------------------------------------------
         2) Buscar canciones de esta playlist → userPlaylistSongs
         ------------------------------------------------------------ */
      const playlistSongsRef = collection(firestore, "userPlaylistSongs");
      const songsQuery = query(
        playlistSongsRef,
        where("playlistId", "==", plDoc.id),
        orderBy("position", "asc")
      );

      const songsSnap = await getDocs(songsQuery);
      const fullSongs: any[] = [];

      for (const s of songsSnap.docs) {
        const data = s.data();

        // Buscar la canción real en songs/
        const songRef = doc(firestore, "songs", data.songId);
        const songSnap = await getDocs(
          query(collection(firestore, "songs"), where("__name__", "==", data.songId))
        );

        if (!songSnap.empty) {
          const songData = songSnap.docs[0].data();
          fullSongs.push({
            id: data.songId,
            title: songData.title,
            artist: songData.artist,
            coverImage: songData.coverImage,
            audioUrl: songData.audioUrl,
            position: data.position,
          });
        }
      }

      playlists.push({
        id: plDoc.id,
        name: plData.name,
        description: plData.description ?? "",
        isPublic: plData.isPublic ?? false,
        createdAt: plData.createdAt,
        songCount: fullSongs.length,
        songs: fullSongs,
      });
    }

    return NextResponse.json(playlists);
  } catch (err: any) {
    if (err?.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("🔥 Fatal error GET /api/user-playlists:", err);
    return NextResponse.json(
      { error: "Error fetching playlists" },
      { status: 500 }
    );
  }
}

/* ============================================================
   POST → Crear playlist del usuario
   ============================================================ */
export async function POST(request: Request) {
  try {
    // 🔐 Autenticación
    const user = await requireUser();
    const userId = user.id;

    const { name, description, isPublic } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Playlist name is required" },
        { status: 400 }
      );
    }

    /* ------------------------------------------------------------
       1) Crear playlist en Firestore
       ------------------------------------------------------------ */
    const playlistPayload = {
      userId,
      name: name.trim(),
      description: description ?? "",
      isPublic: Boolean(isPublic),
      createdAt: now(),
    };

    const playlistsRef = collection(firestore, "userPlaylists");
    const playlistDoc = await addDoc(playlistsRef, playlistPayload);

    /* ------------------------------------------------------------
       2) Actualizar stats del usuario
       ------------------------------------------------------------ */
    const usersRef = collection(firestore, "users");
    const userQuery = query(usersRef, where("id", "==", userId));
    const userSnap = await getDocs(userQuery);

    if (!userSnap.empty) {
      const uRef = doc(firestore, "users", userSnap.docs[0].id);
      const uData = userSnap.docs[0].data();

      await updateDoc(uRef, {
        playlistCount: (uData.playlistCount ?? 0) + 1,
        loyaltyPoints: (uData.loyaltyPoints ?? 0) + 10,
      });
    }

    /* ------------------------------------------------------------
       3) Registrar actividad
       ------------------------------------------------------------ */
    const activityRef = collection(firestore, "activities");
    await addDoc(activityRef, {
      userId,
      type: "playlist_create",
      metadata: JSON.stringify({ playlistName: name }),
      createdAt: now(),
    });

    /* ------------------------------------------------------------
       4) Respuesta final
       ------------------------------------------------------------ */
    return NextResponse.json({
      id: playlistDoc.id,
      ...playlistPayload,
    });
  } catch (err: any) {
    if (err?.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("🔥 Fatal error POST /api/user-playlists:", err);
    return NextResponse.json(
      { error: "Error creating playlist" },
      { status: 500 }
    );
  }
}
