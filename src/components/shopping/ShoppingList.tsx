'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ShoppingBag, Users, Share2, MoreVertical,
  Trash2, Edit2, Copy, Check, QrCode, Link as LinkIcon,
  ChevronDown, ChevronRight, LayoutGrid, List as ListIcon, Undo2
} from 'lucide-react'
import { ShoppingItem } from './ShoppingItem'
import { AddItemForm } from './AddItemForm'
import { PresenceIndicator } from './PresenceIndicator'
import { ListNotes } from './ListNotes'
import { FavoriteItems } from './FavoriteItems'
import { useFavorites } from '@/hooks/useFavorites'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ListItem, ShoppingList as ShoppingListType, Profile } from '@/lib/supabase/types'
import { createClient } from '@/lib/supabase/client'
import {
  useItems,
  useItemsActions,
  useUser,
} from '@/store/useStore'
import { useRealtimeList } from '@/hooks/useRealtimeList'
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
import { sendPushNotification } from '@/lib/notifications'
import { CATEGORIES, CategoryId } from '@/lib/constants'

// Definimos el tipo local extendido
type ListItemWithImage = ListItem & { image_url?: string | null }

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

// COMPONENTE TOAST PARA DESHACER
function UndoToast({ 
  message, 
  onUndo, 
  isVisible 
}: { 
  message: string, 
  onUndo: () => void, 
  isVisible: boolean 
}) {
  if (!isVisible) return null
  
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300 w-[90%] max-w-sm">
      <div className="bg-foreground text-background px-4 py-3 rounded-xl shadow-2xl flex items-center gap-4 justify-between">
        <span className="text-sm font-medium truncate">{message}</span>
        <button 
          onClick={onUndo}
          className="text-primary-foreground font-bold text-sm hover:underline flex items-center gap-1 whitespace-nowrap"
        >
          <Undo2 className="w-4 h-4" /> Deshacer
        </button>
      </div>
    </div>
  )
}

