'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, List, Share2, Volume2, Heart, Music, User, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import AudioVisualizer from '@/components/AudioVisualizer'

interface Song {
  id: number
  title: string
  artist: string
  duration: number
  coverImage: string
  audioUrl: string
  lyrics: string
}

const mockSongs: Song[] = [
  {
    id: 1,
    title: "Noches de Sangre",
    artist: "Enrique de Zairtre",
    duration: 245,
    coverImage: "https://z-cdn-media.chatglm.cn/files/fe136bc7-0296-45b7-a567-82eb3e4072e4_Zairtre%20y%20Raltek.jpg?auth_key=1864304639-e6d63655667443888ad144ddaa27b31f-0-4b598a42d06e8256240c67561440c29f",
    audioUrl: "/audio/song1.mp3",
    lyrics: "En la oscuridad de la noche\nDonde las sombras danzan\nMi voz resuena con fuerza\nComo un trueno en la distancia..."
  },
  {
    id: 2,
    title: "Dragón Dorado",
    artist: "Enrique de Zairtre",
    duration: 198,
    coverImage: "https://z-cdn-media.chatglm.cn/files/fe136bc7-0296-45b7-a567-82eb3e4072e4_Zairtre%20y%20Raltek.jpg?auth_key=1864304639-e6d63655667443888ad144ddaa27b31f-0-4b598a42d06e8256240c67561440c29f",
    audioUrl: "/audio/song2.mp3",
    lyrics: "Alas de oro flamean\nEn el cielo oscuro\nFuego y magia ancestral\nLibertad en mi furor..."
  },
  {
    id: 3,
    title: "Reino de las Sombras",
    artist: "Enrique de Zairtre",
    duration: 312,
    coverImage: "https://z-cdn-media.chatglm.cn/files/fe136bc7-0296-45b7-a567-82eb3e4072e4_Zairtre%20y%20Raltek.jpg?auth_key=1864304639-e6d63655667443888ad144ddaa27b31f-0-4b598a42d06e8256240c67561440c29f",
    audioUrl: "/audio/song3.mp3",
    lyrics: "En el reino donde la luz muere\nDonde el miedo nace y crece\nMi poder se hace infinito\nComo la eterna noche..."
  }
]

