'use client'

import { useState, useEffect, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Users, Award, Star, Crown, Gift, Power, PowerOff, Calendar } from 'lucide-react'
import { toast } from 'sonner'

type AppUser = {
  id: string
  email: string
  role: 'admin' | 'fan'
  name?: string
  image?: string
}

interface Fan {
  id: string
  email: string
  name: string | null
  image: string | null
  isActive: boolean
  totalPlays: number
  joinDate: string
  lastLogin: string | null
  favoriteCount: number
  playlistCount: number
  loyaltyPoints: number
  tier: string
  _count: {
    favorites: number
    playlists: number
    activities: number
    rewards: number
  }
}

export function FanManager() {
  const [me, setMe] = useState<AppUser | null>(null)

  const [fans, setFans] = useState<Fan[]>([])
  const [loading, setLoading] = useState(true)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedFan, setSelectedFan] = useState<Fan | null>(null)

  const [actionData, setActionData] = useState({
    action: '',
    type: '',
    title: '',
    description: '',
  })

  // 1) Verificar sesión/rol admin (cookie session -> /api/me)
  useEffect(() => {
    const loadMe = async () => {
      try {
        const res = await fetch('/api/me')
        if (!res.ok) throw new Error('unauthorized')

        const data = await res.json()
        const user: AppUser | null = data?.user ?? null
        setMe(user)
      } catch {
        setMe(null)
      }
    }

    loadMe()
  }, [])

  // 2) Cargar fans solo si soy admin
  useEffect(() => {
    if (!me) return
    if (me.role !== 'admin') {
      setLoading(false)
      return
    }
    fetchFans()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me])

  const fetchFans = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/fans')
      if (response.ok) {
        const data = await response.json()
        setFans(data)
      } else if (response.status === 401 || response.status === 403) {
        toast.error('No autorizado para ver fans')
      } else {
        toast.error('Error al cargar fans')
      }
    } catch {
      toast.error('Error al cargar fans')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async () => {
    if (!selectedFan) return

    try {
      const response = await fetch('/api/admin/fans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedFan.id,
          ...actionData,
        }),
      })

      if (response.ok) {
        toast.success('Acción realizada correctamente')
        setIsDialogOpen(false)
        setSelectedFan(null)
        setActionData({ action: '', type: '', title: '', description: '' })
        fetchFans()
      } else if (response.status === 401 || response.status === 403) {
        toast.error('No autorizado para realizar esta acción')
      } else {
        toast.error('Error al realizar acción')
      }
    } catch {
      toast.error('Error al realizar acción')
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum':
        return 'bg-purple-600'
      case 'gold':
        return 'bg-yellow-600'
      case 'silver':
        return 'bg-gray-400'
      case 'bronze':
        return 'bg-orange-600'
      default:
        return 'bg-gray-600'
    }
  }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'platinum':
        return <Crown className="w-4 h-4" />
      case 'gold':
        return <Star className="w-4 h-4" />
      case 'silver':
        return <Award className="w-4 h-4" />
      case 'bronze':
        return <Users className="w-4 h-4" />
      default:
        return <Users className="w-4 h-4" />
    }
  }

  // Loader general
  if (loading) {
    return <div className="text-center py-8">Cargando fans...</div>
  }

  // Si no hay sesión / o no es admin
  if (!me) {
    return (
      <div className="text-center py-8 text-gray-300">
        Debes iniciar sesión para ver este módulo.
      </div>
    )
  }

  if (me.role !== 'admin') {
    return (
      <div className="text-center py-8 text-gray-300">
        No tienes permisos para acceder a la gestión de fans.
      </div>
    )
  }

  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <Card className="bg-black/50 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Gestión de Fans
              </CardTitle>
              <CardDescription>Sistema de Atención al Cliente (SAC) y Recompensas</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-green-500 text-green-400">
                {fans.length} Fans Activos
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-purple-900/20 border-purple-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-purple-400" />
                    <div>
                      <p className="text-sm text-gray-400">Platinum</p>
                      <p className="text-xl font-bold">{fans.filter((f) => f.tier === 'platinum').length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-yellow-900/20 border-yellow-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-400" />
                    <div>
                      <p className="text-sm text-gray-400">Gold</p>
                      <p className="text-xl font-bold">{fans.filter((f) => f.tier === 'gold').length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/20 border-gray-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-400">Silver</p>
                      <p className="text-xl font-bold">{fans.filter((f) => f.tier === 'silver').length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-orange-900/20 border-orange-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-orange-400" />
                    <div>
                      <p className="text-sm text-gray-400">Bronze</p>
                      <p className="text-xl font-bold">{fans.filter((f) => f.tier === 'bronze').length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Fans Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fan</TableHead>
                  <TableHead>Nivel</TableHead>
                  <TableHead>Puntos</TableHead>
                  <TableHead>Favoritos</TableHead>
                  <TableHead>Playlists</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {fans.map((fan) => (
                  <TableRow key={fan.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={fan.image || '/default-avatar.png'}
                          alt={fan.name || 'Fan'}
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <p className="font-medium">{fan.name || 'Sin nombre'}</p>
                          <p className="text-sm text-gray-400">{fan.email}</p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge className={`${getTierColor(fan.tier)} text-white`}>
                        <div className="flex items-center gap-1">
                          {getTierIcon(fan.tier)}
                          {fan.tier.charAt(0).toUpperCase() + fan.tier.slice(1)}
                        </div>
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400" />
                        {fan.loyaltyPoints}
                      </div>
                    </TableCell>

                    <TableCell>{fan._count.favorites}</TableCell>
                    <TableCell>{fan._count.playlists}</TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-400">
                        <Calendar className="w-4 h-4" />
                        {new Date(fan.joinDate).toLocaleDateString()}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant={fan.isActive ? 'default' : 'secondary'}>
                        {fan.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <Dialog
                        open={isDialogOpen && selectedFan?.id === fan.id}
                        onOpenChange={setIsDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedFan(fan)}
                            className="bg-purple-600 hover:bg-purple-700 text-white border border-purple-400"
                          >
                            <Gift className="w-4 h-4 mr-1" />
                            SAC
                          </Button>
                        </DialogTrigger>

                        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Users className="w-5 h-5" />
                              Atención al Fan
                            </DialogTitle>
                            <DialogDescription>
                              {selectedFan?.name || selectedFan?.email} - Nivel {selectedFan?.tier}
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="action">Acción</Label>
                              <Select
                                value={actionData.action}
                                onValueChange={(value) =>
                                  setActionData({ ...actionData, action: value })
                                }
                              >
                                <SelectTrigger className="bg-gray-800 border-gray-600">
                                  <SelectValue placeholder="Selecciona una acción" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="award_points">Otorgar Puntos</SelectItem>
                                  <SelectItem value="award_badge">Otorgar Insignia</SelectItem>
                                  <SelectItem value="upgrade_tier">Mejorar Nivel</SelectItem>
                                  <SelectItem value="activate">Activar Cuenta</SelectItem>
                                  <SelectItem value="deactivate">Desactivar Cuenta</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {actionData.action === 'award_points' && (
                              <div>
                                <Label htmlFor="type">Cantidad de Puntos</Label>
                                <Input
                                  id="type"
                                  type="number"
                                  value={actionData.type}
                                  onChange={(e) =>
                                    setActionData({ ...actionData, type: e.target.value })
                                  }
                                  className="bg-gray-800 border-gray-600"
                                  placeholder="100"
                                />
                              </div>
                            )}

                            {actionData.action === 'award_badge' && (
                              <div>
                                <Label htmlFor="type">Icono</Label>
                                <Input
                                  id="type"
                                  value={actionData.type}
                                  onChange={(e) =>
                                    setActionData({ ...actionData, type: e.target.value })
                                  }
                                  className="bg-gray-800 border-gray-600"
                                  placeholder="🏆"
                                />
                              </div>
                            )}

                            {actionData.action === 'upgrade_tier' && (
                              <div>
                                <Label htmlFor="type">Nuevo Nivel</Label>
                                <Select
                                  value={actionData.type}
                                  onValueChange={(value) =>
                                    setActionData({ ...actionData, type: value })
                                  }
                                >
                                  <SelectTrigger className="bg-gray-800 border-gray-600">
                                    <SelectValue placeholder="Selecciona nivel" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="silver">Silver</SelectItem>
                                    <SelectItem value="gold">Gold</SelectItem>
                                    <SelectItem value="platinum">Platinum</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            {(actionData.action === 'award_points' ||
                              actionData.action === 'award_badge' ||
                              actionData.action === 'upgrade_tier') && (
                              <>
                                <div>
                                  <Label htmlFor="title">Título</Label>
                                  <Input
                                    id="title"
                                    value={actionData.title}
                                    onChange={(e) =>
                                      setActionData({ ...actionData, title: e.target.value })
                                    }
                                    className="bg-gray-800 border-gray-600"
                                    placeholder="Título de la recompensa"
                                  />
                                </div>

                                <div>
                                  <Label htmlFor="description">Descripción</Label>
                                  <Textarea
                                    id="description"
                                    value={actionData.description}
                                    onChange={(e) =>
                                      setActionData({ ...actionData, description: e.target.value })
                                    }
                                    className="bg-gray-800 border-gray-600"
                                    rows={3}
                                    placeholder="Descripción detallada"
                                  />
                                </div>
                              </>
                            )}

                            <div className="flex justify-end space-x-2">
                              <Button
                                className="bg-purple-600 hover:bg-purple-700 text-white border border-purple-400"
                                variant="outline"
                                onClick={() => setIsDialogOpen(false)}
                              >
                                Cancelar
                              </Button>

                              <Button
                                onClick={handleAction}
                                className="bg-purple-600 hover:bg-purple-700 text-white border border-purple-400"
                                disabled={!actionData.action}
                              >
                                {actionData.action === 'activate' ? (
                                  <>
                                    <Power className="w-4 h-4 mr-2" /> Activar
                                  </>
                                ) : actionData.action === 'deactivate' ? (
                                  <>
                                    <PowerOff className="w-4 h-4 mr-2" /> Desactivar
                                  </>
                                ) : (
                                  <>
                                    <Gift className="w-4 h-4 mr-2" /> Otorgar
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </Suspense>
  )
}
