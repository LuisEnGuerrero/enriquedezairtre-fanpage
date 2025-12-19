import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

import { firestore } from "@/lib/firebase";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  getDoc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

const SUPPORTED_BACKUP_VERSION = "2.0";

// 🔒 Lock config
const LOCK_DOC_PATH = ["settings", "import_lock"] as const;
// TTL recomendado: 10–15 min (tu maxDuration es 5 min; dejemos margen)
const LOCK_TTL_MS = 12 * 60 * 1000;

/* ------------------------------------------
 * Helpers: Firestore import
------------------------------------------- */

async function clearCollection(path: string) {
  const snap = await getDocs(collection(firestore, path));
  for (const d of snap.docs) {
    await deleteDoc(doc(firestore, path, d.id));
  }
}

async function importCollection(path: string, items: any[]) {
  for (const item of items) {
    const { id, ...data } = item;
    if (!id) continue;

    await setDoc(doc(firestore, path, id), {
      ...data,
      restoredAt: Date.now(),
    });
  }
}

async function importPlaylists(playlists: any[]) {
  for (const playlist of playlists) {
    const { id, songs, ...data } = playlist;
    if (!id) continue;

    await setDoc(doc(firestore, "playlists", id), {
      ...data,
      restoredAt: Date.now(),
    });

    if (Array.isArray(songs)) {
      for (const song of songs) {
        const { id: songId, ...songData } = song;
        if (!songId) continue;

        await setDoc(doc(firestore, "playlists", id, "songs", songId), {
          ...songData,
          restoredAt: Date.now(),
        });
      }
    }
  }
}

/* ------------------------------------------
 * Helpers: Audit log
------------------------------------------- */

function getClientIp(request: Request) {
  // Render/Proxy comúnmente usan x-forwarded-for
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return request.headers.get("x-real-ip") || null;
}

