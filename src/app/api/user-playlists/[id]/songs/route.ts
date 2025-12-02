import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { db } from '@/lib/db'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { songId } = await request.json()
    const playlistId = params.id

    if (!songId) {
      return NextResponse.json({ error: 'Song ID is required' }, { status: 400 })
    }

    // Verify playlist ownership
    const playlist = await db.userPlaylist.findUnique({
      where: { id: playlistId }
    })

    if (!playlist || playlist.userId !== session.user.id) {
      return NextResponse.json({ error: 'Playlist not found or access denied' }, { status: 404 })
    }

    // Check if song already in playlist
    const existing = await db.userPlaylistSong.findFirst({
      where: {
        playlistId,
        songId
      }
    })

    if (existing) {
      return NextResponse.json({ error: 'Song already in playlist' }, { status: 400 })
    }

    // Get next position
    const maxPosition = await db.userPlaylistSong.aggregate({
      where: { playlistId },
      _max: { position: true }
    })

    const nextPosition = (maxPosition._max.position || 0) + 1

    // Add song to playlist
    const playlistSong = await db.userPlaylistSong.create({
      data: {
        playlistId,
        songId,
        position: nextPosition
      },
      include: {
        song: true
      }
    })

    // Log activity
    await db.activity.create({
      data: {
        userId: session.user.id,
        type: 'playlist_add_song',
        songId,
        metadata: JSON.stringify({ playlistId, playlistName: playlist.name })
      }
    })

    return NextResponse.json(playlistSong)
  } catch (error) {
    return NextResponse.json({ error: 'Error adding song to playlist' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { songId } = await request.json()
    const playlistId = params.id

    if (!songId) {
      return NextResponse.json({ error: 'Song ID is required' }, { status: 400 })
    }

    // Verify playlist ownership
    const playlist = await db.userPlaylist.findUnique({
      where: { id: playlistId }
    })

    if (!playlist || playlist.userId !== session.user.id) {
      return NextResponse.json({ error: 'Playlist not found or access denied' }, { status: 404 })
    }

    // Remove song from playlist
    await db.userPlaylistSong.deleteMany({
      where: {
        playlistId,
        songId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error removing song from playlist' }, { status: 500 })
  }
}