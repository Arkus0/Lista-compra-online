'use client'

import { memo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ShoppingItem, AssignablePerson } from './ShoppingItem'
import { ListItem, Profile } from '@/lib/supabase/types'

interface SortableShoppingItemProps {
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
  addedByProfile?: Profile | null
  checkedByProfile?: Profile | null
}

function SortableShoppingItemComponent({
  item,
  onToggle,
  onDelete,
  onUpdateQuantity,
  onAddToFavorites,
  onAssign,
  onAddImage,
  onAddNote,
  assignablePeople,
  assignedToProfile,
  addedByProfile,
  checkedByProfile,
}: SortableShoppingItemProps) {
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
    zIndex: isDragging ? 50 : 'auto',
    position: 'relative' as const,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <ShoppingItem
        item={item}
        onToggle={onToggle}
        onDelete={onDelete}
        onUpdateQuantity={onUpdateQuantity}
        onAddToFavorites={onAddToFavorites}
        onAssign={onAssign}
        onAddImage={onAddImage}
        onAddNote={onAddNote}
        assignablePeople={assignablePeople}
        assignedToProfile={assignedToProfile}
        dragHandleProps={listeners}
        addedByProfile={addedByProfile}
        checkedByProfile={checkedByProfile}
        isDragEnabled={true}
      />
    </div>
  )
}

// Memoización actualizada
export const SortableShoppingItem = memo(SortableShoppingItemComponent, (prevProps, nextProps) => {
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.name === nextProps.item.name &&
    prevProps.item.checked === nextProps.item.checked &&
    prevProps.item.quantity === nextProps.item.quantity &&
    prevProps.item.category === nextProps.item.category &&
    prevProps.item.image_url === nextProps.item.image_url &&
    prevProps.item.note === nextProps.item.note &&
    prevProps.item.position === nextProps.item.position &&
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
    prevProps.assignablePeople?.length === nextProps.assignablePeople?.length
  )
})

SortableShoppingItem.displayName = 'SortableShoppingItem'
