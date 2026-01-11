'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ShoppingBag, Users, Share2, MoreVertical,
  Trash2, Edit2, Check, Link as LinkIcon,
  ChevronDown, ChevronRight, LayoutGrid, Undo2,
  Archive, CheckCheck, Eraser, Copy as CopyIcon, Search, X,
  FileText, Zap, Plus, Eye, EyeOff, Star, Minus, ArrowLeft, Tag
} from 'lucide-react'
import { ShoppingItem, AssignablePerson } from './ShoppingItem'
import { AddItemDrawer } from './AddItemDrawer'
import { PresenceIndicator } from './PresenceIndicator'
import { ListNotes } from './ListNotes'
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
import { sendPushNotification } from '@/lib/notifications'
import { CATEGORIES, CategoryId, detectCategory, getSmartSuggestions, CommonProduct, getProductEmoji, getCategoryEmoji } from '@/lib/constants'
import { normalizeText } from '@/lib/utils'

// --- DATOS DEL CATÁLOGO RÁPIDO ---
const QUICK_CATALOG: Record<CategoryId, string[]> = {
  'fruits-veg': [
    'Manzanas', 'Plátanos', 'Lechuga', 'Tomates', 'Zanahorias', 
    'Cebollas', 'Patatas', 'Aguacate', 'Limones', 'Ajos', 
    'Pimientos', 'Naranjas', 'Calabacín', 'Pepino'
  ],
  'meat-fish': [
    'Pollo', 'Ternera', 'Carne picada', 'Jamón serrano', 'Jamón cocido', 
    'Pechuga de pavo', 'Salmón', 'Atún', 'Huevos', 'Bacon', 
    'Lomo', 'Salchichas', 'Merluza', 'Gambas'
  ],
  'dairy': [
    'Leche entera', 'Leche semi', 'Queso', 'Yogur natural', 'Yogur sabores', 
    'Mantequilla', 'Nata cocinar', 'Queso rallado', 'Leche vegetal', 'Queso fresco'
  ],
  'pantry': [
    'Arroz', 'Pasta', 'Pan', 'Aceite de oliva', 'Azúcar', 
    'Sal', 'Harina', 'Tomate frito', 'Legumbres', 'Cereales', 
    'Galletas', 'Café molido', 'Cacao en polvo', 'Especias'
  ],
  'frozen': [
    'Pizza', 'Guisantes', 'Helado', 'Verduras salteadas', 'Croquetas', 
    'Pescado congelado', 'Patatas fritas', 'Hielo', 'Frutos rojos'
  ],
  'beverages': [
    'Agua mineral', 'Refrescos', 'Cerveza', 'Vino tinto', 'Vino blanco', 
    'Zumo de naranja', 'Zumo de piña', 'Gaseosa', 'Aquarius'
  ],
  'household': [
    'Papel higiénico', 'Detergente ropa', 'Suavizante', 'Pastillas lavavajillas', 
    'Papel de cocina', 'Bolsas de basura', 'Fregasuelos', 'Lejía', 'Estropajos'
  ],
  'hygiene': [
    'Gel de ducha', 'Champú', 'Pasta de dientes', 'Desodorante', 'Jabón de manos', 
    'Compresas/Tampones', 'Espuma afeitar', 'Cuchillas', 'Crema hidratante'
  ],
  'pets': [
    'Comida perro', 'Comida gato', 'Arena de gato', 'Premios mascotas', 'Bolsas caca'
  ],
  'other': [
    'Pilas', 'Bombillas', 'Velas', 'Papel aluminio', 'Papel film'
  ]
}

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

// TIPOS DE TOAST
type ToastType = 'success' | 'info' | 'warning' | 'undo'

// COMPONENTE TOAST MEJORADO
function ActionToast({
  message,
  type = 'info',
  icon,
  onUndo,
  isVisible
}: {
  message: string,
  type?: ToastType,
  icon?: React.ReactNode,
  onUndo?: () => void,
  isVisible: boolean
}) {
  if (!isVisible) return null

  const bgColors = {
    success: 'bg-green-600',
    info: 'bg-foreground',
    warning: 'bg-amber-500',
    undo: 'bg-foreground'
  }

  return (
    <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300 w-[90%] max-w-sm pointer-events-auto">
      <div className={`${bgColors[type]} text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 justify-between`}>
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span className="text-sm font-medium truncate flex-1">{message}</span>
        {onUndo && (
          <button
            onClick={onUndo}
            className="text-white/90 font-bold text-sm hover:text-white flex items-center gap-1 whitespace-nowrap"
          >
            <Undo2 className="w-4 h-4" /> Deshacer
          </button>
        )}
      </div>
    </div>
  )
}

// COMPONENTE TOAST LEGACY (para compatibilidad)
function UndoToast({
  message,
  onUndo,
  isVisible
}: {
  message: string,
  onUndo: () => void,
  isVisible: boolean
}) {
  return (
    <ActionToast
      message={message}
      type="undo"
      onUndo={onUndo}
      isVisible={isVisible}
      icon={<Check className="w-4 h-4" />}
    />
  )
}

