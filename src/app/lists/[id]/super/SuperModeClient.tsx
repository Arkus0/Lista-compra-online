'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  X, ChevronDown, ChevronUp, Plus, ShoppingCart,
  AlertCircle, Check, Loader2, Ban
} from 'lucide-react'
import { ShoppingList as ShoppingListType, ListItem, Profile } from '@/lib/supabase/types'
import { createClient } from '@/lib/supabase/client'
import {
  useItems, useItemsActions, useSetCurrentList, useSetUser
} from '@/store/useStore'
import { useRealtimeList } from '@/hooks/useRealtimeList'
import { CATEGORIES, CategoryId, getProductEmoji, getCategoryEmoji } from '@/lib/constants'

interface Props {
  list: ShoppingListType
  user: Profile
}

export function SuperModeClient({ list, user }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const items = useItems() as ListItem[]
  const { setItems, updateItem, addItem } = useItemsActions()
  const setCurrentList = useSetCurrentList()
  const setUser = useSetUser()

  const [isLoading, setIsLoading] = useState(true)
  const [showCompleted, setShowCompleted] = useState(false)
  const [showAddInput, setShowAddInput] = useState(false)
  const [newItemName, setNewItemName] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  // Realtime sync
  useRealtimeList({ listId: list.id, user })

  // Setup
  useEffect(() => {
    setCurrentList(list)
    setUser(user)

    // Cargar items
    const loadItems = async () => {
      const { data } = await supabase
        .from('list_items')
        .select('*')
        .eq('list_id', list.id)
        .order('position', { ascending: true })

      if (data) setItems(data)
      setIsLoading(false)
    }

    loadItems()

    return () => setCurrentList(null)
  }, [list, user, setCurrentList, setUser, setItems, supabase])

  // Wake Lock - mantener pantalla encendida
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen')
        }
      } catch (err) {
        console.log('Wake Lock not supported')
      }
    }

    requestWakeLock()

    // Re-request on visibility change
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      wakeLock?.release()
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  // Separar items
  const { pendingItems, unavailableItems, completedItems } = useMemo(() => {
    const pending: ListItem[] = []
    const unavailable: ListItem[] = []
    const completed: ListItem[] = []

    items.forEach(item => {
      if (item.checked) {
        completed.push(item)
      } else if (item.note?.includes('[NO HABÍA]')) {
        unavailable.push(item)
      } else {
        pending.push(item)
      }
    })

    return { pendingItems: pending, unavailableItems: unavailable, completedItems: completed }
  }, [items])

  // Agrupar por categoría
  const groupedPending = useMemo(() => {
    const groups: Record<CategoryId, ListItem[]> = {} as Record<CategoryId, ListItem[]>

    pendingItems.forEach(item => {
      const cat = (item.category as CategoryId) || 'other'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(item)
    })

    // Ordenar por el orden de CATEGORIES
    const orderedCategories = Object.keys(CATEGORIES) as CategoryId[]
    const orderedGroups: [CategoryId, ListItem[]][] = []

    orderedCategories.forEach(catId => {
      if (groups[catId] && groups[catId].length > 0) {
        orderedGroups.push([catId, groups[catId]])
      }
    })

    return orderedGroups
  }, [pendingItems])

  // Progreso
  const totalItems = items.length
  const completedCount = completedItems.length
  const progress = totalItems > 0 ? (completedCount / totalItems) * 100 : 0

  // Marcar como completado
  const handleToggle = useCallback(async (item: ListItem) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([30, 50, 30])
    }

    const newChecked = !item.checked
    updateItem(item.id, { checked: newChecked })

    await supabase
      .from('list_items')
      .update({
        checked: newChecked,
        checked_by: newChecked ? user.id : null
      })
      .eq('id', item.id)
  }, [supabase, updateItem, user.id])

  // Marcar como "no había"
  const handleUnavailable = useCallback(async (item: ListItem) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(100)
    }

    const hasTag = item.note?.includes('[NO HABÍA]')
    const newNote = hasTag
      ? item.note?.replace('[NO HABÍA]', '').trim() || ''
      : `[NO HABÍA] ${item.note || ''}`.trim()

    updateItem(item.id, { note: newNote })

    await supabase
      .from('list_items')
      .update({ note: newNote })
      .eq('id', item.id)
  }, [supabase, updateItem])

  // Añadir item rápido
  const handleAddItem = useCallback(async () => {
    if (!newItemName.trim() || isAdding) return

    setIsAdding(true)
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50)
    }

    const { data, error } = await supabase
      .from('list_items')
      .insert({
        list_id: list.id,
        name: newItemName.trim(),
        quantity: 1,
        category: 'other',
        checked: false,
        added_by: user.id,
        position: items.length
      })
      .select()
      .single()

    if (data && !error) {
      addItem(data)
      setNewItemName('')
      setShowAddInput(false)
    }

    setIsAdding(false)
  }, [newItemName, isAdding, supabase, list.id, user.id, items.length, addItem])

  // Salir del modo super
  const handleExit = () => {
    router.push(`/lists/${list.id}`)
  }

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header compacto */}
      <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingCart className="w-6 h-6 text-primary" />
          <div>
            <h1 className="font-bold text-lg leading-tight truncate max-w-[200px]">
              {list.name}
            </h1>
            <p className="text-xs text-muted-foreground">
              {completedCount} de {totalItems} items
            </p>
          </div>
        </div>
        <button
          onClick={handleExit}
          className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center hover:bg-red-100 hover:text-red-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Barra de progreso */}
      <div className="px-4 py-2 bg-card/50">
        <div className="h-3 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-green-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-center text-muted-foreground mt-1">
          {progress.toFixed(0)}% completado
        </p>
      </div>

      {/* Lista principal */}
      <main className="flex-1 overflow-y-auto">
        {/* Items pendientes por categoría */}
        {groupedPending.map(([categoryId, categoryItems]) => {
          const category = CATEGORIES[categoryId]
          return (
            <div key={categoryId} className="border-b border-border/50">
              {/* Header de categoría */}
              <div className={`px-4 py-2 flex items-center gap-2 ${category.color} bg-opacity-50`}>
                <span className="text-lg">{getCategoryEmoji(categoryId)}</span>
                <span className="font-semibold text-sm uppercase tracking-wide">
                  {category.label}
                </span>
                <span className="ml-auto text-xs bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded-full">
                  {categoryItems.length}
                </span>
              </div>

              {/* Items de esta categoría */}
              <div className="divide-y divide-border/30">
                {categoryItems.map(item => (
                  <SuperItem
                    key={item.id}
                    item={item}
                    onToggle={() => handleToggle(item)}
                    onUnavailable={() => handleUnavailable(item)}
                  />
                ))}
              </div>
            </div>
          )
        })}

        {/* Items no disponibles */}
        {unavailableItems.length > 0 && (
          <div className="border-b border-border/50">
            <div className="px-4 py-2 flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
              <AlertCircle className="w-5 h-5" />
              <span className="font-semibold text-sm uppercase tracking-wide">
                No había
              </span>
              <span className="ml-auto text-xs bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded-full">
                {unavailableItems.length}
              </span>
            </div>
            <div className="divide-y divide-border/30">
              {unavailableItems.map(item => (
                <SuperItem
                  key={item.id}
                  item={item}
                  onToggle={() => handleToggle(item)}
                  onUnavailable={() => handleUnavailable(item)}
                  isUnavailable
                />
              ))}
            </div>
          </div>
        )}

        {/* Completados (colapsable) */}
        {completedItems.length > 0 && (
          <div className="border-b border-border/50">
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="w-full px-4 py-3 flex items-center gap-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
            >
              <Check className="w-5 h-5" />
              <span className="font-semibold text-sm uppercase tracking-wide">
                Completados
              </span>
              <span className="ml-auto text-xs bg-green-100 dark:bg-green-900/40 px-2 py-0.5 rounded-full mr-2">
                {completedItems.length}
              </span>
              {showCompleted ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>

            {showCompleted && (
              <div className="divide-y divide-border/30 bg-green-50/50 dark:bg-green-900/10">
                {completedItems.map(item => (
                  <SuperItem
                    key={item.id}
                    item={item}
                    onToggle={() => handleToggle(item)}
                    onUnavailable={() => handleUnavailable(item)}
                    isCompleted
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Mensaje si está vacío */}
        {pendingItems.length === 0 && unavailableItems.length === 0 && completedItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <ShoppingCart className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg font-medium">Lista vacía</p>
            <p className="text-sm">Añade items para empezar</p>
          </div>
        )}

        {/* Mensaje de victoria */}
        {pendingItems.length === 0 && (completedItems.length > 0 || unavailableItems.length > 0) && (
          <div className="flex flex-col items-center justify-center py-10 text-center px-4">
            <div className="text-6xl mb-4">🎉</div>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">
              ¡Compra completada!
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {unavailableItems.length > 0
                ? `${unavailableItems.length} item(s) no disponible(s)`
                : 'Todos los items encontrados'}
            </p>
          </div>
        )}

        {/* Espacio para el botón flotante */}
        <div className="h-24" />
      </main>

      {/* Input de añadir (expandible) */}
      {showAddInput && (
        <div className="fixed bottom-20 left-4 right-4 bg-card rounded-2xl shadow-2xl border border-border p-3 animate-in slide-in-from-bottom-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="Nombre del item..."
              className="flex-1 h-12 px-4 rounded-xl bg-secondary focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddItem()
                if (e.key === 'Escape') setShowAddInput(false)
              }}
            />
            <button
              onClick={handleAddItem}
              disabled={isAdding || !newItemName.trim()}
              className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center disabled:opacity-50"
            >
              {isAdding ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Plus className="w-6 h-6" />
              )}
            </button>
            <button
              onClick={() => setShowAddInput(false)}
              className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Botón flotante para añadir */}
      {!showAddInput && (
        <button
          onClick={() => setShowAddInput(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-white shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
        >
          <Plus className="w-7 h-7" />
        </button>
      )}
    </div>
  )
}

// Componente de item simplificado
function SuperItem({
  item,
  onToggle,
  onUnavailable,
  isCompleted = false,
  isUnavailable = false
}: {
  item: ListItem
  onToggle: () => void
  onUnavailable: () => void
  isCompleted?: boolean
  isUnavailable?: boolean
}) {
  const [showActions, setShowActions] = useState(false)

  return (
    <div
      className={`
        px-4 py-3 flex items-center gap-3
        transition-all duration-200
        ${isUnavailable ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}
      `}
      onClick={() => setShowActions(!showActions)}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
        className={`
          w-8 h-8 rounded-lg border-2 flex items-center justify-center flex-shrink-0
          transition-all active:scale-90
          ${isCompleted
            ? 'bg-green-500 border-green-500 shadow-md shadow-green-500/30'
            : 'border-gray-300 dark:border-gray-600 hover:border-primary'
          }
        `}
      >
        {isCompleted && <Check className="w-5 h-5 text-white" strokeWidth={3} />}
      </button>

      {/* Emoji + Nombre */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xl">{getProductEmoji(item.name, item.category as CategoryId)}</span>
          <span className={`font-medium ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
            {item.name}
          </span>
        </div>
        {item.note && !item.note.includes('[NO HABÍA]') && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.note}</p>
        )}
      </div>

      {/* Cantidad */}
      {item.quantity > 1 && (
        <span className="px-2 py-1 bg-secondary rounded-lg text-sm font-bold tabular-nums">
          x{item.quantity}
        </span>
      )}

      {/* Botón "no había" */}
      {!isCompleted && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onUnavailable()
          }}
          className={`
            w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
            transition-colors
            ${isUnavailable
              ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600'
              : 'bg-secondary text-muted-foreground hover:bg-amber-100 hover:text-amber-600'
            }
          `}
          title={isUnavailable ? 'Volver a pendiente' : 'No había'}
        >
          <Ban className={`w-5 h-5 ${isUnavailable ? 'opacity-100' : 'opacity-50'}`} />
        </button>
      )}
    </div>
  )
}
