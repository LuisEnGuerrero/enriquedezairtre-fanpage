// src/app/api/favorites/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { firestore } from "@/lib/firebase";
import { getSongCached } from "@/lib/songs";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  increment,
  addDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

interface FavoriteWithSong {
  id: string;
  userId: string;
  songId: string;
  createdAt: any;
  song: any | null;
}

// ------------------------------------------------------------
// GET → Obtener favoritos del usuario (Optimizado)
// ------------------------------------------------------------
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // 1. Obtener favoritos del usuario (UNA lectura)
    const favoritesRef = collection(firestore, "users", userId, "favorites");
    const q = query(favoritesRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return NextResponse.json([]);
    }

    const favorites = await Promise.all(
      snapshot.docs.map(async (favDoc) => {
        const fav = favDoc.data() as any;

        // 2. Obtener canción desde caché
        const song = await getSongCached(fav.songId);

        return {
          id: favDoc.id,
          userId,
          songId: fav.songId,
          createdAt: fav.createdAt,
          song,
        };
      })
    );

    return NextResponse.json(favorites);
  } catch (error) {
    console.error("🔥 Error fetching optimized favorites:", error);
    return NextResponse.json(
      { error: "Error fetching favorites" },
      { status: 500 }
    );
  }
}


/* ------------------------------------------------------------
   POST → Toggle favorito (Add / Remove)
------------------------------------------------------------ */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const songId = String(body.songId || "").trim();

    if (!songId) {
      return NextResponse.json(
        { error: "Song ID is required" },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    const favRef = doc(firestore, "users", userId, "favorites", songId);
    const existing = await getDoc(favRef);

    /* ------------------------------------------------------------
       ❌ 1. Si YA existe → eliminar favorito
    ------------------------------------------------------------ */
    if (existing.exists()) {
      await deleteDoc(favRef);

      // Actualizar estadísticas
      await updateDoc(doc(firestore, "users", userId), {
        favoriteCount: increment(-1),
      });

      // Registrar actividad
      await addDoc(collection(firestore, "activities"), {
        userId,
        type: "unfavorite",
        songId,
        createdAt: serverTimestamp(),
        metadata: { action: "removed_from_favorites" },
      });

      return NextResponse.json({ favorited: false });
    }

    /* ------------------------------------------------------------
       ✅ 2. Si NO existe → agregar favorito
    ------------------------------------------------------------ */
    await setDoc(favRef, {
      userId,
      songId,
      createdAt: serverTimestamp(),
    });

    // Obtener canción
    const songSnap = await getDoc(doc(firestore, "songs", songId));

    // Actualizar stats
    await updateDoc(doc(firestore, "users", userId), {
      favoriteCount: increment(1),
      loyaltyPoints: increment(5),
    });

    // Registrar actividad
    await addDoc(collection(firestore, "activities"), {
      userId,
      type: "favorite",
      songId,
      createdAt: serverTimestamp(),
      metadata: { action: "added_to_favorites" },
    });

    return NextResponse.json({
      favorited: true,
      favorite: {
        songId,
        song: songSnap.exists()
          ? { id: songSnap.id, ...songSnap.data() }
          : null,
      },
    });
  } catch (error) {
    console.error("🔥 Error managing favorite:", error);
    return NextResponse.json(
      { error: "Error managing favorite" },
      { status: 500 }
    );
  }
}
