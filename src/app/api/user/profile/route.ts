// src/app/api/user/profile/route.ts

import { requireUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import { firestore } from "@/lib/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

// ------------------------------------------------------
// Helper para serializar fechas de Firestore/Date/number
// ------------------------------------------------------
function serializeDate(value: any): string | null {
  if (!value) return null;

  if (typeof value === "string") return value;

  if (typeof value === "number") {
    return new Date(value).toISOString();
  }

  if (typeof value === "object" && value.toDate) {
    try {
      return value.toDate().toISOString();
    } catch {
      return null;
    }
  }

  return null;
}

/* ============================================================
   GET → Obtener perfil del usuario desde Firestore
   ============================================================ */
export async function GET() {
  try {
    // 🔐 Autenticación
    const user = await requireUser();
    const userId = user.id;

    // 1) Leer documento del usuario
    const userRef = doc(firestore, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userSnap.data() || {};

    // 2) Traer recompensas asociadas al usuario
    const rewardsRef = collection(firestore, "rewards");
    const rewardsQuery = query(rewardsRef, where("userId", "==", userId));
    const rewardsSnap = await getDocs(rewardsQuery);

    const rewards = rewardsSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    // 3) Normalizar fechas
    const joinDate = serializeDate(userData.joinDate);
    const lastLogin = serializeDate(userData.lastLogin);

    // 4) Respuesta final
    return NextResponse.json({
      id: userSnap.id,
      name: userData.name ?? null,
      email: userData.email ?? null,
      image: userData.image ?? null,
      role: userData.role ?? "fan",

      joinDate,
      lastLogin,

      loyaltyPoints: userData.loyaltyPoints ?? 0,
      tier: userData.tier ?? "bronze",

      phone: userData.phone ?? "",
      bio: userData.bio ?? "",

      favoriteCount: userData.favoriteCount ?? 0,
      playlistCount: userData.playlistCount ?? 0,
      totalPlays: userData.totalPlays ?? 0,

      rewards,
    });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("🔥 Error GET /api/user/profile:", error);
    return NextResponse.json(
      { error: "Server error fetching profile" },
      { status: 500 }
    );
  }
}

/* ============================================================
   PUT → Actualizar perfil del usuario en Firestore
   ============================================================ */
export async function PUT(request: Request) {
  try {
    // 🔐 Autenticación
    const user = await requireUser();
    const userId = user.id;

    const body = await request.json();

    const userRef = doc(firestore, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Actualizar campos permitidos
    await updateDoc(userRef, {
      name: body.name ?? null,
      phone: body.phone ?? "",
      bio: body.bio ?? "",
      profileUpdatedAt: Date.now(),
    });

    // Volver a leer usuario
    const updatedSnap = await getDoc(userRef);
    const updatedData = updatedSnap.data() || {};

    const joinDate = serializeDate(updatedData.joinDate);
    const lastLogin = serializeDate(updatedData.lastLogin);

    return NextResponse.json({
      id: updatedSnap.id,
      name: updatedData.name ?? null,
      email: updatedData.email ?? null,
      image: updatedData.image ?? null,
      role: updatedData.role ?? "fan",
      joinDate,
      lastLogin,
      loyaltyPoints: updatedData.loyaltyPoints ?? 0,
      tier: updatedData.tier ?? "bronze",
      phone: updatedData.phone ?? "",
      bio: updatedData.bio ?? "",
      favoriteCount: updatedData.favoriteCount ?? 0,
      playlistCount: updatedData.playlistCount ?? 0,
      totalPlays: updatedData.totalPlays ?? 0,
    });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("🔥 Error PUT /api/user/profile:", error);
    return NextResponse.json(
      { error: "Error updating profile" },
      { status: 500 }
    );
  }
}