// COMPONENTE MODAL DE CATÁLOGO
function CatalogModal({
  isOpen,
  onClose,
  onSelect,
  onRemove,
  currentItems
}: {
  isOpen: boolean,
  onClose: () => void,
  onSelect: (name: string, category: string) => void,
  onRemove: (id: string) => void,
  currentItems: ListItem[]
}) {
  const [activeTab, setActiveTab] = useState<CategoryId>('fruits-veg')

  if (!isOpen) return null

  const handleAddClick = (item: string, categoryId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10)
    onSelect(item, categoryId)
  }

  const handleRemoveClick = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10)
    onRemove(itemId)
  }

  // Map of item names to their quantity and id (only unchecked items)
  const itemQuantityMap = new Map<string, { quantity: number, id: string }>()
  currentItems.filter(i => !i.checked).forEach(item => {
    const key = item.name.toLowerCase()
    itemQuantityMap.set(key, { quantity: item.quantity || 1, id: item.id })
  })

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background animate-in slide-in-from-bottom duration-300">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-card">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <LayoutGrid className="w-5 h-5 text-primary" />
          Catálogo Rápido
        </h2>
        <button onClick={onClose} className="p-2 bg-secondary rounded-full hover:bg-gray-200 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex overflow-x-auto py-3 px-2 gap-2 border-b border-border bg-card/50 no-scrollbar">
        {Object.values(CATEGORIES).map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveTab(cat.id)}
            className={`flex flex-col items-center gap-1 min-w-[70px] p-2 rounded-xl transition-all ${
              activeTab === cat.id
                ? 'bg-primary text-primary-foreground shadow-md scale-105'
                : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
            }`}
          >
            <cat.icon className="w-6 h-6" />
            <span className="text-[10px] font-medium leading-none">{cat.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-secondary/10">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pb-20">
          {QUICK_CATALOG[activeTab]?.map((item) => {
             const itemData = itemQuantityMap.get(item.toLowerCase())
             const quantity = itemData?.quantity || 0
             const hasItem = quantity > 0

             return (
              <div
                key={item}
                className={`
                  aspect-square flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-200
                  ${hasItem
                    ? 'bg-primary/10 border-primary shadow-[0_0_0_2px] shadow-primary/20'
                    : 'bg-card border-border shadow-sm'
                  }
                `}
              >
                {hasItem ? (
                  // Show quantity with +/- buttons
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      onClick={(e) => handleRemoveClick(itemData!.id, e)}
                      className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 flex items-center justify-center hover:bg-red-200 dark:hover:bg-red-900/50 active:scale-95 transition-all"
                    >
                      <span className="text-xl font-bold leading-none">−</span>
                    </button>
                    <span className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-base font-bold">
                      {quantity}
                    </span>
                    <button
                      onClick={(e) => handleAddClick(item, activeTab, e)}
                      className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center hover:bg-green-200 dark:hover:bg-green-900/50 active:scale-95 transition-all"
                    >
                      <span className="text-xl font-bold leading-none">+</span>
                    </button>
                  </div>
                ) : (
                  // Show add button
                  <button
                    onClick={(e) => handleAddClick(item, activeTab, e)}
                    className="w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors bg-secondary text-muted-foreground hover:bg-primary hover:text-primary-foreground active:scale-95"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                )}
                <span className="text-2xl mb-1">{getProductEmoji(item, activeTab)}</span>
                <span className="text-sm text-center font-medium leading-tight line-clamp-2">{item}</span>
              </div>
             )
          })}
        </div>
      </div>
    </div>
  )
}