export default function Home() {
  const { data: session } = useSession()
  const [songs, setSongs] = useState<Song[]>(mockSongs)
  const [favorites, setFavorites] = useState<string[]>([])
  const [currentSong, setCurrentSong] = useState<Song>(mockSongs[0])
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(75)
  const [isShuffleOn, setIsShuffleOn] = useState(false)
  const [repeatMode, setRepeatMode] = useState<'off' | 'one' | 'all'>('off')
  const [showPlaylist, setShowPlaylist] = useState(false)
  const [showLyrics, setShowLyrics] = useState(false)
  const [colorPhase, setColorPhase] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  useEffect(() => {
    const interval = setInterval(() => {
      setColorPhase(prev => (prev + 1) % 360)
    }, 50)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100
    }
  }, [volume])

  useEffect(() => {
    // Load songs and favorites from API
    const loadData = async () => {
      try {
        const songsResponse = await fetch('/api/songs')
        if (songsResponse.ok) {
          const songsData = await songsResponse.json()
          setSongs(songsData)
          if (songsData.length > 0) {
            setCurrentSong(songsData[0])
          }
        }

        if (session?.user?.id) {
          const favoritesResponse = await fetch('/api/favorites')
          if (favoritesResponse.ok) {
            const favoritesData = await favoritesResponse.json()
            setFavorites(favoritesData.map((fav: any) => fav.songId))
          }
        }
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }

    loadData()
  }, [session])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleNext = () => {
    const currentIndex = mockSongs.findIndex(song => song.id === currentSong.id)
    let nextIndex
    if (isShuffleOn) {
      nextIndex = Math.floor(Math.random() * mockSongs.length)
    } else {
      nextIndex = (currentIndex + 1) % mockSongs.length
    }
    setCurrentSong(mockSongs[nextIndex])
    setCurrentTime(0)
  }

  const handlePrevious = () => {
    const currentIndex = mockSongs.findIndex(song => song.id === currentSong.id)
    const prevIndex = currentIndex === 0 ? mockSongs.length - 1 : currentIndex - 1
    setCurrentSong(mockSongs[prevIndex])
    setCurrentTime(0)
  }

  const handleFavorite = async () => {
    if (!session?.user?.id) {
      toast.error('Debes iniciar sesión para añadir favoritos')
      return
    }

    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ songId: currentSong.id.toString() }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.favorited) {
          setFavorites([...favorites, currentSong.id.toString()])
          toast.success('Añadido a favoritos')
        } else {
          setFavorites(favorites.filter(id => id !== currentSong.id.toString()))
          toast.info('Eliminado de favoritos')
        }
      }
    } catch (error) {
      toast.error('Error al gestionar favorito')
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${currentSong.title} - ${currentSong.artist}`,
          text: `Escucha "${currentSong.title}" de ${currentSong.artist}`,
          url: window.location.href
        })
      } catch (err) {
        console.log('Error sharing:', err)
      }
    }
  }

  const getDynamicColor = () => {
    const hue = (colorPhase + 240) % 360
    return `hsl(${hue}, 70%, 15%)`
  }

  const getAccentColor = () => {
    const hue = (colorPhase + 280) % 360
    return `hsl(${hue}, 80%, 50%)`
  }

  return (
    <Suspense fallback={<div>Cargando...</div>}>
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
              <div className="w-48 h-48 rounded-full overflow-hidden border-4 shadow-2xl"
                  style={{ borderColor: getAccentColor() }}>
                <img 
                  src="https://z-cdn-media.chatglm.cn/files/fe136bc7-0296-45b7-a567-82eb3e4072e4_Zairtre%20y%20Raltek.jpg?auth_key=1864304639-e6d63655667443888ad144ddaa27b31f-0-4b598a42d06e8256240c67561440c29f"
                  alt="Enrique de Zairtre"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-red-600 text-white rounded-full p-2">
                <Music className="w-6 h-6" />
              </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 tracking-wider"
                style={{ textShadow: '0 0 20px rgba(255,255,255,0.3)' }}>
              Enrique de Zairtre
            </h1>
            
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {['Poeta', 'Artista', 'Productor', 'Estrella de Rock'].map((role, index) => (
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
              ))}
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
                    src={currentSong.coverImage}
                    alt={currentSong.title}
                    className="w-full h-full object-cover"
                  />
                  <canvas 
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full opacity-50"
                  />
                  <AudioVisualizer 
                    audioRef={audioRef}
                    canvasRef={canvasRef}
                    isPlaying={isPlaying}
                  />
                </div>
                
                {/* Song Info */}
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-2">{currentSong.title}</h2>
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
                    max={currentSong.duration}
                    step={1}
                    className="w-full"
                    onValueChange={(value) => setCurrentTime(value[0])}
                  />
                </div>

                {/* Control Buttons */}
                <div className="flex justify-center items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsShuffleOn(!isShuffleOn)}
                    className={isShuffleOn ? 'text-purple-400' : 'text-gray-400'}
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
                    className="w-16 h-16 rounded-full"
                    style={{ backgroundColor: getAccentColor() }}
                  >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
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
                    onClick={() => setRepeatMode(repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off')}
                    className={repeatMode !== 'off' ? 'text-purple-400' : 'text-gray-400'}
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
                    onValueChange={(value) => setVolume(value[0])}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleFavorite}
                    className={`flex-1 border-gray-600 text-white hover:bg-gray-800 ${
                      favorites.includes(currentSong.id.toString()) ? 'bg-red-900/30 border-red-600' : ''
                    }`}
                  >
                    <Heart className={`w-4 h-4 mr-2 ${favorites.includes(currentSong.id.toString()) ? 'fill-current' : ''}`} />
                    {favorites.includes(currentSong.id.toString()) ? 'Favorito' : 'Favorito'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => setShowPlaylist(!showPlaylist)}
                    className="flex-1 border-gray-600 text-white hover:bg-gray-800"
                  >
                    <List className="w-4 h-4 mr-2" />
                    Playlist
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => setShowLyrics(!showLyrics)}
                    className="flex-1 border-gray-600 text-white hover:bg-gray-800"
                  >
                    <Music className="w-4 h-4 mr-2" />
                    Letras
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleShare}
                    className="border-gray-600 text-white hover:bg-gray-800"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Playlist */}
            {showPlaylist && (
              <div className="border-t border-gray-700 p-4 max-h-64 overflow-y-auto">
                <h3 className="text-lg font-semibold mb-3">Playlist</h3>
                <div className="space-y-2">
                  {songs.map((song) => (
                    <div
                      key={song.id}
                      onClick={() => setCurrentSong(song)}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        currentSong.id === song.id ? 'bg-purple-900/30' : 'hover:bg-gray-800'
                      }`}
                    >
                      <img src={song.coverImage} alt={song.title} className="w-12 h-12 rounded" />
                      <div className="flex-1">
                        <p className="font-medium">{song.title}</p>
                        <p className="text-sm text-gray-400">{song.artist}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {favorites.includes(song.id.toString()) && (
                          <Heart className="w-4 h-4 text-red-400 fill-current" />
                        )}
                        <span className="text-sm text-gray-400">{formatTime(song.duration)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lyrics */}
            {showLyrics && (
              <div className="border-t border-gray-700 p-4">
                <h3 className="text-lg font-semibold mb-3">Letras</h3>
                <div className="text-center space-y-2 text-gray-300 font-medium">
                  {currentSong.lyrics.split('\n').map((line, index) => (
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
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            onEnded={() => {
              if (repeatMode === 'one') {
                audioRef.current?.play()
              } else if (repeatMode === 'all' || isShuffleOn) {
                handleNext()
              }
            }}
          />
        </div>

        <style jsx>{`
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