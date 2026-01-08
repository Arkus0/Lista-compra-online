'use client'

import { useState } from 'react'
import { MoreVertical, Trash2, Edit2, Copy } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface Props {
  listId: string
  listName: string
  ownerId?: string // Opcional, por si queremos restringir acciones
}

export function ListMenuButton({ listId, listName }: Props) {
  const [showMenu, setShowMenu] = useState(false)
  
  // Estados para modales y acciones
  const [activeModal, setActiveModal] = useState<'edit' | 'delete' | null>(null)
  const [newName, setNewName] = useState(listName)
  const [isLoading, setIsLoading] = useState(false)

  const supabase = createClient()
  const router = useRouter()

  // --- Lógica de Negocio ---

  const handleUpdateName = async () => {
    if (!newName.trim() || newName === listName) {
      setActiveModal(null)
      return
    }

    setIsLoading(true)
    const { error } = await supabase
      .from('shopping_lists')
      .update({ name: newName })
      .eq('id', listId)

    if (!error) {
      router.refresh()
      setActiveModal(null)
    }
    setIsLoading(false)
  }

  const handleDuplicate = async () => {
    setIsLoading(true)
    setShowMenu(false)

    // 1. Obtener usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // 2. Obtener items originales
    const { data: items } = await supabase
      .from('list_items')
      .select('*')
      .eq('list_id', listId)

    // 3. Crear nueva lista
    const { data: newList, error: listError } = await supabase
      .from('shopping_lists')
      .insert({
        name: `${listName} (Copia)`,
        owner_id: user.id,
        share_code: Math.random().toString(36).substring(2, 8).toUpperCase()
      })
      .select()
      .single()

    if (listError || !newList) {
      console.error('Error al duplicar lista')
      setIsLoading(false)
      return
    }

    // 4. Copiar items
    if (items && items.length > 0) {
      const itemsToInsert = items.map(item => ({
        list_id: newList.id,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        checked: false,
        added_by: user.id
      }))

      await supabase.from('list_items').insert(itemsToInsert)
    }

    router.refresh()
    setIsLoading(false)
  }

  const handleDelete = async () => {
    setIsLoading(true)
    const { error } = await supabase
      .from('shopping_lists')
      .delete()
      .eq('id', listId)

    if (!error) {
      router.refresh()
      setActiveModal(null)
    }
    setIsLoading(false)
  }

  // --- Helpers UI ---
  const handleClick = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault()
    e.stopPropagation()
    action()
  }

  return (
    <>
      <div className="relative">
        <button
          className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center transition-colors relative z-20"
          onClick={(e) => handleClick(e, () => setShowMenu(!showMenu))}
        >
          {isLoading ? (
             <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <MoreVertical className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {/* Menú Desplegable */}
        {showMenu && (
          <>
            <div className="fixed inset-0 z-30" onClick={(e) => handleClick(e, () => setShowMenu(false))} />
            <div className="absolute right-0 top-full mt-1 w-48 bg-background border border-gray-100 rounded-xl shadow-xl z-40 py-1 animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={(e) => handleClick(e, () => { setShowMenu(false); setActiveModal('edit'); setNewName(listName) })}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4 text-gray-500" />
                Editar nombre
              </button>
              
              <button
                onClick={(e) => handleClick(e, handleDuplicate)}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <Copy className="w-4 h-4 text-gray-500" />
                Duplicar lista
              </button>
              
              <div className="h-px bg-gray-100 my-1" />
              
              <button
                onClick={(e) => handleClick(e, () => { setShowMenu(false); setActiveModal('delete') })}
                className="w-full px-4 py-2 text-left text-sm text-danger hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar lista
              </button>
            </div>
          </>
        )}
      </div>

      {/* --- MODALES --- */}
      
      {/* Modal: Editar Nombre */}
      {activeModal === 'edit' && (
        <div onClick={(e) => e.preventDefault()}>
          <Modal isOpen={true} onClose={() => setActiveModal(null)} title="Editar lista">
            <div className="space-y-4">
              <Input
                label="Nombre de la lista"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
              />
              <div className="flex gap-3 justify-end mt-4">
                <Button variant="ghost" onClick={() => setActiveModal(null)}>Cancelar</Button>
                <Button onClick={handleUpdateName} isLoading={isLoading}>Guardar</Button>
              </div>
            </div>
          </Modal>
        </div>
      )}

      {/* Modal: Eliminar */}
      {activeModal === 'delete' && (
        <div onClick={(e) => e.preventDefault()}>
          <Modal isOpen={true} onClose={() => setActiveModal(null)} title="¿Eliminar lista?">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto text-danger">
                <Trash2 className="w-6 h-6" />
              </div>
              <p className="text-gray-600">
                Vas a eliminar <strong>{listName}</strong>. Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3 justify-center mt-6">
                <Button variant="secondary" onClick={() => setActiveModal(null)}>Cancelar</Button>
                <Button variant="danger" onClick={handleDelete} isLoading={isLoading}>Sí, eliminar</Button>
              </div>
            </div>
          </Modal>
        </div>
      )}
    </>
  )
}
