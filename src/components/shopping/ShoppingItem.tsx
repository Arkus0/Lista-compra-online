'use client'

import { useState, memo, useCallback } from 'react'
import { Check, Trash2, GripVertical, Minus, Plus } from 'lucide-react'
import { ListItem } from '@/lib/supabase/types'

interface ShoppingItemProps {
  item: ListItem
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onUpdateQuantity: (id: string, quantity: number) => void
  dragHandleProps?: any
}

// Colores de categoría - extraído fuera del componente para evitar recreación
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

function ShoppingItemComponent({ item, onToggle, onDelete, onUpdateQuantity, dragHandleProps }: ShoppingItemProps) {
  const [isDeleting, setIsDeleting] = useState(false)

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

  const categoryColor = item.category
    ? categoryColors[item.category.toLowerCase()] || categoryColors.otros
    : categoryColors.otros

  return (
    <div
      className={`
        flex items-center gap-3 p-3 bg-background rounded-xl border border-gray-100
        transition-all duration-200 group
        ${item.checked ? 'opacity-60' : ''}
        ${isDeleting ? 'scale-95 opacity-0' : ''}
      `}
    >
      {/* Drag handle */}
      <div {...dragHandleProps} className="text-gray-300 cursor-grab active:cursor-grabbing touch-none">
        <GripVertical className="w-5 h-5" />
      </div>

      {/* Checkbox */}
      <button
        onClick={handleToggle}
        className={`
          w-6 h-6 rounded-lg border-2 flex items-center justify-center
          transition-all duration-200 shrink-0
          ${item.checked
            ? 'bg-primary border-primary'
            : 'border-gray-300 hover:border-primary'
          }
        `}
      >
        {item.checked && <Check className="w-4 h-4 text-white" />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`font-medium truncate ${item.checked ? 'line-through text-gray-400' : ''}`}>
          {item.name}
        </p>
        {item.category && (
          <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColor}`}>
            {item.category}
          </span>
        )}
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
          {item.unit && <span className="text-xs text-gray-400 ml-0.5">{item.unit}</span>}
        </span>
        <button
          onClick={handleIncrement}
          className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center
                     hover:bg-secondary/80 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Delete button */}
      <button
        onClick={handleDelete}
        className="w-8 h-8 rounded-lg text-gray-400 hover:text-danger hover:bg-danger/10
                   flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}

// Memoización con comparación profunda de props
export const ShoppingItem = memo(ShoppingItemComponent, (prevProps, nextProps) => {
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.name === nextProps.item.name &&
    prevProps.item.checked === nextProps.item.checked &&
    prevProps.item.quantity === nextProps.item.quantity &&
    prevProps.item.category === nextProps.item.category &&
    prevProps.item.unit === nextProps.item.unit &&
    prevProps.onToggle === nextProps.onToggle &&
    prevProps.onDelete === nextProps.onDelete &&
    prevProps.onUpdateQuantity === nextProps.onUpdateQuantity
  )
})

ShoppingItem.displayName = 'ShoppingItem'
