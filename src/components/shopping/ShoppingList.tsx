'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ShoppingBag, Users, Share2, MoreVertical,
  Trash2, Edit2, Check, Link as LinkIcon,
  ChevronDown, ChevronRight, LayoutGrid, Undo2,
  Archive, CheckCheck, Eraser, Copy as CopyIcon, Search, X,
  FileText, Zap, Plus
} from 'lucide-react'
import { ShoppingItem, AssignablePerson } from './ShoppingItem'
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
import { CATEGORIES, CategoryId, detectCategory, getSmartSuggestions, CommonProduct } from '@/lib/constants'

// --- DATOS DEL CATÁLOGO RÁPIDO ---
const QUICK_CATALOG: Record<CategoryId, string[]> = {
  'fruits-veg': ['Manzanas', 'Plátanos', 'Lechuga', 'Tomates', 'Zanahorias', 'Cebollas', 'Patatas', 'Aguacate', 'Limones', 'Ajos'],
  'meat-fish': ['Pollo', 'Ternera', 'Carne picada', 'Jamón serrano', 'Salmón', 'Atún', 'Huevos', 'Bacon', 'Lomo', 'Salchichas'],
  'dairy': ['Leche entera', 'Queso', 'Yogur natural', 'Mantequilla', 'Nata', 'Queso rallado'],
  'pantry': ['Arroz', 'Pasta', 'Pan', 'Aceite de oliva', 'Azúcar', 'Sal', 'Harina', 'Tomate frito', 'Café'],
  'frozen': ['Pizza', 'Guisantes', 'Helado', 'Verduras salteadas', 'Croquetas'],
  'beverages': ['Agua', 'Refrescos', 'Cerveza', 'Vino', 'Zumo'],
  'household': ['Papel higiénico', 'Detergente', 'Suavizante', 'Lavavajillas', 'Papel cocina', 'Bolsas basura'],
  'hygiene': ['Gel', 'Champú', 'Pasta dientes', 'Desodorante', 'Jabón manos'],
  'pets': ['Comida perro', 'Comida gato'],
  'other': ['Pilas', 'Bombillas']
}

interface ShoppingListProps {
  list: ShoppingListType
}

interface Collaborator {
  role: string
  user_id: string
  profiles: { id: string; email: string; name: string; avatar_url: string | null }
}

const ItemSkeleton = () => (
  <div className="flex items-center gap-3 p-3 bg-background rounded-xl border border-gray-100 animate-pulse">
    <div className="w-5 h-5 bg-gray-200 rounded" />
    <div className="flex-1 h-4 bg-gray-200 rounded w-3/4" />
  </div>
)

function UndoToast({ message, onUndo, isVisible }: { message: string, onUndo: () => void, isVisible: boolean }) {
  if (!isVisible) return null
  return (
    <div className="fixed bottom-36 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in w-[90%] max-w-sm">
      <div className="bg-foreground text-background px-4 py-3 rounded-xl shadow-2xl flex items-center justify-between">
        <span className="text-sm font-medium truncate mr-2">{message}</span>
        <button onClick={onUndo} className="text-primary-foreground font-bold text-sm flex items-center gap-1 whitespace-nowrap"><Undo2 className="w-4 h-4" /> Deshacer</button>
      </div>
    </div>
  )
}

