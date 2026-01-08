'use client'

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

export function SortableShoppingItem({ item, onToggle, onDelete, onUpdateQuantity }: SortableShoppingItemProps) {
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
