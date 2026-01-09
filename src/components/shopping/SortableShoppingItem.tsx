'use client'

import { memo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ShoppingItem } from './ShoppingItem'
import { ListItem } from '@/lib/supabase/types'

interface SortableShoppingItemProps {
  item: ListItem
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onUpdateQuantity: (id: string, quantity: number) => void
}

function SortableShoppingItemComponent({ item, onToggle, onDelete, onUpdateQuantity }: SortableShoppingItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <ShoppingItem
        item={item}
        onToggle={onToggle}
        onDelete={onDelete}
        onUpdateQuantity={onUpdateQuantity}
        dragHandleProps={listeners}
      />
    </div>
  )
}

// Memoización para evitar re-renders innecesarios
export const SortableShoppingItem = memo(SortableShoppingItemComponent, (prevProps, nextProps) => {
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.name === nextProps.item.name &&
    prevProps.item.checked === nextProps.item.checked &&
    prevProps.item.quantity === nextProps.item.quantity &&
    prevProps.item.category === nextProps.item.category &&
    prevProps.item.position === nextProps.item.position &&
    prevProps.onToggle === nextProps.onToggle &&
    prevProps.onDelete === nextProps.onDelete &&
    prevProps.onUpdateQuantity === nextProps.onUpdateQuantity
  )
})

SortableShoppingItem.displayName = 'SortableShoppingItem'
