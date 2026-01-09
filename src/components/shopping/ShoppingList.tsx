'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ShoppingBag, Users, Share2, MoreVertical,
  Trash2, Edit2, Copy, Check, X, QrCode, Link as LinkIcon
} from 'lucide-react'
import { ShoppingItem } from './ShoppingItem'
import { AddItemForm } from './AddItemForm'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ListItem, ShoppingList as ShoppingListType } from '@/lib/supabase/types'
import { createClient } from '@/lib/supabase/client'
import {
  useItems,
  useItemsActions,
  useUser,
} from '@/store/useStore'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { SortableShoppingItem } from './SortableShoppingItem'

interface ShoppingListProps {
  list: ShoppingListType
}

interface Collaborator {
  role: string
  profiles: {
    email: string
    name: string
    avatar_url: string | null
  }
}

// Skeleton loader para items
const ItemSkeleton = () => (
  <div className="flex items-center gap-3 p-3 bg-background rounded-xl border border-gray-100 animate-pulse">
    <div className="w-5 h-5 bg-gray-200 rounded" />
    <div className="w-6 h-6 bg-gray-200 rounded-lg" />
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-200 rounded w-1/4" />
    </div>
    <div className="flex gap-1">
      <div className="w-7 h-7 bg-gray-200 rounded-lg" />
      <div className="w-8 h-7 bg-gray-200 rounded" />
      <div className="w-7 h-7 bg-gray-200 rounded-lg" />
    </div>
  </div>
)

