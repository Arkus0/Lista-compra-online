'use client'

import { useState, memo, useCallback, useRef, useEffect } from 'react'
import { Check, Trash2, GripVertical, Minus, Plus, User, Star, Image as ImageIcon, ExternalLink, UserPlus, X } from 'lucide-react'
import { ListItem, Profile } from '@/lib/supabase/types'
import { CATEGORIES, CategoryId } from '@/lib/constants'

// Extendemos el tipo ListItem para incluir image_url y assigned_to
type ListItemWithImage = ListItem & { image_url?: string | null }

// Tipo simple para personas asignables
export interface AssignablePerson {
  id: string
  name: string
  avatar_url: string | null
}

interface ShoppingItemProps {
  item: ListItemWithImage
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onUpdateQuantity: (id: string, quantity: number) => void
  onAddToFavorites?: (item: ListItem) => void
  onAssign?: (itemId: string, userId: string | null) => void
  assignablePeople?: AssignablePerson[]
  assignedToProfile?: Profile | null
  dragHandleProps?: any
  addedByProfile?: Profile | null
  checkedByProfile?: Profile | null
  isDragEnabled?: boolean
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
  onAssign,
  assignablePeople = [],
  assignedToProfile,
  dragHandleProps,
  addedByProfile,
  checkedByProfile,
  isDragEnabled = true
}: ShoppingItemProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [showAssignMenu, setShowAssignMenu] = useState(false)
  const assignMenuRef = useRef<HTMLDivElement>(null)

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (assignMenuRef.current && !assignMenuRef.current.contains(e.target as Node)) {
        setShowAssignMenu(false)
      }
    }
    if (showAssignMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showAssignMenu])

  const handleAssign = useCallback((userId: string | null) => {
    onAssign?.(item.id, userId)
    setShowAssignMenu(false)
  }, [item.id, onAssign])

  // Obtener iniciales para avatar
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

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

  // Obtener la etiqueta en español de la categoría
  const categoryLabel = item.category && CATEGORIES[item.category as CategoryId]
    ? CATEGORIES[item.category as CategoryId].label
    : item.category

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
                {categoryLabel}
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

        {/* Asignación de persona - Botón sutil */}
        {onAssign && assignablePeople.length > 0 && (
          <div className="relative" ref={assignMenuRef}>
            <button
              onClick={() => setShowAssignMenu(!showAssignMenu)}
              className={`
                flex items-center justify-center rounded-full transition-all
                ${assignedToProfile
                  ? 'w-7 h-7 bg-blue-100 dark:bg-blue-900/30 hover:ring-2 hover:ring-blue-300'
                  : 'w-7 h-7 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 opacity-50 hover:opacity-100'
                }
              `}
              title={assignedToProfile ? `Asignado a ${assignedToProfile.name}` : 'Asignar a alguien'}
            >
              {assignedToProfile ? (
                assignedToProfile.avatar_url ? (
                  <img src={assignedToProfile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                    {getInitials(assignedToProfile.name || 'U')}
                  </span>
                )
              ) : (
                <UserPlus className="w-3.5 h-3.5 text-gray-400" />
              )}
            </button>

            {/* Menú de asignación */}
            {showAssignMenu && (
              <div className="absolute top-full right-0 mt-1 w-48 bg-card border border-border rounded-xl shadow-xl z-30 py-1 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-xs font-medium text-muted">Asignar a...</p>
                </div>

                {/* Opción para quitar asignación */}
                {assignedToProfile && (
                  <button
                    onClick={() => handleAssign(null)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-hover flex items-center gap-2 text-red-500"
                  >
                    <X className="w-4 h-4" />
                    Quitar asignación
                  </button>
                )}

                {/* Lista de personas */}
                {assignablePeople.map(person => (
                  <button
                    key={person.id}
                    onClick={() => handleAssign(person.id)}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-hover flex items-center gap-2 ${
                      item.assigned_to === person.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    {person.avatar_url ? (
                      <img src={person.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-[9px] font-bold">{getInitials(person.name)}</span>
                      </div>
                    )}
                    <span className="truncate">{person.name}</span>
                    {item.assigned_to === person.id && (
                      <Check className="w-4 h-4 ml-auto text-blue-500" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

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

        {/* Action buttons - always visible on mobile, hover on desktop */}
        <div className="flex items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          {onAddToFavorites && (
            <button
              onClick={handleAddToFavorites}
              className="w-8 h-8 rounded-lg text-muted hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20
                        flex items-center justify-center transition-colors active:scale-95"
              title="Añadir a favoritos"
            >
              <Star className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleDelete}
            className="w-8 h-8 rounded-lg text-muted hover:text-danger hover:bg-danger/10
                      flex items-center justify-center transition-colors active:scale-95"
            title="Eliminar"
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
    prevProps.item.image_url === nextProps.item.image_url &&
    prevProps.item.unit === nextProps.item.unit &&
    prevProps.item.checked_by === nextProps.item.checked_by &&
    prevProps.item.assigned_to === nextProps.item.assigned_to &&
    prevProps.onToggle === nextProps.onToggle &&
    prevProps.onDelete === nextProps.onDelete &&
    prevProps.onUpdateQuantity === nextProps.onUpdateQuantity &&
    prevProps.onAddToFavorites === nextProps.onAddToFavorites &&
    prevProps.onAssign === nextProps.onAssign &&
    prevProps.addedByProfile?.id === nextProps.addedByProfile?.id &&
    prevProps.checkedByProfile?.id === nextProps.checkedByProfile?.id &&
    prevProps.assignedToProfile?.id === nextProps.assignedToProfile?.id &&
    prevProps.isDragEnabled === nextProps.isDragEnabled &&
    prevProps.assignablePeople?.length === nextProps.assignablePeople?.length
  )
})

ShoppingItem.displayName = 'ShoppingItem'