export function ShoppingList({ list }: ShoppingListProps) {
  // Usar selectores optimizados del store
  const items = useItems() as ListItemWithImage[]
  const { setItems, addItem, updateItem, removeItem, toggleItemChecked, updateItemsPositions } = useItemsActions()
  const user = useUser()

  // Hook de realtime y presencia
  const { presenceUsers, isConnected } = useRealtimeList({
    listId: list.id,
    user,
  })

  // Hook de favoritos
  const {
    favoriteItems,
    isLoading: favoritesLoading,
    addFavoriteItem,
    removeFavoriteItem,
    addItemToListFromFavorite,
  } = useFavorites(user?.id)

  const [isLoading, setIsLoading] = useState(true)
  const [activeModal, setActiveModal] = useState<'share' | 'collaborators' | 'edit' | 'delete' | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [showCompleted, setShowCompleted] = useState(false)
  
  // ESTADOS NUEVOS
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('list')
  const [undoState, setUndoState] = useState<{
    isVisible: boolean
    message: string
    action: () => Promise<void> | void
    timer: NodeJS.Timeout | null
  }>({ isVisible: false, message: '', action: () => {}, timer: null })

  // Estados para funcionalidades especificas
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [collaboratorsLoaded, setCollaboratorsLoaded] = useState(false)
  const [newName, setNewName] = useState(list.name)
  const [isCopied, setIsCopied] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [profilesCache, setProfilesCache] = useState<Map<string, Profile>>(new Map())

  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const router = useRouter()

  const shareUrl = useMemo(() =>
    typeof window !== 'undefined' ? `${window.location.origin}/join/${list.share_code}` : '',
    [list.share_code]
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const uncheckedItems = useMemo(() => items.filter((item) => !item.checked), [items])
  const checkedItems = useMemo(() => items.filter((item) => item.checked), [items])
  const progress = useMemo(() => items.length > 0 ? (checkedItems.length / items.length) * 100 : 0, [items.length, checkedItems.length])

  // Agrupación de Items
  const groupedItems = useMemo(() => {
    if (viewMode === 'list') return null

    // Orden definido en constants.ts
    const groups: Record<string, ListItemWithImage[]> = {}
    
    // Inicializar grupos vacíos para mantener orden
    Object.keys(CATEGORIES).forEach(key => { groups[key] = [] })
    
    uncheckedItems.forEach(item => {
      const cat = item.category || 'other'
      if (!groups[cat]) groups[cat] = [] // Por si acaso hay categorías desconocidas
      groups[cat].push(item)
    })

    // Limpiar grupos vacíos
    return Object.entries(groups).filter(([_, items]) => items.length > 0)
  }, [uncheckedItems, viewMode])

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
        setItems(data as ListItemWithImage[])
      }
      if (isMounted) setIsLoading(false)
    }
    loadItems()
    return () => { isMounted = false }
  }, [list.id, setItems, supabase])

  // Cargar perfiles y colaboradores (se mantiene igual...)
  useEffect(() => {
    if (activeModal === 'collaborators' && !collaboratorsLoaded) {
      const loadCollaborators = async () => {
        const { data } = await supabase.from('list_collaborators').select('role, profiles(email, name, avatar_url)').eq('list_id', list.id)
        if (data) { setCollaborators(data as unknown as Collaborator[]); setCollaboratorsLoaded(true) }
      }
      loadCollaborators()
    }
  }, [activeModal, list.id, supabase, collaboratorsLoaded])

  useEffect(() => {
    const loadProfiles = async () => {
      const userIds = new Set<string>()
      items.forEach((item) => {
        if (item.added_by) userIds.add(item.added_by)
        if (item.checked_by) userIds.add(item.checked_by)
      })
      const missingIds = Array.from(userIds).filter((id) => !profilesCache.has(id))
      if (missingIds.length === 0) return
      const { data } = await supabase.from('profiles').select('*').in('id', missingIds)
      if (data) {
        setProfilesCache((prev) => {
          const newCache = new Map(prev)
          data.forEach((profile) => newCache.set(profile.id, profile))
          return newCache
        })
      }
    }
    if (items.length > 0) loadProfiles()
  }, [items, supabase, profilesCache])

  // --- UNDO SYSTEM ---
  const showUndoToast = (message: string, undoAction: () => Promise<void> | void) => {
    if (undoState.timer) clearTimeout(undoState.timer)
    
    const timer = setTimeout(() => {
      setUndoState(prev => ({ ...prev, isVisible: false }))
    }, 4000)

    setUndoState({ isVisible: true, message, action: undoAction, timer })
  }

  const handleUndo = async () => {
    if (undoState.action) {
      await undoState.action()
      setUndoState(prev => ({ ...prev, isVisible: false }))
      if (undoState.timer) clearTimeout(undoState.timer)
    }
  }

  // --- HANDLERS ---

  const handleAddItem = useCallback(async (name: string, category?: string, imageUrl?: string) => {
    if (!user) return
    const normalizedName = name.trim().toLowerCase()
    const existingItem = items.find(item => item.name.trim().toLowerCase() === normalizedName)

    if (existingItem) {
      const newQuantity = (existingItem.quantity || 1) + 1
      updateItem(existingItem.id, { quantity: newQuantity, checked: false })
      const { error } = await supabase.from('list_items').update({ 
          quantity: newQuantity, 
          checked: false, checked_by: null,
          category: existingItem.category === 'other' && category ? category : existingItem.category
        }).eq('id', existingItem.id)
      
      if (error) { updateItem(existingItem.id, { quantity: existingItem.quantity, checked: existingItem.checked }); return }

      sendPushNotification({
          listId: list.id, listName: list.name, action: 'item_added', 
          actorName: user.name || 'Alguien', itemName: existingItem.name, excludeUserId: user.id,
      })
    } else {
      const maxPosition = items.length > 0 ? Math.max(...items.map(i => i.position ?? 0)) : -1
      const itemData = {
        list_id: list.id, name: name.trim(), category, added_by: user.id, position: maxPosition + 1, image_url: imageUrl
      }
      
      // Primero insertamos para obtener el ID real
      const { data, error } = await supabase.from('list_items').insert(itemData).select().single()
      
      if (!error && data) {
        addItem(data as ListItemWithImage)
        sendPushNotification({
          listId: list.id, listName: list.name, action: 'item_added',
          actorName: user.name || 'Alguien', itemName: name, excludeUserId: user.id,
        })
      }
    }
  }, [user, items, list.id, list.name, supabase, updateItem, addItem])

  const handleToggleItem = useCallback(async (id: string) => {
    const item = items.find((i) => i.id === id)
    if (!item || !user) return

    const newChecked = !item.checked
    toggleItemChecked(id) 

    // Definir UNDO
    const undoAction = async () => {
       toggleItemChecked(id) 
       await supabase.from('list_items').update({ checked: !newChecked, checked_by: !newChecked ? null : user.id }).eq('id', id)
    }

    if (newChecked) showUndoToast(`Completado: ${item.name}`, undoAction)

    const { error } = await supabase.from('list_items').update({
        checked: newChecked, checked_by: newChecked ? user.id : null,
      }).eq('id', id)

    if (error) toggleItemChecked(id)
    else if (newChecked) {
      sendPushNotification({
        listId: list.id, listName: list.name, action: 'item_checked',
        actorName: user.name || 'Alguien', itemName: item.name, excludeUserId: user.id,
      })
    }
  }, [items, user, toggleItemChecked, supabase, list.id, list.name])

  const handleDeleteItem = useCallback(async (id: string) => {
    const item = items.find((i) => i.id === id)
    if (!item || !user) return

    removeItem(id)

    const undoAction = async () => {
      // Recreamos el item (perderá su ID original, pero para el usuario es igual)
      const { data } = await supabase.from('list_items').insert({
        list_id: item.list_id, name: item.name, quantity: item.quantity, category: item.category, 
        added_by: item.added_by, image_url: item.image_url, position: item.position
      }).select().single()
      if (data) addItem(data as ListItemWithImage)
    }

    showUndoToast(`Eliminado: ${item.name}`, undoAction)

    const { error } = await supabase.from('list_items').delete().eq('id', id)
    if (error) addItem(item)
    else {
      sendPushNotification({
        listId: list.id, listName: list.name, action: 'item_removed',
        actorName: user.name || 'Alguien', itemName: item.name, excludeUserId: user.id,
      })
    }
  }, [items, user, removeItem, addItem, supabase, list.id, list.name])

  const handleUpdateQuantity = useCallback(async (id: string, quantity: number) => {
    const item = items.find((i) => i.id === id)
    if (!item) return
    const oldQuantity = item.quantity
    updateItem(id, { quantity })
    const { error } = await supabase.from('list_items').update({ quantity }).eq('id', id)
    if (error) updateItem(id, { quantity: oldQuantity })
  }, [items, updateItem, supabase])

  const handleAddToFavorites = useCallback(async (item: ListItem) => {
    await addFavoriteItem({
      name: item.name, quantity: item.quantity, unit: item.unit, category: item.category,
    })
  }, [addFavoriteItem])

  const handleAddFromFavorite = useCallback(async (favorite: typeof favoriteItems[0]) => {
    const result = await addItemToListFromFavorite(favorite, list.id)
    if (result) {
      if (result.action === 'created') addItem(result.item as ListItemWithImage)
      else updateItem(result.item.id, { quantity: result.item.quantity, checked: result.item.checked })
    }
  }, [addItemToListFromFavorite, list.id, addItem, updateItem])

  // Drag and Drop
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = uncheckedItems.findIndex((item) => item.id === active.id)
    const newIndex = uncheckedItems.findIndex((item) => item.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reorderedUnchecked = arrayMove(uncheckedItems, oldIndex, newIndex)
    const allItems = [...reorderedUnchecked, ...checkedItems]
    setItems(allItems)

    const updates = reorderedUnchecked.map((item, index) => ({ id: item.id, position: index }))
    updateItemsPositions(updates)
    
    // Background update
    await Promise.all(updates.map(u => supabase.from('list_items').update({ position: u.position }).eq('id', u.id)))
  }, [uncheckedItems, checkedItems, setItems, updateItemsPositions, supabase])

  // ... (Funciones de Modales: copyLink, updateName, deleteList... se mantienen igual) ...
  // Por brevedad, asumo que tienes las funciones handleCopyLink, handleUpdateName, handleDeleteList, handleDuplicateList, closeMenu, openShareModal... 
  // Copia las de tu código anterior o pídemelas si las necesitas.
  // Aquí pongo dummies para que compile si copias-pegas:
  const handleCopyLink = () => { navigator.clipboard.writeText(shareUrl); setIsCopied(true); setTimeout(() => setIsCopied(false), 2000) }
  const handleUpdateName = async () => { if(!newName.trim()) return; await supabase.from('shopping_lists').update({name: newName}).eq('id', list.id); closeModal(); router.refresh() }
  const handleDeleteList = async () => { await supabase.from('shopping_lists').delete().eq('id', list.id); router.push('/lists') }
  const handleDuplicateList = async () => {/* ...lógica anterior... */}
  const closeModal = () => setActiveModal(null)
  const openShareModal = () => setActiveModal('share')
  const openCollaboratorsModal = () => setActiveModal('collaborators')
  const toggleMenu = () => setShowMenu(p => !p)

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <header className="p-4 border-b border-gray-100 bg-background z-10 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center relative">
              <ShoppingBag className="w-5 h-5 text-primary" />
              <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
            </div>
            <div>
              <h1 className="font-bold text-lg">{list.name}</h1>
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-500">{items.length} productos</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 relative">
             {/* TOGGLE VIEW BUTTON */}
             <button 
                onClick={() => setViewMode(prev => prev === 'list' ? 'grouped' : 'list')}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${viewMode === 'grouped' ? 'bg-primary/10 text-primary' : 'hover:bg-secondary text-muted'}`}
                title={viewMode === 'list' ? "Ver por categorías" : "Ver lista simple"}
              >
                {viewMode === 'list' ? <LayoutGrid className="w-5 h-5" /> : <ListIcon className="w-5 h-5" />}
              </button>

            {presenceUsers.length > 0 && <PresenceIndicator users={presenceUsers} maxVisible={3} />}
            <button onClick={openCollaboratorsModal} className="w-10 h-10 rounded-xl hover:bg-secondary flex items-center justify-center text-muted"><Users className="w-5 h-5" /></button>
            <button onClick={openShareModal} className="w-10 h-10 rounded-xl hover:bg-secondary flex items-center justify-center text-muted"><Share2 className="w-5 h-5" /></button>
            <button onClick={toggleMenu} className="w-10 h-10 rounded-xl hover:bg-secondary flex items-center justify-center text-muted"><MoreVertical className="w-5 h-5" /></button>
            
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute top-12 right-0 w-48 bg-card border border-border rounded-xl shadow-xl z-20 py-2">
                  <button onClick={() => {setActiveModal('edit'); setShowMenu(false)}} className="w-full px-4 py-2 text-left text-sm hover:bg-hover flex gap-2"><Edit2 className="w-4 h-4" /> Editar nombre</button>
                  <button onClick={() => {setActiveModal('delete'); setShowMenu(false)}} className="w-full px-4 py-2 text-left text-sm text-danger hover:bg-danger/10 flex gap-2"><Trash2 className="w-4 h-4" /> Eliminar lista</button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </header>

      {user && (
        <div className="flex-shrink-0">
          <ListNotes listId={list.id} listName={list.name} currentUser={user} isCollaborative={collaborators.length > 0 || list.share_code !== null} />
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-2 pb-40">
        {isLoading ? (
          <div className="space-y-2"><ItemSkeleton /><ItemSkeleton /></div>
        ) : (
          <>
            {/* VISTA POR CATEGORÍAS (Sin Drag&Drop entre grupos) */}
            {viewMode === 'grouped' && groupedItems ? (
               <div className="space-y-6 pb-4">
                 {groupedItems.map(([catId, groupItems]) => {
                   const CategoryConfig = CATEGORIES[catId as CategoryId] || CATEGORIES['other']
                   return (
                     <div key={catId} className="animate-in fade-in slide-in-from-bottom-2">
                       <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-2 flex items-center gap-2 mb-1 border-b border-dashed border-gray-100">
                         <div className={`p-1.5 rounded-lg ${CategoryConfig.color} bg-opacity-20`}>
                           <CategoryConfig.icon className={`w-4 h-4 ${CategoryConfig.color.split(' ')[0]}`} />
                         </div>
                         <h3 className="font-semibold text-sm text-gray-700 capitalize">{CategoryConfig.label}</h3>
                         <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{groupItems.length}</span>
                       </div>
                       <div className="space-y-2 pl-2 border-l-2 border-gray-50">
                          {groupItems.map(item => (
                             <ShoppingItem 
                               key={item.id} 
                               item={item}
                               onToggle={handleToggleItem}
                               onDelete={handleDeleteItem}
                               onUpdateQuantity={handleUpdateQuantity}
                               onAddToFavorites={handleAddToFavorites}
                               addedByProfile={profilesCache.get(item.added_by)}
                               checkedByProfile={item.checked_by ? profilesCache.get(item.checked_by) : null}
                               isDragEnabled={false} // Desactivamos drag visualmente en modo grupo
                             />
                          ))}
                       </div>
                     </div>
                   )
                 })}
               </div>
            ) : (
              /* VISTA DE LISTA (Drag&Drop habilitado) */
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={uncheckedItems.map(item => item.id)} strategy={verticalListSortingStrategy}>
                  {uncheckedItems.map((item) => (
                    <SortableShoppingItem
                      key={item.id}
                      item={item}
                      onToggle={handleToggleItem}
                      onDelete={handleDeleteItem}
                      onUpdateQuantity={handleUpdateQuantity}
                      onAddToFavorites={handleAddToFavorites}
                      addedByProfile={profilesCache.get(item.added_by)}
                      checkedByProfile={item.checked_by ? profilesCache.get(item.checked_by) : null}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}

            {/* COMPLETADOS */}
            {checkedItems.length > 0 && (
              <div className="mt-6 border-t border-dashed border-gray-100 pt-4">
                <button
                  onClick={() => setShowCompleted(!showCompleted)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors w-full mb-3"
                >
                  <div className="p-1 rounded bg-gray-100">
                    {showCompleted ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </div>
                  <span>Completados ({checkedItems.length})</span>
                  <div className="h-px flex-1 bg-gray-100 ml-2" />
                </button>

                {showCompleted && (
                  <div className="space-y-2 opacity-60">
                    {checkedItems.map((item) => (
                      <ShoppingItem
                        key={item.id}
                        item={item}
                        onToggle={handleToggleItem}
                        onDelete={handleDeleteItem}
                        onUpdateQuantity={handleUpdateQuantity}
                        onAddToFavorites={handleAddToFavorites}
                        addedByProfile={profilesCache.get(item.added_by)}
                        checkedByProfile={item.checked_by ? profilesCache.get(item.checked_by) : null}
                        isDragEnabled={false}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <UndoToast message={undoState.message} isVisible={undoState.isVisible} onUndo={handleUndo} />

      <div className="fixed bottom-0 left-0 right-0 bg-background z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] border-t border-border/50">
        <FavoriteItems favorites={favoriteItems} isLoading={favoritesLoading} onAddToList={handleAddFromFavorite} onRemove={removeFavoriteItem} />
        <AddItemForm onAdd={handleAddItem} suggestionsSource={favoriteItems} />
      </div>

      {/* MODALES DE SOPORTE */}
      <Modal isOpen={activeModal === 'share'} onClose={closeModal} title="Compartir">
         <div className="flex flex-col items-center gap-4">
           <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(shareUrl)}`} alt="QR" className="rounded-xl border" />
           <p className="font-mono text-sm bg-secondary p-2 rounded">{shareUrl}</p>
           <Button onClick={handleCopyLink}>{isCopied ? 'Copiado' : 'Copiar Enlace'}</Button>
         </div>
      </Modal>
      <Modal isOpen={activeModal === 'collaborators'} onClose={closeModal} title="Colaboradores">
          <div className="space-y-2">{collaborators.map((c, i) => <div key={i} className="p-2 border rounded">{c.profiles.name} ({c.role})</div>)}</div>
      </Modal>
      <Modal isOpen={activeModal === 'edit'} onClose={closeModal} title="Editar Nombre">
          <div className="gap-2 flex flex-col"><Input value={newName} onChange={e => setNewName(e.target.value)} /><Button onClick={handleUpdateName}>Guardar</Button></div>
      </Modal>
       <Modal isOpen={activeModal === 'delete'} onClose={closeModal} title="Eliminar Lista">
          <div className="text-center"><p className="mb-4">¿Seguro?</p><Button variant="danger" onClick={handleDeleteList}>Eliminar</Button></div>
      </Modal>
    </div>
  )
}
