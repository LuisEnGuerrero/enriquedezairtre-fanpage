// src/lib/syncUser.ts

import { db } from "@/lib/db"

export async function syncUserDB(
  email: string,
  name?: string | null,
  image?: string | null
) {
  if (!email) throw new Error("Email requerido para sincronizar usuario")

  const ADMIN_EMAIL = process.env.ADM1N_EM41L || "enrique.zairtre@example.com"

  let user = await db.user.findUnique({
    where: { email },
  })

  if (user) {
    user = await db.user.update({
      where: { email },
      data: {
        lastLogin: new Date(),
        name: name || user.name,
        image: image || user.image,
      },
    })
  } else {
    const isAdmin = email === ADMIN_EMAIL

    user = await db.user.create({
      data: {
        email,
        name: name || "Unknown User",
        image: image || "",
        role: isAdmin ? "admin" : "fan",
        isActive: true,
        joinDate: new Date(),
        lastLogin: new Date(),
      },
    })
  }

  return user
}
