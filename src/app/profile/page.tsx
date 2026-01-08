'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  User,
  Mail,
  LogOut,
  Settings,
  Bell,
  Shield,
  HelpCircle,
  ChevronRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/lib/supabase/types'

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(data)
      setIsLoading(false)
    }

    loadProfile()
  }, [supabase, router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  const menuItems = [
    { icon: Settings, label: 'Configuracion', href: '/settings' },
    { icon: Bell, label: 'Notificaciones', href: '/notifications' },
    { icon: Shield, label: 'Privacidad', href: '/privacy' },
    { icon: HelpCircle, label: 'Ayuda', href: '/help' },
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20">
      <Header title="Perfil" />

      <main className="p-4 space-y-6">
        {/* Profile card */}
        <Card variant="elevated">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.name || 'Avatar'}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-lg">{profile?.name || 'Usuario'}</h2>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Mail className="w-4 h-4" />
                {profile?.email}
              </p>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card variant="outlined" className="text-center">
            <p className="text-2xl font-bold text-primary">0</p>
            <p className="text-xs text-gray-500">Listas</p>
          </Card>
          <Card variant="outlined" className="text-center">
            <p className="text-2xl font-bold text-primary">0</p>
            <p className="text-xs text-gray-500">Productos</p>
          </Card>
          <Card variant="outlined" className="text-center">
            <p className="text-2xl font-bold text-primary">0</p>
            <p className="text-xs text-gray-500">Ahorrado</p>
          </Card>
        </div>

        {/* Menu */}
        <section>
          <h3 className="font-semibold text-lg mb-3">Ajustes</h3>
          <Card variant="outlined" padding="none">
            {menuItems.map((item, index) => {
              const Icon = item.icon
              return (
                <button
                  key={item.label}
                  className={`
                    w-full flex items-center gap-3 p-4 hover:bg-secondary transition-colors
                    ${index < menuItems.length - 1 ? 'border-b border-gray-100' : ''}
                  `}
                >
                  <Icon className="w-5 h-5 text-gray-500" />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              )
            })}
          </Card>
        </section>

        {/* Logout */}
        <Button
          variant="danger"
          className="w-full"
          onClick={handleLogout}
          leftIcon={<LogOut className="w-5 h-5" />}
        >
          Cerrar sesion
        </Button>

        {/* Version */}
        <p className="text-center text-xs text-gray-400">
          ShoppyJuan v0.1.0
        </p>
      </main>

      <BottomNav />
    </div>
  )
}
