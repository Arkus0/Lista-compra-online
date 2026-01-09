'use client'

import { useState } from 'react'
import { Star, Plus, Trash2, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { UserFavoriteItem } from '@/lib/supabase/types'

interface FavoriteItemsProps {
  favorites: UserFavoriteItem[]
  isLoading: boolean
  onAddToList: (favorite: UserFavoriteItem) => Promise<void>
  onRemove: (itemId: string) => Promise<void>
}

export function FavoriteItems({
  favorites,
  isLoading,
  onAddToList,
  onRemove,
}: FavoriteItemsProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [addingId, setAddingId] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Cargando favoritos...</span>
      </div>
    )
  }

  if (favorites.length === 0) {
    return null
  }

  const handleAdd = async (favorite: UserFavoriteItem) => {
    setAddingId(favorite.id)
    await onAddToList(favorite)
    setAddingId(null)
  }

  const handleRemove = async (itemId: string) => {
    setRemovingId(itemId)
    await onRemove(itemId)
    setRemovingId(null)
  }

  return (
    <div className="border-t border-gray-100 dark:border-gray-800">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-2 hover:bg-secondary/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-medium">
            Favoritos ({favorites.length})
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted" />
        )}
      </button>

      {isExpanded && (
        <div className="px-3 pb-3">
          <div className="flex flex-wrap gap-2">
            {favorites.map((favorite) => (
              <div
                key={favorite.id}
                className="group flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 px-2 py-1 rounded-lg text-sm"
              >
                <button
                  onClick={() => handleAdd(favorite)}
                  disabled={addingId === favorite.id}
                  className="flex items-center gap-1 hover:underline disabled:opacity-50"
                  title="Añadir a la lista"
                >
                  {addingId === favorite.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Plus className="w-3 h-3" />
                  )}
                  <span>{favorite.name}</span>
                  {favorite.quantity > 1 && (
                    <span className="text-xs opacity-70">
                      x{favorite.quantity}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => handleRemove(favorite.id)}
                  disabled={removingId === favorite.id}
                  className="ml-1 p-0.5 opacity-0 group-hover:opacity-100 hover:bg-amber-200 dark:hover:bg-amber-800 rounded transition-all disabled:opacity-50"
                  title="Eliminar de favoritos"
                >
                  {removingId === favorite.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Trash2 className="w-3 h-3" />
                  )}
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted mt-2">
            Toca un favorito para añadirlo a la lista
          </p>
        </div>
      )}
    </div>
  )
}
