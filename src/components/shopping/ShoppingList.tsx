'use client'

import { useEffect, useState } from 'react'
import { ShoppingBag, Users, Share2, MoreVertical } from 'lucide-react'
import { ShoppingItem } from './ShoppingItem'
import { AddItemForm } from './AddItemForm'
import { ListItem, ShoppingList as ShoppingListType } from '@/lib/supabase/types'
import { createClient } from '@/lib/supabase/client'
import { useStore } from '@/store/useStore'

interface ShoppingListProps {
  list: ShoppingListType
}

export function ShoppingList({ list }: ShoppingListProps) {
  const { items, setItems, addItem, updateItem, removeItem, toggleItemChecked, user } = useStore()
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  // Cargar items iniciales
  useEffect(() => {
    const loadItems = async () => {
      const { data, error } = await supabase
        .from('list_items')
        .select('*')
        .eq('list_id', list.id)
        .order('created_at', { ascending: true })

      if (!error && data) {
        setItems(data)
      }
      setIsLoading(false)
    }

    loadItems()
  }, [list.id, setItems, supabase])

  // Suscripción en tiempo real
  useEffect(() => {
    const channel = supabase
      .channel(`list-${list.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'list_items',
          filter: `list_id=eq.${list.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            addItem(payload.new as ListItem)
          } else if (payload.eventType === 'UPDATE') {
            updateItem(payload.new.id, payload.new as Partial<ListItem>)
          } else if (payload.eventType === 'DELETE') {
            removeItem(payload.old.id)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [list.id, supabase, addItem, updateItem, removeItem])

  const handleAddItem = async (name: string, category?: string) => {
    if (!user) return

    const { error } = await supabase.from('list_items').insert({
      list_id: list.id,
      name,
      category,
      added_by: user.id,
    })

    if (error) {
      console.error('Error adding item:', error)
    }
  }

  const handleToggleItem = async (id: string) => {
    const item = items.find((i) => i.id === id)
    if (!item) return

    toggleItemChecked(id) // Optimistic update

    const { error } = await supabase
      .from('list_items')
      .update({ checked: !item.checked })
      .eq('id', id)

    if (error) {
      toggleItemChecked(id) // Revert on error
      console.error('Error toggling item:', error)
    }
  }

  const handleDeleteItem = async (id: string) => {
    const item = items.find((i) => i.id === id)
    if (!item) return

    removeItem(id) // Optimistic update

    const { error } = await supabase.from('list_items').delete().eq('id', id)

    if (error) {
      addItem(item) // Revert on error
      console.error('Error deleting item:', error)
    }
  }

  const handleUpdateQuantity = async (id: string, quantity: number) => {
    updateItem(id, { quantity }) // Optimistic update

    const { error } = await supabase
      .from('list_items')
      .update({ quantity })
      .eq('id', id)

    if (error) {
      const item = items.find((i) => i.id === id)
      if (item) updateItem(id, { quantity: item.quantity }) // Revert
      console.error('Error updating quantity:', error)
    }
  }

  const uncheckedItems = items.filter((item) => !item.checked)
  const checkedItems = items.filter((item) => item.checked)
  const progress = items.length > 0 ? (checkedItems.length / items.length) * 100 : 0

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-lg">{list.name}</h1>
              <p className="text-sm text-gray-500">
                {items.length} productos
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 rounded-xl hover:bg-secondary flex items-center justify-center transition-colors">
              <Users className="w-5 h-5 text-gray-500" />
            </button>
            <button className="w-10 h-10 rounded-xl hover:bg-secondary flex items-center justify-center transition-colors">
              <Share2 className="w-5 h-5 text-gray-500" />
            </button>
            <button className="w-10 h-10 rounded-xl hover:bg-secondary flex items-center justify-center transition-colors">
              <MoreVertical className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {checkedItems.length} de {items.length} completados
        </p>
      </header>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Pending items */}
            {uncheckedItems.length > 0 && (
              <div className="space-y-2">
                {uncheckedItems.map((item) => (
                  <ShoppingItem
                    key={item.id}
                    item={item}
                    onToggle={handleToggleItem}
                    onDelete={handleDeleteItem}
                    onUpdateQuantity={handleUpdateQuantity}
                  />
                ))}
              </div>
            )}

            {/* Checked items */}
            {checkedItems.length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-medium text-gray-400 mb-2">
                  Completados ({checkedItems.length})
                </p>
                <div className="space-y-2">
                  {checkedItems.map((item) => (
                    <ShoppingItem
                      key={item.id}
                      item={item}
                      onToggle={handleToggleItem}
                      onDelete={handleDeleteItem}
                      onUpdateQuantity={handleUpdateQuantity}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {items.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                  <ShoppingBag className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="font-medium text-gray-600 mb-1">Lista vacía</h3>
                <p className="text-sm text-gray-400">
                  Añade productos para empezar
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add item form */}
      <AddItemForm onAdd={handleAddItem} />
    </div>
  )
}
