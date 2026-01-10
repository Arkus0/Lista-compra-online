'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ShoppingBag, Users, Share2, MoreVertical,
  Trash2, Edit2, Copy, Check, Link as LinkIcon,
  ChevronDown, ChevronRight, LayoutGrid, List as ListIcon, Undo2,
  Archive, CheckCheck, Eraser, Copy as CopyIcon, Search, X,
  FileText, Store
} from 'lucide-react'
import { ShoppingItem, AssignablePerson } from './ShoppingItem'
import { AddItemForm } from './AddItemForm'
import { PresenceIndicator } from './PresenceIndicator'
import { ListNotes } from './ListNotes'
import { FavoriteItems } from './FavoriteItems'
import { useFavorites } from '@/hooks/useFavorites'
import { useImageUpload } from '@/hooks/useImageUpload'
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
import { CATEGORIES, CategoryId, detectCategory, getSmartSuggestions, CommonProduct } from '@/lib/constants'

interface ShoppingListProps {
  list: ShoppingListType
}

interface Collaborator {
  role: string
  user_id: string
  profiles: {
    id: string
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
  const items = useItems() as ListItem[]
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

  // Hook de subida de imágenes
  const { upload: uploadImage, isUploading: isUploadingImage } = useImageUpload({ bucket: 'list-images' })

  const [isLoading, setIsLoading] = useState(true)
  const [activeModal, setActiveModal] = useState<'share' | 'collaborators' | 'edit' | 'delete' | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [showCompleted, setShowCompleted] = useState(false)
  
  // ESTADOS NUEVOS
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [undoState, setUndoState] = useState<{
    isVisible: boolean
    message: string
    action: () => Promise<void> | void
    timer: NodeJS.Timeout | null
  }>({ isVisible: false, message: '', action: () => {}, timer: null })

  // Estados para scroll y visibilidad de controles
  const [isControlsVisible, setIsControlsVisible] = useState(true)
  const [isInputActive, setIsInputActive] = useState(false) // Nuevo estado para favoritos
  const lastScrollY = useRef(0)

  // Estados para funcionalidades especificas
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [collaboratorsLoaded, setCollaboratorsLoaded] = useState(false)
  const [newName, setNewName] = useState(list.name)
  const [isCopied, setIsCopied] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [profilesCache, setProfilesCache] = useState<Map<string, Profile>>(new Map())

  // Estados para modales de imagen y nota
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editingItemNote, setEditingItemNote] = useState('')
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)

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

  // Control de scroll para ocultar UI (con fix de rebote)
  const handleListScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    
    // Fix: Si estamos cerca del final, forzar mostrar controles
    // Esto evita el "baile" o vibración cuando el footer desaparece/aparece cambiando la altura del viewport
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100

    if (isNearBottom) {
      if (!isControlsVisible) setIsControlsVisible(true)
      lastScrollY.current = scrollTop
      return
    }

    if (scrollTop > lastScrollY.current && scrollTop > 20) {
      setIsControlsVisible(false)
    } else if (scrollTop < lastScrollY.current || scrollTop < 20) {
      setIsControlsVisible(true)
    }
    lastScrollY.current = scrollTop
  }

  // Filtrar items por búsqueda
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items
    const query = searchQuery.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    return items.filter(item => {
      const name = item.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      return name.includes(query)
    })
  }, [items, searchQuery])

  const uncheckedItems = useMemo(() => filteredItems.filter((item) => !item.checked), [filteredItems])
  const checkedItems = useMemo(() => filteredItems.filter((item) => item.checked), [filteredItems])
  
  // Función para normalizar categoría (manejar legacy y autodetectar)
  const normalizeCategory = useCallback((item: ListItem): CategoryId => {
    // Si tiene categoría válida del sistema, usarla
    if (item.category && CATEGORIES[item.category as CategoryId]) {
      return item.category as CategoryId
    }

    // Mapeo de categorías legacy a nuevas
    const legacyMapping: Record<string, CategoryId> = {
      'Frutas': 'fruits-veg',
      'Verduras': 'fruits-veg',
      'Carnes': 'meat-fish',
      'Pescados': 'meat-fish',
      'Lácteos': 'dairy',
      'Panadería': 'pantry',
      'Bebidas': 'beverages',
      'Limpieza': 'household',
      'Otros': 'other',
    }

    if (item.category && legacyMapping[item.category]) {
      return legacyMapping[item.category]
    }

    // Autodetectar categoría basándose en el nombre del producto
    return detectCategory(item.name)
  }, [])

  // Agrupación de Items mejorada
  const groupedItems = useMemo(() => {
    if (viewMode === 'list') return null

    // Orden definido en constants.ts
    const groups: Record<CategoryId, ListItem[]> = {} as Record<CategoryId, ListItem[]>

    // Inicializar grupos vacíos para mantener orden
    Object.keys(CATEGORIES).forEach(key => { groups[key as CategoryId] = [] })

    uncheckedItems.forEach(item => {
      const cat = normalizeCategory(item)
      groups[cat].push(item)
    })

    // Ordenar items dentro de cada grupo por posición
    Object.keys(groups).forEach(key => {
      groups[key as CategoryId].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    })

    // Filtrar grupos vacíos y retornar
    return Object.entries(groups).filter(([_, items]) => items.length > 0) as [CategoryId, ListItem[]][]
  }, [uncheckedItems, viewMode, normalizeCategory])

  // Sugerencias inteligentes basadas en items de la lista
  const smartSuggestions = useMemo(() => {
    const itemNames = items.map(item => item.name)
    return getSmartSuggestions(itemNames, 4)
  }, [items])

  // Lista de personas asignables (usuario actual + colaboradores)
  const assignablePeople = useMemo((): AssignablePerson[] => {
    const people: AssignablePerson[] = []
    const addedIds = new Set<string>()

    // Añadir usuario actual primero
    if (user) {
      people.push({
        id: user.id,
        name: user.name || 'Yo',
        avatar_url: user.avatar_url || null
      })
      addedIds.add(user.id)
    }

    // Añadir colaboradores (evitando duplicados)
    collaborators.forEach(collab => {
      if (collab.profiles && collab.user_id && !addedIds.has(collab.user_id)) {
        people.push({
          id: collab.user_id,
          name: collab.profiles.name || collab.profiles.email,
          avatar_url: collab.profiles.avatar_url
        })
        addedIds.add(collab.user_id)
      }
    })

    return people
  }, [user, collaborators])

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
        setItems(data as ListItem[])
      }
      if (isMounted) setIsLoading(false)
    }
    loadItems()
    return () => { isMounted = false }
  }, [list.id, setItems, supabase])

  // Cargar colaboradores al montar (para asignación de items)
  useEffect(() => {
    const loadCollaborators = async () => {
      const { data } = await supabase
        .from('list_collaborators')
        .select('role, user_id, profiles(id, email, name, avatar_url)')
        .eq('list_id', list.id)
      if (data) {
        setCollaborators(data as unknown as Collaborator[])
        setCollaboratorsLoaded(true)
      }
    }
    if (!collaboratorsLoaded) loadCollaborators()
  }, [list.id, supabase, collaboratorsLoaded])

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
    
    // TIEMPO REDUCIDO A 2 SEGUNDOS
    const timer = setTimeout(() => {
      setUndoState(prev => ({ ...prev, isVisible: false }))
    }, 2000)

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
        addItem(data as ListItem)
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
      if (data) addItem(data as ListItem)
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
      if (result.action === 'created') addItem(result.item as ListItem)
      else updateItem(result.item.id, { quantity: result.item.quantity, checked: result.item.checked })
    }
  }, [addItemToListFromFavorite, list.id, addItem, updateItem])

  // Añadir item desde sugerencia inteligente
  const handleAddFromSuggestion = useCallback((suggestion: CommonProduct) => {
    handleAddItem(suggestion.name, suggestion.category)
  }, [handleAddItem])

  // Asignar item a una persona
  const handleAssignItem = useCallback(async (itemId: string, userId: string | null) => {
    const item = items.find(i => i.id === itemId)
    if (!item) return

    // Actualizar en store
    updateItem(itemId, { assigned_to: userId } as any)

    // Actualizar en DB
    const { error } = await supabase
      .from('list_items')
      .update({ assigned_to: userId })
      .eq('id', itemId)

    if (error) {
      // Revertir en caso de error
      updateItem(itemId, { assigned_to: item.assigned_to } as any)
    }
  }, [items, updateItem, supabase])

  // Abrir modal para añadir/editar imagen de un item
  const handleAddImage = useCallback((itemId: string) => {
    setEditingItemId(itemId)
    setShowImageModal(true)
    // Trigger file input
    setTimeout(() => imageInputRef.current?.click(), 100)
  }, [])

  // Subir imagen para un item
  const handleImageSelected = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editingItemId) return

    const item = items.find(i => i.id === editingItemId)
    if (!item) return

    // Subir imagen
    const path = `items/${Date.now()}_${Math.random().toString(36).slice(2)}`
    const imageUrl = await uploadImage(file, path)

    if (imageUrl) {
      // Actualizar en store
      updateItem(editingItemId, { image_url: imageUrl } as any)

      // Actualizar en DB
      await supabase
        .from('list_items')
        .update({ image_url: imageUrl })
        .eq('id', editingItemId)
    }

    // Cerrar y limpiar
    setShowImageModal(false)
    setEditingItemId(null)
    if (imageInputRef.current) imageInputRef.current.value = ''
  }, [editingItemId, items, uploadImage, updateItem, supabase])

  // Abrir modal para añadir/editar nota de un item
  const handleAddNote = useCallback((itemId: string) => {
    const item = items.find(i => i.id === itemId)
    setEditingItemId(itemId)
    setEditingItemNote(item?.note || '')
    setShowNoteModal(true)
  }, [items])

  // Guardar nota de un item
  const handleSaveNote = useCallback(async () => {
    if (!editingItemId) return

    const item = items.find(i => i.id === editingItemId)
    if (!item) return

    const noteValue = editingItemNote.trim() || null

    // Actualizar en store
    updateItem(editingItemId, { note: noteValue } as any)

    // Actualizar en DB
    await supabase
      .from('list_items')
      .update({ note: noteValue })
      .eq('id', editingItemId)

    // Cerrar modal
    setShowNoteModal(false)
    setEditingItemId(null)
    setEditingItemNote('')
  }, [editingItemId, editingItemNote, items, updateItem, supabase])

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

  // --- FUNCIONES DE MODALES Y ACCIONES ---
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const closeModal = useCallback(() => setActiveModal(null), [])

  const handleUpdateName = async () => {
    if (!newName.trim()) return
    await supabase.from('shopping_lists').update({ name: newName }).eq('id', list.id)
    closeModal()
    router.refresh()
  }

  const handleDeleteList = async () => {
    await supabase.from('shopping_lists').delete().eq('id', list.id)
    router.push('/lists')
  }

  const handleArchiveList = async () => {
    await supabase.from('shopping_lists').update({ is_archived: true }).eq('id', list.id)
    router.push('/lists')
  }

  const handleDuplicateList = async () => {
    if (isDuplicating) return
    setIsDuplicating(true)

    // Crear nueva lista
    const { data: newList, error: listError } = await supabase
      .from('shopping_lists')
      .insert({
        name: `${list.name} (copia)`,
        owner_id: user?.id,
        share_code: null
      })
      .select()
      .single()

    if (listError || !newList) {
      setIsDuplicating(false)
      return
    }

    // Copiar items
    if (items.length > 0) {
      const itemsCopy = items.map((item, index) => ({
        list_id: newList.id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        checked: false,
        added_by: user?.id,
        position: index
      }))

      await supabase.from('list_items').insert(itemsCopy)
    }

    setIsDuplicating(false)
    setShowMenu(false)
    router.push(`/lists/${newList.id}`)
  }

  const handleSaveAsTemplate = async () => {
    if (!user) return

    // Crear lista como plantilla
    const { data: newTemplate, error } = await supabase
      .from('shopping_lists')
      .insert({
        name: `${list.name} (plantilla)`,
        owner_id: user.id,
        is_template: true
      })
      .select()
      .single()

    if (error || !newTemplate) return

    // Copiar items
    if (items.length > 0) {
      const itemsCopy = items.map((item, index) => ({
        list_id: newTemplate.id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        checked: false,
        added_by: user.id,
        position: index
      }))

      await supabase.from('list_items').insert(itemsCopy)
    }

    setShowMenu(false)
    // Mostrar feedback
    showUndoToast('Plantilla creada correctamente', () => {
      router.push('/lists/templates')
    })
  }

  // --- ACCIONES MASIVAS ---
  const handleMarkAllComplete = async () => {
    if (!user) return

    // Actualizar en store
    const updates = uncheckedItems.map(item => ({
      ...item,
      checked: true,
      checked_by: user.id
    }))
    setItems([...updates, ...checkedItems])

    // Actualizar en DB
    await supabase
      .from('list_items')
      .update({ checked: true, checked_by: user.id })
      .eq('list_id', list.id)
      .eq('checked', false)

    setShowMenu(false)
  }

  const handleClearCompleted = async () => {
    if (checkedItems.length === 0) return

    // Guardar para undo
    const itemsToDelete = [...checkedItems]

    // Actualizar store
    setItems(uncheckedItems)

    // Mostrar undo
    const undoAction = async () => {
      // Restaurar items
      const itemsToRestore = itemsToDelete.map(item => ({
        list_id: item.list_id,
        name: item.name,
        quantity: item.quantity,
        category: item.category,
        added_by: item.added_by,
        checked: true,
        position: item.position
      }))
      const { data } = await supabase.from('list_items').insert(itemsToRestore).select()
      if (data) {
        // Recargar todos los items desde la DB para tener el estado actualizado
        const { data: allItems } = await supabase
          .from('list_items')
          .select('*')
          .eq('list_id', list.id)
          .order('position', { ascending: true })
        if (allItems) setItems(allItems as ListItem[])
      }
    }

    showUndoToast(`${itemsToDelete.length} items eliminados`, undoAction)

    // Eliminar de DB
    await supabase
      .from('list_items')
      .delete()
      .eq('list_id', list.id)
      .eq('checked', true)

    setShowMenu(false)
  }

  const openShareModal = () => setActiveModal('share')
  const openCollaboratorsModal = () => setActiveModal('collaborators')
  const toggleMenu = () => setShowMenu(p => !p)
  
  // Handler memoizado para cerrar modal de notas
  const handleCloseNoteModal = useCallback(() => {
    setShowNoteModal(false)
    setEditingItemId(null)
    setEditingItemNote('')
  }, [])

  return (
    <div className="flex flex-col h-full relative">
      {/* Header sin barra de progreso */}
      <header className="p-4 border-b border-gray-100 bg-background z-10 flex-shrink-0">
        {/* Barra de búsqueda expandible */}
        {showSearch ? (
          <div className="flex items-center gap-2 mb-3 animate-in slide-in-from-top-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar en la lista..."
                className="w-full h-10 pl-10 pr-10 rounded-xl bg-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                >
                  <X className="w-3 h-3 text-muted" />
                </button>
              )}
            </div>
            <button
              onClick={() => { setShowSearch(false); setSearchQuery('') }}
              className="p-2 hover:bg-secondary rounded-lg text-muted"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between mb-1">
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
              {/* Botón de búsqueda */}
              <button
                onClick={() => { setShowSearch(true); setTimeout(() => searchInputRef.current?.focus(), 100) }}
                className="w-10 h-10 rounded-xl hover:bg-secondary flex items-center justify-center text-muted"
                title="Buscar"
              >
                <Search className="w-5 h-5" />
              </button>
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
                <div className="absolute top-12 right-0 w-56 bg-card border border-border rounded-xl shadow-xl z-20 py-2">
                  {/* Acciones masivas */}
                  {uncheckedItems.length > 0 && (
                    <button onClick={handleMarkAllComplete} className="w-full px-4 py-2.5 text-left text-sm hover:bg-hover flex items-center gap-2">
                      <CheckCheck className="w-4 h-4 text-green-500" />
                      Marcar todo completado
                    </button>
                  )}
                  {checkedItems.length > 0 && (
                    <button onClick={handleClearCompleted} className="w-full px-4 py-2.5 text-left text-sm hover:bg-hover flex items-center gap-2">
                      <Eraser className="w-4 h-4 text-orange-500" />
                      Limpiar completados ({checkedItems.length})
                    </button>
                  )}
                  {(uncheckedItems.length > 0 || checkedItems.length > 0) && <div className="border-t border-border my-1" />}

                  {/* Acciones de lista */}
                  <button onClick={handleDuplicateList} disabled={isDuplicating} className="w-full px-4 py-2.5 text-left text-sm hover:bg-hover flex items-center gap-2 disabled:opacity-50">
                    <CopyIcon className="w-4 h-4 text-blue-500" />
                    {isDuplicating ? 'Duplicando...' : 'Duplicar lista'}
                  </button>
                  <button onClick={handleSaveAsTemplate} className="w-full px-4 py-2.5 text-left text-sm hover:bg-hover flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-500" />
                    Guardar como plantilla
                  </button>
                  <button onClick={() => {setActiveModal('edit'); setShowMenu(false)}} className="w-full px-4 py-2.5 text-left text-sm hover:bg-hover flex items-center gap-2">
                    <Edit2 className="w-4 h-4 text-muted" />
                    Editar nombre
                  </button>

                  <div className="border-t border-border my-1" />

                  {/* Modo Super (placeholder) */}
                  <button
                    onClick={() => { setShowMenu(false); alert('¡Próximamente! El modo super te permitirá organizar tu compra por pasillos del supermercado.') }}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-hover flex items-center gap-2 opacity-60"
                  >
                    <Store className="w-4 h-4 text-emerald-500" />
                    <span>Modo en el super</span>
                    <span className="ml-auto text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded">Pronto</span>
                  </button>

                  <div className="border-t border-border my-1" />

                  {/* Zona peligrosa */}
                  <button onClick={() => {handleArchiveList(); setShowMenu(false)}} className="w-full px-4 py-2.5 text-left text-sm hover:bg-hover flex items-center gap-2">
                    <Archive className="w-4 h-4 text-gray-500" />
                    Archivar lista
                  </button>
                  <button onClick={() => {setActiveModal('delete'); setShowMenu(false)}} className="w-full px-4 py-2.5 text-left text-sm text-danger hover:bg-danger/10 flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    Eliminar lista
                  </button>
                </div>
              </>
            )}
            </div>
          </div>
        )}

        {/* Indicador de búsqueda activa */}
        {searchQuery && (
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs text-muted">
              {filteredItems.length} resultados para "{searchQuery}"
            </span>
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-primary hover:underline"
            >
              Limpiar
            </button>
          </div>
        )}
      </header>

      {user && (
        <div className="flex-shrink-0">
          <ListNotes listId={list.id} listName={list.name} currentUser={user} isCollaborative={collaborators.length > 0 || list.share_code !== null} />
        </div>
      )}

      {/* AQUÍ ES DONDE OCURRE EL SCROLL: AÑADIDO onScroll */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-2 pb-40"
        onScroll={handleListScroll}
      >
        {isLoading ? (
          <div className="space-y-2"><ItemSkeleton /><ItemSkeleton /></div>
        ) : (
          <>
            {/* VISTA POR CATEGORÍAS (Sin Drag&Drop entre grupos) */}
            {viewMode === 'grouped' && groupedItems ? (
               <div className="space-y-4 pb-4">
                 {groupedItems.map(([catId, groupItems]) => {
                   const CategoryConfig = CATEGORIES[catId] || CATEGORIES['other']
                   return (
                     <div key={catId} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                       {/* Cabecera de categoría sticky */}
                       <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-2 mb-2">
                         <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${CategoryConfig.color}`}>
                           <CategoryConfig.icon className="w-5 h-5" />
                           <h3 className="font-semibold text-sm flex-1">{CategoryConfig.label}</h3>
                           <span className="text-xs font-medium bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded-full">
                             {groupItems.length} {groupItems.length === 1 ? 'item' : 'items'}
                           </span>
                         </div>
                       </div>
                       {/* Items de la categoría */}
                       <div className="space-y-2 ml-1 pl-3 border-l-2 border-gray-100 dark:border-gray-800">
                          {groupItems.map(item => (
                             <ShoppingItem
                               key={item.id}
                               item={item}
                               onToggle={handleToggleItem}
                               onDelete={handleDeleteItem}
                               onUpdateQuantity={handleUpdateQuantity}
                               onAddToFavorites={handleAddToFavorites}
                               onAssign={handleAssignItem}
                               onAddImage={handleAddImage}
                               onAddNote={handleAddNote}
                               assignablePeople={assignablePeople}
                               assignedToProfile={item.assigned_to ? profilesCache.get(item.assigned_to) : null}
                               addedByProfile={profilesCache.get(item.added_by)}
                               checkedByProfile={item.checked_by ? profilesCache.get(item.checked_by) : null}
                               isDragEnabled={false}
                             />
                          ))}
                       </div>
                     </div>
                   )
                 })}

                 {/* Mensaje si no hay items */}
                 {groupedItems.length === 0 && (
                   <div className="text-center py-12 text-muted">
                     <p>No hay items pendientes</p>
                   </div>
                 )}
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
                      onAssign={handleAssignItem}
                      onAddImage={handleAddImage}
                      onAddNote={handleAddNote}
                      assignablePeople={assignablePeople}
                      assignedToProfile={item.assigned_to ? profilesCache.get(item.assigned_to) : null}
                      addedByProfile={profilesCache.get(item.added_by)}
                      checkedByProfile={item.checked_by ? profilesCache.get(item.checked_by) : null}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}

            {/* COMPLETADOS REDISEÑADOS */}
            {checkedItems.length > 0 && (
              <div className="mt-8 pt-6 border-t-2 border-dashed border-border/50 bg-secondary/10 -mx-4 px-4 pb-10 rounded-t-3xl">
                <button
                  onClick={() => setShowCompleted(!showCompleted)}
                  className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors w-full mb-4"
                >
                  <div className={`p-1.5 rounded-lg transition-colors ${showCompleted ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted'}`}>
                    {showCompleted ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </div>
                  <span>Productos comprados ({checkedItems.length})</span>
                </button>

                {showCompleted && (
                  <div className="space-y-2 opacity-75 grayscale-[0.3] transition-all duration-300">
                    {checkedItems.map((item) => (
                      <ShoppingItem
                        key={item.id}
                        item={item}
                        onToggle={handleToggleItem}
                        onDelete={handleDeleteItem}
                        onUpdateQuantity={handleUpdateQuantity}
                        onAddToFavorites={handleAddToFavorites}
                        onAssign={handleAssignItem}
                        onAddImage={handleAddImage}
                        onAddNote={handleAddNote}
                        assignablePeople={assignablePeople}
                        assignedToProfile={item.assigned_to ? profilesCache.get(item.assigned_to) : null}
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
        {/* Sugerencias inteligentes */}
        {smartSuggestions.length > 0 && (
          <div className="px-4 py-2 border-b border-border/30 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-muted">✨ Sugerido para ti</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {smartSuggestions.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => handleAddFromSuggestion(suggestion)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-full border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all text-sm whitespace-nowrap group"
                >
                  <span className="text-xs opacity-60 group-hover:opacity-100">+</span>
                  <span>{suggestion.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Favoritos: Solo visibles si el input está activo */}
        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isInputActive ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}>
          <FavoriteItems favorites={favoriteItems} isLoading={favoritesLoading} onAddToList={handleAddFromFavorite} onRemove={removeFavoriteItem} />
        </div>

        {/* Pasamos la prop de visibilidad */}
        <AddItemForm 
          onAdd={handleAddItem} 
          suggestionsSource={favoriteItems} 
          isVisible={isControlsVisible} 
          onFocusChange={setIsInputActive}
        />
      </div>

      {/* MODALES DE SOPORTE */}
      <Modal isOpen={activeModal === 'share'} onClose={closeModal} title="Compartir Lista">
         <div className="flex flex-col items-center gap-4 py-2">
           <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareUrl)}`} alt="QR Code" className="rounded-xl border shadow-sm" />
           
           <div className="w-full space-y-2">
             <div className="text-xs text-muted font-medium uppercase tracking-wider text-center">Código de acceso</div>
             <p className="font-mono text-2xl text-center font-bold tracking-widest bg-secondary py-3 rounded-lg border border-border">{list.share_code}</p>
           </div>

           <p className="text-sm text-center text-muted px-4">
             Comparte este código o escanea el QR para que otros se unan a esta lista.
           </p>

           <Button onClick={handleCopyLink} className="w-full flex items-center justify-center gap-2">
             {isCopied ? <Check className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
             {isCopied ? 'Enlace Copiado' : 'Copiar Enlace de Invitación'}
           </Button>
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

      {/* Modal de Nota */}
      <Modal
        isOpen={showNoteModal}
        onClose={handleCloseNoteModal}
        title="Añadir nota"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Añade una nota específica para este producto (ej: marca preferida, ubicación en tienda, etc.)
          </p>
          <textarea
            value={editingItemNote}
            onChange={(e) => setEditingItemNote(e.target.value)}
            placeholder="Escribe tu nota aquí..."
            className="w-full h-32 px-4 py-3 rounded-xl border-2 border-border bg-input-bg text-foreground placeholder:text-muted-light focus:outline-none focus:border-primary transition-colors resize-none"
            autoFocus
          />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={handleCloseNoteModal}>
              Cancelar
            </Button>
            <Button onClick={handleSaveNote}>
              Guardar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Input oculto para subir imagen */}
      <input
        type="file"
        ref={imageInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleImageSelected}
      />

      {/* Indicador de subida de imagen */}
      {isUploadingImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card p-6 rounded-2xl shadow-xl flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-foreground font-medium">Subiendo imagen...</p>
          </div>
        </div>
      )}
    </div>
  )
}
