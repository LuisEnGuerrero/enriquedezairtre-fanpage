import { firestore } from "@/lib/firebase";
import { cacheGet, cacheSet } from "./cache";
import { doc, getDoc } from "firebase/firestore";

export async function getSongCached(songId: string) {
  const cacheKey = `song:${songId}`;

  // 1. Intentar recuperar desde caché
  const cached = cacheGet<any>(cacheKey);
  if (cached) return cached;

  // 2. Leer desde Firestore (solo 1 lectura)
  const snap = await getDoc(doc(firestore, "songs", songId));
  if (!snap.exists()) return null;

  const songData = { id: snap.id, ...snap.data() };

  // 3. Guardar en caché
  cacheSet(cacheKey, songData);

  return songData;
}
