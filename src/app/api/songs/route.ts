import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const songs = await db.song.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' }
    })
    
    return Response.json(songs)
  } catch (error) {
    return Response.json({ error: 'Error fetching songs' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession()
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const song = await db.song.create({
      data: {
        title: body.title,
        artist: body.artist,
        duration: body.duration,
        coverImage: body.coverImage,
        audioUrl: body.audioUrl,
        lyrics: body.lyrics,
        published: body.published
      }
    })
    
    return Response.json(song)
  } catch (error) {
    return Response.json({ error: 'Error creating song' }, { status: 500 })
  }
}