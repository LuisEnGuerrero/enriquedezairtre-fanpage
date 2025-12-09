import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

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
   Helper para timestamp y seguridad
   ============================================================ */
const now = () => Date.now();

/* ============================================================
   GET → Obtener playlists del usuario
   ============================================================ */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      console.warn("❌ GET /api/user-playlists → Unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

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

        // ahora buscar la canción real en songs/
        const songDocRef = collection(firestore, "songs");
        const songQuery = query(songDocRef, where("id", "==", data.songId));
        const songSnap = await getDocs(songQuery);

        let finalSong: any = null;

        if (!songSnap.empty) {
          const songData = songSnap.docs[0].data();
          finalSong = {
            id: data.songId,
            title: songData.title,
            artist: songData.artist,
            coverImage: songData.coverImage,
            audioUrl: songData.audioUrl,
            position: data.position,
          };
        }

        fullSongs.push(finalSong);
      }

      playlists.push({
        id: plDoc.id,
        name: plData.name,
        description: plData.description ?? "",
        isPublic: plData.isPublic ?? false,
        createdAt: plData.createdAt,
        songCount: fullSongs.length,
        songs: fullSongs.filter(Boolean),
      });
    }

    return NextResponse.json(playlists);
  } catch (err) {
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
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      console.warn("❌ POST /api/user-playlists → Unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description, isPublic } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Playlist name is required" },
        { status: 400 }
      );
    }

    const userId = session.user.id;

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
      await updateDoc(uRef, {
        playlistCount: (userSnap.docs[0].data().playlistCount ?? 0) + 1,
        loyaltyPoints: (userSnap.docs[0].data().loyaltyPoints ?? 0) + 10,
      });
    }

    /* ------------------------------------------------------------
       3) Registrar actividad
     ------------------------------------------------------------ */
    const activityRef = collection(firestore, "activities");
    await addDoc(activityRef, {
      userId,
      type: "playlist_create",
      metadata: JSON.stringify({
        playlistName: name,
      }),
      createdAt: now(),
    });

    /* ------------------------------------------------------------
       4) Respuesta final
     ------------------------------------------------------------ */
    return NextResponse.json({
      id: playlistDoc.id,
      ...playlistPayload,
    });
  } catch (err) {
    console.error("🔥 Fatal error POST /api/user-playlists:", err);
    return NextResponse.json(
      { error: "Error creating playlist" },
      { status: 500 }
    );
  }
}
