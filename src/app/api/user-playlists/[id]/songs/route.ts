import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";

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
   POST → Añadir canción a playlist
   ============================================================ */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { songId } = await request.json();
    const playlistId = params.id;

    if (!songId) {
      return NextResponse.json(
        { error: "Song ID is required" },
        { status: 400 }
      );
    }

    /* ------------------------------------------------------------
       1) Validar que la playlist existe y es del usuario
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
    if (plData.userId !== session.user.id) {
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
       4) Crear entrada userPlaylistSong
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
    const activityRef = collection(firestore, "activities");
    await addDoc(activityRef, {
      userId: session.user.id,
      songId,
      type: "playlist_add_song",
      metadata: JSON.stringify({
        playlistId,
        playlistName: plData.name,
      }),
      createdAt: now(),
    });

    return NextResponse.json({
      ...newPlSong,
      id: songId,
    });
  } catch (error) {
    console.error("🔥 Error adding song to playlist:", error);
    return NextResponse.json(
      { error: "Error adding song to playlist" },
      { status: 500 }
    );
  }
}

/* ============================================================
   DELETE → Eliminar canción de playlist
   ============================================================ */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { songId } = await request.json();
    const playlistId = params.id;

    if (!songId) {
      return NextResponse.json(
        { error: "Song ID is required" },
        { status: 400 }
      );
    }

    /* ------------------------------------------------------------
       1) Verificar que playlist pertenece al usuario
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

    if (plData.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    /* ------------------------------------------------------------
       2) Eliminar la canción
       ------------------------------------------------------------ */
    const plSongsRef = collection(firestore, "userPlaylistSongs");
    const delQuery = query(
      plSongsRef,
      where("playlistId", "==", playlistId),
      where("songId", "==", songId)
    );

    const delSnap = await getDocs(delQuery);
    for (const docItem of delSnap.docs) {
      await deleteDoc(doc(firestore, "userPlaylistSongs", docItem.id));
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
    for (const docItem of remainingSnap.docs) {
      await updateDoc(doc(firestore, "userPlaylistSongs", docItem.id), {
        position: pos++,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("🔥 Error removing song from playlist:", error);
    return NextResponse.json(
      { error: "Error removing song from playlist" },
      { status: 500 }
    );
  }
}
