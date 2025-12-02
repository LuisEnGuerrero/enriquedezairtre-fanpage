import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { db } from '@/lib/db'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id } = params

    const playlist = await db.playlist.update({
      where: { id },
      data: body
    })

    return NextResponse.json(playlist)
  } catch (error) {
    return NextResponse.json({ error: 'Error updating playlist' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    await db.playlist.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Playlist deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Error deleting playlist' }, { status: 500 })
  }
}