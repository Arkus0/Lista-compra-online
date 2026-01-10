'use client'

import { useState, memo, useCallback, useRef, useEffect } from 'react'
import {
  Check, Trash2, GripVertical, Minus, Plus, User, Star,
  UserPlus, X, MoreVertical, Image, StickyNote, Camera
} from 'lucide-react'
import { ListItem, Profile } from '@/lib/supabase/types'

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
  assignablePeople?: AssignablePerson[]
  assignedToProfile?: Profile | null
  dragHandleProps?: any
  addedByProfile?: Profile | null
  checkedByProfile?: Profile | null
  isDragEnabled?: boolean
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
  assignablePeople = [],
  assignedToProfile,
  dragHandleProps,
  addedByProfile,
  checkedByProfile,
  isDragEnabled = true
}: ShoppingItemProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [showActionMenu, setShowActionMenu] = useState(false)
  const [showAssignSubmenu, setShowAssignSubmenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowActionMenu(false)
        setShowAssignSubmenu(false)
      }
    }
    if (showActionMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showActionMenu])

  const handleAssign = useCallback((userId: string | null) => {
    onAssign?.(item.id, userId)
    setShowActionMenu(false)
    setShowAssignSubmenu(false)
  }, [item.id, onAssign])

  // Obtener iniciales para avatar
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const handleDelete = useCallback(() => {
    setIsDeleting(true)
    setShowActionMenu(false)
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
    setShowActionMenu(false)
  }, [item, onAddToFavorites])

  const categoryColor = item.category
    ? categoryColors[item.category.toLowerCase()] || categoryColors.otros
    : null

  return (
    <>
      <div
        className={`
          flex items-center gap-2 sm:gap-3 p-3 bg-card rounded-xl border border-border-light
          transition-all duration-200 group relative
          hover:border-border hover:shadow-sm
          ${item.checked ? 'opacity-60 bg-secondary/20' : ''}
          ${isDeleting ? 'scale-95 opacity-0' : ''}
        `}
        role="listitem"
        aria-label={`${item.name}${item.checked ? ', completado' : ''}`}
      >
        {/* Drag handle - Solo si está habilitado */}
        {isDragEnabled && (
          <div
            {...dragHandleProps}
            className="drag-hint text-muted-light cursor-grab active:cursor-grabbing touch-none flex-shrink-0 p-0.5 rounded hover:bg-secondary transition-colors hidden sm:block"
            aria-label="Arrastrar para reordenar"
          >
            <GripVertical className="w-4 h-4" />
          </div>
        )}

        {/* Checkbox */}
        <button
          onClick={handleToggle}
          className={`
            w-6 h-6 rounded-lg border-2 flex items-center justify-center
            transition-all duration-200 shrink-0
            focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
            ${item.checked
              ? 'bg-primary border-primary'
              : 'border-muted-light hover:border-primary active:scale-95'
            }
          `}
          aria-checked={item.checked}
          aria-label={`Marcar ${item.name} como ${item.checked ? 'pendiente' : 'completado'}`}
          role="checkbox"
        >
          {item.checked && <Check className="w-3.5 h-3.5 text-white" />}
        </button>

        {/* Imagen miniatura (si existe) */}
        {item.image_url && (
          <button
            onClick={() => setShowImageModal(true)}
            className="w-8 h-8 rounded-lg bg-secondary flex-shrink-0 overflow-hidden border border-border-light"
            aria-label="Ver imagen del producto"
          >
            <img src={item.image_url} alt="" className="w-full h-full object-cover" />
          </button>
        )}

        {/* Contenido principal: Nombre prominente */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`text-base font-medium truncate ${item.checked ? 'line-through text-muted' : 'text-foreground'}`}>
              {item.name}
            </p>
            {/* Avatar pequeño si está asignado */}
            {assignedToProfile && (
              <span
                className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center ring-1 ring-blue-200 dark:ring-blue-700"
                title={`Asignado a ${assignedToProfile.name}`}
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
          {/* Categoría debajo del nombre */}
          {categoryColor && (
            <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded-md mt-0.5 ${categoryColor}`}>
              {item.category}
            </span>
          )}
        </div>

        {/* Cantidad - compacto */}
        <div className="flex items-center gap-0.5 bg-secondary rounded-lg p-0.5">
          <button
            onClick={handleDecrement}
            className="w-6 h-6 rounded-md flex items-center justify-center
                      hover:bg-hover transition-colors disabled:opacity-30"
            disabled={item.quantity <= 1}
            aria-label="Disminuir cantidad"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="w-7 text-center text-sm font-semibold tabular-nums">
            {item.quantity}
          </span>
          <button
            onClick={handleIncrement}
            className="w-6 h-6 rounded-md flex items-center justify-center
                      hover:bg-hover transition-colors"
            aria-label="Aumentar cantidad"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Menú de tres puntos */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowActionMenu(!showActionMenu)}
            className="w-8 h-8 rounded-lg flex items-center justify-center
                      text-muted hover:text-foreground hover:bg-secondary transition-colors
                      focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-label="Más opciones"
            aria-expanded={showActionMenu}
            aria-haspopup="menu"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {/* Menú desplegable de acciones */}
          {showActionMenu && (
            <div
              className="absolute top-full right-0 mt-1 w-52 bg-card border border-border rounded-xl shadow-xl z-40 py-1 animate-in fade-in slide-in-from-top-2 duration-150"
              role="menu"
            >
              {/* Asignar a alguien */}
              {onAssign && assignablePeople.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setShowAssignSubmenu(!showAssignSubmenu)}
                    className="w-full px-3 py-2.5 text-left text-sm hover:bg-hover flex items-center gap-3 transition-colors"
                    role="menuitem"
                  >
                    <UserPlus className="w-4 h-4 text-muted" />
                    <span className="flex-1">Asignar a...</span>
                    {assignedToProfile && (
                      <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                        {assignedToProfile.avatar_url ? (
                          <img src={assignedToProfile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span className="text-[8px] font-bold text-blue-600">{getInitials(assignedToProfile.name || 'U')}</span>
                        )}
                      </span>
                    )}
                  </button>

                  {/* Submenú de asignación */}
                  {showAssignSubmenu && (
                    <div className="absolute left-full top-0 ml-1 w-48 bg-card border border-border rounded-xl shadow-xl py-1 animate-in fade-in slide-in-from-left-2 duration-150">
                      {assignedToProfile && (
                        <button
                          onClick={() => handleAssign(null)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-hover flex items-center gap-2 text-danger"
                          role="menuitem"
                        >
                          <X className="w-4 h-4" />
                          Quitar asignación
                        </button>
                      )}
                      {assignablePeople.map(person => (
                        <button
                          key={person.id}
                          onClick={() => handleAssign(person.id)}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-hover flex items-center gap-2 ${
                            item.assigned_to === person.id ? 'bg-primary/10' : ''
                          }`}
                          role="menuitem"
                        >
                          {person.avatar_url ? (
                            <img src={person.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center">
                              <span className="text-[9px] font-bold">{getInitials(person.name)}</span>
                            </div>
                          )}
                          <span className="truncate flex-1">{person.name}</span>
                          {item.assigned_to === person.id && (
                            <Check className="w-4 h-4 text-primary" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Añadir a favoritos */}
              {onAddToFavorites && (
                <button
                  onClick={handleAddToFavorites}
                  className="w-full px-3 py-2.5 text-left text-sm hover:bg-hover flex items-center gap-3 transition-colors"
                  role="menuitem"
                >
                  <Star className="w-4 h-4 text-amber-500" />
                  <span>Añadir a favoritos</span>
                </button>
              )}

              {/* Añadir imagen */}
              {onAddImage && (
                <button
                  onClick={() => { onAddImage(item.id); setShowActionMenu(false); }}
                  className="w-full px-3 py-2.5 text-left text-sm hover:bg-hover flex items-center gap-3 transition-colors"
                  role="menuitem"
                >
                  <Camera className="w-4 h-4 text-muted" />
                  <span>{item.image_url ? 'Cambiar imagen' : 'Añadir imagen'}</span>
                </button>
              )}

              {/* Añadir nota */}
              {onAddNote && (
                <button
                  onClick={() => { onAddNote(item.id); setShowActionMenu(false); }}
                  className="w-full px-3 py-2.5 text-left text-sm hover:bg-hover flex items-center gap-3 transition-colors"
                  role="menuitem"
                >
                  <StickyNote className="w-4 h-4 text-muted" />
                  <span>Añadir nota</span>
                </button>
              )}

              {/* Separador */}
              <div className="h-px bg-border-light my-1" />

              {/* Eliminar */}
              <button
                onClick={handleDelete}
                className="w-full px-3 py-2.5 text-left text-sm hover:bg-danger/10 flex items-center gap-3 text-danger transition-colors"
                role="menuitem"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Imagen Ampliada */}
      {showImageModal && item.image_url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setShowImageModal(false)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            onClick={() => setShowImageModal(false)}
            aria-label="Cerrar"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <div className="relative max-w-lg w-full">
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
    prevProps.onAddImage === nextProps.onAddImage &&
    prevProps.onAddNote === nextProps.onAddNote &&
    prevProps.addedByProfile?.id === nextProps.addedByProfile?.id &&
    prevProps.checkedByProfile?.id === nextProps.checkedByProfile?.id &&
    prevProps.assignedToProfile?.id === nextProps.assignedToProfile?.id &&
    prevProps.isDragEnabled === nextProps.isDragEnabled &&
    prevProps.assignablePeople?.length === nextProps.assignablePeople?.length
  )
})

ShoppingItem.displayName = 'ShoppingItem'
