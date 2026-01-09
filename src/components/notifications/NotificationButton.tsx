'use client'

import { Bell } from 'lucide-react'
import { useState } from 'react'
import { useNotifications } from '@/hooks/useNotifications'
import { NotificationPanel } from './NotificationPanel'

export function NotificationButton() {
  const [showNotifications, setShowNotifications] = useState(false)
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications()

  return (
    <div className="relative">
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="w-10 h-10 rounded-xl hover:bg-secondary flex items-center justify-center transition-colors relative"
      >
        <Bell className="w-5 h-5 text-muted" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      {showNotifications && (
        <NotificationPanel
          notifications={notifications}
          unreadCount={unreadCount}
          isLoading={isLoading}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onDelete={deleteNotification}
          onClearAll={clearAll}
          onClose={() => setShowNotifications(false)}
        />
      )}
    </div>
  )
}
