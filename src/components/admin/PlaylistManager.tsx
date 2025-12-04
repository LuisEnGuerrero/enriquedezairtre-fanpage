'use client'

import { useState, useEffect, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, Music } from 'lucide-react'
import { toast } from 'sonner'

interface Playlist {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
  _count?: {
    songs: number
  }
}

export function PlaylistManager() {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })

  useEffect(() => {
    fetchPlaylists()
  }, [])

  const fetchPlaylists = async () => {
    try {
      const response = await fetch('/api/playlists')
      if (response.ok) {
        const data = await response.json()
        setPlaylists(data)
      }
    } catch (error) {
      toast.error('Error al cargar playlists')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingPlaylist ? `/api/playlists/${editingPlaylist.id}` : '/api/playlists'
      const method = editingPlaylist ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success(editingPlaylist ? 'Playlist actualizada' : 'Playlist creada')
        setIsDialogOpen(false)
        setEditingPlaylist(null)
        resetForm()
        fetchPlaylists()
      } else {
        toast.error('Error al guardar playlist')
      }
    } catch (error) {
      toast.error('Error al guardar playlist')
    }
  }

  const handleEdit = (playlist: Playlist) => {
    setEditingPlaylist(playlist)
    setFormData({
      name: playlist.name,
      description: playlist.description || ''
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta playlist?')) {
      try {
        const response = await fetch(`/api/playlists/${id}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          toast.success('Playlist eliminada')
          fetchPlaylists()
        } else {
          toast.error('Error al eliminar playlist')
        }
      } catch (error) {
        toast.error('Error al eliminar playlist')
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: ''
    })
  }

  if (loading) {
    return <div className="text-center py-8">Cargando playlists...</div>
  }

  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <Card className="bg-black/50 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestión de Playlists</CardTitle>
              <CardDescription>Administra las listas de reproducción</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => {
                    resetForm()
                    setEditingPlaylist(null)
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white border border-purple-400"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Playlist
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-gray-700 text-white">
                <DialogHeader>
                  <DialogTitle>
                    {editingPlaylist ? 'Editar Playlist' : 'Nueva Playlist'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingPlaylist ? 'Modifica los datos de la playlist' : 'Crea una nueva playlist'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nombre</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-gray-800 border-gray-600"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="bg-gray-800 border-gray-600"
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button className="bg-purple-600 hover:bg-purple-700 text-white border border-purple-400" type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white border border-purple-400">
                      {editingPlaylist ? 'Actualizar' : 'Crear'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Canciones</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {playlists.map((playlist) => (
                <TableRow key={playlist.id}>
                  <TableCell className="font-medium">{playlist.name}</TableCell>
                  <TableCell>{playlist.description || 'Sin descripción'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Music className="w-4 h-4" />
                      {playlist._count?.songs || 0}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(playlist.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(playlist)}
                        className="bg-purple-600 hover:bg-purple-700 text-white border border-purple-400"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(playlist.id)}
                        className="bg-purple-600 hover:bg-purple-700 text-white border border-purple-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Suspense>
  )
}