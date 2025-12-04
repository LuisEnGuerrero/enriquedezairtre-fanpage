import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const ADMIN_EMAIL = process.env.ADM1N_EM41L || 'enrique.zairtre@example.com'

export async function syncUserDirect({
  email,
  name,
  image,
}: {
  email: string
  name?: string | null
  image?: string | null
}) {
  if (!email) {
    throw new Error('Email is required')
  }

  // Check if user exists
  let user = await db.user.findUnique({
    where: { email },
  })

  if (user) {
    // Update existing user
    user = await db.user.update({
      where: { email },
      data: {
        lastLogin: new Date(),
        name: name || user.name,
        image: image || user.image,
      },
    })
  } else {
    // Create new user
    const isAdmin = email === ADMIN_EMAIL
    user = await db.user.create({
      data: {
        email,
        name: name || 'Unknown User',
        image: image || '',
        role: isAdmin ? 'admin' : 'fan',
        isActive: true,
        joinDate: new Date(),
        lastLogin: new Date(),
      },
    })
  }

  return user
}

// Handler HTTP (si algún día quieres llamarlo vía API)
export async function POST(request: Request) {
  try {
    const { email, name, image } = await request.json()

    const user = await syncUserDirect({ email, name, image })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error syncing user (POST handler):', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
