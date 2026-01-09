'use client'

import { useState, useEffect } from 'react'
import { MoreVertical, Trash2, Edit2, Copy, Share2, Check, Link as LinkIcon, QrCode } from 'lucide-react'
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
  const [activeModal, setActiveModal] = useState<'edit' | 'delete' | 'share' | null>(null)
  const [newName, setNewName] = useState(listName)
  const [isLoading, setIsLoading] = useState(false)
  const [shareCode, setShareCode] = useState<string | null>(null)
  const [isCopied, setIsCopied] = useState(false)

  const supabase = createClient()
  const router = useRouter()

  // Cargar el share_code cuando se abre el modal de compartir
  useEffect(() => {
    if (activeModal === 'share') {
      const loadShareCode = async () => {
        const { data } = await supabase
          .from('shopping_lists')
          .select('share_code')
          .eq('id', listId)
          .single()

        if (data) {
          setShareCode(data.share_code)
        }
      }
      loadShareCode()
    }
  }, [activeModal, listId, supabase])

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
      setActiveModal(null)
      // Redirigir a /lists y forzar recarga
      router.push('/lists')
      router.refresh()
    } else {
      console.error('Error al eliminar lista:', error)
    }
    setIsLoading(false)
  }

  const handleCopyLink = () => {
    const url = `${window.location.origin}/join/${shareCode}`
    navigator.clipboard.writeText(url)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  // --- Helpers UI ---
  const handleClick = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault()
    e.stopPropagation()
    action()
  }

  const shareUrl = typeof window !== 'undefined' && shareCode ? `${window.location.origin}/join/${shareCode}` : ''

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
            <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-xl shadow-xl z-40 py-1 animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={(e) => handleClick(e, () => { setShowMenu(false); setActiveModal('share') })}
                className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-hover flex items-center gap-2 transition-colors"
              >
                <Share2 className="w-4 h-4 text-muted" />
                Compartir lista
              </button>

              <button
                onClick={(e) => handleClick(e, () => { setShowMenu(false); setActiveModal('edit'); setNewName(listName) })}
                className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-hover flex items-center gap-2 transition-colors"
              >
                <Edit2 className="w-4 h-4 text-muted" />
                Editar nombre
              </button>

              <button
                onClick={(e) => handleClick(e, handleDuplicate)}
                className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-hover flex items-center gap-2 transition-colors"
              >
                <Copy className="w-4 h-4 text-muted" />
                Duplicar lista
              </button>

              <div className="h-px bg-border-light my-1" />

              <button
                onClick={(e) => handleClick(e, () => { setShowMenu(false); setActiveModal('delete') })}
                className="w-full px-4 py-2 text-left text-sm text-danger hover:bg-danger/10 flex items-center gap-2 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar lista
              </button>
            </div>
          </>
        )}
      </div>

      {/* --- MODALES --- */}

      {/* Modal: Compartir */}
      {activeModal === 'share' && (
        <div onClick={(e) => e.preventDefault()}>
          <Modal isOpen={true} onClose={() => setActiveModal(null)} title="Compartir lista">
            <div className="space-y-6 flex flex-col items-center">
              <div className="bg-white p-4 rounded-xl border-2 border-dashed border-gray-200">
                {shareUrl && (
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${shareUrl}`}
                    alt="QR Code"
                    className="w-40 h-40 mix-blend-multiply"
                  />
                )}
              </div>
              <div className="w-full space-y-2">
                <p className="text-sm font-medium text-gray-500">Enlace de invitación</p>
                <div className="flex gap-2">
                  <div className="flex-1 bg-secondary px-3 py-2 rounded-lg text-sm text-gray-600 truncate font-mono">
                    {shareUrl || 'Cargando...'}
                  </div>
                  <Button onClick={handleCopyLink} variant={isCopied ? 'primary' : 'secondary'} size="sm">
                    {isCopied ? <Check className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div className="w-full p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100 rounded-lg border-2 border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <QrCode className="w-5 h-5" />
                  <span className="text-sm font-medium">Código de lista</span>
                </div>
                <div className="text-center">
                  <span className="text-2xl font-bold tracking-wider">{shareCode || 'Cargando...'}</span>
                </div>
              </div>
            </div>
          </Modal>
        </div>
      )}

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
