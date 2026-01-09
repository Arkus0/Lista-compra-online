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
  Settings,
  Archive,
  History,
  TrendingDown,
  CheckCircle2,
  Users
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/lib/supabase/types'

// Definimos los posibles accesos rápidos
const AVAILABLE_SHORTCUTS = [
  { id: 'shared', label: 'Listas Compartidas', icon: Users, href: '/lists/shared', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  { id: 'favorites', label: 'Favoritos', icon: Star, href: '/favorites', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  { id: 'compare', label: 'Comparador', icon: TrendingDown, href: '/compare', color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
  { id: 'notifications', label: 'Historial Avisos', icon: History, href: '/notifications', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  { id: 'archived', label: 'Papelera / Archivo', icon: Archive, href: '/lists/archived', color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-800' },
]

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({ lists: 0, items: 0, favorites: 0 })
  const [showNotifications, setShowNotifications] = useState(false)
  
  // Estado para gestión de accesos rápidos
  const [isEditingShortcuts, setIsEditingShortcuts] = useState(false)
  // Por defecto quitamos favoritos si ya está en el nav, dejamos otros útiles
  const [activeShortcuts, setActiveShortcuts] = useState(['shared', 'compare', 'archived'])

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

      const { count: favoritesCount } = await supabase
        .from('user_favorite_items')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      // Contar items en listas propias (aprox)
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
      
      // Aquí podrías cargar la preferencia del usuario desde localStorage o DB
      const savedShortcuts = localStorage.getItem('profileShortcuts')
      if (savedShortcuts) {
        setActiveShortcuts(JSON.parse(savedShortcuts))
      }

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

  const toggleShortcut = (id: string) => {
    const newShortcuts = activeShortcuts.includes(id)
      ? activeShortcuts.filter(s => s !== id)
      : [...activeShortcuts, id]
    
    setActiveShortcuts(newShortcuts)
    localStorage.setItem('profileShortcuts', JSON.stringify(newShortcuts))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24">
      <Header title="Perfil" />

      <main className="p-4 space-y-6">
        {/* Profile card con editor */}
        {profile && (
          <ProfileEditor profile={profile} onUpdate={handleProfileUpdate}>
            <Card variant="elevated" className="cursor-pointer hover:shadow-lg transition-shadow relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <Settings className="w-24 h-24" />
              </div>
              <div className="flex items-center gap-4 relative z-10">
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
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-lg truncate">{profile.name || 'Usuario'}</h2>
                  <p className="text-sm text-gray-500 flex items-center gap-1 truncate">
                    <Mail className="w-3 h-3" />
                    {profile.email}
                  </p>
                  <div className="mt-2 inline-flex items-center text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                    Editar perfil
                  </div>
                </div>
              </div>
            </Card>
          </ProfileEditor>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <Card variant="outlined" className="text-center py-3 px-1">
            <p className="text-xl font-bold text-foreground">{stats.lists}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-light">Listas</p>
          </Card>
          <Card variant="outlined" className="text-center py-3 px-1">
            <p className="text-xl font-bold text-foreground">{stats.items}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-light">Productos</p>
          </Card>
          <Card variant="outlined" className="text-center py-3 px-1">
            <p className="text-xl font-bold text-foreground">{stats.favorites}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-light">Favoritos</p>
          </Card>
        </div>

        {/* Accesos rápidos Configurable */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-lg">Accesos rápidos</h3>
            <button 
              onClick={() => setIsEditingShortcuts(!isEditingShortcuts)}
              className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              {isEditingShortcuts ? 'Hecho' : 'Editar'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {isEditingShortcuts ? (
              // MODO EDICIÓN: Mostrar todos con checkbox
              AVAILABLE_SHORTCUTS.map((shortcut) => {
                const isActive = activeShortcuts.includes(shortcut.id)
                return (
                  <button
                    key={shortcut.id}
                    onClick={() => toggleShortcut(shortcut.id)}
                    className={`p-3 rounded-xl border-2 transition-all flex items-center gap-3 text-left ${
                      isActive 
                        ? 'border-primary bg-primary/5' 
                        : 'border-dashed border-border hover:border-border-hover opacity-60'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${shortcut.bg}`}>
                      <shortcut.icon className={`w-4 h-4 ${shortcut.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{shortcut.label}</p>
                    </div>
                    {isActive && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                  </button>
                )
              })
            ) : (
              // MODO VISUALIZACIÓN: Mostrar solo activos
              <>
                {activeShortcuts.map((id) => {
                  const shortcut = AVAILABLE_SHORTCUTS.find(s => s.id === id)
                  if (!shortcut) return null
                  return (
                    <button
                      key={shortcut.id}
                      onClick={() => router.push(shortcut.href)}
                      className={`p-4 rounded-xl flex items-center gap-3 transition-colors ${shortcut.bg} hover:brightness-95`}
                    >
                      <shortcut.icon className={`w-6 h-6 ${shortcut.color}`} />
                      <div className="text-left min-w-0">
                        <p className="font-medium text-sm truncate">{shortcut.label}</p>
                        <p className="text-xs text-muted/80 truncate">Ir a sección</p>
                      </div>
                    </button>
                  )
                })}
                {/* Botón placeholder si no hay nada activo */}
                {activeShortcuts.length === 0 && (
                  <div className="col-span-2 py-6 text-center text-sm text-muted border-2 border-dashed border-border rounded-xl">
                    No tienes accesos rápidos activos
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* Notificaciones (desplegable) */}
        <section>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-full flex items-center justify-between p-4 bg-secondary/50 rounded-xl hover:bg-secondary/80 transition-colors border border-transparent hover:border-border"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center shadow-sm">
                <Bell className="w-4 h-4 text-muted" />
              </div>
              <span className="font-medium">Configurar Notificaciones</span>
            </div>
            {showNotifications ? (
              <ChevronUp className="w-5 h-5 text-muted" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted" />
            )}
          </button>

          {showNotifications && profile && (
            <div className="mt-2 p-1 animate-in fade-in slide-in-from-top-2">
              <NotificationSettings userId={profile.id} />
            </div>
          )}
        </section>

        {/* Logout */}
        <Button
          variant="danger"
          className="w-full mt-8"
          onClick={handleLogout}
          leftIcon={<LogOut className="w-5 h-5" />}
        >
          Cerrar sesión
        </Button>

        {/* Version */}
        <p className="text-center text-xs text-gray-300 dark:text-gray-700 font-mono mt-4">
          ShoppyJuan v0.2.1
        </p>
      </main>

      <BottomNav />
    </div>
  )
}
