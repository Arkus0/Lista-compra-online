'use client'

import { useState, memo, useCallback } from 'react'
import {
  Check, Trash2, GripVertical, Minus, Plus, User, Star,
  UserPlus, X, MoreVertical, StickyNote, Camera, Tag
} from 'lucide-react'
import { ListItem, Profile } from '@/lib/supabase/types'
import { getProductEmoji, CategoryId } from '@/lib/constants'
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/DropdownMenu'

// Tipo simple para personas asignables
export interface AssignablePerson {
  id: string
  name: string
  avatar_url: string | null
}

interface ShoppingItemProps {
  item: ListItem
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onUpdateQuantity: (id: string, quantity: number) => void
  onAddToFavorites?: (item: ListItem) => void
  onAssign?: (itemId: string, userId: string | null) => void
  onAddImage?: (itemId: string) => void
  onAddNote?: (itemId: string) => void
  onAddTags?: (itemId: string) => void
  assignablePeople?: AssignablePerson[]
  assignedToProfile?: Profile | null
  dragHandleProps?: any
  addedByProfile?: Profile | null
  checkedByProfile?: Profile | null
  isDragEnabled?: boolean
  domId?: string          // ID para el scroll automático
}

// Colores de categoría
const categoryColors: Record<string, string> = {
  frutas: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  verduras: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  carnes: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  pescados: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  lacteos: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  panaderia: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  bebidas: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  limpieza: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  otros: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
}

