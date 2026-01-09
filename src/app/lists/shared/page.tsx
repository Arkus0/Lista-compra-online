'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ListCardSkeleton } from '@/components/ui/Skeleton'
import { Users, ShoppingBag, Share2, Check, Link as LinkIcon, QrCode } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface SharedList {
  id: string
  name: string
  updated_at: string
  list_items: { count: number }[]
}

interface OwnList {
  id: string
  name: string
  share_code: string | null
}

export default function SharedListsPage() {
  const [sharedLists, setSharedLists] = useState<SharedList[]>([])
  const [ownLists, setOwnLists] = useState<OwnList[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showShareModal, setShowShareModal] = useState(false)
  const [selectedList, setSelectedList] = useState<OwnList | null>(null)
  const [isCopied, setIsCopied] = useState(false)

  const router = useRouter()
  // Usar ref para evitar recreación del cliente
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
        return
      }

      // Cargar ambas queries en paralelo para mayor velocidad
      const [sharedResult, ownResult] = await Promise.all([
        supabase
          .from('list_collaborators')
          .select('shopping_lists(*, list_items(count))')
          .eq('user_id', user.id),
        supabase
          .from('shopping_lists')
          .select('id, name, share_code')
          .eq('owner_id', user.id)
          .order('updated_at', { ascending: false })
      ])

      if (isMounted) {
        const allSharedLists = (sharedResult.data?.map((s: any) => s.shopping_lists).filter(Boolean) || []) as SharedList[]
        setSharedLists(allSharedLists)
        setOwnLists(ownResult.data || [])
        setIsLoading(false)
      }
    }

    loadData()

    return () => { isMounted = false }
  }, [supabase, router])

  const handleSelectListToShare = useCallback((list: OwnList) => {
    setSelectedList(list)
  }, [])

  const handleCopyLink = useCallback(() => {
    if (!selectedList?.share_code) return
    const url = `${window.location.origin}/join/${selectedList.share_code}`
    navigator.clipboard.writeText(url)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }, [selectedList?.share_code])

  const closeModal = useCallback(() => {
    setSelectedList(null)
    setShowShareModal(false)
    setIsCopied(false)
  }, [])

  const openShareModal = useCallback(() => {
    setShowShareModal(true)
  }, [])

  // Memoizar shareUrl para evitar recálculos
  const shareUrl = useMemo(() =>
    typeof window !== 'undefined' && selectedList?.share_code
      ? `${window.location.origin}/join/${selectedList.share_code}`
      : '',
    [selectedList?.share_code]
  )

  return (
    <div className="min-h-screen pb-20">
      <Header title="Listas Colaborativas" />

      <main className="p-4 space-y-6">
        {/* Listas compartidas conmigo */}
        <section>
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Compartidas conmigo
          </h3>

          {isLoading ? (
            <div className="space-y-3">
              <ListCardSkeleton />
              <ListCardSkeleton />
            </div>
          ) : sharedLists.length > 0 ? (
            <div className="space-y-3">
              {sharedLists.map((list) => (
                <Link key={list.id} href={`/lists/${list.id}`}>
                  <Card
                    variant="outlined"
                    className="hover:border-primary transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{list.name}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>{(list.list_items as { count: number }[])?.[0]?.count || 0} productos</span>
                          <span>•</span>
                          <span>Compartida</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card variant="outlined" className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">No tienes listas compartidas todavía</p>
            </Card>
          )}
        </section>

        {/* Banner para compartir */}
        <section>
          <Card
            variant="elevated"
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white cursor-pointer hover:scale-[1.02] transition-transform"
            onClick={openShareModal}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Share2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-lg">
                  {sharedLists.length > 0 ? 'Compartir listas' : 'Empieza a compartir'}
                </p>
                <p className="text-sm text-blue-100">
                  {sharedLists.length > 0
                    ? 'Comparte tus listas con otros'
                    : 'Invita a otros a colaborar en tus listas'}
                </p>
              </div>
              <div className="text-white/80">→</div>
            </div>
          </Card>
        </section>
      </main>

      <BottomNav />

      {/* Modal: Seleccionar lista para compartir */}
      <Modal
        isOpen={showShareModal && !selectedList}
        onClose={() => setShowShareModal(false)}
        title="Selecciona la lista a compartir"
      >
        <div className="space-y-3">
          {isLoading ? (
            <>
              <ListCardSkeleton />
              <ListCardSkeleton />
            </>
          ) : ownLists.length > 0 ? (
            ownLists.map((list) => (
              <Card
                key={list.id}
                variant="outlined"
                className="hover:border-primary transition-colors cursor-pointer"
                onClick={() => handleSelectListToShare(list)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{list.name}</p>
                  </div>
                  <Share2 className="w-5 h-5 text-gray-400" />
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No tienes listas para compartir</p>
              <Link href="/lists/new">
                <Button>Crear nueva lista</Button>
              </Link>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal: Mostrar QR y código para compartir */}
      <Modal
        isOpen={!!selectedList}
        onClose={closeModal}
        title={`Compartir: ${selectedList?.name}`}
      >
        <div className="space-y-6 flex flex-col items-center">
          <div className="bg-white p-4 rounded-xl border-2 border-dashed border-gray-200">
            {shareUrl && (
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(shareUrl)}`}
                alt="QR Code"
                className="w-40 h-40 mix-blend-multiply"
                loading="lazy"
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
          <div className="w-full p-3 bg-blue-50 text-blue-700 rounded-lg text-sm flex items-center gap-2">
            <QrCode className="w-4 h-4" />
            <span>Código de lista: <strong>{selectedList?.share_code || 'Cargando...'}</strong></span>
          </div>
        </div>
      </Modal>
    </div>
  )
}
