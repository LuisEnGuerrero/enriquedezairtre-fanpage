import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession()
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const totalSongs = await db.song.count()
    const totalPlaylists = await db.playlist.count()
    
    // Mock plays count - in real app, you'd have a plays table
    const totalPlays = Math.floor(Math.random() * 10000)

    return NextResponse.json({
      totalSongs,
      totalPlaylists,
      totalPlays
    })
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching stats' }, { status: 500 })
  }
}