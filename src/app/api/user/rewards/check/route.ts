import { requireUser } from "@/lib/auth";
import { NextResponse } from "next/server";

import { firestore, storage } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
} from "firebase/firestore";

import { ref, getDownloadURL } from "firebase/storage";

/* ============================================================
   🔥 Configuración de tiers
   ============================================================ */
export const REWARD_TIERS = [
  {
    tier: 1,
    title: "Fan Apprentice",
    pointsRequired: 50,
    badge: "badges/fan_apprentice.png",
    sound: "sounds/unlock_tier1.mp3",
  },
  {
    tier: 2,
    title: "Loyal Listener",
    pointsRequired: 100,
    badge: "badges/loyal_listener.png",
    sound: "sounds/unlock_tier2.mp3",
  },
  {
    tier: 3,
    title: "Zairtre Elite",
    pointsRequired: 300,
    badge: "badges/zairtre_elite.png",
    sound: "sounds/unlock_tier3.mp3",
  },
];

/* ============================================================
   Helper timestamp
   ============================================================ */
function toTimestamp(date: Date): number {
  return date.getTime();
}

/* ============================================================
   GET → Verifica si el usuario desbloquea nuevas recompensas
   ============================================================ */
export async function GET() {
  try {
    // 🔐 Autenticación
    const user = await requireUser();
    const userId = user.id;

    /* ------------------------------------------------------------
       1) Leer usuario desde Firestore
     ------------------------------------------------------------ */
    const usersRef = collection(firestore, "users");
    const userQuery = query(usersRef, where("id", "==", userId));
    const userSnap = await getDocs(userQuery);

    if (userSnap.empty) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userSnap.docs[0].data();
    const loyaltyPoints = userData.loyaltyPoints ?? 0;

    /* ------------------------------------------------------------
       2) Leer recompensas ya desbloqueadas
     ------------------------------------------------------------ */
    const rewardsRef = collection(firestore, "rewards");
    const existingRewardsQuery = query(
      rewardsRef,
      where("userId", "==", userId)
    );
    const rewardsSnap = await getDocs(existingRewardsQuery);

    const unlockedTiers = new Set(
      rewardsSnap.docs.map((d) => d.data().tier)
    );

    const newRewards: any[] = [];

    /* ------------------------------------------------------------
       3) Evaluar tiers
     ------------------------------------------------------------ */
    for (const tier of REWARD_TIERS) {
      const alreadyUnlocked = unlockedTiers.has(tier.tier);
      const meetsRequirement = loyaltyPoints >= tier.pointsRequired;

      if (alreadyUnlocked || !meetsRequirement) continue;

      /* ------------------------------------------------------------
         4) Obtener URLs desde Firebase Storage
       ------------------------------------------------------------ */
      const badgeUrl = await getDownloadURL(ref(storage, tier.badge));
      const soundUrl = await getDownloadURL(ref(storage, tier.sound));

      /* ------------------------------------------------------------
         5) Crear recompensa
       ------------------------------------------------------------ */
      const rewardPayload = {
        userId,
        tier: tier.tier,
        title: tier.title,
        pointsRequired: tier.pointsRequired,
        badgeUrl,
        soundUrl,
        unlockedAt: toTimestamp(new Date()),
      };

      const rewardDoc = await addDoc(rewardsRef, rewardPayload);

      /* ------------------------------------------------------------
         6) Registrar actividad
       ------------------------------------------------------------ */
      const activityRef = collection(firestore, "activities");
      await addDoc(activityRef, {
        userId,
        type: "reward_unlocked",
        metadata: JSON.stringify({
          reward: tier.title,
          tier: tier.tier,
        }),
        createdAt: toTimestamp(new Date()),
      });

      newRewards.push({
        id: rewardDoc.id,
        ...rewardPayload,
      });
    }

    /* ------------------------------------------------------------
       7) Respuesta final
     ------------------------------------------------------------ */
    return NextResponse.json({
      newRewards,
      message: newRewards.length
        ? "Rewards unlocked"
        : "No new rewards",
    });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("🔥 Error in /api/user/rewards/check:", error);
    return NextResponse.json(
      { error: "Error checking rewards" },
      { status: 500 }
    );
  }
}
