'use client'

import { Bell } from 'lucide-react'
import { useState, useRef } from 'react'
import { useNotifications } from '@/hooks/useNotifications'
import { NotificationPanel } from './NotificationPanel'

export function NotificationButton() {
  const [showNotifications, setShowNotifications] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications()

  const handleToggle = () => {
    setShowNotifications(prev => !prev)
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors relative ${
          showNotifications
            ? 'bg-primary/10 text-primary'
            : 'hover:bg-secondary text-muted'
        }`}
        aria-label={showNotifications ? "Cerrar notificaciones" : "Ver notificaciones"}
        aria-expanded={showNotifications}
      >
        <Bell className="w-5 h-5" />
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
          triggerRef={buttonRef}
        />
      )}
    </div>
  )
}
