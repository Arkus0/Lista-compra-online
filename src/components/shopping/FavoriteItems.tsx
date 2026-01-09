'use client'

import { useState } from 'react'
import { Star, Plus, Trash2, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { UserFavoriteItem } from '@/lib/supabase/types'

interface FavoriteItemsProps {
  favorites: UserFavoriteItem[]
  isLoading: boolean
  onAddToList: (favorite: UserFavoriteItem) => Promise<void>
  onRemove: (itemId: string) => Promise<boolean | void>
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
    return null // Oculto mientras carga para no saltar
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
    <div className="bg-background border-t border-border/50">
      {/* Barra de cabecera / Asa del cajón */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-2 bg-secondary/30 hover:bg-secondary/60 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Favoritos ({favorites.length})
          </span>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-muted" />
        ) : (
          <ChevronUp className="w-4 h-4 text-muted" />
        )}
      </button>

      {/* Contenido desplegable (Drawer) */}
      {isExpanded && (
        <div className="animate-in slide-in-from-bottom-2 duration-200">
          <div className="px-3 py-3 max-h-48 overflow-y-auto scrollbar-thin">
            <div className="flex flex-wrap gap-2">
              {favorites.map((favorite) => (
                <div
                  key={favorite.id}
                  className="group flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 px-2 py-1.5 rounded-lg text-sm border border-amber-100 dark:border-amber-800/30"
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
                    <span className="font-medium">{favorite.name}</span>
                    {favorite.quantity > 1 && (
                      <span className="text-xs opacity-70 ml-0.5">
                        x{favorite.quantity}
                      </span>
                    )}
                  </button>
                  <div className="w-px h-3 bg-amber-200 dark:bg-amber-700 mx-1" />
                  <button
                    onClick={() => handleRemove(favorite.id)}
                    disabled={removingId === favorite.id}
                    className="p-0.5 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-all disabled:opacity-50"
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
            <p className="text-[10px] text-center text-muted-light mt-3 uppercase tracking-wider">
              Toca para añadir rápido
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
