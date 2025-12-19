// src/app/api/favorites/route.ts

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
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

/* ============================================================
   GET → Obtener favoritos del usuario
   ============================================================ */
export async function GET() {
  try {
    const user = await requireUser();
    const userId = user.id;

    const favoritesRef = collection(firestore, "favorites");
    const q = query(favoritesRef, where("userId", "==", userId));
    const snap = await getDocs(q);

    const favorites = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as any),
    }));

    return NextResponse.json(favorites);
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("🔥 Error fetching favorites:", error);
    return NextResponse.json(
      { error: "Error fetching favorites" },
      { status: 500 }
    );
  }
}

/* ============================================================
   POST → Añadir favorito
   ============================================================ */
export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const userId = user.id;

    const { songId } = await request.json();

    if (!songId) {
      return NextResponse.json(
        { error: "Song ID is required" },
        { status: 400 }
      );
    }

    const favoritesRef = collection(firestore, "favorites");

    await addDoc(favoritesRef, {
      userId,
      songId,
      createdAt: serverTimestamp(),
    });

    await updateDoc(doc(firestore, "users", userId), {
      favoriteCount: serverTimestamp(), // o increment si lo usas
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("🔥 Error adding favorite:", error);
    return NextResponse.json(
      { error: "Error adding favorite" },
      { status: 500 }
    );
  }
}

/* ============================================================
   DELETE → Eliminar favorito
   ============================================================ */
export async function DELETE(request: Request) {
  try {
    const user = await requireUser();
    const userId = user.id;

    const { songId } = await request.json();

    if (!songId) {
      return NextResponse.json(
        { error: "Song ID is required" },
        { status: 400 }
      );
    }

    const favoritesRef = collection(firestore, "favorites");
    const q = query(
      favoritesRef,
      where("userId", "==", userId),
      where("songId", "==", songId)
    );

    const snap = await getDocs(q);
    for (const d of snap.docs) {
      await deleteDoc(doc(firestore, "favorites", d.id));
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("🔥 Error removing favorite:", error);
    return NextResponse.json(
      { error: "Error removing favorite" },
      { status: 500 }
    );
  }
}