export function ShoppingList({ list }: ShoppingListProps) {
  // Usar selectores optimizados del store
  const items = useItems()
  const { setItems, addItem, updateItem, removeItem, toggleItemChecked, updateItemsPositions } = useItemsActions()
  const user = useUser()

  const [isLoading, setIsLoading] = useState(true)
  const [activeModal, setActiveModal] = useState<'share' | 'collaborators' | 'edit' | 'delete' | null>(null)
  const [showMenu, setShowMenu] = useState(false)

  // Estados para funcionalidades especificas
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [collaboratorsLoaded, setCollaboratorsLoaded] = useState(false) // Cache flag
  const [newName, setNewName] = useState(list.name)
  const [isCopied, setIsCopied] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)

  // Ref para el cliente de supabase - evita recreación
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const router = useRouter()

  // QR URL memoizada - solo se recalcula si cambia share_code
  const shareUrl = useMemo(() =>
    typeof window !== 'undefined' ? `${window.location.origin}/join/${list.share_code}` : '',
    [list.share_code]
  )

  // Configure drag and drop sensors - memoizado
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Items separados - memoizados
  const uncheckedItems = useMemo(() =>
    items.filter((item) => !item.checked),
    [items]
  )

  const checkedItems = useMemo(() =>
    items.filter((item) => item.checked),
    [items]
  )

  // Progress memoizado
  const progress = useMemo(() =>
    items.length > 0 ? (checkedItems.length / items.length) * 100 : 0,
    [items.length, checkedItems.length]
  )

  // Cargar items iniciales
  useEffect(() => {
    let isMounted = true

    const loadItems = async () => {
      const { data, error } = await supabase
        .from('list_items')
        .select('*')
        .eq('list_id', list.id)
        .order('position', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true })

      if (!error && data && isMounted) {
        setItems(data)
      }
      if (isMounted) {
        setIsLoading(false)
      }
    }

    loadItems()

    return () => { isMounted = false }
  }, [list.id, setItems, supabase])

  // Cargar colaboradores - con caché
  useEffect(() => {
    if (activeModal === 'collaborators' && !collaboratorsLoaded) {
      const loadCollaborators = async () => {
        const { data } = await supabase
          .from('list_collaborators')
          .select('role, profiles(email, name, avatar_url)')
          .eq('list_id', list.id)

        if (data) {
          setCollaborators(data as unknown as Collaborator[])
          setCollaboratorsLoaded(true)
        }
      }
      loadCollaborators()
    }
  }, [activeModal, list.id, supabase, collaboratorsLoaded])

  // Suscripción en tiempo real - con cleanup correcto
  useEffect(() => {
    const channel = supabase
      .channel(`list-${list.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'list_items',
        filter: `list_id=eq.${list.id}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          addItem(payload.new as ListItem)
        } else if (payload.eventType === 'UPDATE') {
          updateItem(payload.new.id, payload.new as Partial<ListItem>)
        } else if (payload.eventType === 'DELETE') {
          removeItem(payload.old.id)
        }
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
      supabase.removeChannel(channel)
    }
  }, [list.id, supabase, addItem, updateItem, removeItem])

  // --- Handlers de Items - memoizados ---

  const handleAddItem = useCallback(async (name: string, category?: string) => {
    if (!user) return

    const maxPosition = items.length > 0
      ? Math.max(...items.map(i => i.position ?? 0))
      : -1

    const itemData = {
      list_id: list.id,
      name,
      category,
      added_by: user.id,
      position: maxPosition + 1
    }

    const { error } = await supabase.from('list_items').insert(itemData)
    if (error) console.error('Error adding item:', error)
  }, [user, items, list.id, supabase])

  const handleToggleItem = useCallback(async (id: string) => {
    const item = items.find((i) => i.id === id)
    if (!item) return

    // Optimistic update
    toggleItemChecked(id)

    const { error } = await supabase
      .from('list_items')
      .update({ checked: !item.checked })
      .eq('id', id)

    // Rollback on error
    if (error) toggleItemChecked(id)
  }, [items, toggleItemChecked, supabase])

  const handleDeleteItem = useCallback(async (id: string) => {
    const item = items.find((i) => i.id === id)
    if (!item) return

    // Optimistic update
    removeItem(id)

    const { error } = await supabase
      .from('list_items')
      .delete()
      .eq('id', id)

    // Rollback on error
    if (error) addItem(item)
  }, [items, removeItem, addItem, supabase])

  const handleUpdateQuantity = useCallback(async (id: string, quantity: number) => {
    const item = items.find((i) => i.id === id)
    if (!item) return

    const oldQuantity = item.quantity

    // Optimistic update
    updateItem(id, { quantity })

    const { error } = await supabase
      .from('list_items')
      .update({ quantity })
      .eq('id', id)

    // Rollback on error
    if (error) updateItem(id, { quantity: oldQuantity })
  }, [items, updateItem, supabase])

  // --- Drag and Drop - OPTIMIZADO con batch updates ---
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const oldIndex = uncheckedItems.findIndex((item) => item.id === active.id)
    const newIndex = uncheckedItems.findIndex((item) => item.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    // Reorder items locally
    const reorderedUnchecked = arrayMove(uncheckedItems, oldIndex, newIndex)

    // Merge with checked items and update state
    const allItems = [...reorderedUnchecked, ...checkedItems]
    setItems(allItems)

    // Preparar updates con nuevas posiciones
    const updates = reorderedUnchecked.map((item, index) => ({
      id: item.id,
      position: index,
    }))

    // Update state batch
    updateItemsPositions(updates)

    // BATCH UPDATE en BD - todas las actualizaciones en paralelo
    try {
      await Promise.all(
        updates.map(update =>
          supabase
            .from('list_items')
            .update({ position: update.position })
            .eq('id', update.id)
        )
      )
    } catch (error) {
      console.error('Error updating positions:', error)
      // En caso de error, recargar items desde BD
      const { data } = await supabase
        .from('list_items')
        .select('*')
        .eq('list_id', list.id)
        .order('position', { ascending: true })

      if (data) setItems(data)
    }
  }, [uncheckedItems, checkedItems, setItems, updateItemsPositions, supabase, list.id])

  // --- Funcionalidades Modales - memoizadas ---

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(shareUrl)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }, [shareUrl])

  const handleUpdateName = useCallback(async () => {
    if (!newName.trim() || newName === list.name) return

    const { error } = await supabase
      .from('shopping_lists')
      .update({ name: newName })
      .eq('id', list.id)

    if (!error) {
      router.refresh()
      setActiveModal(null)
    }
  }, [newName, list.name, list.id, supabase, router])

  const handleDeleteList = useCallback(async () => {
    const { error } = await supabase
      .from('shopping_lists')
      .delete()
      .eq('id', list.id)

    if (!error) {
      router.push('/lists')
      router.refresh()
    }
  }, [list.id, supabase, router])

  const handleDuplicateList = useCallback(async () => {
    if (!user) return
    setIsDuplicating(true)

    try {
      // 1. Crear nueva lista
      const { data: newList, error: listError } = await supabase
        .from('shopping_lists')
        .insert({
          name: `${list.name} (Copia)`,
          owner_id: user.id,
          share_code: Math.random().toString(36).substring(2, 8).toUpperCase()
        })
        .select()
        .single()

      if (listError || !newList) {
        throw listError
      }

      // 2. Copiar items en batch
      if (items.length > 0) {
        const itemsToInsert = items.map((item, index) => ({
          list_id: newList.id,
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          unit: item.unit,
          checked: false,
          added_by: user.id,
          position: index
        }))

        await supabase.from('list_items').insert(itemsToInsert)
      }

      setShowMenu(false)
      router.push(`/lists/${newList.id}`)
    } catch (error) {
      console.error('Error duplicating list:', error)
    } finally {
      setIsDuplicating(false)
    }
  }, [user, list.name, items, supabase, router])

  const closeMenu = useCallback(() => setShowMenu(false), [])
  const openShareModal = useCallback(() => setActiveModal('share'), [])
  const openCollaboratorsModal = useCallback(() => setActiveModal('collaborators'), [])
  const closeModal = useCallback(() => setActiveModal(null), [])
  const toggleMenu = useCallback(() => setShowMenu(prev => !prev), [])

  const openEditModal = useCallback(() => {
    setActiveModal('edit')
    setShowMenu(false)
  }, [])

  const openDeleteModal = useCallback(() => {
    setActiveModal('delete')
    setShowMenu(false)
  }, [])

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <header className="p-4 border-b border-gray-100 bg-background z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-lg">{list.name}</h1>
              <p className="text-sm text-gray-500">{items.length} productos</p>
            </div>
          </div>

          <div className="flex items-center gap-2 relative">
            <button
              onClick={openCollaboratorsModal}
              className="w-10 h-10 rounded-xl hover:bg-secondary flex items-center justify-center transition-colors"
            >
              <Users className="w-5 h-5 text-gray-500" />
            </button>
            <button
              onClick={openShareModal}
              className="w-10 h-10 rounded-xl hover:bg-secondary flex items-center justify-center transition-colors"
            >
              <Share2 className="w-5 h-5 text-muted" />
            </button>
            <button
              onClick={toggleMenu}
              className="w-10 h-10 rounded-xl hover:bg-secondary flex items-center justify-center transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-muted" />
            </button>

            {/* Menú Desplegable */}
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={closeMenu} />
                <div className="absolute top-12 right-0 w-48 bg-card border border-border rounded-xl shadow-xl z-20 py-2 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={openEditModal}
                    className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-hover flex items-center gap-2 transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-muted" /> Editar nombre
                  </button>
                  <button
                    onClick={handleDuplicateList}
                    disabled={isDuplicating}
                    className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-hover flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <Copy className="w-4 h-4 text-muted" /> {isDuplicating ? 'Duplicando...' : 'Duplicar lista'}
                  </button>
                  <div className="h-px bg-border-light my-1" />
                  <button
                    onClick={openDeleteModal}
                    className="w-full px-4 py-2 text-left text-sm text-danger hover:bg-danger/10 flex items-center gap-2 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> Eliminar lista
                  </button>
                </div>
              </>
            )}
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

      {/* Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {isLoading ? (
          <div className="space-y-2">
            <ItemSkeleton />
            <ItemSkeleton />
            <ItemSkeleton />
          </div>
        ) : (
          <>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={uncheckedItems.map(item => item.id)} strategy={verticalListSortingStrategy}>
                {uncheckedItems.map((item) => (
                  <SortableShoppingItem
                    key={item.id}
                    item={item}
                    onToggle={handleToggleItem}
                    onDelete={handleDeleteItem}
                    onUpdateQuantity={handleUpdateQuantity}
                  />
                ))}
              </SortableContext>
            </DndContext>

            {checkedItems.length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-medium text-gray-400 mb-2">Completados ({checkedItems.length})</p>
                <div className="space-y-2 opacity-60">
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
            {items.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                  <ShoppingBag className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="font-medium text-gray-600 mb-1">Lista vacía</h3>
                <p className="text-sm text-gray-400">Añade productos para empezar</p>
              </div>
            )}
          </>
        )}
      </div>

      <AddItemForm onAdd={handleAddItem} />

      {/* --- MODALES --- */}

      {/* Modal Compartir */}
      <Modal isOpen={activeModal === 'share'} onClose={closeModal} title="Compartir lista">
        <div className="space-y-6 flex flex-col items-center">
          <div className="bg-card p-4 rounded-xl border-2 border-dashed border-border">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(shareUrl)}`}
              alt="QR Code"
              className="w-40 h-40"
              loading="lazy"
            />
          </div>
          <div className="w-full space-y-2">
            <p className="text-sm font-medium text-muted">Enlace de invitación</p>
            <div className="flex gap-2">
              <div className="flex-1 bg-secondary px-3 py-2 rounded-lg text-sm text-muted truncate font-mono">
                {shareUrl}
              </div>
              <Button onClick={handleCopyLink} variant={isCopied ? 'primary' : 'secondary'} size="sm">
                {isCopied ? <Check className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <div className="w-full p-3 bg-primary/10 text-primary rounded-lg text-sm flex items-center gap-2">
            <QrCode className="w-4 h-4" />
            <span>Código de lista: <strong>{list.share_code}</strong></span>
          </div>
        </div>
      </Modal>

      {/* Modal Colaboradores */}
      <Modal isOpen={activeModal === 'collaborators'} onClose={closeModal} title="Colaboradores">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                {user?.name?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div>
                <p className="font-medium">Tú</p>
                <p className="text-xs text-muted-light">Propietario</p>
              </div>
            </div>
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">Owner</span>
          </div>

          {collaborators.length > 0 ? (
            collaborators.map((collab, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border border-border rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted font-bold">
                    {collab.profiles.name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div>
                    <p className="font-medium">{collab.profiles.name || 'Usuario'}</p>
                    <p className="text-xs text-muted-light">{collab.profiles.email}</p>
                  </div>
                </div>
                <span className="text-xs bg-secondary text-muted px-2 py-1 rounded-full capitalize">{collab.role}</span>
              </div>
            ))
          ) : (
            <p className="text-center text-muted text-sm py-4">No hay otros colaboradores</p>
          )}
        </div>
      </Modal>

      {/* Modal Editar */}
      <Modal isOpen={activeModal === 'edit'} onClose={closeModal} title="Editar lista">
        <div className="space-y-4">
          <Input
            label="Nombre de la lista"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <div className="flex gap-3 justify-end mt-4">
            <Button variant="ghost" onClick={closeModal}>Cancelar</Button>
            <Button onClick={handleUpdateName}>Guardar</Button>
          </div>
        </div>
      </Modal>

      {/* Modal Eliminar */}
      <Modal isOpen={activeModal === 'delete'} onClose={closeModal} title="¿Eliminar lista?">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto text-danger">
            <Trash2 className="w-6 h-6" />
          </div>
          <p className="text-gray-600">
            Esta acción no se puede deshacer. Se perderán todos los productos.
          </p>
          <div className="flex gap-3 justify-center mt-6">
            <Button variant="secondary" onClick={closeModal}>Cancelar</Button>
            <Button variant="danger" onClick={handleDeleteList}>Sí, eliminar</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
