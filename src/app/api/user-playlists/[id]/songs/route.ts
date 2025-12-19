// src/app/api/user-playlists/[id]/songs/route.ts

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";

import { firestore } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  orderBy,
} from "firebase/firestore";

const now = () => Date.now();

/* ============================================================
   POST → Añadir canción a playlist del usuario
   ============================================================ */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();

    const { songId } = await request.json();
    const playlistId = params.id;

    if (!songId) {
      return NextResponse.json(
        { error: "Song ID is required" },
        { status: 400 }
      );
    }

    /* ------------------------------------------------------------
       1) Validar que la playlist existe y pertenece al usuario
       ------------------------------------------------------------ */
    const plRef = collection(firestore, "userPlaylists");
    const plQuery = query(plRef, where("__name__", "==", playlistId));
    const plSnap = await getDocs(plQuery);

    if (plSnap.empty) {
      return NextResponse.json(
        { error: "Playlist not found" },
        { status: 404 }
      );
    }

    const plData = plSnap.docs[0].data();
    if (plData.userId !== user.id) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    /* ------------------------------------------------------------
       2) Prevenir canciones duplicadas
       ------------------------------------------------------------ */
    const plSongsRef = collection(firestore, "userPlaylistSongs");
    const dupeQuery = query(
      plSongsRef,
      where("playlistId", "==", playlistId),
      where("songId", "==", songId)
    );

    const dupeSnap = await getDocs(dupeQuery);
    if (!dupeSnap.empty) {
      return NextResponse.json(
        { error: "Song already in playlist" },
        { status: 400 }
      );
    }

    /* ------------------------------------------------------------
       3) Calcular siguiente posición
       ------------------------------------------------------------ */
    const posQuery = query(
      plSongsRef,
      where("playlistId", "==", playlistId),
      orderBy("position", "asc")
    );

    const posSnap = await getDocs(posQuery);
    const nextPosition =
      posSnap.empty
        ? 1
        : (posSnap.docs[posSnap.docs.length - 1].data().position ?? 0) + 1;

    /* ------------------------------------------------------------
       4) Crear relación playlist ↔ song
       ------------------------------------------------------------ */
    const newPlSong = {
      playlistId,
      songId,
      position: nextPosition,
      createdAt: now(),
    };

    await addDoc(plSongsRef, newPlSong);

    /* ------------------------------------------------------------
       5) Registrar actividad
       ------------------------------------------------------------ */
    await addDoc(collection(firestore, "activities"), {
      userId: user.id,
      songId,
      type: "playlist_add_song",
      metadata: {
        playlistId,
        playlistName: plData.name,
      },
      createdAt: now(),
    });

    return NextResponse.json(newPlSong);
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("🔥 Error adding song to playlist:", error);
    return NextResponse.json(
      { error: "Error adding song to playlist" },
      { status: 500 }
    );
  }
}

/* ============================================================
   DELETE → Eliminar canción de playlist del usuario
   ============================================================ */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();

    const { songId } = await request.json();
    const playlistId = params.id;

    if (!songId) {
      return NextResponse.json(
        { error: "Song ID is required" },
        { status: 400 }
      );
    }

    /* ------------------------------------------------------------
       1) Validar propiedad de la playlist
       ------------------------------------------------------------ */
    const plRef = collection(firestore, "userPlaylists");
    const plQuery = query(plRef, where("__name__", "==", playlistId));
    const plSnap = await getDocs(plQuery);

    if (plSnap.empty) {
      return NextResponse.json(
        { error: "Playlist not found" },
        { status: 404 }
      );
    }

    const plData = plSnap.docs[0].data();
    if (plData.userId !== user.id) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    /* ------------------------------------------------------------
       2) Eliminar canción
       ------------------------------------------------------------ */
    const plSongsRef = collection(firestore, "userPlaylistSongs");
    const delQuery = query(
      plSongsRef,
      where("playlistId", "==", playlistId),
      where("songId", "==", songId)
    );

    const delSnap = await getDocs(delQuery);
    for (const d of delSnap.docs) {
      await deleteDoc(doc(firestore, "userPlaylistSongs", d.id));
    }

    /* ------------------------------------------------------------
       3) Reordenar posiciones
       ------------------------------------------------------------ */
    const remainingQuery = query(
      plSongsRef,
      where("playlistId", "==", playlistId),
      orderBy("position", "asc")
    );

    const remainingSnap = await getDocs(remainingQuery);
    let pos = 1;

    for (const d of remainingSnap.docs) {
      await updateDoc(doc(firestore, "userPlaylistSongs", d.id), {
        position: pos++,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("🔥 Error removing song from playlist:", error);
    return NextResponse.json(
      { error: "Error removing song from playlist" },
      { status: 500 }
    );
  }
}
