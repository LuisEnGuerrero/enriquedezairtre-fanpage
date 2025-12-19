// src/app/api/admin/stats/route.ts

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

import { firestore } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export async function GET() {
  try {
    // 🔐 Verificación de administrador (Firebase Session Cookie)
    await requireAdmin();

    // 🔹 1. Total de canciones
    const songsSnap = await getDocs(collection(firestore, "songs"));
    const totalSongs = songsSnap.size;

    // 🔹 2. Total de playlists oficiales
    const playlistsSnap = await getDocs(collection(firestore, "playlists"));
    const totalPlaylists = playlistsSnap.size;

    // 🔹 3. Total de reproducciones (sumatoria desde users)
    const usersSnap = await getDocs(collection(firestore, "users"));
    let totalPlays = 0;

    usersSnap.forEach((docSnap) => {
      const data = docSnap.data() as { totalPlays?: number };
      totalPlays += data.totalPlays ?? 0;
    });

    return NextResponse.json({
      totalSongs,
      totalPlaylists,
      totalPlays,
    });
  } catch (error: any) {
    // 🚫 Errores de auth
    if (error?.message === "UNAUTHORIZED" || error?.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("🔥 Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Error fetching stats" },
      { status: 500 }
    );
  }
}