function CatalogModal({ isOpen, onClose, onSelect, currentItems }: { isOpen: boolean, onClose: () => void, onSelect: (name: string, category: string) => void, currentItems: ListItem[] }) {
  const [activeTab, setActiveTab] = useState<CategoryId>('fruits-veg')
  if (!isOpen) return null
  const existingMap = new Set(currentItems.filter(i => !i.checked).map(i => i.name.toLowerCase()))

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background animate-in slide-in-from-bottom duration-300">
      <div className="px-4 py-3 border-b flex items-center justify-between bg-card">
        <h2 className="font-bold text-lg flex items-center gap-2"><LayoutGrid className="w-5 h-5 text-primary" /> Catálogo</h2>
        <button onClick={onClose} className="p-2 bg-secondary rounded-full"><X className="w-5 h-5" /></button>
      </div>
      <div className="flex overflow-x-auto py-3 px-2 gap-2 border-b bg-card/50 no-scrollbar">
        {Object.values(CATEGORIES).map(cat => (
          <button key={cat.id} onClick={() => setActiveTab(cat.id)} className={`flex flex-col items-center gap-1 min-w-[70px] p-2 rounded-xl ${activeTab === cat.id ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
            <cat.icon className="w-6 h-6" />
            <span className="text-[10px] font-medium">{cat.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-4 bg-secondary/10">
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pb-20">
          {QUICK_CATALOG[activeTab]?.map((item) => {
             const exists = existingMap.has(item.toLowerCase())
             return (
              <button key={item} onClick={() => onSelect(item, activeTab)} className={`aspect-square flex flex-col items-center justify-center p-2 rounded-2xl border ${exists ? 'bg-primary/10 border-primary' : 'bg-card'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${exists ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>{exists ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}</div>
                <span className="text-xs text-center font-medium leading-tight">{item}</span>
              </button>
             )
          })}
        </div>
      </div>
    </div>
  )
}

export function ShoppingList({ list }: ShoppingListProps) {
  const items = useItems() as ListItem[]
  const { setItems, addItem, updateItem, removeItem, toggleItemChecked } = useItemsActions()
  const user = useUser()
  const { presenceUsers, isConnected } = useRealtimeList({ listId: list.id, user })
  const { favoriteItems, addFavoriteItem, addItemToListFromFavorite } = useFavorites(user?.id)
  const { upload: uploadImage, isUploading: isUploadingImage } = useImageUpload({ bucket: 'list-images' })

  const [isLoading, setIsLoading] = useState(true)
  const [activeModal, setActiveModal] = useState<'share' | 'collaborators' | 'edit' | 'delete' | 'catalog' | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [showCompleted, setShowCompleted] = useState(false)
  
  // ESTADOS NUEVOS
  const [showNotes, setShowNotes] = useState(false)
  const [justAddedItemId, setJustAddedItemId] = useState<string | null>(null) // Para scroll

  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [undoState, setUndoState] = useState<{ isVisible: boolean, message: string, action: () => Promise<void> | void, timer: NodeJS.Timeout | null }>({ isVisible: false, message: '', action: () => {}, timer: null })

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
  const imageInputRef = useRef<HTMLInputElement>(null)
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current
  const router = useRouter()

  const shareUrl = useMemo(() => typeof window !== 'undefined' ? `${window.location.origin}/join/${list.share_code}` : '', [list.share_code])

  // EFECTO DE SCROLL INTELIGENTE
  useEffect(() => {
    if (justAddedItemId) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`item-${justAddedItemId}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          element.classList.add('ring-2', 'ring-primary', 'ring-offset-2')
          setTimeout(() => element.classList.remove('ring-2', 'ring-primary', 'ring-offset-2'), 2000)
          setJustAddedItemId(null)
        }
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [justAddedItemId, items])

  // Medir header
  useEffect(() => {
    if (headerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => { for (let entry of entries) setHeaderHeight(entry.contentRect.height) })
      resizeObserver.observe(headerRef.current)
      return () => resizeObserver.disconnect()
    }
  }, [user, collaborators, list.name])

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items
    const query = searchQuery.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    return items.filter(item => item.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(query))
  }, [items, searchQuery])

  const uncheckedItems = useMemo(() => filteredItems.filter((item) => !item.checked), [filteredItems])
  const checkedItems = useMemo(() => filteredItems.filter((item) => item.checked), [filteredItems])
  
  const normalizeCategory = useCallback((item: ListItem): CategoryId => {
    if (item.category && CATEGORIES[item.category as CategoryId]) return item.category as CategoryId
    return detectCategory(item.name)
  }, [])

  // Agrupación obligatoria
  const groupedItems = useMemo(() => {
    const groups: Record<CategoryId, ListItem[]> = {} as Record<CategoryId, ListItem[]>
    Object.keys(CATEGORIES).forEach(key => { groups[key as CategoryId] = [] })
    uncheckedItems.forEach(item => { groups[normalizeCategory(item)].push(item) })
    return Object.entries(groups).filter(([_, items]) => items.length > 0) as [CategoryId, ListItem[]][]
  }, [uncheckedItems, normalizeCategory])

  const smartSuggestions = useMemo(() => getSmartSuggestions(items.map(i => i.name), 4), [items])

  const assignablePeople = useMemo(() => {
    const people: AssignablePerson[] = []
    const addedIds = new Set<string>()
    if (user) { people.push({ id: user.id, name: user.name || 'Yo', avatar_url: user.avatar_url || null }); addedIds.add(user.id) }
    collaborators.forEach(collab => { if (!addedIds.has(collab.user_id)) { people.push({ id: collab.user_id, name: collab.profiles.name, avatar_url: collab.profiles.avatar_url }); addedIds.add(collab.user_id) } })
    return people
  }, [user, collaborators])

  // Cargas iniciales
  useEffect(() => {
    const loadItems = async () => {
      const { data } = await supabase.from('list_items').select('*').eq('list_id', list.id).order('position', { ascending: true, nullsFirst: false }).order('created_at', { ascending: true })
      if (data) setItems(data as ListItem[])
      setIsLoading(false)
    }
    loadItems()
  }, [list.id, setItems, supabase])

  useEffect(() => {
    if (!collaboratorsLoaded) {
      supabase.from('list_collaborators').select('role, user_id, profiles(id, email, name, avatar_url)').eq('list_id', list.id)
        .then(({ data }) => { if (data) { setCollaborators(data as unknown as Collaborator[]); setCollaboratorsLoaded(true) } })
    }
  }, [list.id, supabase, collaboratorsLoaded])

  useEffect(() => {
    const userIds = new Set<string>()
    items.forEach(item => { if (item.added_by) userIds.add(item.added_by); if (item.checked_by) userIds.add(item.checked_by) })
    const missingIds = Array.from(userIds).filter(id => !profilesCache.has(id))
    if (missingIds.length > 0) {
      supabase.from('profiles').select('*').in('id', missingIds).then(({ data }) => {
        if (data) setProfilesCache(prev => { const n = new Map(prev); data.forEach(p => n.set(p.id, p)); return n })
      })
    }
  }, [items, supabase, profilesCache])

  // Handlers
  const showUndoToast = (message: string, undoAction: () => Promise<void> | void) => {
    if (undoState.timer) clearTimeout(undoState.timer)
    const timer = setTimeout(() => setUndoState(prev => ({ ...prev, isVisible: false })), 2000)
    setUndoState({ isVisible: true, message, action: undoAction, timer })
  }
  const handleUndo = async () => { if (undoState.action) { await undoState.action(); setUndoState(prev => ({ ...prev, isVisible: false })) } }

  const handleAddItem = useCallback(async (name: string, category?: string) => {
    if (!user) return
    const normalizedName = name.trim()
    const existing = items.find(i => i.name.toLowerCase() === normalizedName.toLowerCase())
    
    if (existing) {
      const newQty = (existing.quantity || 1) + 1
      updateItem(existing.id, { quantity: newQty, checked: false })
      await supabase.from('list_items').update({ quantity: newQty, checked: false }).eq('id', existing.id)
      setJustAddedItemId(existing.id) // También hacemos scroll si ya existe
    } else {
      const maxPos = items.length > 0 ? Math.max(...items.map(i => i.position ?? 0)) : -1
      const itemData = { list_id: list.id, name: normalizedName, category, added_by: user.id, position: maxPos + 1 }
      const { data } = await supabase.from('list_items').insert(itemData).select().single()
      if (data) {
        addItem(data as ListItem)
        setJustAddedItemId(data.id) // ACTIVAMOS SCROLL
        sendPushNotification({ listId: list.id, listName: list.name, action: 'item_added', actorName: user.name || 'Alguien', itemName: normalizedName, excludeUserId: user.id })
      }
    }
  }, [user, items, list.id, list.name, supabase, updateItem, addItem])

  // ... (Resto de handlers handleDeleteItem, handleToggleItem, etc. iguales que antes, omitidos por brevedad pero deben estar aquí)
  const handleToggleItem = async (id: string) => { const item = items.find(i => i.id === id); if(!item) return; toggleItemChecked(id); await supabase.from('list_items').update({ checked: !item.checked }).eq('id', id) }
  const handleDeleteItem = async (id: string) => { removeItem(id); await supabase.from('list_items').delete().eq('id', id) }
  const handleUpdateQuantity = async (id: string, q: number) => { updateItem(id, { quantity: q }); await supabase.from('list_items').update({ quantity: q }).eq('id', id) }
  const handleAddToFavorites = async (item: ListItem) => { await addFavoriteItem({ name: item.name, quantity: item.quantity, category: item.category }) }
  const handleAddFromSuggestion = (s: CommonProduct) => handleAddItem(s.name, s.category)
  const handleAssignItem = async (itemId: string, userId: string | null) => { updateItem(itemId, { assigned_to: userId } as any); await supabase.from('list_items').update({ assigned_to: userId }).eq('id', itemId) }
  const handleAddImage = (itemId: string) => { setEditingItemId(itemId); setShowImageModal(true); setTimeout(() => imageInputRef.current?.click(), 100) }
  const handleImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file || !editingItemId) return; const path = `items/${Date.now()}`; const url = await uploadImage(file, path); if (url) { updateItem(editingItemId, { image_url: url } as any); await supabase.from('list_items').update({ image_url: url }).eq('id', editingItemId) } setShowImageModal(false) }
  const handleAddNote = (itemId: string) => { const item = items.find(i => i.id === itemId); setEditingItemId(itemId); setEditingItemNote(item?.note || ''); setShowNoteModal(true) }
  const handleSaveNote = async () => { if(!editingItemId) return; const n = editingItemNote.trim() || null; updateItem(editingItemId, { note: n } as any); await supabase.from('list_items').update({ note: n }).eq('id', editingItemId); setShowNoteModal(false) }
  const closeModal = () => setActiveModal(null)
  
  // Handlers de menú y otros modales (CopyLink, UpdateName, etc.) omitidos para ajustar longitud, incluir si los necesitas.
  const handleCopyLink = () => { navigator.clipboard.writeText(shareUrl); setIsCopied(true); setTimeout(() => setIsCopied(false), 2000) }
  const handleUpdateName = async () => { await supabase.from('shopping_lists').update({ name: newName }).eq('id', list.id); closeModal(); router.refresh() }
  const handleDeleteList = async () => { await supabase.from('shopping_lists').delete().eq('id', list.id); router.push('/lists') }
  const handleArchiveList = async () => { await supabase.from('shopping_lists').update({ is_archived: true }).eq('id', list.id); router.push('/lists') }
  const handleDuplicateList = async () => { if (isDuplicating) return; setIsDuplicating(true); const { data: newList } = await supabase.from('shopping_lists').insert({ name: `${list.name} (copia)`, owner_id: user?.id }).select().single(); if (newList && items.length) { await supabase.from('list_items').insert(items.map((item, i) => ({ list_id: newList.id, name: item.name, quantity: item.quantity, category: item.category, position: i }))) } setIsDuplicating(false); setShowMenu(false); router.push(`/lists/${newList?.id}`) }
  const handleSaveAsTemplate = async () => { if (!user) return; const { data: t } = await supabase.from('shopping_lists').insert({ name: `${list.name} (plantilla)`, owner_id: user.id, is_template: true }).select().single(); if (t && items.length) { await supabase.from('list_items').insert(items.map((item, i) => ({ list_id: t.id, name: item.name, quantity: item.quantity, category: item.category, position: i }))) } setShowMenu(false); showUndoToast('Plantilla creada', () => router.push('/lists/templates')) }
  const handleMarkAllComplete = async () => { const updates = uncheckedItems.map(item => ({ ...item, checked: true })); setItems([...updates, ...checkedItems]); await supabase.from('list_items').update({ checked: true }).eq('list_id', list.id).eq('checked', false); setShowMenu(false) }
  const handleClearCompleted = async () => { setItems(uncheckedItems); await supabase.from('list_items').delete().eq('list_id', list.id).eq('checked', true); setShowMenu(false) }
  const toggleMenu = () => setShowMenu(p => !p)

  return (
    <div className="flex flex-col h-full relative bg-background">
      {/* HEADER FIXED */}
      <header ref={headerRef} className="fixed top-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-md border-b transition-transform">
        <div className="p-4">
          {showSearch ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input ref={searchInputRef} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar..." className="w-full h-10 pl-10 pr-10 rounded-xl bg-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" autoFocus />
                {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1"><X className="w-3 h-3 text-muted" /></button>}
              </div>
              <button onClick={() => { setShowSearch(false); setSearchQuery('') }} className="p-2"><X className="w-5 h-5" /></button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center relative">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                  <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
                </div>
                <div><h1 className="font-bold text-lg">{list.name}</h1><p className="text-sm text-gray-500">{items.length} productos</p></div>
              </div>
              <div className="flex items-center gap-2 relative">
                <button onClick={() => { setShowSearch(true); setTimeout(() => searchInputRef.current?.focus(), 100) }} className="w-10 h-10 rounded-xl hover:bg-secondary flex items-center justify-center text-muted"><Search className="w-5 h-5" /></button>
                {/* TOGGLE NOTAS: Ya no afecta a las etiquetas */}
                <button onClick={() => setShowNotes(!showNotes)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${showNotes ? 'bg-primary/10 text-primary' : 'hover:bg-secondary text-muted'}`}>
                  <FileText className={`w-5 h-5 ${!showNotes && 'opacity-50'}`} />
                </button>
                {presenceUsers.length > 0 && <PresenceIndicator users={presenceUsers} maxVisible={2} />}
                <button onClick={() => setActiveModal('collaborators')} className="w-10 h-10 rounded-xl hover:bg-secondary flex items-center justify-center text-muted"><Users className="w-5 h-5" /></button>
                <button onClick={() => setActiveModal('share')} className="w-10 h-10 rounded-xl hover:bg-secondary flex items-center justify-center text-muted"><Share2 className="w-5 h-5" /></button>
                <button onClick={toggleMenu} className="w-10 h-10 rounded-xl hover:bg-secondary flex items-center justify-center text-muted"><MoreVertical className="w-5 h-5" /></button>
                
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                    <div className="absolute top-12 right-0 w-56 bg-card border rounded-xl shadow-xl z-20 py-2">
                       {uncheckedItems.length > 0 && <button onClick={handleMarkAllComplete} className="w-full px-4 py-2.5 text-left text-sm hover:bg-hover flex gap-2"><CheckCheck className="w-4 h-4 text-green-500" /> Marcar todo</button>}
                       {checkedItems.length > 0 && <button onClick={handleClearCompleted} className="w-full px-4 py-2.5 text-left text-sm hover:bg-hover flex gap-2"><Eraser className="w-4 h-4 text-orange-500" /> Limpiar completados</button>}
                       <div className="border-t my-1" />
                       <button onClick={handleDuplicateList} disabled={isDuplicating} className="w-full px-4 py-2.5 text-left text-sm hover:bg-hover flex gap-2"><CopyIcon className="w-4 h-4 text-blue-500" /> Duplicar</button>
                       <button onClick={handleSaveAsTemplate} className="w-full px-4 py-2.5 text-left text-sm hover:bg-hover flex gap-2"><FileText className="w-4 h-4 text-purple-500" /> Guardar plantilla</button>
                       <button onClick={() => {setActiveModal('edit'); setShowMenu(false)}} className="w-full px-4 py-2.5 text-left text-sm hover:bg-hover flex gap-2"><Edit2 className="w-4 h-4 text-muted" /> Editar nombre</button>
                       <div className="border-t my-1" />
                       <button onClick={() => {handleArchiveList(); setShowMenu(false)}} className="w-full px-4 py-2.5 text-left text-sm hover:bg-hover flex gap-2"><Archive className="w-4 h-4 text-gray-500" /> Archivar</button>
                       <button onClick={() => {setActiveModal('delete'); setShowMenu(false)}} className="w-full px-4 py-2.5 text-left text-sm text-danger hover:bg-danger/10 flex gap-2"><Trash2 className="w-4 h-4" /> Eliminar</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
        {user && <div className="px-4 pb-2"><ListNotes listId={list.id} listName={list.name} currentUser={user} isCollaborative={collaborators.length > 0 || !!list.share_code} /></div>}
      </header>

      {/* LISTA CON PADDING DINÁMICO */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-2 pb-32 overscroll-contain"
        style={{ paddingTop: `${headerHeight + 10}px` }}
      >
        {isLoading ? <div className="space-y-2"><ItemSkeleton /><ItemSkeleton /></div> : (
          <>
            <div className="space-y-4 pb-4">
                {groupedItems.map(([catId, groupItems]) => {
                const CategoryConfig = CATEGORIES[catId] || CATEGORIES['other']
                return (
                    <div key={catId} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="sticky z-10 bg-background/95 backdrop-blur-sm py-2 mb-2 top-0">
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${CategoryConfig.color}`}>
                        <CategoryConfig.icon className="w-5 h-5" />
                        <h3 className="font-semibold text-sm flex-1">{CategoryConfig.label}</h3>
                        <span className="text-xs font-medium bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded-full">{groupItems.length}</span>
                        </div>
                    </div>
                    <div className="space-y-2 ml-1 pl-3 border-l-2 border-gray-100 dark:border-gray-800">
                        {groupItems.map(item => (
                            <ShoppingItem 
                                key={item.id} 
                                domId={`item-${item.id}`} // Pasamos el ID para scroll
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
                                isDragEnabled={false}
                                isNoteVisible={showNotes} // Pasamos estado de notas
                            />
                        ))}
                    </div>
                    </div>
                )
                })}
                {groupedItems.length === 0 && <div className="text-center py-12 text-muted flex flex-col items-center gap-3"><ShoppingBag className="w-12 h-12 text-muted-light" /><p>Lista vacía</p></div>}
            </div>

            {checkedItems.length > 0 && (
              <div className="mt-8 pt-6 border-t-2 border-dashed border-border/50 bg-secondary/10 -mx-4 px-4 pb-10 rounded-t-3xl">
                <button onClick={() => setShowCompleted(!showCompleted)} className="flex items-center gap-2 text-sm font-bold text-muted-foreground w-full mb-4">
                  <div className={`p-1.5 rounded-lg ${showCompleted ? 'bg-primary/10 text-primary' : 'bg-secondary'}`}>{showCompleted ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</div>
                  <span>Comprados ({checkedItems.length})</span>
                </button>
                {showCompleted && <div className="space-y-2 opacity-75 grayscale-[0.3]">{checkedItems.map((item) => (
                      <ShoppingItem key={item.id} item={item} onToggle={handleToggleItem} onDelete={handleDeleteItem} onUpdateQuantity={handleUpdateQuantity} isDragEnabled={false} isNoteVisible={showNotes} />
                    ))}</div>}
              </div>
            )}
            
            {smartSuggestions.length > 0 && (
              <div className="mt-8 mb-4">
                <div className="flex items-center gap-2 mb-3"><Zap className="w-3 h-3 text-amber-500 fill-amber-500" /><span className="text-xs font-medium text-muted uppercase">Sugerencias</span><div className="h-px bg-border flex-1" /></div>
                <div className="flex flex-wrap gap-2">{smartSuggestions.map((s, i) => (<button key={i} onClick={() => handleAddFromSuggestion(s)} className="flex items-center gap-1.5 px-3 py-2 bg-card rounded-full border hover:bg-primary/5 text-sm"><span className="text-primary">+</span>{s.name}</button>))}</div>
              </div>
            )}
          </>
        )}
      </div>

      <UndoToast message={undoState.message} isVisible={undoState.isVisible} onUndo={handleUndo} />

      {/* INPUT STICKY FOOTER */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
        <div className="max-w-md mx-auto w-full flex gap-2 items-center">
            <form className="flex-1 relative" onSubmit={(e) => { e.preventDefault(); const input = e.currentTarget.elements.namedItem('quickAdd') as HTMLInputElement; if(input.value) { handleAddItem(input.value); input.value = ''; } }}>
              <input name="quickAdd" type="text" placeholder="Añadir producto..." className="w-full h-12 pl-4 pr-12 rounded-2xl bg-secondary/80 focus:border-primary focus:bg-background transition-all outline-none" style={{ fontSize: '16px' }} />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-primary-foreground rounded-xl shadow-sm"><Plus className="w-4 h-4" /></button>
            </form>
            <button onClick={() => setActiveModal('catalog')} className="p-3 bg-secondary rounded-2xl"><LayoutGrid className="w-5 h-5 text-muted-foreground" /></button>
        </div>
      </div>

      {/* Modales Auxiliares */}
      <CatalogModal isOpen={activeModal === 'catalog'} onClose={closeModal} onSelect={handleAddItem} currentItems={items} />
      <Modal isOpen={activeModal === 'share'} onClose={closeModal} title="Compartir"><div className="flex flex-col items-center gap-4 py-2"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareUrl)}`} alt="QR" className="rounded-xl border" /><div className="w-full text-center"><p className="font-mono text-2xl font-bold bg-secondary py-3 rounded-lg">{list.share_code}</p></div><Button onClick={handleCopyLink} className="w-full">{isCopied ? 'Copiado' : 'Copiar Link'}</Button></div></Modal>
      <Modal isOpen={activeModal === 'collaborators'} onClose={closeModal} title="Colaboradores"><div className="space-y-2">{collaborators.map((c, i) => <div key={i} className="p-2 border rounded">{c.profiles.name} ({c.role})</div>)}</div></Modal>
      <Modal isOpen={activeModal === 'edit'} onClose={closeModal} title="Editar Nombre"><div className="flex gap-2 flex-col"><Input value={newName} onChange={e => setNewName(e.target.value)} /><Button onClick={handleUpdateName}>Guardar</Button></div></Modal>
      <Modal isOpen={activeModal === 'delete'} onClose={closeModal} title="Eliminar"><div className="text-center"><p className="mb-4">¿Seguro?</p><Button variant="danger" onClick={handleDeleteList}>Eliminar</Button></div></Modal>
      <Modal isOpen={showNoteModal} onClose={() => setShowNoteModal(false)} title="Nota"><textarea value={editingItemNote} onChange={(e) => setEditingItemNote(e.target.value)} className="w-full h-32 p-3 border rounded-xl" autoFocus /><div className="flex gap-2 justify-end mt-4"><Button variant="secondary" onClick={() => setShowNoteModal(false)}>Cancelar</Button><Button onClick={handleSaveNote}>Guardar</Button></div></Modal>
      <input type="file" ref={imageInputRef} accept="image/*" className="hidden" onChange={handleImageSelected} />
      {isUploadingImage && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"><div className="bg-white p-4 rounded-xl">Subiendo...</div></div>}
    </div>
  )
}