function ShoppingItemComponent({
  item,
  onToggle,
  onDelete,
  onUpdateQuantity,
  onAddToFavorites,
  onAssign,
  onAddImage,
  onAddNote,
  onAddTags,
  assignablePeople = [],
  assignedToProfile,
  dragHandleProps,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  addedByProfile,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  checkedByProfile,
  isDragEnabled = true,
  domId
}: ShoppingItemProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)

  const handleAssign = useCallback((userId: string | null) => {
    onAssign?.(item.id, userId)
  }, [item.id, onAssign])

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const handleDelete = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50)
    }
    setIsDeleting(true)
    setTimeout(() => onDelete(item.id), 200)
  }, [item.id, onDelete])

  const handleToggle = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([30, 50, 30]) 
    }
    onToggle(item.id)
  }, [item.id, onToggle])

  const handleDecrement = useCallback(() => {
    if (item.quantity > 1) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10)
      onUpdateQuantity(item.id, item.quantity - 1)
    }
  }, [item.id, item.quantity, onUpdateQuantity])

  const handleIncrement = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10)
    onUpdateQuantity(item.id, item.quantity + 1)
  }, [item.id, item.quantity, onUpdateQuantity])

  const handleAddToFavorites = useCallback(async () => {
    if (onAddToFavorites) {
      await onAddToFavorites(item)
    }
  }, [item, onAddToFavorites])

  const categoryColor = item.category
    ? categoryColors[item.category.toLowerCase()] || categoryColors.otros
    : null

  // Build menu items
  const menuItems: DropdownMenuItem[] = []

  // Submenu de asignación
  if (onAssign && assignablePeople.length > 0) {
    const assignItems: DropdownMenuItem[] = []

    if (assignedToProfile) {
      assignItems.push({
        type: 'item',
        label: 'Quitar',
        icon: <X className="w-4 h-4" />,
        onClick: () => handleAssign(null),
        variant: 'danger'
      })
    }

    assignablePeople.forEach(person => {
      assignItems.push({
        type: 'item',
        label: person.name,
        icon: item.assigned_to === person.id ? <Check className="w-4 h-4 text-primary" /> : undefined,
        onClick: () => handleAssign(person.id),
        className: item.assigned_to === person.id ? 'bg-primary/10' : ''
      })
    })

    menuItems.push({
      type: 'submenu',
      label: 'Asignar a...',
      icon: <UserPlus className="w-4 h-4 text-muted" />,
      items: assignItems
    })
  }

  // Favoritos
  if (onAddToFavorites) {
    menuItems.push({
      type: 'item',
      label: 'Favoritos',
      icon: <Star className="w-4 h-4 text-amber-500" />,
      onClick: handleAddToFavorites
    })
  }

  // Imagen
  if (onAddImage) {
    menuItems.push({
      type: 'item',
      label: item.image_url ? 'Cambiar img' : 'Añadir img',
      icon: <Camera className="w-4 h-4 text-muted" />,
      onClick: () => onAddImage(item.id)
    })
  }

  // Nota
  if (onAddNote) {
    menuItems.push({
      type: 'item',
      label: item.note ? 'Editar nota' : 'Añadir nota',
      icon: <StickyNote className="w-4 h-4 text-muted" />,
      onClick: () => onAddNote(item.id)
    })
  }

  // Etiquetas
  if (onAddTags) {
    menuItems.push({
      type: 'item',
      label: item.tags && item.tags.length > 0 ? 'Editar etiquetas' : 'Añadir etiquetas',
      icon: <Tag className="w-4 h-4 text-primary" />,
      onClick: () => onAddTags(item.id)
    })
  }

  // Separator
  menuItems.push({ type: 'separator' })

  // Eliminar
  menuItems.push({
    type: 'item',
    label: 'Eliminar',
    icon: <Trash2 className="w-4 h-4" />,
    onClick: handleDelete,
    variant: 'danger'
  })

  return (
    <>
      <div
        id={domId} // ID CRÍTICO PARA EL SCROLL
        className={`
          flex items-center gap-2 sm:gap-3 p-3 bg-card rounded-xl border
          transition-all duration-300 group relative scroll-mt-32
          hover:shadow-md
          ${item.checked 
            ? 'opacity-60 bg-secondary/30 border-transparent scale-[0.98]' 
            : 'bg-card border-border-light hover:border-primary/30 scale-100'
          }
          ${isDeleting ? 'scale-90 opacity-0' : ''}
        `}
        role="listitem"
      >
        {isDragEnabled && (
          <div
            {...dragHandleProps}
            className="drag-hint text-muted-light cursor-grab active:cursor-grabbing touch-none flex-shrink-0 p-0.5 rounded hover:bg-secondary transition-colors hidden sm:block"
          >
            <GripVertical className="w-4 h-4" />
          </div>
        )}

        {/* Checkbox */}
        <button
          onClick={handleToggle}
          aria-label={item.checked ? `Marcar ${item.name} como pendiente` : `Marcar ${item.name} como comprado`}
          aria-pressed={item.checked}
          className={`
            w-6 h-6 rounded-lg border-2 flex items-center justify-center
            transition-all duration-300 shrink-0
            focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
            ${item.checked
              ? 'bg-primary border-primary rotate-0 scale-100'
              : 'border-muted-light hover:border-primary active:scale-90 rotate-0'
            }
          `}
        >
          <Check className={`w-3.5 h-3.5 text-white transition-all duration-300 ${item.checked ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`} />
        </button>

        {/* Miniatura */}
        {item.image_url && (
          <button
            onClick={() => setShowImageModal(true)}
            className="w-10 h-10 rounded-lg bg-secondary flex-shrink-0 overflow-hidden border border-border-light shadow-sm"
          >
            <img src={item.image_url} alt="" className="w-full h-full object-cover" />
          </button>
        )}

        {/* Contenido */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`text-base font-medium truncate transition-all ${item.checked ? 'line-through text-muted' : 'text-foreground'}`}>
              <span className="mr-1.5">{getProductEmoji(item.name, item.category as CategoryId)}</span>
              {item.name}
            </p>
            
            {assignedToProfile && (
              <span
                className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center ring-1 ring-blue-200 dark:ring-blue-700"
              >
                {assignedToProfile.avatar_url ? (
                  <img src={assignedToProfile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-[8px] font-bold text-blue-600 dark:text-blue-400">
                    {getInitials(assignedToProfile.name || 'U')}
                  </span>
                )}
              </span>
            )}
          </div>

          {/* NOTA Y ETIQUETAS (si existen) */}
          {(item.note || (item.tags && item.tags.length > 0)) && (
            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
              {item.note && (
                <p className="text-xs text-muted-foreground leading-tight break-words pr-1">
                  {item.note}
                </p>
              )}
              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {item.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-medium rounded-full"
                    >
                      <Tag className="w-2.5 h-2.5" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cantidad */}
        <div className="flex items-center gap-0.5 bg-secondary rounded-lg p-0.5">
          <button
            onClick={handleDecrement}
            disabled={item.quantity <= 1}
            className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-hover disabled:opacity-30"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="w-6 text-center text-sm font-semibold tabular-nums">{item.quantity}</span>
          <button
            onClick={handleIncrement}
            className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-hover"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Menú */}
        <DropdownMenu
          trigger={<MoreVertical className="w-5 h-5" />}
          items={menuItems}
          align="right"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-foreground hover:bg-secondary"
        />
      </div>

      {showImageModal && item.image_url && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowImageModal(false)}>
          <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10" onClick={() => setShowImageModal(false)}><X className="w-6 h-6 text-white" /></button>
          <img src={item.image_url} alt={item.name} className="max-w-full max-h-[80vh] rounded-xl shadow-2xl" />
        </div>
      )}
    </>
  )
}

export const ShoppingItem = memo(ShoppingItemComponent, (prevProps, nextProps) => {
  // Compare tags arrays
  const tagsEqual = (a: string[] | undefined, b: string[] | undefined) => {
    if (!a && !b) return true
    if (!a || !b) return false
    if (a.length !== b.length) return false
    return a.every((tag, i) => tag === b[i])
  }

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
    prevProps.item.note === nextProps.item.note &&
    tagsEqual(prevProps.item.tags, nextProps.item.tags) &&
    prevProps.onToggle === nextProps.onToggle &&
    prevProps.onDelete === nextProps.onDelete &&
    prevProps.onAddToFavorites === nextProps.onAddToFavorites &&
    prevProps.onAddImage === nextProps.onAddImage &&
    prevProps.onAddNote === nextProps.onAddNote &&
    prevProps.onAddTags === nextProps.onAddTags &&
    prevProps.onAssign === nextProps.onAssign &&
    prevProps.onUpdateQuantity === nextProps.onUpdateQuantity
  )
})

ShoppingItem.displayName = 'ShoppingItem'
