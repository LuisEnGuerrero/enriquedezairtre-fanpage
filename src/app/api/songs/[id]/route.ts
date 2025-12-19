// src/app/api/songs/[id]/route.ts
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

import { firestore } from "@/lib/firebase";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";

const now = () => Date.now();

/* ============================================================
   GET → Obtener una canción por ID (PÚBLICO)
   ============================================================ */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Song ID is required" },
        { status: 400 }
      );
    }

    const songRef = doc(firestore, "songs", id);
    const snapshot = await getDoc(songRef);

    if (!snapshot.exists()) {
      return NextResponse.json(
        { error: "Song not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: snapshot.id,
      ...(snapshot.data() as Record<string, any>),
    });
  } catch (error) {
    console.error("🔥 Error fetching song by id:", error);
    return NextResponse.json(
      { error: "Error fetching song" },
      { status: 500 }
    );
  }
}

/* ============================================================
   PUT → Actualizar canción (ADMIN)
   ============================================================ */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin(); // ✅ guard real

    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { error: "Song ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const songRef = doc(firestore, "songs", id);
    await updateDoc(songRef, {
      ...body,
      updatedAt: now(),
    });

    return NextResponse.json({
      id,
      ...body,
    });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error?.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    console.error("🔥 Error updating song by id:", error);
    return NextResponse.json(
      { error: "Error updating song" },
      { status: 500 }
    );
  }
}

/* ============================================================
   DELETE → Eliminar canción (ADMIN)
   ============================================================ */
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin(); // ✅ guard real

    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { error: "Song ID is required" },
        { status: 400 }
      );
    }

    const songRef = doc(firestore, "songs", id);
    await deleteDoc(songRef);

    return NextResponse.json({
      message: "Song deleted successfully",
    });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error?.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    console.error("🔥 Error deleting song by id:", error);
    return NextResponse.json(
      { error: "Error deleting song" },
      { status: 500 }
    );
  }
}
