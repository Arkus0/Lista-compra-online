'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ProfileEditor } from '@/components/profile/ProfileEditor'
import { NotificationSettings } from '@/components/settings/NotificationSettings'
import {
  Mail,
  LogOut,
  Bell,
  Star,
  ChevronDown,
  ChevronUp,
  User,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/lib/supabase/types'

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({ lists: 0, items: 0, favorites: 0 })
  const [showNotifications, setShowNotifications] = useState(false)
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

      // Cargar estadísticas
      const { count: ownListsCount } = await supabase
        .from('shopping_lists')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', user.id)

      const { count: sharedListsCount } = await supabase
        .from('list_collaborators')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      const totalLists = (ownListsCount || 0) + (sharedListsCount || 0)

      // Contar items favoritos
      const { count: favoritesCount } = await supabase
        .from('user_favorite_items')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      // Contar items en listas propias
      const { data: ownLists } = await supabase
        .from('shopping_lists')
        .select('id')
        .eq('owner_id', user.id)

      let totalItems = 0
      if (ownLists && ownLists.length > 0) {
        const { count: itemsCount } = await supabase
          .from('list_items')
          .select('*', { count: 'exact', head: true })
          .in('list_id', ownLists.map(l => l.id))

        totalItems = itemsCount || 0
      }

      setStats({
        lists: totalLists,
        items: totalItems,
        favorites: favoritesCount || 0,
      })
      setIsLoading(false)
    }

    loadProfile()
  }, [supabase, router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  const handleProfileUpdate = (updatedProfile: Profile) => {
    setProfile(updatedProfile)
  }

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
        {/* Profile card con editor */}
        {profile && (
          <ProfileEditor profile={profile} onUpdate={handleProfileUpdate}>
            <Card variant="elevated" className="cursor-pointer hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-background shadow-lg shrink-0">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.name || 'Avatar'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                      <User className="w-10 h-10 text-primary" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="font-bold text-lg">{profile.name || 'Usuario'}</h2>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {profile.email}
                  </p>
                  <p className="text-xs text-muted mt-1">
                    Toca para editar tu perfil
                  </p>
                </div>
              </div>
            </Card>
          </ProfileEditor>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card variant="outlined" className="text-center">
            <p className="text-2xl font-bold text-primary">{stats.lists}</p>
            <p className="text-xs text-gray-500">Listas</p>
          </Card>
          <Card variant="outlined" className="text-center">
            <p className="text-2xl font-bold text-primary">{stats.items}</p>
            <p className="text-xs text-gray-500">Productos</p>
          </Card>
          <Card variant="outlined" className="text-center">
            <p className="text-2xl font-bold text-primary">{stats.favorites}</p>
            <p className="text-xs text-gray-500">Favoritos</p>
          </Card>
        </div>

        {/* Accesos rápidos */}
        <section>
          <h3 className="font-semibold text-lg mb-3">Accesos rápidos</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => router.push('/lists?tab=favorites')}
              className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center gap-3 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
            >
              <Star className="w-6 h-6 text-amber-500" />
              <div className="text-left">
                <p className="font-medium">Favoritos</p>
                <p className="text-xs text-muted">{stats.favorites} items</p>
              </div>
            </button>
            <button
              onClick={() => router.push('/lists/shared')}
              className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center gap-3 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <Mail className="w-6 h-6 text-blue-500" />
              <div className="text-left">
                <p className="font-medium">Compartidas</p>
                <p className="text-xs text-muted">Ver listas</p>
              </div>
            </button>
          </div>
        </section>

        {/* Notificaciones (desplegable) */}
        <section>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-full flex items-center justify-between p-4 bg-secondary rounded-xl hover:bg-secondary/80 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-muted" />
              <span className="font-medium">Notificaciones</span>
            </div>
            {showNotifications ? (
              <ChevronUp className="w-5 h-5 text-muted" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted" />
            )}
          </button>

          {showNotifications && profile && (
            <div className="mt-3 p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
              <NotificationSettings userId={profile.id} />
            </div>
          )}
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
          ShoppyJuan v0.2.0
        </p>
      </main>

      <BottomNav />
    </div>
  )
}
