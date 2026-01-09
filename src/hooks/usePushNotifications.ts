'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface UsePushNotificationsReturn {
  isSupported: boolean
  isSubscribed: boolean
  isLoading: boolean
  permission: NotificationPermission | 'default'
  subscribe: () => Promise<boolean>
  unsubscribe: () => Promise<boolean>
}

// Esta clave debe coincidir con la del servidor
// En producción, usar variable de entorno NEXT_PUBLIC_VAPID_PUBLIC_KEY
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function usePushNotifications(userId?: string): UsePushNotificationsReturn {
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [permission, setPermission] = useState<NotificationPermission>('default')

  // Verificar soporte y estado actual
  useEffect(() => {
    const checkSupport = async () => {
      // Verificar soporte de notificaciones y service workers
      const supported =
        'Notification' in window &&
        'serviceWorker' in navigator &&
        'PushManager' in window

      setIsSupported(supported)
      setPermission(Notification.permission)

      if (!supported || !userId) {
        setIsLoading(false)
        return
      }

      try {
        // Registrar service worker si no está registrado
        const registration = await navigator.serviceWorker.register('/sw.js')
        await navigator.serviceWorker.ready

        // Verificar si ya hay una suscripción
        const subscription = await registration.pushManager.getSubscription()
        setIsSubscribed(!!subscription)
      } catch (error) {
        console.error('Error checking push subscription:', error)
      }

      setIsLoading(false)
    }

    checkSupport()
  }, [userId])

  // Suscribirse a notificaciones
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !userId || !VAPID_PUBLIC_KEY) {
      console.warn('Push notifications not supported or VAPID key missing')
      return false
    }

    setIsLoading(true)

    try {
      // Solicitar permiso
      const permissionResult = await Notification.requestPermission()
      setPermission(permissionResult)

      if (permissionResult !== 'granted') {
        setIsLoading(false)
        return false
      }

      // Obtener service worker registration
      const registration = await navigator.serviceWorker.ready

      // Crear suscripción push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      })

      // Extraer datos de la suscripción
      const subscriptionJson = subscription.toJSON()
      const { endpoint, keys } = subscriptionJson

      if (!endpoint || !keys?.p256dh || !keys?.auth) {
        throw new Error('Invalid subscription data')
      }

      // Guardar en la base de datos
      const supabase = createClient()
      const { error } = await supabase.from('push_subscriptions').upsert(
        {
          user_id: userId,
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
        },
        {
          onConflict: 'user_id,endpoint',
        }
      )

      if (error) throw error

      setIsSubscribed(true)
      setIsLoading(false)
      return true
    } catch (error) {
      console.error('Error subscribing to push notifications:', error)
      setIsLoading(false)
      return false
    }
  }, [isSupported, userId])

  // Desuscribirse de notificaciones
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!userId) return false

    setIsLoading(true)

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        // Cancelar suscripción en el navegador
        await subscription.unsubscribe()

        // Eliminar de la base de datos
        const supabase = createClient()
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', userId)
          .eq('endpoint', subscription.endpoint)
      }

      setIsSubscribed(false)
      setIsLoading(false)
      return true
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error)
      setIsLoading(false)
      return false
    }
  }, [userId])

  return {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscribe,
    unsubscribe,
  }
}
