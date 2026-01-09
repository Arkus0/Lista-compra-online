'use client'

import { PresenceState } from '@/lib/supabase/types'

interface PresenceIndicatorProps {
  users: PresenceState[]
  maxVisible?: number
}

export function PresenceIndicator({ users, maxVisible = 3 }: PresenceIndicatorProps) {
  if (users.length === 0) return null

  const visibleUsers = users.slice(0, maxVisible)
  const extraCount = users.length - maxVisible

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {visibleUsers.map((user) => (
          <div
            key={user.id}
            className="relative group"
            title={user.name || user.email}
          >
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name || 'Usuario'}
                className="w-8 h-8 rounded-full border-2 border-background object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full border-2 border-background bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                {(user.name || user.email)?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            {/* Indicador de online */}
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />

            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
              {user.name || user.email}
            </div>
          </div>
        ))}

        {extraCount > 0 && (
          <div className="w-8 h-8 rounded-full border-2 border-background bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300">
            +{extraCount}
          </div>
        )}
      </div>

      <span className="text-xs text-muted hidden sm:inline">
        {users.length === 1
          ? `${visibleUsers[0].name || 'Alguien'} está viendo`
          : `${users.length} personas viendo`}
      </span>
    </div>
  )
}
