'use client'

import { useEffect, useState } from 'react'
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
import { useStore } from '@/store/useStore'

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

export function ShoppingList({ list }: ShoppingListProps) {
  const { items, setItems, addItem, updateItem, removeItem, toggleItemChecked, user } = useStore()
  const [isLoading, setIsLoading] = useState(true)
  const [activeModal, setActiveModal] = useState<'share' | 'collaborators' | 'edit' | 'delete' | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  
  // Estados para funcionalidades especificas
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [newName, setNewName] = useState(list.name)
  const [isCopied, setIsCopied] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)

  const supabase = createClient()
  const router = useRouter()

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

  // Cargar colaboradores cuando se abre el modal
  useEffect(() => {
    if (activeModal === 'collaborators') {
      const loadCollaborators = async () => {
        const { data } = await supabase
          .from('list_collaborators')
          .select('role, profiles(email, name, avatar_url)')
          .eq('list_id', list.id)
        
        if (data) {
          setCollaborators(data as unknown as Collaborator[])
        }
      }
      loadCollaborators()
    }
  }, [activeModal, list.id, supabase])

  // Suscripción en tiempo real
  useEffect(() => {
    const channel = supabase
      .channel(`list-${list.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'list_items', filter: `list_id=eq.${list.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') addItem(payload.new as ListItem)
          else if (payload.eventType === 'UPDATE') updateItem(payload.new.id, payload.new as Partial<ListItem>)
          else if (payload.eventType === 'DELETE') removeItem(payload.old.id)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [list.id, supabase, addItem, updateItem, removeItem])

  // --- Handlers de Items ---

  const handleAddItem = async (name: string, category?: string) => {
    if (!user) return
    const { error } = await supabase.from('list_items').insert({
      list_id: list.id, name, category, added_by: user.id,
    })
    if (error) console.error('Error adding item:', error)
  }

  const handleToggleItem = async (id: string) => {
    const item = items.find((i) => i.id === id)
    if (!item) return
    toggleItemChecked(id)
    const { error } = await supabase.from('list_items').update({ checked: !item.checked }).eq('id', id)
    if (error) toggleItemChecked(id)
  }

  const handleDeleteItem = async (id: string) => {
    const item = items.find((i) => i.id === id)
    if (!item) return
    removeItem(id)
    const { error } = await supabase.from('list_items').delete().eq('id', id)
    if (error) addItem(item)
  }

  const handleUpdateQuantity = async (id: string, quantity: number) => {
    updateItem(id, { quantity })
    const { error } = await supabase.from('list_items').update({ quantity }).eq('id', id)
    if (error) {
      const item = items.find((i) => i.id === id)
      if (item) updateItem(id, { quantity: item.quantity })
    }
  }

  // --- Funcionalidades Nuevas ---

  const handleCopyLink = () => {
    const url = `${window.location.origin}/join/${list.share_code}`
    navigator.clipboard.writeText(url)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const handleUpdateName = async () => {
    if (!newName.trim() || newName === list.name) return
    const { error } = await supabase.from('shopping_lists').update({ name: newName }).eq('id', list.id)
    if (!error) {
      router.refresh()
      setActiveModal(null)
    }
  }

  const handleDeleteList = async () => {
    const { error } = await supabase.from('shopping_lists').delete().eq('id', list.id)
    if (!error) {
      router.push('/lists')
      router.refresh()
    }
  }

  const handleDuplicateList = async () => {
    if (!user) return
    setIsDuplicating(true)
    
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
      setIsDuplicating(false)
      return
    }

    // 2. Copiar items
    if (items.length > 0) {
      const itemsToInsert = items.map(item => ({
        list_id: newList.id,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        checked: false, // Empezar desmarcados
        added_by: user.id
      }))

      await supabase.from('list_items').insert(itemsToInsert)
    }

    setIsDuplicating(false)
    setShowMenu(false)
    router.push(`/lists/${newList.id}`)
  }

  // UI Calculations
  const uncheckedItems = items.filter((item) => !item.checked)
  const checkedItems = items.filter((item) => item.checked)
  const progress = items.length > 0 ? (checkedItems.length / items.length) * 100 : 0
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/join/${list.share_code}` : ''

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
              onClick={() => setActiveModal('collaborators')}
              className="w-10 h-10 rounded-xl hover:bg-secondary flex items-center justify-center transition-colors"
            >
              <Users className="w-5 h-5 text-gray-500" />
            </button>
            <button 
              onClick={() => setActiveModal('share')}
              className="w-10 h-10 rounded-xl hover:bg-secondary flex items-center justify-center transition-colors"
            >
              <Share2 className="w-5 h-5 text-gray-500" />
            </button>
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="w-10 h-10 rounded-xl hover:bg-secondary flex items-center justify-center transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-gray-500" />
            </button>

            {/* Menú Desplegable */}
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute top-12 right-0 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-20 py-2 animate-in fade-in zoom-in-95 duration-100">
                  <button 
                    onClick={() => { setActiveModal('edit'); setShowMenu(false) }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" /> Editar nombre
                  </button>
                  <button 
                    onClick={handleDuplicateList}
                    disabled={isDuplicating}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" /> {isDuplicating ? 'Duplicando...' : 'Duplicar lista'}
                  </button>
                  <div className="h-px bg-gray-100 my-1" />
                  <button 
                    onClick={() => { setActiveModal('delete'); setShowMenu(false) }}
                    className="w-full px-4 py-2 text-left text-sm text-danger hover:bg-red-50 flex items-center gap-2"
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
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {checkedItems.length} de {items.length} completados
        </p>
      </header>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {uncheckedItems.map((item) => (
              <ShoppingItem key={item.id} item={item} onToggle={handleToggleItem} onDelete={handleDeleteItem} onUpdateQuantity={handleUpdateQuantity} />
            ))}
            {checkedItems.length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-medium text-gray-400 mb-2">Completados ({checkedItems.length})</p>
                <div className="space-y-2 opacity-60">
                  {checkedItems.map((item) => (
                    <ShoppingItem key={item.id} item={item} onToggle={handleToggleItem} onDelete={handleDeleteItem} onUpdateQuantity={handleUpdateQuantity} />
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
      <Modal isOpen={activeModal === 'share'} onClose={() => setActiveModal(null)} title="Compartir lista">
        <div className="space-y-6 flex flex-col items-center">
          <div className="bg-white p-4 rounded-xl border-2 border-dashed border-gray-200">
             {/* QR Placeholder: Usando una API pública simple para no instalar librerías extra por ahora */}
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${shareUrl}`} 
              alt="QR Code" 
              className="w-40 h-40 mix-blend-multiply"
            />
          </div>
          <div className="w-full space-y-2">
            <p className="text-sm font-medium text-gray-500">Enlace de invitación</p>
            <div className="flex gap-2">
              <div className="flex-1 bg-secondary px-3 py-2 rounded-lg text-sm text-gray-600 truncate font-mono">
                {shareUrl}
              </div>
              <Button onClick={handleCopyLink} variant={isCopied ? 'primary' : 'secondary'} size="sm">
                {isCopied ? <Check className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <div className="w-full p-3 bg-blue-50 text-blue-700 rounded-lg text-sm flex items-center gap-2">
            <QrCode className="w-4 h-4" />
            <span>Código de lista: <strong>{list.share_code}</strong></span>
          </div>
        </div>
      </Modal>

      {/* Modal Colaboradores */}
      <Modal isOpen={activeModal === 'collaborators'} onClose={() => setActiveModal(null)} title="Colaboradores">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                {user?.name?.[0].toUpperCase()}
              </div>
              <div>
                <p className="font-medium">Tú</p>
                <p className="text-xs text-gray-500">Propietario</p>
              </div>
            </div>
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">Owner</span>
          </div>

          {collaborators.length > 0 ? (
            collaborators.map((collab, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold">
                    {collab.profiles.name?.[0].toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="font-medium">{collab.profiles.name || 'Usuario'}</p>
                    <p className="text-xs text-gray-500">{collab.profiles.email}</p>
                  </div>
                </div>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full capitalize">{collab.role}</span>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 text-sm py-4">No hay otros colaboradores</p>
          )}
        </div>
      </Modal>

      {/* Modal Editar */}
      <Modal isOpen={activeModal === 'edit'} onClose={() => setActiveModal(null)} title="Editar lista">
        <div className="space-y-4">
          <Input 
            label="Nombre de la lista"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <div className="flex gap-3 justify-end mt-4">
            <Button variant="ghost" onClick={() => setActiveModal(null)}>Cancelar</Button>
            <Button onClick={handleUpdateName}>Guardar</Button>
          </div>
        </div>
      </Modal>

      {/* Modal Eliminar */}
      <Modal isOpen={activeModal === 'delete'} onClose={() => setActiveModal(null)} title="¿Eliminar lista?">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto text-danger">
            <Trash2 className="w-6 h-6" />
          </div>
          <p className="text-gray-600">
            Esta acción no se puede deshacer. Se perderán todos los productos.
          </p>
          <div className="flex gap-3 justify-center mt-6">
            <Button variant="secondary" onClick={() => setActiveModal(null)}>Cancelar</Button>
            <Button variant="danger" onClick={handleDeleteList}>Sí, eliminar</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
