// src/app/api/playlists/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

import { firestore } from "@/lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

const PLAYLISTS_COLLECTION = "playlists";

/* ============================================================
   GET → Obtener todas las playlists globales
   ============================================================ */
export async function GET() {
  try {
    const ref = collection(firestore, PLAYLISTS_COLLECTION);
    const snapshot = await getDocs(ref);

    const playlists = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as any),
    }));

    return NextResponse.json(playlists);
  } catch (error) {
    console.error("🔥 Error fetching playlists:", error);
    return NextResponse.json(
      { error: "Error fetching playlists" },
      { status: 500 }
    );
  }
}

/* ============================================================
   POST → Crear playlist global (ADMIN)
   ============================================================ */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { error: "Playlist name is required" },
        { status: 400 }
      );
    }

    const newPlaylist = {
      name: body.name.trim(),
      description: body.description || "",
      coverImage: body.coverImage || null,
      published: body.published ?? true,
      songCount: 0,
      createdAt: serverTimestamp(),
    };

    const ref = await addDoc(collection(firestore, PLAYLISTS_COLLECTION), newPlaylist);

    return NextResponse.json({
      id: ref.id,
      ...newPlaylist,
    });
  } catch (error) {
    console.error("🔥 Error creating playlist:", error);
    return NextResponse.json(
      { error: "Error creating playlist" },
      { status: 500 }
    );
  }
}
