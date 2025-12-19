// src/app/page.tsx

'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  List,
  Share2,
  Volume2,
  Heart,
  Music,
  User,
  LogIn,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'

/* ============================
   Tipos
============================ */

type RepeatMode = 'off' | 'all' | 'one'

type AppUser = {
  id: string
  email: string
  role: 'admin' | 'fan'
  name?: string
  image?: string
}

interface Song {
  id: string
  title: string
  artist: string
  duration: number
  coverUrl?: string
  audioUrl: string
  lyrics: string
  published?: boolean
}

interface PlaylistSummary {
  id: string
  name: string
  description?: string
  isOfficial?: boolean
  songCount?: number
  songIds?: string[]
}

type UserPlaylist = {
  id: string
  name: string
  description?: string
  songIds?: string[]
}

/* ============================
   Fallback
============================ */

const fallbackSong: Song = {
  id: 'fallback-1',
  title: 'Canción de Ejemplo',
  artist: 'Artista',
  duration: 200,
  coverUrl: '/assets/vortex.jpg',
  audioUrl: '/assets/vortex.mp3',
  lyrics: 'Letra de ejemplo...',
}

/* ============================
   Página principal
============================ */

export default function HomePage() {
  const router = useRouter()

  /* 🔐 Usuario autenticado (Firebase session cookie) */
  const [user, setUser] = useState<AppUser | null>(null)
  const isLoggedIn = !!user

  /* 🎵 Estados de música */
  const [songs, setSongs] = useState<Song[]>([])
  const [favorites, setFavorites] = useState<string[]>([])
  const [currentSong, setCurrentSong] = useState<Song>(fallbackSong)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(75)
  const [isShuffleOn, setIsShuffleOn] = useState(false)
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off')

  /* 🎼 Playlists */
  const [showPlaylistPanel, setShowPlaylistPanel] = useState(false)
  const [officialPlaylists, setOfficialPlaylists] = useState<PlaylistSummary[]>([])
  const [userPlaylists, setUserPlaylists] = useState<UserPlaylist[]>([])
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<'all' | string>('all')

  /* 🧠 UI extra */
  const [showLyrics, setShowLyrics] = useState(false)
  const [colorPhase, setColorPhase] = useState(0)
  const [avatarIndex, setAvatarIndex] = useState(0)

  /* 🆕 Crear playlist */
  const [showNewPlaylistModal, setShowNewPlaylistModal] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('')
  const [selectedSongIds, setSelectedSongIds] = useState<string[]>([])
  const [isSavingPlaylist, setIsSavingPlaylist] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)

  const avatarImages = ['/assets/Zairtre.jpg', '/assets/photo.jpg']

  /* ============================
     Auth: /api/me
  ============================ */
  useEffect(() => {
    fetch('/api/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => setUser(data?.user ?? null))
      .catch(() => setUser(null))
  }, [])

  /* ============================
     Background animado
  ============================ */
  useEffect(() => {
    const i = setInterval(() => setColorPhase(p => (p + 1) % 360), 50)
    return () => clearInterval(i)
  }, [])

  useEffect(() => {
    const i = setInterval(
      () => setAvatarIndex(p => (p + 1) % avatarImages.length),
      33000
    )
    return () => clearInterval(i)
  }, [avatarImages.length])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100
  }, [volume])

  /* ============================
     Carga de datos
  ============================ */
  useEffect(() => {
    const load = async () => {
      const songsRes = await fetch('/api/songs')
      const songsData = songsRes.ok ? await songsRes.json() : []
      const normalized = Array.isArray(songsData) && songsData.length
        ? songsData.map((s: any) => ({
            id: s.id ?? crypto.randomUUID(),
            title: s.title,
            artist: s.artist ?? 'Enrique de Zairtre',
            duration: s.duration ?? 0,
            coverUrl: s.coverUrl ?? '/assets/vortex.jpg',
            audioUrl: s.audioUrl ?? '/assets/vortex.mp3',
            lyrics: s.lyrics ?? '',
            published: s.published ?? true,
          }))
        : [fallbackSong]

      setSongs(normalized)
      setCurrentSong(normalized[0])

      if (isLoggedIn) {
        const fav = await fetch('/api/favorites')
        if (fav.ok) {
          const f = await fav.json()
          setFavorites(f.map((x: any) => x.songId))
        }
      }
    }

    load().catch(console.error)
  }, [isLoggedIn])

  /* ============================
     Auth actions
  ============================ */
  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' })
    setUser(null)
    toast.success('Sesión cerrada')
  }

  const handleLogin = () => router.push('/admin/login')

  /* ============================
     Utilidades
  ============================ */
  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`

  const playSong = (song: Song) => {
    setCurrentSong(song)
    setCurrentTime(0)
    setTimeout(() => audioRef.current?.play().then(() => setIsPlaying(true)), 0)
  }

  const handlePlayPause = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play().then(() => setIsPlaying(true))
    }
  }

  /* ============================
     Render
  ============================ */
  return (
    <Suspense fallback={<div>Cargando…</div>}>
      <div className="min-h-screen bg-black text-white">

        {/* HEADER */}
        <header className="text-center py-10">
          <h1 className="text-5xl font-bold mb-4">Enrique de Zairtre</h1>

          <div className="flex justify-center gap-4">
            {isLoggedIn ? (
              <>
                <Button variant="outline" onClick={() => router.push('/profile')}>
                  <User className="w-4 h-4" />
                </Button>
                <Button variant="outline" onClick={handleLogout}>
                  <LogIn className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Button onClick={handleLogin}>
                <LogIn className="w-4 h-4" />
              </Button>
            )}
          </div>
        </header>

        {/* PLAYER */}
        <Card className="max-w-3xl mx-auto p-6 bg-black/60">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold">{currentSong.title}</h2>
            <p className="text-gray-400">{currentSong.artist}</p>
          </div>

          <div className="flex justify-center gap-4">
            <Button onClick={handlePlayPause}>
              {isPlaying ? <Pause /> : <Play />}
            </Button>
          </div>

          <Slider
            value={[currentTime]}
            max={currentSong.duration}
            onValueChange={v => {
              setCurrentTime(v[0])
              if (audioRef.current) audioRef.current.currentTime = v[0]
            }}
          />
        </Card>

        <audio
          ref={audioRef}
          src={currentSong.audioUrl}
          onTimeUpdate={e => setCurrentTime(e.currentTarget.currentTime)}
        />
      </div>
    </Suspense>
  )
}
