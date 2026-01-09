'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, BellRing, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { createClient } from '@/lib/supabase/client'
import { NotificationPreferences } from '@/lib/supabase/types'

interface NotificationSettingsProps {
  userId: string
}

export function NotificationSettings({ userId }: NotificationSettingsProps) {
  const {
    isSupported,
    isSubscribed,
    isLoading: isPushLoading,
    permission,
    subscribe,
    unsubscribe,
  } = usePushNotifications(userId)

  const [preferences, setPreferences] = useState<Partial<NotificationPreferences>>({
    items_added: true,
    items_removed: true,
    items_checked: true,
    notes_added: true,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingPrefs, setIsLoadingPrefs] = useState(true)

  // Cargar preferencias del usuario
  useEffect(() => {
    const loadPreferences = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (data) {
        setPreferences(data)
      }
      setIsLoadingPrefs(false)
    }

    loadPreferences()
  }, [userId])

  const handleToggleNotifications = async () => {
    if (isSubscribed) {
      await unsubscribe()
    } else {
      const success = await subscribe()
      if (success) {
        // Crear preferencias por defecto si no existen
        const supabase = createClient()
        await supabase.from('notification_preferences').upsert({
          user_id: userId,
          items_added: true,
          items_removed: true,
          items_checked: true,
          notes_added: true,
        }, { onConflict: 'user_id' })
      }
    }
  }

  const handlePreferenceChange = async (key: keyof NotificationPreferences, value: boolean) => {
    setPreferences((prev) => ({ ...prev, [key]: value }))
    setIsSaving(true)

    const supabase = createClient()
    await supabase
      .from('notification_preferences')
      .upsert({
        user_id: userId,
        ...preferences,
        [key]: value,
      }, { onConflict: 'user_id' })

    setIsSaving(false)
  }

  if (!isSupported) {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl text-yellow-800 dark:text-yellow-200 text-sm">
        <div className="flex items-center gap-2">
          <BellOff className="w-5 h-5" />
          <span>Las notificaciones push no están soportadas en este navegador.</span>
        </div>
      </div>
    )
  }

  if (permission === 'denied') {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-800 dark:text-red-200 text-sm">
        <div className="flex items-center gap-2">
          <BellOff className="w-5 h-5" />
          <span>Has bloqueado las notificaciones. Habilítalas desde la configuración del navegador.</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Toggle principal */}
      <div className="flex items-center justify-between p-4 bg-secondary rounded-xl">
        <div className="flex items-center gap-3">
          {isSubscribed ? (
            <BellRing className="w-6 h-6 text-primary" />
          ) : (
            <Bell className="w-6 h-6 text-muted" />
          )}
          <div>
            <p className="font-medium">Notificaciones push</p>
            <p className="text-sm text-muted">
              {isSubscribed
                ? 'Recibirás notificaciones de cambios en tus listas'
                : 'Activa las notificaciones para estar al día'}
            </p>
          </div>
        </div>
        <Button
          onClick={handleToggleNotifications}
          disabled={isPushLoading}
          variant={isSubscribed ? 'secondary' : 'primary'}
          size="sm"
        >
          {isPushLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isSubscribed ? (
            'Desactivar'
          ) : (
            'Activar'
          )}
        </Button>
      </div>

      {/* Preferencias detalladas */}
      {isSubscribed && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted">Notificarme cuando:</p>

          {isLoadingPrefs ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted" />
            </div>
          ) : (
            <div className="space-y-2">
              <PreferenceToggle
                label="Alguien añada productos"
                checked={preferences.items_added ?? true}
                onChange={(v) => handlePreferenceChange('items_added', v)}
                disabled={isSaving}
              />
              <PreferenceToggle
                label="Alguien elimine productos"
                checked={preferences.items_removed ?? true}
                onChange={(v) => handlePreferenceChange('items_removed', v)}
                disabled={isSaving}
              />
              <PreferenceToggle
                label="Alguien marque productos como comprados"
                checked={preferences.items_checked ?? true}
                onChange={(v) => handlePreferenceChange('items_checked', v)}
                disabled={isSaving}
              />
              <PreferenceToggle
                label="Alguien deje una nota"
                checked={preferences.notes_added ?? true}
                onChange={(v) => handlePreferenceChange('notes_added', v)}
                disabled={isSaving}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface PreferenceToggleProps {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}

function PreferenceToggle({ label, checked, onChange, disabled }: PreferenceToggleProps) {
  return (
    <button
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-colors ${
        checked
          ? 'border-primary/30 bg-primary/5'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className="text-sm">{label}</span>
      <div
        className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
          checked ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-600'
        }`}
      >
        {checked && <Check className="w-3 h-3" />}
      </div>
    </button>
  )
}