export function ShoppingList({ list }: ShoppingListProps) {
  const items = useItems() as ListItem[]
  const { setItems, addItem, updateItem, removeItem, toggleItemChecked, updateItemsPositions } = useItemsActions()
  const user = useUser()

  const { presenceUsers, isConnected } = useRealtimeList({ listId: list.id, user })

  const {
    favoriteItems,
    isLoading: favoritesLoading,
    addFavoriteItem,
    removeFavoriteItem,
    addItemToListFromFavorite,
  } = useFavorites(user?.id)

  const { upload: uploadImage, isUploading: isUploadingImage } = useImageUpload({ bucket: 'list-images' })

  const [isLoading, setIsLoading] = useState(true)
  const [activeModal, setActiveModal] = useState<'share' | 'collaborators' | 'edit' | 'delete' | 'catalog' | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [showCompleted, setShowCompleted] = useState(false)
  
  // ESTADO NUEVO: Controla la visibilidad de las notas globalmente
  const [showNotes, setShowNotes] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [undoState, setUndoState] = useState<{
    isVisible: boolean, message: string, action: () => Promise<void> | void, timer: NodeJS.Timeout | null
  }>({ isVisible: false, message: '', action: () => {}, timer: null })

  // Toast de acción para feedback visual
  const [actionToast, setActionToast] = useState<{
    isVisible: boolean, message: string, type: ToastType, icon?: React.ReactNode
  }>({ isVisible: false, message: '', type: 'info' })

  const headerRef = useRef<HTMLElement>(null)
  const [headerHeight, setHeaderHeight] = useState(130)

  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [collaboratorsLoaded, setCollaboratorsLoaded] = useState(false)
  const [newName, setNewName] = useState(list.name)
  const [isCopied, setIsCopied] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [profilesCache, setProfilesCache] = useState<Map<string, Profile>>(new Map())

  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editingItemNote, setEditingItemNote] = useState('')
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [showTagsModal, setShowTagsModal] = useState(false)
  const [editingItemTags, setEditingItemTags] = useState<string[]>([])
  const [newTagInput, setNewTagInput] = useState('')
  const [showEditNameModal, setShowEditNameModal] = useState(false)
  const [editingItemName, setEditingItemName] = useState('')
  const imageInputRef = useRef<HTMLInputElement>(null)

  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current
  const router = useRouter()

  // Ref para items - permite que los handlers sean estables sin recrearse
  const itemsRef = useRef(items)
  useEffect(() => { itemsRef.current = items }, [items])

  const shareUrl = useMemo(() =>
    typeof window !== 'undefined' ? `${window.location.origin}/join/${list.share_code}` : '',
    [list.share_code]
  )

  useEffect(() => {
    if (headerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          setHeaderHeight(entry.contentRect.height)
        }
      })
      resizeObserver.observe(headerRef.current)
      return () => resizeObserver.disconnect()
    }
  }, [user, collaborators, list.name])

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items
    const query = normalizeText(searchQuery)
    return items.filter(item => {
      const name = normalizeText(item.name)
      // Buscar en nombre
      if (name.includes(query)) return true
      // Buscar en etiquetas
      if (item.tags && item.tags.length > 0) {
        return item.tags.some(tag => normalizeText(tag).includes(query))
      }
      return false
    })
  }, [items, searchQuery])

  const uncheckedItems = useMemo(() => filteredItems.filter((item) => !item.checked), [filteredItems])
  const checkedItems = useMemo(() => filteredItems.filter((item) => item.checked), [filteredItems])
  
  const normalizeCategory = useCallback((item: ListItem): CategoryId => {
    if (item.category && CATEGORIES[item.category as CategoryId]) return item.category as CategoryId
    const legacyMapping: Record<string, CategoryId> = { 'Frutas': 'fruits-veg', 'Verduras': 'fruits-veg', 'Carnes': 'meat-fish', 'Pescados': 'meat-fish', 'Lácteos': 'dairy', 'Panadería': 'pantry', 'Bebidas': 'beverages', 'Limpieza': 'household', 'Otros': 'other' }
    if (item.category && legacyMapping[item.category]) return legacyMapping[item.category]
    return detectCategory(item.name)
  }, [])

  // Agrupación siempre activa
  const groupedItems = useMemo(() => {
    const groups: Record<CategoryId, ListItem[]> = {} as Record<CategoryId, ListItem[]>
    Object.keys(CATEGORIES).forEach(key => { groups[key as CategoryId] = [] })
    uncheckedItems.forEach(item => { groups[normalizeCategory(item)].push(item) })
    Object.keys(groups).forEach(key => groups[key as CategoryId].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)))
    return Object.entries(groups).filter(([_, items]) => items.length > 0) as [CategoryId, ListItem[]][]
  }, [uncheckedItems, normalizeCategory])

  const smartSuggestions = useMemo(() => getSmartSuggestions(items.map(i => i.name), 4), [items])

  const assignablePeople = useMemo((): AssignablePerson[] => {
    const people: AssignablePerson[] = []
    const addedIds = new Set<string>()
    if (user) { people.push({ id: user.id, name: user.name || 'Yo', avatar_url: user.avatar_url || null }); addedIds.add(user.id) }
    collaborators.forEach(collab => {
      if (collab.profiles && collab.user_id && !addedIds.has(collab.user_id)) {
        people.push({ id: collab.user_id, name: collab.profiles.name || collab.profiles.email, avatar_url: collab.profiles.avatar_url })
        addedIds.add(collab.user_id)
      }
    })
    return people
  }, [user, collaborators])

  useEffect(() => {
    let isMounted = true
    const loadItems = async () => {
      const { data, error } = await supabase.from('list_items').select('*').eq('list_id', list.id).order('position', { ascending: true, nullsFirst: false }).order('created_at', { ascending: true })
      if (!error && data && isMounted) setItems(data as ListItem[])
      if (isMounted) setIsLoading(false)
    }
    loadItems()
    return () => { isMounted = false }
  }, [list.id, setItems, supabase])

  useEffect(() => {
    const loadCollaborators = async () => {
      const { data } = await supabase.from('list_collaborators').select('role, user_id, profiles(id, email, name, avatar_url)').eq('list_id', list.id)
      if (data) { setCollaborators(data as unknown as Collaborator[]); setCollaboratorsLoaded(true) }
    }
    if (!collaboratorsLoaded) loadCollaborators()
  }, [list.id, supabase, collaboratorsLoaded])

  useEffect(() => {
    const loadProfiles = async () => {
      const userIds = new Set<string>()
      items.forEach((item) => { if (item.added_by) userIds.add(item.added_by); if (item.checked_by) userIds.add(item.checked_by); if (item.assigned_to) userIds.add(item.assigned_to) })
      const missingIds = Array.from(userIds).filter((id) => !profilesCache.has(id))
      if (missingIds.length === 0) return
      const { data } = await supabase.from('profiles').select('*').in('id', missingIds)
      if (data) setProfilesCache((prev) => { const newCache = new Map(prev); data.forEach((profile) => newCache.set(profile.id, profile)); return newCache })
    }
    if (items.length > 0) loadProfiles()
  }, [items, supabase, profilesCache])

  // --- HANDLERS ---
  const showUndoToast = (message: string, undoAction: () => Promise<void> | void) => {
    if (undoState.timer) clearTimeout(undoState.timer)
    const timer = setTimeout(() => setUndoState(prev => ({ ...prev, isVisible: false })), 2000)
    setUndoState({ isVisible: true, message, action: undoAction, timer })
  }
  const handleUndo = async () => { if (undoState.action) { await undoState.action(); setUndoState(prev => ({ ...prev, isVisible: false })); if (undoState.timer) clearTimeout(undoState.timer) } }

  // Show action toast (simple feedback without undo)
  const showActionToast = useCallback((message: string, type: ToastType = 'success', icon?: React.ReactNode) => {
    // Hide undo toast if visible
    setUndoState(prev => ({ ...prev, isVisible: false }))
    setActionToast({ isVisible: true, message, type, icon })
    setTimeout(() => setActionToast(prev => ({ ...prev, isVisible: false })), 1500)
  }, [])

  const handleAddItem = useCallback(async (name: string, category?: string, imageUrl?: string) => {
    if (!user) return
    const currentItems = itemsRef.current
    const normalizedName = name.trim().toLowerCase()
    const existingItem = currentItems.find(item => item.name.trim().toLowerCase() === normalizedName)
    if (existingItem) {
      const newQuantity = (existingItem.quantity || 1) + 1
      updateItem(existingItem.id, { quantity: newQuantity, checked: false })
      const { error } = await supabase.from('list_items').update({ quantity: newQuantity, checked: false, checked_by: null, category: existingItem.category === 'other' && category ? category : existingItem.category }).eq('id', existingItem.id)
      if (error) { updateItem(existingItem.id, { quantity: existingItem.quantity, checked: existingItem.checked }); return }
      showActionToast(`${existingItem.name} (×${newQuantity})`, 'success', <Plus className="w-4 h-4" />)
      sendPushNotification({ listId: list.id, listName: list.name, action: 'item_added', actorName: user.name || 'Alguien', itemName: existingItem.name, excludeUserId: user.id })
    } else {
      const maxPosition = currentItems.length > 0 ? Math.max(...currentItems.map(i => i.position ?? 0)) : -1
      const itemData = { list_id: list.id, name: name.trim(), category, added_by: user.id, position: maxPosition + 1, image_url: imageUrl }
      const { data, error } = await supabase.from('list_items').insert(itemData).select().single()
      if (!error && data) {
        addItem(data as ListItem)
        showActionToast(`Añadido: ${name.trim()}`, 'success', <Plus className="w-4 h-4" />)
        sendPushNotification({ listId: list.id, listName: list.name, action: 'item_added', actorName: user.name || 'Alguien', itemName: name, excludeUserId: user.id })
      }
    }
  }, [user, list.id, list.name, supabase, updateItem, addItem, showActionToast])

  const handleToggleItem = useCallback(async (id: string) => {
    const item = itemsRef.current.find((i) => i.id === id); if (!item || !user) return
    const newChecked = !item.checked; toggleItemChecked(id)
    const undoAction = async () => { toggleItemChecked(id); await supabase.from('list_items').update({ checked: !newChecked, checked_by: !newChecked ? null : user.id }).eq('id', id) }
    if (newChecked) {
      showUndoToast(`Comprado: ${item.name}`, undoAction)
    } else {
      showActionToast(`Devuelto a la lista: ${item.name}`, 'info', <Undo2 className="w-4 h-4" />)
    }
    const { error } = await supabase.from('list_items').update({ checked: newChecked, checked_by: newChecked ? user.id : null }).eq('id', id)
    if (error) toggleItemChecked(id); else if (newChecked) sendPushNotification({ listId: list.id, listName: list.name, action: 'item_checked', actorName: user.name || 'Alguien', itemName: item.name, excludeUserId: user.id })
  }, [user, toggleItemChecked, supabase, list.id, list.name, showActionToast])

  const handleDeleteItem = useCallback(async (id: string) => {
    const item = itemsRef.current.find((i) => i.id === id); if (!item || !user) return; removeItem(id)
    const undoAction = async () => { const { data } = await supabase.from('list_items').insert({ list_id: item.list_id, name: item.name, quantity: item.quantity, category: item.category, added_by: item.added_by, image_url: item.image_url, position: item.position }).select().single(); if (data) addItem(data as ListItem) }
    showUndoToast(`Eliminado: ${item.name}`, undoAction); const { error } = await supabase.from('list_items').delete().eq('id', id); if (error) addItem(item); else sendPushNotification({ listId: list.id, listName: list.name, action: 'item_removed', actorName: user.name || 'Alguien', itemName: item.name, excludeUserId: user.id })
  }, [user, removeItem, addItem, supabase, list.id, list.name])

  const handleUpdateQuantity = useCallback(async (id: string, quantity: number) => { const item = itemsRef.current.find((i) => i.id === id); if (!item) return; const oldQuantity = item.quantity; updateItem(id, { quantity }); const { error } = await supabase.from('list_items').update({ quantity }).eq('id', id); if (error) updateItem(id, { quantity: oldQuantity }) }, [updateItem, supabase])

  // Handle catalog decrement: reduce quantity or remove if quantity is 1
  const handleCatalogRemove = useCallback(async (id: string) => {
    const item = itemsRef.current.find((i) => i.id === id)
    if (!item) return

    const currentQuantity = item.quantity || 1

    if (currentQuantity <= 1) {
      // Remove the item completely
      await handleDeleteItem(id)
    } else {
      // Decrement quantity
      await handleUpdateQuantity(id, currentQuantity - 1)
    }
  }, [handleDeleteItem, handleUpdateQuantity])
  const handleAddToFavorites = useCallback(async (item: ListItem) => {
    const success = await addFavoriteItem({ name: item.name, quantity: item.quantity, unit: item.unit, category: item.category })
    if (success) {
      showActionToast(`Añadido a favoritos: ${item.name}`, 'success', <Star className="w-4 h-4" />)
    } else {
      showActionToast(`Error al guardar favorito`, 'warning', <Star className="w-4 h-4" />)
    }
  }, [addFavoriteItem, showActionToast])
  const handleAddFromFavorite = useCallback(async (favorite: typeof favoriteItems[0]) => {
    const result = await addItemToListFromFavorite(favorite, list.id)
    if (result) {
      if (result.action === 'created') {
        addItem(result.item as ListItem)
        showActionToast(`Añadido: ${favorite.name}`, 'success', <Star className="w-4 h-4" />)
      } else {
        updateItem(result.item.id, { quantity: result.item.quantity, checked: result.item.checked })
        showActionToast(`${favorite.name} (×${result.item.quantity})`, 'success', <Plus className="w-4 h-4" />)
      }
    }
  }, [addItemToListFromFavorite, list.id, addItem, updateItem, showActionToast])
  const handleAddFromSuggestion = useCallback((suggestion: CommonProduct) => { handleAddItem(suggestion.name, suggestion.category) }, [handleAddItem])
  const handleAssignItem = useCallback(async (itemId: string, userId: string | null) => { const item = itemsRef.current.find(i => i.id === itemId); if (!item) return; updateItem(itemId, { assigned_to: userId } as any); const { error } = await supabase.from('list_items').update({ assigned_to: userId }).eq('id', itemId); if (error) updateItem(itemId, { assigned_to: item.assigned_to } as any) }, [updateItem, supabase])
  const handleAddImage = useCallback((itemId: string) => { setEditingItemId(itemId); setShowImageModal(true); setTimeout(() => imageInputRef.current?.click(), 100) }, [])
  const handleImageSelected = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file || !editingItemId) return; const path = `items/${Date.now()}_${Math.random().toString(36).slice(2)}`; const imageUrl = await uploadImage(file, path); if (imageUrl) { updateItem(editingItemId, { image_url: imageUrl } as any); await supabase.from('list_items').update({ image_url: imageUrl }).eq('id', editingItemId) } setShowImageModal(false); setEditingItemId(null); if (imageInputRef.current) imageInputRef.current.value = '' }, [editingItemId, uploadImage, updateItem, supabase])
  const handleAddNote = useCallback((itemId: string) => { const item = itemsRef.current.find(i => i.id === itemId); setEditingItemId(itemId); setEditingItemNote(item?.note || ''); setShowNoteModal(true) }, [])
  const handleAddTags = useCallback((itemId: string) => { const item = itemsRef.current.find(i => i.id === itemId); setEditingItemId(itemId); setEditingItemTags(item?.tags || []); setNewTagInput(''); setShowTagsModal(true) }, [])
  const handleEditName = useCallback((itemId: string) => { const item = itemsRef.current.find(i => i.id === itemId); setEditingItemId(itemId); setEditingItemName(item?.name || ''); setShowEditNameModal(true) }, [])
  const handleSaveName = useCallback(async () => {
    if (!editingItemId || !editingItemName.trim()) return
    const newName = editingItemName.trim()
    const item = itemsRef.current.find(i => i.id === editingItemId)
    const itemIdToSave = editingItemId

    updateItem(editingItemId, { name: newName })
    setShowEditNameModal(false)
    setEditingItemId(null)
    setEditingItemName('')

    const { error } = await supabase.from('list_items').update({ name: newName }).eq('id', itemIdToSave)
    if (error) {
      console.error('Error guardando nombre:', error)
      updateItem(itemIdToSave, { name: item?.name || '' })
    }
  }, [editingItemId, editingItemName, updateItem, supabase])
  const handleSaveNote = useCallback(async () => {
    if (!editingItemId) return
    const noteValue = editingItemNote.trim() || null
    const item = itemsRef.current.find(i => i.id === editingItemId)
    const itemIdToSave = editingItemId

    // Actualizar estado local primero (optimistic update)
    updateItem(editingItemId, { note: noteValue })
    setShowNoteModal(false)
    setEditingItemId(null)
    setEditingItemNote('')

    // Guardar en base de datos
    const { error } = await supabase.from('list_items').update({ note: noteValue }).eq('id', itemIdToSave)

    // Si hay error, revertir el cambio local
    if (error) {
      console.error('Error guardando nota:', error)
      updateItem(itemIdToSave, { note: item?.note || null })
    }
  }, [editingItemId, editingItemNote, updateItem, supabase])

  const handleAddTagToList = useCallback(() => {
    const tag = newTagInput.trim().toLowerCase()
    if (tag && !editingItemTags.includes(tag)) {
      setEditingItemTags(prev => [...prev, tag])
    }
    setNewTagInput('')
  }, [newTagInput, editingItemTags])

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setEditingItemTags(prev => prev.filter(t => t !== tagToRemove))
  }, [])

  const handleSaveTags = useCallback(async () => {
    if (!editingItemId) return
    const item = itemsRef.current.find(i => i.id === editingItemId)
    const itemIdToSave = editingItemId
    const tagsToSave = [...editingItemTags]

    // Actualizar estado local primero (optimistic update)
    updateItem(editingItemId, { tags: editingItemTags } as any)
    setShowTagsModal(false)
    setEditingItemId(null)
    setEditingItemTags([])
    setNewTagInput('')

    // Guardar en base de datos
    const { error } = await supabase.from('list_items').update({ tags: tagsToSave }).eq('id', itemIdToSave)

    // Si hay error, revertir el cambio local
    if (error) {
      console.error('Error guardando etiquetas:', error)
      updateItem(itemIdToSave, { tags: item?.tags || [] } as any)
    }
  }, [editingItemId, editingItemTags, updateItem, supabase])

  const handleCloseTagsModal = useCallback(() => { setShowTagsModal(false); setEditingItemId(null); setEditingItemTags([]); setNewTagInput('') }, [])

  const handleCopyLink = () => { navigator.clipboard.writeText(shareUrl); setIsCopied(true); setTimeout(() => setIsCopied(false), 2000) }
  const closeModal = useCallback(() => setActiveModal(null), [])
  const handleUpdateName = async () => { if (!newName.trim()) return; await supabase.from('shopping_lists').update({ name: newName }).eq('id', list.id); closeModal(); router.refresh() }
  const handleDeleteList = async () => { await supabase.from('shopping_lists').delete().eq('id', list.id); router.replace('/'); router.refresh() }
  const handleArchiveList = async () => { await supabase.from('shopping_lists').update({ is_archived: true }).eq('id', list.id); router.push('/lists') }
  const handleDuplicateList = async () => { if (isDuplicating) return; setIsDuplicating(true); const { data: newList, error: listError } = await supabase.from('shopping_lists').insert({ name: `${list.name} (copia)`, owner_id: user?.id, share_code: null }).select().single(); if (listError || !newList) { setIsDuplicating(false); return } if (items.length > 0) { const itemsCopy = items.map((item, index) => ({ list_id: newList.id, name: item.name, quantity: item.quantity, unit: item.unit, category: item.category, checked: false, added_by: user?.id, position: index })); await supabase.from('list_items').insert(itemsCopy) } setIsDuplicating(false); setShowMenu(false); router.push(`/lists/${newList.id}`) }
  const handleSaveAsTemplate = async () => { if (!user) return; const { data: newTemplate, error } = await supabase.from('shopping_lists').insert({ name: `${list.name} (plantilla)`, owner_id: user.id, is_template: true }).select().single(); if (error || !newTemplate) return; if (items.length > 0) { const itemsCopy = items.map((item, index) => ({ list_id: newTemplate.id, name: item.name, quantity: item.quantity, unit: item.unit, category: item.category, checked: false, added_by: user.id, position: index })); await supabase.from('list_items').insert(itemsCopy) } setShowMenu(false); showUndoToast('Plantilla creada correctamente', () => { router.push('/lists/templates') }) }
  const handleMarkAllComplete = async () => { if (!user) return; const updates = uncheckedItems.map(item => ({ ...item, checked: true, checked_by: user.id })); setItems([...updates, ...checkedItems]); await supabase.from('list_items').update({ checked: true, checked_by: user.id }).eq('list_id', list.id).eq('checked', false); setShowMenu(false) }
  const handleClearCompleted = async () => { if (checkedItems.length === 0) return; const itemsToDelete = [...checkedItems]; setItems(uncheckedItems); const undoAction = async () => { const itemsToRestore = itemsToDelete.map(item => ({ list_id: item.list_id, name: item.name, quantity: item.quantity, category: item.category, added_by: item.added_by, checked: true, position: item.position })); const { data } = await supabase.from('list_items').insert(itemsToRestore).select(); if (data) { const { data: allItems } = await supabase.from('list_items').select('*').eq('list_id', list.id).order('position', { ascending: true }); if (allItems) setItems(allItems as ListItem[]) } }; showUndoToast(`${itemsToDelete.length} items eliminados`, undoAction); await supabase.from('list_items').delete().eq('list_id', list.id).eq('checked', true); setShowMenu(false) }
  const openShareModal = () => setActiveModal('share'); const openCollaboratorsModal = () => setActiveModal('collaborators'); const toggleMenu = () => setShowMenu(p => !p); const handleCloseNoteModal = useCallback(() => { setShowNoteModal(false); setEditingItemId(null); setEditingItemNote('') }, []); const handleCloseEditNameModal = useCallback(() => { setShowEditNameModal(false); setEditingItemId(null); setEditingItemName('') }, [])

  return (
    <div className="flex flex-col h-full relative bg-background">
      {/* Header FLOTANTE */}
      <header 
        ref={headerRef}
        className="fixed top-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-md border-b border-border transition-transform duration-300 translate-y-0"
      >
        <div className="p-4">
          {showSearch ? (
            <div className="flex items-center gap-2 animate-in slide-in-from-top-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input ref={searchInputRef} type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar en la lista..." className="w-full h-10 pl-10 pr-10 rounded-xl bg-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" autoFocus />
                {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"><X className="w-3 h-3 text-muted" /></button>}
              </div>
              <button onClick={() => { setShowSearch(false); setSearchQuery('') }} className="p-2 hover:bg-secondary rounded-lg text-muted"><X className="w-5 h-5" /></button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link
                  href="/lists"
                  className="w-10 h-10 rounded-xl bg-secondary hover:bg-hover flex items-center justify-center text-muted transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="font-bold text-lg truncate max-w-[180px]">{list.name}</h1>
                {presenceUsers.length > 0 && <PresenceIndicator users={presenceUsers} maxVisible={2} />}
                {isConnected && <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />}
              </div>

              <div className="flex items-center gap-1 relative">
                <Link
                  href={`/lists/${list.id}/super`}
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-green-500 flex items-center justify-center text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all"
                  title="Modo Super"
                >
                  <Zap className="w-5 h-5" />
                </Link>
                <button onClick={() => { setShowSearch(true); setTimeout(() => searchInputRef.current?.focus(), 100) }} className="w-10 h-10 rounded-xl hover:bg-secondary flex items-center justify-center text-muted" title="Buscar"><Search className="w-5 h-5" /></button>
                <button onClick={toggleMenu} className="w-10 h-10 rounded-xl hover:bg-secondary flex items-center justify-center text-muted"><MoreVertical className="w-5 h-5" /></button>

                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-[9998]" onClick={() => setShowMenu(false)} />
                    <div className="fixed top-16 right-4 w-56 bg-card border border-border rounded-xl shadow-xl z-[9999] py-2 animate-in fade-in slide-in-from-top-2">
                       <button onClick={() => { openShareModal(); setShowMenu(false) }} className="w-full px-4 py-2.5 text-left text-sm hover:bg-hover flex items-center gap-2"><Share2 className="w-4 h-4 text-primary" /> Compartir</button>
                       <button onClick={() => { openCollaboratorsModal(); setShowMenu(false) }} className="w-full px-4 py-2.5 text-left text-sm hover:bg-hover flex items-center gap-2"><Users className="w-4 h-4 text-blue-500" /> Colaboradores</button>
                       <button
                         onClick={() => { setShowNotes(!showNotes); setShowMenu(false) }}
                         className="w-full px-4 py-2.5 text-left text-sm hover:bg-hover flex items-center gap-2"
                       >
                         <FileText className={`w-4 h-4 ${showNotes ? 'text-primary' : 'text-muted'}`} />
                         {showNotes ? 'Ocultar notas' : 'Mostrar notas'}
                       </button>
                       <div className="border-t border-border my-1" />
                       {uncheckedItems.length > 0 && <button onClick={handleMarkAllComplete} className="w-full px-4 py-2.5 text-left text-sm hover:bg-hover flex items-center gap-2"><CheckCheck className="w-4 h-4 text-green-500" /> Marcar todo completado</button>}
                       {checkedItems.length > 0 && <button onClick={handleClearCompleted} className="w-full px-4 py-2.5 text-left text-sm hover:bg-hover flex items-center gap-2"><Eraser className="w-4 h-4 text-orange-500" /> Limpiar completados ({checkedItems.length})</button>}
                       {(uncheckedItems.length > 0 || checkedItems.length > 0) && <div className="border-t border-border my-1" />}
                       <button onClick={handleDuplicateList} disabled={isDuplicating} className="w-full px-4 py-2.5 text-left text-sm hover:bg-hover flex items-center gap-2 disabled:opacity-50"><CopyIcon className="w-4 h-4 text-blue-500" /> {isDuplicating ? 'Duplicando...' : 'Duplicar lista'}</button>
                       <button onClick={handleSaveAsTemplate} className="w-full px-4 py-2.5 text-left text-sm hover:bg-hover flex items-center gap-2"><FileText className="w-4 h-4 text-purple-500" /> Guardar como plantilla</button>
                       <button onClick={() => {setActiveModal('edit'); setShowMenu(false)}} className="w-full px-4 py-2.5 text-left text-sm hover:bg-hover flex items-center gap-2"><Edit2 className="w-4 h-4 text-muted" /> Editar nombre</button>
                       <div className="border-t border-border my-1" />
                       <button onClick={() => {handleArchiveList(); setShowMenu(false)}} className="w-full px-4 py-2.5 text-left text-sm hover:bg-hover flex items-center gap-2"><Archive className="w-4 h-4 text-gray-500" /> Archivar lista</button>
                       <button onClick={() => {setActiveModal('delete'); setShowMenu(false)}} className="w-full px-4 py-2.5 text-left text-sm text-danger hover:bg-danger/10 flex items-center gap-2"><Trash2 className="w-4 h-4" /> Eliminar lista</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
          {searchQuery && (
            <div className="flex items-center justify-between mt-2 px-1">
              <span className="text-xs text-muted">{filteredItems.length} resultados para "{searchQuery}"</span>
              <button onClick={() => setSearchQuery('')} className="text-xs text-primary hover:underline">Limpiar</button>
            </div>
          )}
        </div>

        {/* NOTAS EN HEADER */}
        {user && (
          <div className="px-4 pb-2">
             <ListNotes
               listId={list.id}
               listName={list.name}
               currentUser={user}
               isCollaborative={collaborators.length > 0 || list.share_code !== null}
               isExpandedExternal={showNotes}
               onExpandedChange={setShowNotes}
             />
          </div>
        )}
      </header>

      {/* LISTA - Padding dinámico */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-2 pb-32 overscroll-contain"
        style={{ paddingTop: `${headerHeight + 10}px` }}
      >
        {isLoading ? (
          <div className="space-y-2"><ItemSkeleton /><ItemSkeleton /></div>
        ) : (
          <>
            {/* VISTA ÚNICA AGRUPADA */}
            {groupedItems ? (
               <div className="space-y-4 pb-4">
                 {groupedItems.map(([catId, groupItems]) => {
                   const CategoryConfig = CATEGORIES[catId] || CATEGORIES['other']
                   return (
                     <div key={catId} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                       <div 
                        className="sticky z-10 bg-background/95 backdrop-blur-sm py-2 mb-2 top-0"
                       >
                         <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${CategoryConfig.color}`}>
                           <CategoryConfig.icon className="w-5 h-5" />
                           <h3 className="font-semibold text-sm flex-1">{CategoryConfig.label}</h3>
                           <span className="text-xs font-medium bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded-full">{groupItems.length} {groupItems.length === 1 ? 'item' : 'items'}</span>
                         </div>
                       </div>
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
                                onAddTags={handleAddTags}
                                onEditName={handleEditName}
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
                 {groupedItems.length === 0 && <div className="text-center py-12 text-muted flex flex-col items-center gap-3"><ShoppingBag className="w-12 h-12 text-muted-light" /><p>No hay items pendientes</p></div>}
               </div>
            ) : null}

            {checkedItems.length > 0 && (
              <div className="mt-8 pt-6 border-t-2 border-dashed border-border/50 bg-secondary/10 -mx-4 px-4 pb-10 rounded-t-3xl">
                <button onClick={() => setShowCompleted(!showCompleted)} className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors w-full mb-4">
                  <div className={`p-1.5 rounded-lg transition-colors ${showCompleted ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted'}`}>{showCompleted ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</div>
                  <span>Productos comprados ({checkedItems.length})</span>
                </button>
                {showCompleted && <div className="space-y-2 opacity-75 grayscale-[0.3] transition-all duration-300">{checkedItems.map((item) => (
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
                        onAddTags={handleAddTags}
                        onEditName={handleEditName}
                        assignablePeople={assignablePeople}
                        assignedToProfile={item.assigned_to ? profilesCache.get(item.assigned_to) : null}
                        addedByProfile={profilesCache.get(item.added_by)}
                        checkedByProfile={item.checked_by ? profilesCache.get(item.checked_by) : null}
                        isDragEnabled={false}
                      />
                    ))}</div>}
              </div>
            )}
            
            {smartSuggestions.length > 0 && (
              <div className="mt-8 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span className="text-xs font-medium text-muted uppercase tracking-wider">Sugerencias inteligentes</span>
                  <div className="h-px bg-border flex-1" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {smartSuggestions.map((suggestion, i) => (
                    <button key={i} onClick={() => handleAddFromSuggestion(suggestion)} className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-800 rounded-full border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all text-sm group shadow-sm">
                      <span className="text-lg leading-none text-primary">+</span><span>{suggestion.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <UndoToast message={undoState.message} isVisible={undoState.isVisible} onUndo={handleUndo} />
      {/* Action toast for simple feedback */}
      {!undoState.isVisible && (
        <ActionToast
          message={actionToast.message}
          type={actionToast.type}
          icon={actionToast.icon}
          isVisible={actionToast.isVisible}
        />
      )}

      {/* NUEVO DRAWER Y FAB */}
      <AddItemDrawer 
        onAdd={handleAddItem}
        onOpenCatalog={() => setActiveModal('catalog')}
        favoriteItems={favoriteItems}
        isLoadingFavorites={favoritesLoading}
        onAddFromFavorite={handleAddFromFavorite}
        onRemoveFavorite={async (id) => { await removeFavoriteItem(id); }}
      />

      {/* MODAL DEL CATÁLOGO */}
      <CatalogModal
        isOpen={activeModal === 'catalog'}
        onClose={closeModal}
        onSelect={handleAddItem}
        onRemove={handleCatalogRemove}
        currentItems={items}
      />

      {/* Otros Modales */}
      <Modal isOpen={activeModal === 'share'} onClose={closeModal} title="Compartir Lista"><div className="flex flex-col items-center gap-4 py-2"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareUrl)}`} alt="QR Code" className="rounded-xl border shadow-sm" /><div className="w-full space-y-2"><div className="text-xs text-muted font-medium uppercase tracking-wider text-center">Código de acceso</div><p className="font-mono text-2xl text-center font-bold tracking-widest bg-secondary py-3 rounded-lg border border-border">{list.share_code}</p></div><p className="text-sm text-center text-muted px-4">Comparte este código o escanea el QR.</p><Button onClick={handleCopyLink} className="w-full flex items-center justify-center gap-2">{isCopied ? <Check className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}{isCopied ? 'Enlace Copiado' : 'Copiar Enlace'}</Button></div></Modal>
      <Modal isOpen={activeModal === 'collaborators'} onClose={closeModal} title="Colaboradores"><div className="space-y-2">{collaborators.map((c, i) => <div key={i} className="p-2 border rounded">{c.profiles.name} ({c.role})</div>)}</div></Modal>
      <Modal isOpen={activeModal === 'edit'} onClose={closeModal} title="Editar Nombre"><div className="gap-2 flex flex-col"><Input value={newName} onChange={e => setNewName(e.target.value)} /><Button onClick={handleUpdateName}>Guardar</Button></div></Modal>
      <Modal isOpen={activeModal === 'delete'} onClose={closeModal} title="Eliminar Lista"><div className="text-center"><p className="mb-4">¿Seguro?</p><Button variant="danger" onClick={handleDeleteList}>Eliminar</Button></div></Modal>
      <Modal isOpen={showNoteModal} onClose={handleCloseNoteModal} title="Añadir nota"><div className="space-y-4"><p className="text-sm text-muted">Añade una nota para este producto.</p><textarea value={editingItemNote} onChange={(e) => setEditingItemNote(e.target.value)} placeholder="Escribe tu nota aquí..." className="w-full h-32 px-4 py-3 rounded-xl border-2 border-border bg-input-bg text-foreground placeholder:text-muted-light focus:outline-none focus:border-primary transition-colors resize-none" autoFocus /><div className="flex gap-3 justify-end"><Button variant="secondary" onClick={handleCloseNoteModal}>Cancelar</Button><Button onClick={handleSaveNote}>Guardar</Button></div></div></Modal>
      <Modal isOpen={showEditNameModal} onClose={handleCloseEditNameModal} title="Editar nombre"><div className="space-y-4"><p className="text-sm text-muted">Edita el nombre de este producto.</p><input type="text" value={editingItemName} onChange={(e) => setEditingItemName(e.target.value)} placeholder="Nombre del producto..." className="w-full px-4 py-3 rounded-xl border-2 border-border bg-input-bg text-foreground placeholder:text-muted-light focus:outline-none focus:border-primary transition-colors" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName() }} /><div className="flex gap-3 justify-end"><Button variant="secondary" onClick={handleCloseEditNameModal}>Cancelar</Button><Button onClick={handleSaveName} disabled={!editingItemName.trim()}>Guardar</Button></div></div></Modal>
      <Modal isOpen={showTagsModal} onClose={handleCloseTagsModal} title="Etiquetas">
        <div className="space-y-4">
          <p className="text-sm text-muted">Añade etiquetas para organizar y buscar este producto (ej: mercadona, lidl, urgente).</p>

          {/* Current tags */}
          {editingItemTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {editingItemTags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Add new tag */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddTagToList()
                }
              }}
              placeholder="Nueva etiqueta..."
              className="flex-1 h-10 px-4 rounded-xl border-2 border-border bg-input-bg text-foreground placeholder:text-muted-light focus:outline-none focus:border-primary transition-colors"
              autoFocus
            />
            <Button onClick={handleAddTagToList} disabled={!newTagInput.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Quick suggestions */}
          <div className="flex flex-wrap gap-2">
            {['mercadona', 'lidl', 'carrefour', 'dia', 'aldi', 'urgente', 'oferta'].filter(s => !editingItemTags.includes(s)).slice(0, 4).map(suggestion => (
              <button
                key={suggestion}
                onClick={() => setEditingItemTags(prev => [...prev, suggestion])}
                className="px-2.5 py-1 bg-secondary hover:bg-secondary/80 text-sm rounded-full text-muted-foreground"
              >
                + {suggestion}
              </button>
            ))}
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={handleCloseTagsModal}>Cancelar</Button>
            <Button onClick={handleSaveTags}>Guardar</Button>
          </div>
        </div>
      </Modal>
      <input type="file" ref={imageInputRef} accept="image/*" className="hidden" onChange={handleImageSelected} />
      {isUploadingImage && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"><div className="bg-card p-6 rounded-2xl shadow-xl flex flex-col items-center gap-4"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" /><p className="text-foreground font-medium">Subiendo imagen...</p></div></div>}
    </div>
  )
}