async function auditLog(payload: Record<string, any>) {
  // No debe romper el import si falla el log
  try {
    await setDoc(doc(collection(firestore, "admin_audit_logs")), {
      ...payload,
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    console.error("⚠️ Audit log failed:", e);
  }
}

/* ------------------------------------------
 * Helpers: Lock (transactional, TTL)
------------------------------------------- */

type LockState = {
  locked: boolean;
  ownerId: string | null;
  importId: string | null;
  expiresAt: number | null;
};

async function acquireImportLock(ownerId: string, importId: string) {
  const lockRef = doc(firestore, ...LOCK_DOC_PATH);
  const now = Date.now();
  const newExpiresAt = now + LOCK_TTL_MS;

  const result = await runTransaction(firestore, async (tx) => {
    const snap = await tx.get(lockRef);

    let current: LockState = {
      locked: false,
      ownerId: null,
      importId: null,
      expiresAt: null,
    };

    if (snap.exists()) {
      const d = snap.data() as any;
      current = {
        locked: !!d.locked,
        ownerId: d.ownerId ?? null,
        importId: d.importId ?? null,
        expiresAt: typeof d.expiresAt === "number" ? d.expiresAt : null,
      };
    }

    const isExpired =
      current.locked &&
      typeof current.expiresAt === "number" &&
      current.expiresAt <= now;

    if (current.locked && !isExpired) {
      // Lock activo → deny
      return {
        ok: false as const,
        current,
      };
    }

    // Adquirir lock (si estaba libre o expirado)
    tx.set(
      lockRef,
      {
        locked: true,
        ownerId,
        importId,
        acquiredAt: now,
        expiresAt: newExpiresAt,
        updatedAt: now,
      },
      { merge: true }
    );

    return {
      ok: true as const,
      current,
      lock: {
        locked: true,
        ownerId,
        importId,
        expiresAt: newExpiresAt,
      } satisfies LockState,
    };
  });

  return result;
}

async function releaseImportLock(ownerId: string, importId: string) {
  const lockRef = doc(firestore, ...LOCK_DOC_PATH);
  const now = Date.now();

  try {
    await runTransaction(firestore, async (tx) => {
      const snap = await tx.get(lockRef);
      if (!snap.exists()) return;

      const d = snap.data() as any;
      const locked = !!d.locked;
      const currentOwner = d.ownerId ?? null;
      const currentImportId = d.importId ?? null;

      // Solo el dueño del lock lo libera (evita que otro lo tumbe)
      if (!locked) return;
      if (currentOwner !== ownerId) return;
      if (currentImportId !== importId) return;

      tx.set(
        lockRef,
        {
          locked: false,
          ownerId: null,
          importId: null,
          releasedAt: now,
          updatedAt: now,
        },
        { merge: true }
      );
    });
  } catch (e) {
    console.error("⚠️ Release lock failed:", e);
  }
}

/* ------------------------------------------
 * POST /api/admin/import
------------------------------------------- */
export async function POST(request: Request) {
  const importId = crypto.randomUUID();
  let adminUser: { id: string; email: string } | null = null;

  try {
    // 🔐 Auth
    const user = await requireAdmin();
    adminUser = { id: user.id, email: user.email };

    const { searchParams } = new URL(request.url);
    const dryRun = searchParams.get("dryRun") === "true";

    // Si quieres permitir dryRun sin lock: OK.
    // Si prefieres que dryRun también tome lock: se puede cambiar.
    // Yo lo dejo SIN lock para validar rápido.

    const json = await request.json();

    // ---- Validaciones ----
    if (!json || typeof json !== "object") {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    if (json.version !== SUPPORTED_BACKUP_VERSION) {
      await auditLog({
        event: "IMPORT_FAIL",
        reason: "UNSUPPORTED_VERSION",
        importId,
        adminId: adminUser.id,
        adminEmail: adminUser.email,
        receivedVersion: json.version ?? null,
        expectedVersion: SUPPORTED_BACKUP_VERSION,
        dryRun,
        ip: getClientIp(request),
        userAgent: request.headers.get("user-agent") || null,
      });

      return NextResponse.json(
        {
          error: "Unsupported backup version",
          expected: SUPPORTED_BACKUP_VERSION,
          received: json.version ?? null,
        },
        { status: 400 }
      );
    }

    if (!json.data || typeof json.data !== "object") {
      return NextResponse.json(
        { error: "Invalid backup structure: missing data" },
        { status: 400 }
      );
    }

    const {
      songs = [],
      playlists = [],
      users = [],
      favorites = [],
      rewards = [],
      activities = [],
      userPlaylists = [],
      userPlaylistSongs = [],
    } = json.data;

    const summary = {
      songs: Array.isArray(songs) ? songs.length : 0,
      playlists: Array.isArray(playlists) ? playlists.length : 0,
      users: Array.isArray(users) ? users.length : 0,
      favorites: Array.isArray(favorites) ? favorites.length : 0,
      rewards: Array.isArray(rewards) ? rewards.length : 0,
      activities: Array.isArray(activities) ? activities.length : 0,
      userPlaylists: Array.isArray(userPlaylists) ? userPlaylists.length : 0,
      userPlaylistSongs: Array.isArray(userPlaylistSongs) ? userPlaylistSongs.length : 0,
    };

    // ---- DRY RUN ----
    if (dryRun) {
      await auditLog({
        event: "DRY_RUN",
        importId,
        adminId: adminUser.id,
        adminEmail: adminUser.email,
        version: json.version,
        engine: json.engine ?? "firestore",
        exportDate: json.exportDate ?? null,
        summary,
        ip: getClientIp(request),
        userAgent: request.headers.get("user-agent") || null,
      });

      return NextResponse.json({
        dryRun: true,
        version: json.version,
        importId,
        summary,
      });
    }

    // ---- LOCK (solo para import real) ----
    const lockAttempt = await acquireImportLock(adminUser.id, importId);

    if (!lockAttempt.ok) {
      await auditLog({
        event: "LOCK_DENIED",
        importId,
        adminId: adminUser.id,
        adminEmail: adminUser.email,
        version: json.version,
        summary,
        lock: lockAttempt.current,
        ip: getClientIp(request),
        userAgent: request.headers.get("user-agent") || null,
      });

      return NextResponse.json(
        {
          error: "Import already in progress",
          importId,
          lock: lockAttempt.current,
          hint: "Try again after the lock expires",
        },
        { status: 409 }
      );
    }

    // ---- AUDIT: START ----
    await auditLog({
      event: "IMPORT_START",
      importId,
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      version: json.version,
      engine: json.engine ?? "firestore",
      exportDate: json.exportDate ?? null,
      summary,
      lock: lockAttempt.lock,
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent") || null,
    });

    // ---- IMPORT REAL (DESTRUCTIVO) ----
    // (Orden recomendado: primero relaciones/colecciones dependientes, luego base)
    await clearCollection("favorites");
    await clearCollection("rewards");
    await clearCollection("activities");
    await clearCollection("userPlaylistSongs");
    await clearCollection("userPlaylists");
    await clearCollection("playlists");
    await clearCollection("songs");
    await clearCollection("users");

    await importCollection("songs", songs);
    await importPlaylists(playlists);
    await importCollection("users", users);
    await importCollection("favorites", favorites);
    await importCollection("rewards", rewards);
    await importCollection("activities", activities);
    await importCollection("userPlaylists", userPlaylists);
    await importCollection("userPlaylistSongs", userPlaylistSongs);

    // ---- AUDIT: SUCCESS ----
    await auditLog({
      event: "IMPORT_SUCCESS",
      importId,
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      version: json.version,
      summary,
      importedAt: new Date().toISOString(),
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent") || null,
    });

    return NextResponse.json({
      success: true,
      importId,
      importedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    const msg = error?.message || "UNKNOWN_ERROR";

    if (msg === "UNAUTHORIZED" || msg === "FORBIDDEN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await auditLog({
      event: "IMPORT_FAIL",
      importId,
      adminId: adminUser?.id ?? null,
      adminEmail: adminUser?.email ?? null,
      reason: msg,
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent") || null,
    });

    console.error("🔥 Import error:", error);
    return NextResponse.json({ error: "Error importing backup" }, { status: 500 });
  } finally {
    // 🔓 Liberar lock si se adquirió (best-effort)
    if (adminUser) {
      await releaseImportLock(adminUser.id, importId);
    }
  }
}
