'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Music, Users, ListMusic, Settings, LogOut } from 'lucide-react'
import { toast } from 'sonner'

import { SongManager } from '@/components/admin/SongManager'
import { PlaylistManager } from '@/components/admin/PlaylistManager'
import { SettingsPanel } from '@/components/admin/SettingsPanel'
import { FanManager } from '@/components/admin/FanManager'

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

export default function AdminDashboard() {
  const router = useRouter()

  const [user, setUser] = useState<AppUser | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  const [stats, setStats] = useState({
    totalSongs: 0,
    totalPlaylists: 0,
    totalPlays: 0,
  })

  /* =========================
     🔒 Auth check (client)
     Usa session cookie + /api/me
  ========================= */

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/me')
        if (!res.ok) throw new Error('unauthorized')

        const data = await res.json()
        const me: AppUser | null = data?.user ?? null

        if (!me) {
          router.replace('/admin/login')
          return
        }

        if (me.role !== 'admin') {
          router.replace('/auth/error?error=AccessDenied')
          return
        }

        setUser(me)
      } catch {
        router.replace('/admin/login')
      } finally {
        setCheckingAuth(false)
      }
    }

    checkAuth()
  }, [router])

  /* =========================
     📊 Load admin stats
  ========================= */

  useEffect(() => {
    if (!user || user.role !== 'admin') return

    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/stats')
        if (res.ok) {
          setStats(await res.json())
        }
      } catch (e) {
        console.error('Error fetching stats:', e)
      }
    }

    fetchStats()
  }, [user])

  /* =========================
     🚪 Logout
  ========================= */

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' })
    toast.success('Sesión cerrada')
    router.replace('/')
  }

  /* =========================
     Loader while checking auth
  ========================= */

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-lg">Verificando sesión…</div>
      </div>
    )
  }

  /* =========================
     Safety: should not render
  ========================= */

  if (!user || user.role !== 'admin') {
    return null
  }

  /* =========================
     ✅ Admin panel
  ========================= */

  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <div className="min-h-screen bg-gray-900 text-white">

        {/* Header */}
        <header className="bg-black/50 backdrop-blur-lg border-b border-gray-700">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                <Music className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Panel Administrativo</h1>
                <p className="text-sm text-gray-400">Enrique de Zairtre</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <img
                  src={user.image || '/default-avatar.png'}
                  alt={user.name || user.email}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm">{user.name || user.email}</span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="bg-purple-600 hover:bg-purple-700 text-white border border-purple-400"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="container mx-auto px-4 py-8">

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

            <Card className="bg-black/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total Canciones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalSongs}</div>
              </CardContent>
            </Card>

            <Card className="bg-black/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Playlists</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalPlaylists}</div>
              </CardContent>
            </Card>

            <Card className="bg-black/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Reproducciones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalPlays}</div>
              </CardContent>
            </Card>

          </div>

          {/* Tabs */}
          <Tabs defaultValue="songs" className="space-y-6">

            <TabsList className="grid grid-cols-4 bg-black/50 border-gray-700">
              <TabsTrigger value="songs" className="data-[state=active]:bg-purple-600">
                <Music className="w-4 h-4 mr-2" /> Canciones
              </TabsTrigger>
              <TabsTrigger value="playlists" className="data-[state=active]:bg-purple-600">
                <ListMusic className="w-4 h-4 mr-2" /> Playlists
              </TabsTrigger>
              <TabsTrigger value="fans" className="data-[state=active]:bg-purple-600">
                <Users className="w-4 h-4 mr-2" /> Fans SAC
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-purple-600">
                <Settings className="w-4 h-4 mr-2" /> Configuración
              </TabsTrigger>
            </TabsList>

            <TabsContent value="songs"><SongManager /></TabsContent>
            <TabsContent value="playlists"><PlaylistManager /></TabsContent>
            <TabsContent value="fans"><FanManager /></TabsContent>
            <TabsContent value="settings"><SettingsPanel /></TabsContent>

          </Tabs>
        </main>
      </div>
    </Suspense>
  )
}
