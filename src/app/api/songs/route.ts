import { requireUser } from "@/lib/auth";
// src/app/api/songs/route.ts
import { NextResponse } from "next/server";

import { firestore } from "@/lib/firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";

const now = () => Date.now();

/* ============================================================
   GET â†’ Obtener todas las canciones publicadas
   ============================================================ */
export async function GET() {
  try {
    const songsRef = collection(firestore, "songs");

    // Solo canciones publicadas
    const q = query(songsRef, where("published", "==", true));

    const snapshot = await getDocs(q);

    const songs = snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Record<string, any>),
    }));

    return NextResponse.json(songs);
  } catch (error) {
    console.error("ðŸ”¥ Error fetching songs:", error);
    return NextResponse.json(
      { error: "Error fetching songs" },
      { status: 500 }
    );
  }
}

/* ============================================================
   PUT â†’ Actualizar canciÃ³n (ADMIN)
   ============================================================ */
export async function PUT(request: Request) {
  try {

    // ValidaciÃ³n ADMIN

    const body = await request.json();
    const { id, ...rest } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Song ID is required for update" },
        { status: 400 }
      );
    }

    const songRef = doc(firestore, "songs", id);

    await updateDoc(songRef, {
      ...rest,
      updatedAt: now(),
    });

    return NextResponse.json({ id, ...rest });
  } catch (error) {
    console.error("ðŸ”¥ Error updating song:", error);
    return NextResponse.json(
      { error: "Error updating song" },
      { status: 500 }
    );
  }
}

/* ============================================================
   DELETE â†’ Eliminar canciÃ³n (ADMIN)
   ============================================================ */
export async function DELETE(request: Request) {
  try {

    // ValidaciÃ³n ADMIN

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Song ID is required" },
        { status: 400 }
      );
    }

    await deleteDoc(doc(firestore, "songs", id));

    return NextResponse.json({
      message: "Song deleted successfully",
    });
  } catch (error) {
    console.error("ðŸ”¥ Error deleting song:", error);
    return NextResponse.json(
      { error: "Error deleting song" },
      { status: 500 }
    );
  }
}
