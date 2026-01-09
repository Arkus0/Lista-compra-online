'use client'

import { useState, memo, useCallback } from 'react'
import { Check, Trash2, GripVertical, Minus, Plus, User, Star, Image as ImageIcon, ExternalLink } from 'lucide-react'
import { ListItem, Profile } from '@/lib/supabase/types'

// Extendemos el tipo ListItem para incluir image_url temporalmente
// hasta que actualices tus tipos de Supabase generados
type ListItemWithImage = ListItem & { image_url?: string | null }

interface ShoppingItemProps {
  item: ListItemWithImage
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onUpdateQuantity: (id: string, quantity: number) => void
  onAddToFavorites?: (item: ListItem) => void
  dragHandleProps?: any
  addedByProfile?: Profile | null
  checkedByProfile?: Profile | null
  isDragEnabled?: boolean // Nueva prop para ocultar el asa de arrastre
}

// Colores de categoría
const categoryColors: Record<string, string> = {
  frutas: 'bg-green-100 text-green-700',
  verduras: 'bg-emerald-100 text-emerald-700',
  carnes: 'bg-red-100 text-red-700',
  pescados: 'bg-blue-100 text-blue-700',
  lacteos: 'bg-yellow-100 text-yellow-700',
  panaderia: 'bg-amber-100 text-amber-700',
  bebidas: 'bg-cyan-100 text-cyan-700',
  limpieza: 'bg-purple-100 text-purple-700',
  otros: 'bg-gray-100 text-gray-700',
}

function ShoppingItemComponent({
  item,
  onToggle,
  onDelete,
  onUpdateQuantity,
  onAddToFavorites,
  dragHandleProps,
  addedByProfile,
  checkedByProfile,
  isDragEnabled = true
}: ShoppingItemProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)

  const handleDelete = useCallback(() => {
    setIsDeleting(true)
    setTimeout(() => onDelete(item.id), 200)
  }, [item.id, onDelete])

  const handleToggle = useCallback(() => {
    onToggle(item.id)
  }, [item.id, onToggle])

  const handleDecrement = useCallback(() => {
    if (item.quantity > 1) {
      onUpdateQuantity(item.id, item.quantity - 1)
    }
  }, [item.id, item.quantity, onUpdateQuantity])

  const handleIncrement = useCallback(() => {
    onUpdateQuantity(item.id, item.quantity + 1)
  }, [item.id, item.quantity, onUpdateQuantity])

  const handleAddToFavorites = useCallback(() => {
    onAddToFavorites?.(item)
  }, [item, onAddToFavorites])

  const categoryColor = item.category
    ? categoryColors[item.category.toLowerCase()] || categoryColors.otros
    : categoryColors.otros

  const profileToShow = item.checked ? checkedByProfile : addedByProfile
  const actionText = item.checked ? 'comprado por' : 'añadido por'

  return (
    <>
      <div
        className={`
          flex items-center gap-3 p-3 bg-background rounded-xl border border-gray-100
          transition-all duration-200 group relative overflow-hidden
          ${item.checked ? 'opacity-60' : ''}
          ${isDeleting ? 'scale-95 opacity-0' : ''}
        `}
      >
        {/* Drag handle - Solo si está habilitado */}
        {isDragEnabled && (
          <div {...dragHandleProps} className="text-muted-light cursor-grab active:cursor-grabbing touch-none flex-shrink-0">
            <GripVertical className="w-5 h-5" />
          </div>
        )}

        {/* Checkbox */}
        <button
          onClick={handleToggle}
          className={`
            w-6 h-6 rounded-lg border-2 flex items-center justify-center
            transition-all duration-200 shrink-0
            ${item.checked
              ? 'bg-primary border-primary'
              : 'border-muted-light hover:border-primary'
            }
          `}
        >
          {item.checked && <Check className="w-4 h-4 text-white" />}
        </button>

        {/* IMAGEN DEL PRODUCTO (Miniatura) */}
        {item.image_url && (
          <button 
            onClick={() => setShowImageModal(true)}
            className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-200 relative group/img"
          >
            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors" />
          </button>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`font-medium truncate ${item.checked ? 'line-through text-muted-light' : ''}`}>
            {item.name}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {item.category && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColor}`}>
                {item.category}
              </span>
            )}
            {profileToShow && (
              <span className="text-xs text-muted flex items-center gap-1">
                {profileToShow.avatar_url ? (
                  <img
                    src={profileToShow.avatar_url}
                    alt=""
                    className="w-4 h-4 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-3 h-3" />
                )}
                <span className="hidden sm:inline">{actionText}</span>
                <span className="font-medium">{profileToShow.name || 'Usuario'}</span>
              </span>
            )}
          </div>
        </div>

        {/* Quantity controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleDecrement}
            className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center
                      hover:bg-secondary/80 transition-colors disabled:opacity-50"
            disabled={item.quantity <= 1}
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-8 text-center font-medium">
            {item.quantity}
            {item.unit && <span className="text-xs text-muted-light ml-0.5">{item.unit}</span>}
          </span>
          <button
            onClick={handleIncrement}
            className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center
                      hover:bg-secondary/80 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {onAddToFavorites && (
            <button
              onClick={handleAddToFavorites}
              className="w-8 h-8 rounded-lg text-muted-light hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20
                        flex items-center justify-center transition-colors"
              title="Añadir a favoritos"
            >
              <Star className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleDelete}
            className="w-8 h-8 rounded-lg text-muted-light hover:text-danger hover:bg-danger/10
                      flex items-center justify-center transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modal de Imagen Ampliada (Simple) */}
      {showImageModal && item.image_url && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative max-w-lg w-full bg-transparent">
             <img src={item.image_url} alt={item.name} className="w-full h-auto rounded-xl shadow-2xl" />
             <p className="text-white text-center mt-4 font-medium">{item.name}</p>
          </div>
        </div>
      )}
    </>
  )
}

// Memoización con comparación profunda
export const ShoppingItem = memo(ShoppingItemComponent, (prevProps, nextProps) => {
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.name === nextProps.item.name &&
    prevProps.item.checked === nextProps.item.checked &&
    prevProps.item.quantity === nextProps.item.quantity &&
    prevProps.item.category === nextProps.item.category &&
    prevProps.item.image_url === nextProps.item.image_url && // Importante: comparar imagen
    prevProps.item.unit === nextProps.item.unit &&
    prevProps.item.checked_by === nextProps.item.checked_by &&
    prevProps.onToggle === nextProps.onToggle &&
    prevProps.onDelete === nextProps.onDelete &&
    prevProps.onUpdateQuantity === nextProps.onUpdateQuantity &&
    prevProps.onAddToFavorites === nextProps.onAddToFavorites &&
    prevProps.addedByProfile?.id === nextProps.addedByProfile?.id &&
    prevProps.checkedByProfile?.id === nextProps.checkedByProfile?.id &&
    prevProps.isDragEnabled === nextProps.isDragEnabled
  )
})

ShoppingItem.displayName = 'ShoppingItem'
