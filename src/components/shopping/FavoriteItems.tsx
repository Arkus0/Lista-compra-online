'use client'

import { useState } from 'react'
import { Star, Plus, Trash2, ChevronDown, ChevronUp, Loader2, Sparkles } from 'lucide-react'
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
    return (
      <div className="bg-background border-t border-border/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 skeleton rounded" />
          <div className="w-24 h-4 skeleton rounded" />
        </div>
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
    <div className="bg-background border-t border-border/50">
      {/* Barra de cabecera / Asa del cajón - Mejorada */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-900/10 dark:to-orange-900/10 hover:from-amber-50 hover:to-orange-50 dark:hover:from-amber-900/20 dark:hover:to-orange-900/20 transition-all group"
        aria-expanded={isExpanded}
        aria-controls="favorites-panel"
      >
        <div className="flex items-center gap-2">
          <div className="relative">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            <Sparkles className="w-3 h-3 text-amber-400 absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
            Mis Favoritos
          </span>
          <span className="px-2 py-0.5 bg-amber-200/50 dark:bg-amber-800/30 text-amber-700 dark:text-amber-300 text-xs font-medium rounded-full">
            {favorites.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted hidden sm:block">
            {isExpanded ? 'Ocultar' : 'Mostrar'}
          </span>
          {/* Chevron corregido: abajo cuando está cerrado (indica que se puede abrir), arriba cuando está abierto */}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-amber-600 dark:text-amber-400 transition-transform" />
          ) : (
            <ChevronDown className="w-5 h-5 text-amber-600 dark:text-amber-400 transition-transform" />
          )}
        </div>
      </button>

      {/* Contenido desplegable (Drawer) */}
      {isExpanded && (
        <div
          id="favorites-panel"
          className="animate-in slide-in-from-bottom-2 duration-200"
          role="region"
          aria-label="Lista de productos favoritos"
        >
          <div className="px-4 py-4 max-h-56 overflow-y-auto">
            <div className="flex flex-wrap gap-2">
              {favorites.map((favorite) => (
                <div
                  key={favorite.id}
                  className="group flex items-center gap-1.5 bg-white dark:bg-gray-800 text-foreground px-3 py-2 rounded-xl text-sm border border-border shadow-sm hover:shadow-md transition-shadow"
                >
                  <button
                    onClick={() => handleAdd(favorite)}
                    disabled={addingId === favorite.id}
                    className="flex items-center gap-1.5 hover:text-primary disabled:opacity-50 transition-colors"
                    aria-label={`Añadir ${favorite.name} a la lista`}
                  >
                    {addingId === favorite.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    ) : (
                      <Plus className="w-4 h-4 text-primary" />
                    )}
                    <span className="font-medium">{favorite.name}</span>
                    {favorite.quantity > 1 && (
                      <span className="text-xs bg-secondary px-1.5 py-0.5 rounded-full text-muted">
                        x{favorite.quantity}
                      </span>
                    )}
                  </button>
                  <div className="w-px h-4 bg-border mx-1" />
                  <button
                    onClick={() => handleRemove(favorite.id)}
                    disabled={removingId === favorite.id}
                    className="p-1 hover:text-danger hover:bg-danger/10 rounded-lg transition-all disabled:opacity-50"
                    aria-label={`Eliminar ${favorite.name} de favoritos`}
                  >
                    {removingId === favorite.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-center text-muted mt-4 flex items-center justify-center gap-1">
              <Plus className="w-3 h-3" />
              Toca un favorito para añadirlo rápidamente
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
