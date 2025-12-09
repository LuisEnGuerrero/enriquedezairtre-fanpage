// src/app/api/playlists/[id]/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

import { firestore } from "@/lib/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

/* ============================================================
   PUT → Actualizar playlist global (ADMIN)
   ============================================================ */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    const playlistRef = doc(firestore, "playlists", id);
    const snapshot = await getDoc(playlistRef);

    if (!snapshot.exists()) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }

    await updateDoc(playlistRef, {
      ...body,
      updatedAt: Date.now(),
    });

    return NextResponse.json({
      id,
      ...snapshot.data(),
      ...body,
    });

  } catch (error) {
    console.error("🔥 Error updating playlist:", error);
    return NextResponse.json(
      { error: "Error updating playlist" },
      { status: 500 }
    );
  }
}

/* ============================================================
   DELETE → Eliminar playlist global (ADMIN)
   ============================================================ */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const playlistRef = doc(firestore, "playlists", id);
    const snapshot = await getDoc(playlistRef);

    if (!snapshot.exists()) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }

    await deleteDoc(playlistRef);

    return NextResponse.json({
      message: "Playlist deleted successfully",
      id,
    });

  } catch (error) {
    console.error("🔥 Error deleting playlist:", error);
    return NextResponse.json(
      { error: "Error deleting playlist" },
      { status: 500 }
    );
  }
}
