'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
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
  Edit3,
  LogOut,
  TrendingUp,
  Gift
} from 'lucide-react'
import { toast } from 'sonner'

/* =========================
   Types
========================= */

type AppUser = {
  id: string
  email: string
  role: 'admin' | 'fan'
  name?: string
  image?: string
}

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
  }
  createdAt: string
}

interface UserPlaylist {
  id: string
  name: string
  description: string | null
  _count: { songs: number }
}

interface Reward {
  id: string
  title: string
  description: string | null
  icon: string | null
  unlockedAt: string
}

/* =========================
   Page
========================= */

export default function FanProfilePage() {
  const router = useRouter()

  const [user, setUser] = useState<AppUser | null>(null)
  const [profile, setProfile] = useState<FanProfile | null>(null)
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [playlists, setPlaylists] = useState<UserPlaylist[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loading, setLoading] = useState(true)

  /* Editor */
  const [editOpen, setEditOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editBio, setEditBio] = useState('')

  /* =========================
     Auth: /api/me
  ========================= */

  useEffect(() => {
    fetch('/api/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!data?.user) {
          router.replace('/admin/login')
        } else {
          setUser(data.user)
        }
      })
      .catch(() => router.replace('/admin/login'))
  }, [router])

  /* =========================
     Load profile data
  ========================= */

  useEffect(() => {
    if (!user) return

    const load = async () => {
      try {
        setLoading(true)

        const [p, f, pl, r] = await Promise.all([
          fetch('/api/user/profile'),
          fetch('/api/favorites'),
          fetch('/api/user-playlists'),
          fetch('/api/user/rewards')
        ])

        if (p.ok) {
          const data = await p.json()
          setProfile(data)
          setEditName(data.name ?? '')
          setEditPhone(data.phone ?? '')
          setEditBio(data.bio ?? '')
        }

        if (f.ok) setFavorites(await f.json())
        if (pl.ok) setPlaylists(await pl.json())
        if (r.ok) setRewards(await r.json())
      } catch (e) {
        console.error(e)
        toast.error('Error cargando perfil')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user])

  /* =========================
     Actions
  ========================= */

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' })
    toast.success('Sesión cerrada')
    router.replace('/')
  }

  const handleUpdateProfile = async () => {
    if (!profile) return

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

    setProfile(await res.json())
    toast.success('Perfil actualizado')
    setEditOpen(false)
  }

  /* =========================
     Helpers
  ========================= */

  const formatDuration = (s: number) =>
    `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`

  const tierIcon = (tier: string) =>
    tier === 'platinum' ? <Crown /> :
    tier === 'gold' ? <Star /> :
    tier === 'silver' ? <Award /> : <Users />

  /* =========================
     Render
  ========================= */

  if (loading || !profile) {
    return <div className="min-h-screen flex items-center justify-center text-white">Cargando perfil…</div>
  }

  return (
    <Suspense fallback={<div className="text-white">Cargando…</div>}>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4">
        <div className="container mx-auto max-w-6xl">

          {/* Header */}
          <div className="flex justify-between mb-6">
            <Button variant="outline" onClick={() => router.push('/')}>
              <Music className="w-4 h-4 mr-2" />
              Volver
            </Button>

            <Button variant="outline" onClick={handleLogout} className="border-red-500 text-red-300">
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar sesión
            </Button>
          </div>

          {/* Profile card */}
          <Card className="bg-black/60 text-white mb-8">
            <CardContent className="p-6 flex gap-6">
              <img
                src={profile.image || '/default-avatar.png'}
                className="w-24 h-24 rounded-full border-2 border-purple-500 object-cover"
              />

              <div className="flex-1">
                <h2 className="text-2xl font-bold">{profile.name || 'Fan Anónimo'}</h2>
                <p className="text-gray-300">{profile.email}</p>

                <div className="flex gap-2 mt-2 items-center">
                  <Badge className="flex gap-1">
                    {tierIcon(profile.tier)}
                    {profile.tier.toUpperCase()}
                  </Badge>
                  <span className="text-yellow-300">
                    ⭐ {profile.loyaltyPoints} pts
                  </span>
                </div>

                <p className="mt-3 text-gray-300">
                  {profile.bio || 'Sin biografía aún.'}
                </p>
              </div>

              {/* Edit dialog */}
              <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Edit3 className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                </DialogTrigger>

                <DialogContent className="bg-gray-900 text-white">
                  <DialogHeader>
                    <DialogTitle>Editar perfil</DialogTitle>
                  </DialogHeader>

                  <div className="space-y-3">
                    <Label>Nombre</Label>
                    <Input value={editName} onChange={e => setEditName(e.target.value)} />
                    <Label>Teléfono</Label>
                    <Input value={editPhone} onChange={e => setEditPhone(e.target.value)} />
                    <Label>Biografía</Label>
                    <Textarea value={editBio} onChange={e => setEditBio(e.target.value)} />

                    <Button onClick={handleUpdateProfile}>Guardar</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="favorites">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="favorites">Favoritos</TabsTrigger>
              <TabsTrigger value="playlists">Playlists</TabsTrigger>
              <TabsTrigger value="rewards">Recompensas</TabsTrigger>
            </TabsList>

            <TabsContent value="favorites">
              {favorites.length === 0 ? (
                <p className="text-gray-400 text-center">Sin favoritos aún</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Canción</TableHead>
                      <TableHead>Artista</TableHead>
                      <TableHead>Duración</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {favorites.map(f => (
                      <TableRow key={f.id}>
                        <TableCell>{f.song.title}</TableCell>
                        <TableCell>{f.song.artist}</TableCell>
                        <TableCell>{formatDuration(f.song.duration)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="playlists">
              <div className="grid md:grid-cols-2 gap-4">
                {playlists.map(pl => (
                  <Card key={pl.id} className="bg-gray-900">
                    <CardContent>
                      <p className="font-semibold">{pl.name}</p>
                      <p className="text-sm text-gray-400">{pl.description}</p>
                      <Badge>{pl._count.songs} canciones</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="rewards">
              <div className="grid md:grid-cols-3 gap-4">
                {rewards.map(r => (
                  <Card key={r.id} className="bg-gray-900 text-center">
                    <CardContent>
                      <div className="text-4xl">{r.icon || '🏆'}</div>
                      <p className="font-semibold">{r.title}</p>
                      <p className="text-sm text-gray-400">{r.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>

        </div>
      </div>
    </Suspense>
  )
}
