// src/app/api/admin/fans/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

import { firestore } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  addDoc,
} from "firebase/firestore";

// --------------------------------------------------------------
// GET → Obtener lista de fans con estadísticas
// --------------------------------------------------------------
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const usersRef = collection(firestore, "users");
    const q = query(usersRef, where("role", "==", "fan"));
    const snapshot = await getDocs(q);

    const rewardsRef = collection(firestore, "rewards");
    const favoritesRef = collection(firestore, "favorites");
    const playlistsRef = collection(firestore, "user_playlists");
    const activitiesRef = collection(firestore, "activities");

    const fans: any[] = [];

    for (const userDoc of snapshot.docs) {
      const user = userDoc.data();
      const userId = userDoc.id;

      // Contar favoritos
      const favSnap = await getDocs(
        query(favoritesRef, where("userId", "==", userId))
      );

      // Contar playlists personales
      const plSnap = await getDocs(
        query(playlistsRef, where("userId", "==", userId))
      );

      // Contar actividades
      const actSnap = await getDocs(
        query(activitiesRef, where("userId", "==", userId))
      );

      // Contar recompensas
      const rewSnap = await getDocs(
        query(rewardsRef, where("userId", "==", userId))
      );

      fans.push({
        id: userId,
        ...user,
        _count: {
          favorites: favSnap.size,
          playlists: plSnap.size,
          activities: actSnap.size,
          rewards: rewSnap.size,
        },
      });
    }

    return NextResponse.json(fans);
  } catch (error) {
    console.error("🔥 Error fetching fans:", error);
    return NextResponse.json(
      { error: "Error fetching fans" },
      { status: 500 }
    );
  }
}

// --------------------------------------------------------------
// POST → Acciones administrativas sobre un fan
// --------------------------------------------------------------
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, action, type, title, description } = await request.json();

    if (!userId || !action) {
      return NextResponse.json(
        { error: "User ID and action are required" },
        { status: 400 }
      );
    }

    const userRef = doc(firestore, "users", userId);

    switch (action) {
      case "award_points": {
        const points = parseInt(type) || 100;

        await updateDoc(userRef, {
          loyaltyPoints: (await (await getDocs(query(collection(firestore, "users"), where("__name__", "==", userId)))).docs[0].data().loyaltyPoints || 0) + points,
        });

        await addDoc(collection(firestore, "rewards"), {
          userId,
          type: "points",
          title: `+${points} Puntos de Lealtad`,
          description: description || "Puntos otorgados por el administrador",
          unlockedAt: Date.now(),
        });

        break;
      }

      case "award_badge": {
        await addDoc(collection(firestore, "rewards"), {
          userId,
          type: "badge",
          title: title || "Insignia Especial",
          description: description || "Insignia otorgada por el administrador",
          icon: type || "🏆",
          unlockedAt: Date.now(),
        });
        break;
      }

      case "upgrade_tier": {
        await updateDoc(userRef, {
          tier: type || "silver",
        });

        await addDoc(collection(firestore, "rewards"), {
          userId,
          type: "tier_upgrade",
          title: `Actualizado a ${type || "Silver"}`,
          description: description || "Nivel mejorado por el administrador",
          unlockedAt: Date.now(),
        });
        break;
      }

      case "deactivate": {
        await updateDoc(userRef, { isActive: false });
        break;
      }

      case "activate": {
        await updateDoc(userRef, { isActive: true });
        break;
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("🔥 Error processing admin fan action:", error);
    return NextResponse.json(
      { error: "Error processing action" },
      { status: 500 }
    );
  }
}
