import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession()
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const fans = await db.user.findMany({
      where: { role: 'fan' },
      include: {
        _count: {
          select: {
            favorites: true,
            playlists: true,
            activities: true,
            rewards: true
          }
        }
      },
      orderBy: { joinDate: 'desc' }
    })
    
    return NextResponse.json(fans)
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching fans' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession()
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, action, type, title, description } = await request.json()

    if (!userId || !action) {
      return NextResponse.json({ error: 'User ID and action are required' }, { status: 400 })
    }

    switch (action) {
      case 'award_points':
        const points = parseInt(type) || 100
        await db.user.update({
          where: { id: userId },
          data: {
            loyaltyPoints: {
              increment: points
            }
          }
        })

        // Create reward record
        await db.reward.create({
          data: {
            userId,
            type: 'points',
            title: `+${points} Puntos de Lealtad`,
            description: description || 'Puntos otorgados por el administrador'
          }
        })
        break

      case 'award_badge':
        await db.reward.create({
          data: {
            userId,
            type: 'badge',
            title: title || 'Insignia Especial',
            description: description || 'Insignia otorgada por el administrador',
            icon: type || '🏆'
          }
        })
        break

      case 'upgrade_tier':
        await db.user.update({
          where: { id: userId },
          data: {
            tier: type || 'silver'
          }
        })

        await db.reward.create({
          data: {
            userId,
            type: 'tier_upgrade',
            title: `Actualizado a ${type || 'Silver'}`,
            description: description || 'Nivel mejorado por el administrador'
          }
        })
        break

      case 'deactivate':
        await db.user.update({
          where: { id: userId },
          data: {
            isActive: false
          }
        })
        break

      case 'activate':
        await db.user.update({
          where: { id: userId },
          data: {
            isActive: true
          }
        })
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error processing action' }, { status: 500 })
  }
}