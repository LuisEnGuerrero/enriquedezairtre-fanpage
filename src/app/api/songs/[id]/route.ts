// src/app/api/songs/[id]/route.ts
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

const now = () => Date.now();

/* ============================================================
   GET → Obtener una canción por ID
   ============================================================ */
export async function GET(
  request: Request,
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

    const data = snapshot.data() as Record<string, any>;

    return NextResponse.json({
      id: snapshot.id,
      ...data,
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
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

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
  } catch (error) {
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
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

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
  } catch (error) {
    console.error("🔥 Error deleting song by id:", error);
    return NextResponse.json(
      { error: "Error deleting song" },
      { status: 500 }
    );
  }
}
