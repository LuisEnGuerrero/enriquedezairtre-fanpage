// src/app/auth/signin/ClientSignin.tsx
'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Music, Users, Heart, Star } from 'lucide-react'

import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { auth } from '@/lib/firebaseClient'

export default function ClientSignIn() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  const handleGoogleSignIn = async () => {
    setIsLoading(true)

    try {
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({
        prompt: 'select_account',
      })

      const result = await signInWithPopup(auth, provider)
      const user = result.user

      if (!user) {
        throw new Error('No user returned from Firebase')
      }

      const idToken = await user.getIdToken(true)

      // 🔐 Backend sync (fan / admin / SAC)
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      })

      if (!res.ok) {
        throw new Error('Backend login failed')
      }

      router.push(callbackUrl)
    } catch (error: any) {
      console.error('🔥 Firebase SignIn error:', error)

      if (error.code === 'auth/popup-closed-by-user') return
      alert('Error iniciando sesión. Intenta nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-900 to-black flex items-center justify-center p-4">
      <div className="relative z-10 w-full max-w-md">
        <Card className="bg-black/80 border-purple-500/20 text-white backdrop-blur-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center">
              <Music className="w-8 h-8" />
            </div>
            <CardTitle className="text-2xl font-bold">
              Bienvenido Fan
            </CardTitle>
            <CardDescription className="text-gray-300">
              Únete a la comunidad de Enrique de Zairtre
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3 text-center">
                <Heart className="w-6 h-6 mx-auto mb-2 text-red-400" />
                <span className="text-xs">Favoritos</span>
              </div>
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3 text-center">
                <Users className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                <span className="text-xs">Playlists</span>
              </div>
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3 text-center">
                <Star className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
                <span className="text-xs">Recompensas</span>
              </div>
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3 text-center">
                <Music className="w-6 h-6 mx-auto mb-2 text-purple-400" />
                <span className="text-xs">Exclusivo</span>
              </div>
            </div>

            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="bg-purple-600 hover:bg-purple-700 text-white border border-purple-400 w-full"
            >
              {isLoading ? 'Conectando…' : 'Iniciar con Google'}
            </Button>

            <p className="text-xs text-center text-gray-400">
              Al iniciar sesión aceptas nuestros términos y condiciones
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
