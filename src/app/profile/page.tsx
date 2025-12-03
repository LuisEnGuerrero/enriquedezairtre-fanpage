'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Music, 
  Heart, 
  Users, 
  Star, 
  Crown, 
  Award, 
  Plus, 
  LogOut, 
  User,
  Calendar,
  Gift,
  TrendingUp
} from 'lucide-react'
import { toast } from 'sonner'

interface FanProfile {
  id: string
  email: string
  name: string | null
  image: string | null
  totalPlays: number
  joinDate: string
  lastLogin: string | null
  favoriteCount: number
  playlistCount: number
  loyaltyPoints: number
  tier: string
}

interface Favorite {
  id: string
  song: {
    id: string
    title: string
    artist: string
    duration: number
    coverImage: string
  }
  createdAt: string
}

interface UserPlaylist {
  id: string
  name: string
  description: string | null
  isPublic: boolean
  createdAt: string
  _count: {
    songs: number
  }
}

interface Reward {
  id: string
  type: string
  title: string
  description: string | null
  icon: string | null
  unlockedAt: string
  expiresAt: string | null
}

export default function FanProfile() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<FanProfile | null>(null)
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [playlists, setPlaylists] = useState<UserPlaylist[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loading, setLoading] = useState(true)
  const [isPlaylistDialogOpen, setIsPlaylistDialogOpen] = useState(false)
  const [newPlaylist, setNewPlaylist] = useState({
    name: '',
    description: '',
    isPublic: false
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user?.id) {
      fetchProfileData()
    }
  }, [session])

  const fetchProfileData = async () => {
    try {
      const [profileRes, favoritesRes, playlistsRes, rewardsRes] = await Promise.all([
        fetch('/api/user/profile'),
        fetch('/api/favorites'),
        fetch('/api/user-playlists'),
        fetch('/api/user/rewards')
      ])

      if (profileRes.ok) {
        const profileData = await profileRes.json()
        setProfile(profileData)
      }

      if (favoritesRes.ok) {
        const favoritesData = await favoritesRes.json()
        setFavorites(favoritesData)
      }

      if (playlistsRes.ok) {
        const playlistsData = await playlistsRes.json()
        setPlaylists(playlistsData)
      }

      if (rewardsRes.ok) {
        const rewardsData = await rewardsRes.json()
        setRewards(rewardsData)
      }
    } catch (error) {
      toast.error('Error al cargar datos del perfil')
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePlaylist = async () => {
    if (!newPlaylist.name.trim()) {
      toast.error('El nombre es requerido')
      return
    }

    try {
      const response = await fetch('/api/user-playlists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPlaylist),
      })

      if (response.ok) {
        toast.success('Playlist creada correctamente')
        setIsPlaylistDialogOpen(false)
        setNewPlaylist({ name: '', description: '', isPublic: false })
        fetchProfileData()
      } else {
        toast.error('Error al crear playlist')
      }
    } catch (error) {
      toast.error('Error al crear playlist')
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum': return 'bg-purple-600'
      case 'gold': return 'bg-yellow-600'
      case 'silver': return 'bg-gray-400'
      case 'bronze': return 'bg-orange-600'
      default: return 'bg-gray-600'
    }
  }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'platinum': return <Crown className="w-4 h-4" />
      case 'gold': return <Star className="w-4 h-4" />
      case 'silver': return <Award className="w-4 h-4" />
      case 'bronze': return <Users className="w-4 h-4" />
      default: return <Users className="w-4 h-4" />
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white">Cargando perfil...</div>
      </div>
    )
  }

  if (!session || !profile) {
    return null
  }

  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => router.push('/')}
                className="border-gray-600 text-white hover:bg-gray-800"
              >
                <Music className="w-4 h-4 mr-2" />
                Volver
              </Button>
              <h1 className="text-3xl font-bold text-white">Mi Perfil</h1>
            </div>
            
            <Button 
              variant="outline" 
              onClick={() => signOut({ callbackUrl: '/' })}
              className="border-gray-600 text-white hover:bg-gray-800"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>

          {/* Profile Info */}
          <Card className="bg-black/50 border-gray-700 text-white mb-8">
            <CardContent className="p-6">
              <div className="flex items-center gap-6">
                <img 
                  src={profile.image || '/default-avatar.png'} 
                  alt={profile.name || 'Fan'}
                  className="w-20 h-20 rounded-full border-2 border-purple-500"
                />
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">{profile.name || 'Fan'}</h2>
                  <p className="text-gray-400 mb-4">{profile.email}</p>
                  <div className="flex items-center gap-4">
                    <Badge className={`${getTierColor(profile.tier)} text-white`}>
                      <div className="flex items-center gap-1">
                        {getTierIcon(profile.tier)}
                        {profile.tier.charAt(0).toUpperCase() + profile.tier.slice(1)}
                      </div>
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span>{profile.loyaltyPoints} puntos</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>Miembro desde {new Date(profile.joinDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-purple-900/20 border-purple-500/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-400" />
                  <div>
                    <p className="text-sm text-gray-400">Favoritos</p>
                    <p className="text-xl font-bold text-white">{profile.favoriteCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-blue-900/20 border-blue-500/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-sm text-gray-400">Playlists</p>
                    <p className="text-xl font-bold text-white">{profile.playlistCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-green-900/20 border-green-500/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-sm text-gray-400">Reproducciones</p>
                    <p className="text-xl font-bold text-white">{profile.totalPlays}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-yellow-900/20 border-yellow-500/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-yellow-400" />
                  <div>
                    <p className="text-sm text-gray-400">Recompensas</p>
                    <p className="text-xl font-bold text-white">{rewards.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="favorites" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-black/50 border-gray-700">
              <TabsTrigger value="favorites" className="data-[state=active]:bg-purple-600">
                <Heart className="w-4 h-4 mr-2" />
                Favoritos
              </TabsTrigger>
              <TabsTrigger value="playlists" className="data-[state=active]:bg-purple-600">
                <Users className="w-4 h-4 mr-2" />
                Mis Playlists
              </TabsTrigger>
              <TabsTrigger value="rewards" className="data-[state=active]:bg-purple-600">
                <Gift className="w-4 h-4 mr-2" />
                Recompensas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="favorites">
              <Card className="bg-black/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5" />
                    Mis Canciones Favoritas
                  </CardTitle>
                  <CardDescription>Canciones que has marcado como favoritas</CardDescription>
                </CardHeader>
                <CardContent>
                  {favorites.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No tienes canciones favoritas aún</p>
                      <p className="text-sm">Explora el catálogo y añade tus canciones preferidas</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Canción</TableHead>
                          <TableHead>Artista</TableHead>
                          <TableHead>Duración</TableHead>
                          <TableHead>Añadida</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {favorites.map((favorite) => (
                          <TableRow key={favorite.id}>
                            <TableCell className="font-medium">{favorite.song.title}</TableCell>
                            <TableCell>{favorite.song.artist}</TableCell>
                            <TableCell>{formatDuration(favorite.song.duration)}</TableCell>
                            <TableCell>
                              {new Date(favorite.createdAt).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="playlists">
              <Card className="bg-black/50 border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Mis Playlists
                      </CardTitle>
                      <CardDescription>Tus listas de reproducción personalizadas</CardDescription>
                    </div>
                    <Dialog open={isPlaylistDialogOpen} onOpenChange={setIsPlaylistDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-purple-600 hover:bg-purple-700">
                          <Plus className="w-4 h-4 mr-2" />
                          Nueva Playlist
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-gray-900 border-gray-700 text-white">
                        <DialogHeader>
                          <DialogTitle>Crear Nueva Playlist</DialogTitle>
                          <DialogDescription>
                            Crea tu propia lista de reproducción personalizada
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="name">Nombre</Label>
                            <Input
                              id="name"
                              value={newPlaylist.name}
                              onChange={(e) => setNewPlaylist({ ...newPlaylist, name: e.target.value })}
                              className="bg-gray-800 border-gray-600"
                              placeholder="Mi playlist favorita"
                            />
                          </div>
                          <div>
                            <Label htmlFor="description">Descripción</Label>
                            <Textarea
                              id="description"
                              value={newPlaylist.description}
                              onChange={(e) => setNewPlaylist({ ...newPlaylist, description: e.target.value })}
                              className="bg-gray-800 border-gray-600"
                              rows={3}
                              placeholder="Describe tu playlist..."
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="isPublic"
                              checked={newPlaylist.isPublic}
                              onChange={(e) => setNewPlaylist({ ...newPlaylist, isPublic: e.target.checked })}
                              className="rounded"
                            />
                            <Label htmlFor="isPublic">Hacer pública</Label>
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setIsPlaylistDialogOpen(false)}>
                              Cancelar
                            </Button>
                            <Button onClick={handleCreatePlaylist} className="bg-purple-600 hover:bg-purple-700">
                              Crear Playlist
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {playlists.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No tienes playlists aún</p>
                      <p className="text-sm">Crea tu primera playlist personalizada</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {playlists.map((playlist) => (
                        <Card key={playlist.id} className="bg-gray-800 border-gray-600">
                          <CardContent className="p-4">
                            <h3 className="font-semibold mb-2">{playlist.name}</h3>
                            <p className="text-sm text-gray-400 mb-3">
                              {playlist.description || 'Sin descripción'}
                            </p>
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="border-gray-500">
                                {playlist._count.songs} canciones
                              </Badge>
                              {playlist.isPublic && (
                                <Badge variant="outline" className="border-green-500 text-green-400">
                                  Pública
                                </Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rewards">
              <Card className="bg-black/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="w-5 h-5" />
                    Mis Recompensas
                  </CardTitle>
                  <CardDescription>Insignias y premios ganados</CardDescription>
                </CardHeader>
                <CardContent>
                  {rewards.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Gift className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No tienes recompensas aún</p>
                      <p className="text-sm">Sigue interactuando para ganar premios</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {rewards.map((reward) => (
                        <Card key={reward.id} className="bg-gray-800 border-gray-600">
                          <CardContent className="p-4 text-center">
                            <div className="text-4xl mb-3">{reward.icon || '🏆'}</div>
                            <h3 className="font-semibold mb-2">{reward.title}</h3>
                            <p className="text-sm text-gray-400 mb-3">{reward.description}</p>
                            <p className="text-xs text-gray-500">
                              Desbloqueado el {new Date(reward.unlockedAt).toLocaleDateString()}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Suspense>
  )
}