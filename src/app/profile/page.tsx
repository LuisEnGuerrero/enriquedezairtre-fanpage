'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
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
  Calendar,
  Gift,
  TrendingUp,
  User as UserIcon,
  Edit3
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
  phone?: string | null
  bio?: string | null
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

export default function FanProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [profile, setProfile] = useState<FanProfile | null>(null)
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [playlists, setPlaylists] = useState<UserPlaylist[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loading, setLoading] = useState(true)

  // Estados del editor
  const [editOpen, setEditOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editBio, setEditBio] = useState('')

  /* -----------------------------------------------------
      REDIRECCIONAR SI NO HAY SESIÓN
  ----------------------------------------------------- */
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  /* -----------------------------------------------------
      CARGAR DATOS DEL PERFIL
  ----------------------------------------------------- */
  useEffect(() => {
    if (status === 'authenticated') {
      fetchProfileData()
    }
  }, [status])

  const fetchProfileData = async () => {
    try {
      setLoading(true)

      const [profileRes, favoritesRes, playlistsRes, rewardsRes] =
        await Promise.all([
          fetch('/api/user/profile'),
          fetch('/api/favorites'),
          fetch('/api/user-playlists'),
          fetch('/api/user/rewards')
        ])

      if (profileRes.ok) {
        const data = await profileRes.json()
        setProfile(data)

        setEditName(data.name ?? '')
        setEditPhone(data.phone ?? '')
        setEditBio(data.bio ?? '')
      }

      if (favoritesRes.ok) {
        setFavorites(await favoritesRes.json())
      }

      if (playlistsRes.ok) {
        setPlaylists(await playlistsRes.json())
      }

      if (rewardsRes.ok) {
        setRewards(await rewardsRes.json())
      }
    } catch (e) {
      console.error('Error cargando perfil:', e)
      toast.error('Error al cargar perfil')
    } finally {
      setLoading(false)
    }
  }

  /* -----------------------------------------------------
      ACTUALIZAR PERFIL (PUT)
  ----------------------------------------------------- */
  const handleUpdateProfile = async () => {
    if (!profile) return

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          phone: editPhone.trim(),
          bio: editBio.trim()
        })
      })

      if (!res.ok) {
        toast.error('No se pudo actualizar el perfil')
        return
      }

      toast.success('Perfil actualizado')

      const updated = await res.json()
      setProfile(updated)

      setEditOpen(false)
    } catch (e) {
      console.error(e)
      toast.error('Error actualizando perfil')
    }
  }

  /* -----------------------------------------------------
      TIERS VISUALES
  ----------------------------------------------------- */
  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum': return 'bg-purple-600'
      case 'gold': return 'bg-yellow-500'
      case 'silver': return 'bg-gray-400'
      case 'bronze': return 'bg-orange-500'
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

  /* -----------------------------------------------------
      LOADING UI
  ----------------------------------------------------- */
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Cargando perfil...
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        No se pudo cargar el perfil.
      </div>
    )
  }

  /* -----------------------------------------------------
      UI PRINCIPAL
  ----------------------------------------------------- */
  return (
    <Suspense fallback={<div className="text-white">Cargando...</div>}>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4">
        <div className="container mx-auto max-w-6xl">

          {/* ------- HEADER ------- */}
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="outline"
              onClick={() => router.push('/')}
              className="border-purple-500 text-white hover:bg-purple-700"
            >
              <Music className="w-4 h-4 mr-2" />
              Volver
            </Button>

            <Button
              variant="outline"
              onClick={() => signOut({ callbackUrl: '/' })}
              className="border-red-500 text-red-300 hover:bg-red-600 hover:text-white"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>

          {/* ------- PERFIL ------- */}
          <Card className="bg-black/60 border-purple-700 text-white mb-8">
            <CardContent className="p-6 flex flex-col md:flex-row gap-6">

              <div className="relative">
                <img
                  src={profile.image || '/default-avatar.png'}
                  className="w-24 h-24 rounded-full border-2 border-purple-500 object-cover"
                />
                <span className="absolute -bottom-1 -right-1 px-2 py-0.5 text-xs bg-green-600 rounded-full">
                  Fan SAC
                </span>
              </div>

              <div className="flex-1">
                <h2 className="text-2xl font-bold">{profile.name || 'Fan Anónimo'}</h2>
                <p className="text-sm text-gray-300">{profile.email}</p>

                <div className="flex gap-2 mt-3">
                  <Badge className={`${getTierColor(profile.tier)} text-white flex items-center gap-1`}>
                    {getTierIcon(profile.tier)}
                    {profile.tier.toUpperCase()} SAC
                  </Badge>

                  <span className="text-yellow-300 flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    {profile.loyaltyPoints} pts
                  </span>
                </div>

                <p className="text-sm text-gray-300 mt-3">
                  {profile.bio?.trim() || 'Sin biografía aún.'}
                </p>

                {profile.phone && (
                  <p className="text-sm text-gray-300 mt-1">Tel: {profile.phone}</p>
                )}
              </div>

              {/* Botón editar */}
              <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2">
                    <Edit3 className="w-4 h-4" />
                    Editar Perfil
                  </Button>
                </DialogTrigger>

                <DialogContent className="bg-gray-900 border-purple-700 text-white max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Editar Perfil</DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4 mt-3">
                    <div>
                      <Label>Nombre</Label>
                      <Input className="bg-gray-800"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label>Teléfono</Label>
                      <Input className="bg-gray-800"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label>Biografía</Label>
                      <Textarea
                        className="bg-gray-800"
                        rows={4}
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value)}
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setEditOpen(false)}
                        className="border-gray-600"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleUpdateProfile}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        Guardar cambios
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* ------- STATS ------- */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-purple-900/30 border-purple-500/60 text-white">
              <CardContent className="p-4">
                <Heart className="w-5 h-5 text-red-400" />
                <p className="text-sm">Favoritos</p>
                <p className="text-xl font-bold">{profile.favoriteCount}</p>
              </CardContent>
            </Card>

            <Card className="bg-blue-900/30 border-blue-500/60 text-white">
              <CardContent className="p-4">
                <Users className="w-5 h-5 text-blue-300" />
                <p className="text-sm">Playlists</p>
                <p className="text-xl font-bold">{profile.playlistCount}</p>
              </CardContent>
            </Card>

            <Card className="bg-green-900/30 border-green-500/60 text-white">
              <CardContent className="p-4">
                <TrendingUp className="w-5 h-5 text-green-300" />
                <p className="text-sm">Reproducciones</p>
                <p className="text-xl font-bold">{profile.totalPlays}</p>
              </CardContent>
            </Card>

            <Card className="bg-yellow-900/30 border-yellow-500/60 text-white">
              <CardContent className="p-4">
                <Gift className="w-5 h-5 text-yellow-300" />
                <p className="text-sm">Recompensas</p>
                <p className="text-xl font-bold">{rewards.length}</p>
              </CardContent>
            </Card>
          </div>

          {/* ------- TABS ------- */}
          <Tabs defaultValue="favorites">
            <TabsList className="grid grid-cols-3 bg-black/40 border border-gray-700">
              <TabsTrigger value="favorites">Favoritos</TabsTrigger>
              <TabsTrigger value="playlists">Playlists</TabsTrigger>
              <TabsTrigger value="rewards">Recompensas</TabsTrigger>
            </TabsList>

            {/* FAVORITOS */}
            <TabsContent value="favorites">
              <Card className="bg-black/60 border-gray-700 text-white">
                <CardHeader>
                  <CardTitle>Mis Canciones Favoritas</CardTitle>
                </CardHeader>

                <CardContent>
                  {favorites.length === 0 ? (
                    <p className="text-center py-4 text-gray-400">
                      Todavía no tienes canciones favoritas.
                    </p>
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
                        {favorites.map((fav) => (
                          <TableRow key={fav.id}>
                            <TableCell>{fav.song.title}</TableCell>
                            <TableCell>{fav.song.artist}</TableCell>
                            <TableCell>{formatDuration(fav.song.duration)}</TableCell>
                            <TableCell>
                              {new Date(fav.createdAt).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* PLAYLISTS */}
            <TabsContent value="playlists">
              <Card className="bg-black/60 border-gray-700 text-white">
                <CardHeader>
                  <CardTitle>Mis Playlists</CardTitle>
                </CardHeader>

                <CardContent>
                  {playlists.length === 0 ? (
                    <p className="text-center py-4 text-gray-400">
                      Todavía no tienes playlists.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {playlists.map((pl) => (
                        <Card key={pl.id} className="bg-gray-900 border-gray-700">
                          <CardContent>
                            <p className="font-semibold">{pl.name}</p>
                            <p className="text-sm text-gray-400">
                              {pl.description ?? 'Sin descripción'}
                            </p>
                            <Badge>{pl._count.songs} canciones</Badge>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* RECOMPENSAS */}
            <TabsContent value="rewards">
              <Card className="bg-black/60 border-gray-700 text-white">
                <CardHeader>
                  <CardTitle>Mis Recompensas</CardTitle>
                </CardHeader>

                <CardContent>
                  {rewards.length === 0 ? (
                    <p className="text-center py-4 text-gray-400">
                      Aún no has desbloqueado recompensas.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {rewards.map((rw) => (
                        <Card key={rw.id} className="bg-gray-900 border-gray-700 text-center">
                          <CardContent>
                            <div className="text-4xl">{rw.icon || '🏆'}</div>
                            <p className="font-semibold">{rw.title}</p>
                            <p className="text-sm text-gray-400">{rw.description}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(rw.unlockedAt).toLocaleDateString()}
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
