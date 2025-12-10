'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
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
  LogIn
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { toast } from 'sonner'
import AudioVisualizer from '@/components/AudioVisualizer'

// 👇 Tipo alineado con lo que guardas en Firestore (coverUrl, audioUrl)
interface Song {
  id: string
  title: string
  artist: string
  duration: number
  coverUrl: string
  audioUrl: string
  lyrics: string
  published?: boolean
}

// Mock temporal si algo falla
const fallbackSong: Song = {
  id: 'fallback-1',
  title: 'Canción de Ejemplo',
  artist: 'Artista',
  duration: 200,
  coverUrl: '../public/assets/vortex.jpg',
  audioUrl: '../public/assets/vortex.mp3',
  lyrics: 'Letra de ejemplo...\nPrueba de línea 2...'
}

export default function Home() {
  const { data: session } = useSession()
  const router = useRouter()

  const [songs, setSongs] = useState<Song[]>([])
  const [favorites, setFavorites] = useState<string[]>([])
  const [currentSong, setCurrentSong] = useState<Song>(fallbackSong)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(75)
  const [isShuffleOn, setIsShuffleOn] = useState(false)
  const [repeatMode, setRepeatMode] = useState<'off' | 'one' | 'all'>('off')
  const [showPlaylist, setShowPlaylist] = useState(false)
  const [showLyrics, setShowLyrics] = useState(false)
  const [colorPhase, setColorPhase] = useState(0)

  // rotación de fotos del header
  const heroImages = ['/assets/Zairtre.jpg', '/assets/photo.jpg']
  const [heroIndex, setHeroIndex] = useState(0)

  const audioRef = useRef<HTMLAudioElement>(null!)
  const canvasRef = useRef<HTMLCanvasElement>(null!)

  // Fondo animado
  useEffect(() => {
    const interval = setInterval(() => {
      setColorPhase(prev => (prev + 1) % 360)
    }, 50)
    return () => clearInterval(interval)
  }, [])
  
  // Rotar imágenes de cabecera cada 22s
  useEffect(() => {
    const interval = setInterval(() => {
      setHeroIndex(prev => (prev + 1) % heroImages.length)
    }, 22000)
    return () => clearInterval(interval)
  }, [heroImages.length])

  // contraste automático
  useEffect(() => {
    const root = getComputedStyle(document.documentElement);
    const bg = root.getPropertyValue("--background");
    const match = bg.match(/\((.*?)\s/);
    const l = match ? parseFloat(match[1]) : 0.5;

    document.body.classList.toggle("dark-text", l < 0.5);
    document.body.classList.toggle("light-text", l >= 0.5);
  }, []);


  // Volumen
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100
    }
  }, [volume])

  // Cargar canciones y favoritos
  useEffect(() => {
    const loadData = async () => {
      try {
        const songsResponse = await fetch('/api/songs')

        if (songsResponse.ok) {
          const songsData = await songsResponse.json()

          if (Array.isArray(songsData) && songsData.length > 0) {
            // Normalizamos las canciones para asegurar coverImage
            const normalized: Song[] = songsData.map((s: any) => ({
              id: s.id,
              title: s.title,
              artist: s.artist,
              duration: s.duration ?? 0,
              coverImage: s.coverImage ?? s.coverUrl ?? '/assets/Zairtre.jpg',
              coverUrl: s.coverUrl,
              audioUrl: s.audioUrl,
              lyrics: s.lyrics ?? ''
            }))

            setSongs(normalized)
            setCurrentSong(normalized[0])
          } else {
            setSongs([fallbackSong])
            setCurrentSong(fallbackSong)
          }
        } else {
          setSongs([fallbackSong])
          setCurrentSong(fallbackSong)
        }

        // Cargar favoritos del usuario
        if (session?.user && (session.user as any).id) {
          const favResponse = await fetch('/api/favorites')
          if (favResponse.ok) {
            const favData = await favResponse.json()
            setFavorites(favData.map((f: any) => f.songId.toString()))
          }
        }
      } catch (error) {
        console.error('Error loading data:', error)
        setSongs([fallbackSong])
        setCurrentSong(fallbackSong)
      }
    }

    loadData()
  }, [session])

  // Format time
  const formatTime = (seconds: number) => {
    const secsNum = Number.isFinite(seconds) ? seconds : 0
    const mins = Math.floor(secsNum / 60)
    const secs = Math.floor(secsNum % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handlePlayPause = () => {
    if (!audioRef.current) return

    if (isPlaying) audioRef.current.pause()
    else audioRef.current.play()

    setIsPlaying(!isPlaying)
  }

  const handleNext = () => {
    if (!songs.length) return

    const index = songs.findIndex(s => s.id === currentSong.id)

    let next = isShuffleOn
      ? Math.floor(Math.random() * songs.length)
      : index + 1 >= songs.length
      ? 0
      : index + 1

    setCurrentSong(songs[next])
    setCurrentTime(0)
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      if (isPlaying) audioRef.current.play()
    }
  }

  const handlePrevious = () => {
    if (!songs.length) return

    const index = songs.findIndex(s => s.id === currentSong.id)

    const previous = index - 1 < 0 ? songs.length - 1 : index - 1
    setCurrentSong(songs[previous])
    setCurrentTime(0)
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      if (isPlaying) audioRef.current.play()
    }
  }

  const handleFavorite = async () => {
    // Si no hay auth, solo mostramos mensaje, la UI igual dibuja el corazón según estado
    if (!session?.user || !(session.user as any).id) {
      toast.error('Debes iniciar sesión')
      return
    }

    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ songId: currentSong.id })
      })

      if (response.ok) {
        const data = await response.json()

        if (data.favorited) {
          setFavorites(prev => [...prev, currentSong.id])
          toast.success('Añadido a favoritos')
        } else {
          setFavorites(prev => prev.filter(id => id !== currentSong.id))
          toast.info('Eliminado de favoritos')
        }
      }
    } catch {
      toast.error('Error al gestionar favorito')
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `${currentSong.title} - ${currentSong.artist}`,
        text: `Escucha "${currentSong.title}"`,
        url: window.location.href
      })
    } else {
      navigator.clipboard
        .writeText(window.location.href)
        .then(() => toast.success('Enlace copiado'))
        .catch(() => toast.error('No se pudo copiar el enlace'))
    }
  }

  const getDynamicColor = () =>
    `hsl(${(colorPhase + 240) % 360}, 70%, 15%)`

  const getAccentColor = () =>
    `hsl(${(colorPhase + 280) % 360}, 90%, 55%)`

  const getAccentButtonStyle = () => ({
  backgroundColor: getAccentColor(),
  color: '#050509' // Texto/icono oscuro para contrastar con el acento brillante
})

  const currentCoverSrc =
    currentSong.coverUrl || '/assets/Zairtre.jpg'

  return (
    <Suspense fallback={<div className="text-white p-8">Cargando...</div>}>
      <div
        className="min-h-screen transition-all duration-1000 relative overflow-hidden"
        style={{ backgroundColor: getDynamicColor() }}
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute w-96 h-96 rounded-full opacity-10 blur-3xl"
            style={{
              backgroundColor: getAccentColor(),
              top: '10%',
              left: '10%',
              animation: 'float 20s infinite ease-in-out'
            }}
          />
          <div
            className="absolute w-96 h-96 rounded-full opacity-10 blur-3xl"
            style={{
              backgroundColor: getAccentColor(),
              bottom: '10%',
              right: '10%',
              animation: 'float 25s infinite ease-in-out reverse'
            }}
          />
        </div>

        <div className="relative z-10 container mx-auto px-4 py-8">
          {/* Header */}
          <header className="text-center mb-12">
            <div className="relative inline-block mb-6">
              <div
                className="w-48 h-48 rounded-full overflow-hidden border-4 shadow-2xl"
                style={{ borderColor: getAccentColor() }}
              >
                <img
                  src={heroImages[heroIndex]}
                  alt="Enrique de Zairtre"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-red-600 text-white rounded-full p-2">
                <Music className="w-6 h-6" />
              </div>
            </div>

            <h1
              className="text-5xl md:text-7xl font-bold text-white mb-4 tracking-wider"
              style={{ textShadow: '0 0 20px rgba(255,255,255,0.3)' }}
            >
              Enrique de Zairtre
            </h1>

            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {['Poeta', 'Artista', 'Productor', 'Estrella de Rock'].map(
                (role, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 rounded-full text-sm font-medium text-white border"
                    style={{
                      borderColor: getAccentColor(),
                      backgroundColor: `${getAccentColor()}20`
                    }}
                  >
                    {role}
                  </span>
                )
              )}
            </div>

            {/* Auth Button */}
            <div className="flex justify-center mb-6">
              {session ? (
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/profile')}
                    className="border-gray-600 text-white hover:bg-gray-800"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Mi Perfil
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="border-gray-600 text-white hover:bg-gray-800"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Cerrar Sesión
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => signIn('google', { callbackUrl: '/' })}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Iniciar Sesión
                </Button>
              )}
            </div>
          </header>

          {/* Main Player */}
          <Card className="max-w-4xl mx-auto bg-black/50 backdrop-blur-lg border-gray-700 text-white overflow-hidden">
            <div className="grid md:grid-cols-2 gap-6 p-6">
              {/* Album Cover and Visualizer */}
              <div className="space-y-4">
                <div className="relative aspect-square rounded-lg overflow-hidden">
                  <img
                    src={currentCoverSrc}
                    alt={currentSong.title}
                    className="w-full h-full object-cover"
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full opacity-50"
                  />
                </div>

                {/* Song Info */}
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-2">
                    {currentSong.title}
                  </h2>
                  <p className="text-gray-300">{currentSong.artist}</p>
                </div>
              </div>

              {/* Player Controls */}
              <div className="space-y-6">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-300">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(currentSong.duration)}</span>
                  </div>
                  <Slider
                    value={[currentTime]}
                    max={currentSong.duration || 0}
                    step={1}
                    className="w-full"
                    onValueChange={value => {
                      const newTime = value[0]
                      setCurrentTime(newTime)
                      if (audioRef.current) {
                        audioRef.current.currentTime = newTime
                      }
                    }}
                  />
                </div>

                {/* Control Buttons */}
                <div className="flex justify-center items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsShuffleOn(!isShuffleOn)}
                    className={
                      isShuffleOn ? 'text-purple-400' : 'text-gray-400'
                    }
                  >
                    <Shuffle className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePrevious}
                    className="text-white hover:text-purple-400"
                  >
                    <SkipBack className="w-6 h-6" />
                  </Button>

                  <Button
                    onClick={handlePlayPause}
                    className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
                    style={getAccentButtonStyle()}
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6" />
                    ) : (
                      <Play className="w-6 h-6 ml-0.5" />
                    )}
                    <span className="sr-only">
                      {isPlaying ? 'Pausar' : 'Reproducir'}
                    </span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleNext}
                    className="text-white hover:text-purple-400"
                  >
                    <SkipForward className="w-6 h-6" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setRepeatMode(
                        repeatMode === 'off'
                          ? 'all'
                          : repeatMode === 'all'
                          ? 'one'
                          : 'off'
                      )
                    }
                    className={
                      repeatMode !== 'off'
                        ? 'text-purple-400'
                        : 'text-gray-400'
                    }
                  >
                    <Repeat className="w-4 h-4" />
                  </Button>
                </div>

                {/* Volume Control */}
                <div className="flex items-center gap-3">
                  <Volume2 className="w-4 h-4 text-gray-400" />
                  <Slider
                    value={[volume]}
                    max={100}
                    step={1}
                    className="flex-1"
                    onValueChange={value => setVolume(value[0])}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 justify-center">
                  {/* Favorito */}
                  <Button
                    variant="outline"
                    onClick={handleFavorite}
                    className={`h-10 w-10 rounded-full border-gray-600 flex items-center justify-center transition ${
                      favorites.includes(currentSong.id)
                        ? 'bg-red-900/40 border-red-500 text-red-300'
                        : 'bg-black/40 text-white hover:bg-gray-800'
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        favorites.includes(currentSong.id) ? 'fill-current' : ''
                      }`}
                    />
                    <span className="sr-only">Marcar como favorito</span>
                  </Button>

                  {/* Playlist */}
                  <Button
                    variant="outline"
                    onClick={() => setShowPlaylist(!showPlaylist)}
                    className="h-10 w-10 rounded-full border-gray-600 bg-black/40 text-white hover:bg-gray-800 flex items-center justify-center"
                  >
                    <List className="w-4 h-4" />
                    <span className="sr-only">Mostrar playlist</span>
                  </Button>

                  {/* Letras */}
                  <Button
                    variant="outline"
                    onClick={() => setShowLyrics(!showLyrics)}
                    className="h-10 w-10 rounded-full border-gray-600 bg-black/40 text-white hover:bg-gray-800 flex items-center justify-center"
                  >
                    <Music className="w-4 h-4" />
                    <span className="sr-only">Mostrar letras</span>
                  </Button>

                  {/* Compartir */}
                  <Button
                    variant="outline"
                    onClick={handleShare}
                    className="h-10 w-10 rounded-full border-gray-600 bg-black/40 text-white hover:bg-gray-800 flex items-center justify-center"
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="sr-only">Compartir canción</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Playlist */}
            {showPlaylist && (
              <div className="border-t border-gray-700 p-4 max-h-64 overflow-y-auto">
                <h3 className="text-lg font-semibold mb-3">Playlist</h3>
                <div className="space-y-2">
                  {songs.map(song => {
                    const coverSrc =
                      song.coverUrl ||
                      '/assets/Zairtre.jpg'
                    return (
                      <div
                        key={song.id}
                        onClick={() => setCurrentSong(song)}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          currentSong.id === song.id
                            ? 'bg-purple-900/30'
                            : 'hover:bg-gray-800'
                        }`}
                      >
                        <img
                          src={coverSrc}
                          alt={song.title}
                          className="w-12 h-12 rounded"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{song.title}</p>
                          <p className="text-sm text-gray-400">
                            {song.artist}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {favorites.includes(song.id) && (
                            <Heart className="w-4 h-4 text-red-400 fill-current" />
                          )}
                          <span className="text-sm text-gray-400">
                            {formatTime(song.duration)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Lyrics */}
            {showLyrics && (
              <div className="border-t border-gray-700 p-4">
                <h3 className="text-lg font-semibold mb-3">Letras</h3>
                <div className="text-center space-y-2 text-gray-300 font-medium">
                  {(currentSong.lyrics || '').split('\n').map((line, index) => (
                    <p key={index}>{line}</p>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Hidden Audio Element */}
          <audio
            ref={audioRef}
            src={currentSong.audioUrl}
            onTimeUpdate={e => setCurrentTime(e.currentTarget.currentTime)}
            onEnded={() => {
              if (repeatMode === 'one') {
                audioRef.current?.play()
              } else if (repeatMode === 'all' || isShuffleOn) {
                handleNext()
              } else {
                setIsPlaying(false)
              }
            }}
          />
          <footer className="mt-10 text-center text-sm text-gray-400">
            <div className="flex justify-center gap-6 mb-2">
              {/* SmartLink streaming */}
              <a
                href="https://ditto.fm/vortex_9cadd2c9"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-white transition"
              >
                <Music className="w-4 h-4" />
                <span className="hidden sm:inline">Escúchalo en tu plataforma favorita</span>
              </a>

              {/* Facebook */}
              <a
                href="https://www.facebook.com/profile.php?id=61584058261395#"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-white transition"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Facebook Oficial</span>
              </a>
            </div>

            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} Enrique de Zairtre. Todos los derechos reservados.
            </p>
          </footer>
        </div>

        <style jsx>{`
          @keyframes float {
            0%,
            100% {
              transform: translateY(0px) rotate(0deg);
            }
            33% {
              transform: translateY(-30px) rotate(120deg);
            }
            66% {
              transform: translateY(30px) rotate(240deg);
            }
          },
          :root {
            --btn-icon-color: #ffffff;
          }

          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            33% { transform: translateY(-30px) rotate(120deg); }
            66% { transform: translateY(30px) rotate(240deg); }
          }
        `}</style>
      </div>
    </Suspense>
  )
}
