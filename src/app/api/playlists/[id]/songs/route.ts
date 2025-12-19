import { requireUser } from "@/lib/auth";
// src/app/api/playlists/[id]/songs/route.ts

import { NextResponse } from "next/server";

import { firestore } from "@/lib/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  collection,
  getDocs,
} from "firebase/firestore";



/* ============================================================
   GET â†’ Obtener canciones de una playlist oficial
   ============================================================ */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const playlistRef = doc(firestore, "playlists", id);
    const playlistSnap = await getDoc(playlistRef);

    if (!playlistSnap.exists()) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }

    const playlist = playlistSnap.data();
    const songIds: string[] = playlist.songs ?? [];

    // Obtener canciones completas
    const songsCollection = collection(firestore, "songs");
    const songsSnapshot = await getDocs(songsCollection);

    const songs = songsSnapshot.docs
      .filter((s) => songIds.includes(s.id))
      .map((s) => ({
        id: s.id,
        ...s.data(),
      }));

    return NextResponse.json({
      playlistId: id,
      songs,
    });

  } catch (error) {
    console.error("ðŸ”¥ Error GET playlist/songs:", error);
    return NextResponse.json({ error: "Error fetching playlist songs" }, { status: 500 });
  }
}

/* ============================================================
   POST â†’ AÃ±adir una canciÃ³n a playlist oficial (ADMIN)
   ============================================================ */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { songId } = await request.json();

    if (!songId) {
      return NextResponse.json({ error: "songId is required" }, { status: 400 });
    }

    const playlistRef = doc(firestore, "playlists", id);
    const playlistSnap = await getDoc(playlistRef);

    if (!playlistSnap.exists()) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }

    await updateDoc(playlistRef, {
      songs: arrayUnion(songId),
      updatedAt: Date.now(),
    });

    return NextResponse.json({
      success: true,
      message: "Song added to playlist",
      playlistId: id,
      songId,
    });

  } catch (error) {
    console.error("ðŸ”¥ Error POST playlist/songs:", error);
    return NextResponse.json(
      { error: "Error adding song to playlist" },
      { status: 500 }
    );
  }
}

/* ============================================================
   DELETE â†’ Eliminar una canciÃ³n de playlist oficial (ADMIN)
   ============================================================ */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { songId } = await request.json();

    if (!songId) {
      return NextResponse.json({ error: "songId is required" }, { status: 400 });
    }

    const playlistRef = doc(firestore, "playlists", id);
    const playlistSnap = await getDoc(playlistRef);

    if (!playlistSnap.exists()) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }

    await updateDoc(playlistRef, {
      songs: arrayRemove(songId),
      updatedAt: Date.now(),
    });

    return NextResponse.json({
      success: true,
      message: "Song removed from playlist",
      playlistId: id,
      songId,
    });

  } catch (error) {
    console.error("ðŸ”¥ Error DELETE playlist/songs:", error);
    return NextResponse.json(
      { error: "Error removing song from playlist" },
      { status: 500 }
    );
  }
}
