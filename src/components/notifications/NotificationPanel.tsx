'use client'

import { useEffect, useRef } from 'react'
import { Notification } from '@/lib/supabase/types'
import { X, CheckCheck, Trash2, ShoppingCart, UserPlus, StickyNote } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'

interface NotificationPanelProps {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
  onDelete: (id: string) => void
  onClearAll: () => void
  onClose: () => void
}

export function NotificationPanel({
  notifications,
  unreadCount,
  isLoading,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClearAll,
  onClose,
}: NotificationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'item_added':
      case 'item_removed':
      case 'item_checked':
        return <ShoppingCart className="w-4 h-4" />
      case 'collaborator_joined':
        return <UserPlus className="w-4 h-4" />
      case 'note_added':
        return <StickyNote className="w-4 h-4" />
    }
  }

  const getNotificationMessage = (notification: Notification) => {
    switch (notification.type) {
      case 'item_added':
        return (
          <>
            <span className="font-medium">{notification.actor_name}</span> añadió{' '}
            <span className="font-medium">{notification.item_name}</span>
          </>
        )
      case 'item_removed':
        return (
          <>
            <span className="font-medium">{notification.actor_name}</span> eliminó{' '}
            <span className="font-medium">{notification.item_name}</span>
          </>
        )
      case 'item_checked':
        return (
          <>
            <span className="font-medium">{notification.actor_name}</span> marcó{' '}
            <span className="font-medium">{notification.item_name}</span> como comprado
          </>
        )
      case 'note_added':
        return (
          <>
            <span className="font-medium">{notification.actor_name}</span> dejó una nota
          </>
        )
      case 'collaborator_joined':
        return (
          <>
            <span className="font-medium">{notification.actor_name}</span> se unió a la lista
          </>
        )
    }
  }

  return (
    <div
      ref={panelRef}
      className="fixed inset-x-4 top-[65px] sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-96 bg-background border border-border-light rounded-xl shadow-xl overflow-hidden z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-light bg-secondary/30">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">Notificaciones</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs bg-primary text-white rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
              title="Marcar todas como leídas"
            >
              <CheckCheck className="w-4 h-4 text-muted" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-muted" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-[60vh] sm:max-h-[calc(100vh-12rem)] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-3">
              <ShoppingCart className="w-8 h-8 text-muted" />
            </div>
            <p className="text-sm text-muted">No tienes notificaciones</p>
          </div>
        ) : (
          <>
            {notifications.map((notification) => (
              <Link
                key={notification.id}
                href={`/lists/${notification.list_id}`}
                onClick={() => {
                  if (!notification.is_read) {
                    onMarkAsRead(notification.id)
                  }
                  onClose()
                }}
                className={`group block px-4 py-3 border-b border-border-light hover:bg-secondary/50 transition-colors ${
                  !notification.is_read ? 'bg-primary/5' : ''
                }`}
              >
                <div className="flex gap-3">
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      notification.type === 'collaborator_joined'
                        ? 'bg-green-100 text-green-600'
                        : notification.type === 'note_added'
                        ? 'bg-yellow-100 text-yellow-600'
                        : 'bg-blue-100 text-blue-600'
                    }`}
                  >
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground mb-0.5">
                      {getNotificationMessage(notification)}
                    </p>
                    <p className="text-xs text-muted truncate">
                      {notification.list_name}
                    </p>
                    <p className="text-xs text-muted-light mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </p>
                  </div>
                  <div className="flex-shrink-0 flex flex-col gap-1">
                    {!notification.is_read && (
                      <div className="w-2 h-2 bg-primary rounded-full" />
                    )}
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        onDelete(notification.id)
                      }}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors opacity-0 group-hover:opacity-100"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-2 border-t border-border-light bg-secondary/30">
          <button
            onClick={onClearAll}
            className="text-xs text-red-500 hover:text-red-600 transition-colors"
          >
            Eliminar todas
          </button>
        </div>
      )}
    </div>
  )
}
