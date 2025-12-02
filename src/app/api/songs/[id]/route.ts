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

    const song = await db.song.update({
      where: { id },
      data: body
    })

    return NextResponse.json(song)
  } catch (error) {
    return NextResponse.json({ error: 'Error updating song' }, { status: 500 })
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

    await db.song.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Song deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Error deleting song' }, { status: 500 })
  }
}