'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Notification } from '@/lib/supabase/types'
import { RealtimeChannel } from '@supabase/supabase-js'

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    let channel: RealtimeChannel | null = null

    const fetchNotifications = async () => {
      setIsLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIsLoading(false)
        return
      }

      // Obtener últimas 50 notificaciones
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (!error && data) {
        setNotifications(data)
        setUnreadCount(data.filter(n => !n.is_read).length)
      }
      setIsLoading(false)
    }

    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Suscribirse a cambios en tiempo real
      channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newNotification = payload.new as Notification
            setNotifications(prev => [newNotification, ...prev.slice(0, 49)])
            setUnreadCount(prev => prev + 1)
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const updatedNotification = payload.new as Notification
            setNotifications(prev =>
              prev.map(n => (n.id === updatedNotification.id ? updatedNotification : n))
            )
            // Recalcular unread count
            setUnreadCount(prev => {
              const oldNotification = notifications.find(n => n.id === updatedNotification.id)
              if (oldNotification?.is_read === false && updatedNotification.is_read === true) {
                return Math.max(0, prev - 1)
              }
              if (oldNotification?.is_read === true && updatedNotification.is_read === false) {
                return prev + 1
              }
              return prev
            })
          }
        )
        .subscribe()
    }

    fetchNotifications()
    setupRealtime()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [])

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)

    if (!error) {
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, is_read: true } : n))
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
  }

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    const notification = notifications.find(n => n.id === notificationId)
    const wasUnread = notification && !notification.is_read

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)

    if (!error) {
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    }
  }

  const clearAll = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', user.id)

    if (!error) {
      setNotifications([])
      setUnreadCount(0)
    }
  }

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  }
}
