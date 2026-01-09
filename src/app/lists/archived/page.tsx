'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  Archive,
  Trash2,
  RotateCcw,
  Calendar,
  ShoppingBag,
  Loader2,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ShoppingList } from '@/lib/supabase/types'

interface ArchivedList extends ShoppingList {
  items_count?: number
  checked_count?: number
}

export default function ArchivedListsPage() {
  const [lists, setLists] = useState<ArchivedList[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadArchivedLists()
  }, [])

  const loadArchivedLists = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth')
      return
    }

    // Cargar listas archivadas
    const { data: archivedLists } = await supabase
      .from('shopping_lists')
      .select('*')
      .eq('owner_id', user.id)
      .eq('is_archived', true)
      .order('updated_at', { ascending: false })

    if (archivedLists) {
      // Obtener conteo de items para cada lista
      const listsWithCounts = await Promise.all(
        archivedLists.map(async (list) => {
          const { count: itemsCount } = await supabase
            .from('list_items')
            .select('*', { count: 'exact', head: true })
            .eq('list_id', list.id)

          const { count: checkedCount } = await supabase
            .from('list_items')
            .select('*', { count: 'exact', head: true })
            .eq('list_id', list.id)
            .eq('checked', true)

          return {
            ...list,
            items_count: itemsCount || 0,
            checked_count: checkedCount || 0
          }
        })
      )

      setLists(listsWithCounts)
    }

    setIsLoading(false)
  }

  const handleRestore = async (listId: string) => {
    setActionLoading(listId)

    const { error } = await supabase
      .from('shopping_lists')
      .update({ is_archived: false })
      .eq('id', listId)

    if (!error) {
      setLists(prev => prev.filter(l => l.id !== listId))
    }

    setActionLoading(null)
  }

  const handleDelete = async (listId: string) => {
    if (!confirm('¿Eliminar esta lista permanentemente? Esta acción no se puede deshacer.')) {
      return
    }

    setActionLoading(listId)

    const { error } = await supabase
      .from('shopping_lists')
      .delete()
      .eq('id', listId)

    if (!error) {
      setLists(prev => prev.filter(l => l.id !== listId))
    }

    setActionLoading(null)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen pb-24">
      <Header title="Archivo" showBack />

      <main className="p-4 space-y-4">
        {/* Header info */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <Archive className="w-6 h-6 text-gray-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Listas Archivadas</h1>
            <p className="text-sm text-muted">
              {lists.length} {lists.length === 1 ? 'lista' : 'listas'} en archivo
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted" />
          </div>
        ) : lists.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <Archive className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-lg font-semibold mb-2">No hay listas archivadas</h2>
            <p className="text-sm text-muted mb-4">
              Cuando archives una lista, aparecerá aquí
            </p>
            <Button variant="secondary" onClick={() => router.push('/lists')}>
              <ShoppingBag className="w-4 h-4 mr-2" />
              Ver mis listas
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {lists.map((list) => {
              const isComplete = list.items_count && list.items_count > 0 && list.checked_count === list.items_count

              return (
                <Card key={list.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      isComplete ? 'bg-green-100 dark:bg-green-900/20' : 'bg-gray-100 dark:bg-gray-800'
                    }`}>
                      {isComplete ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <ShoppingBag className="w-5 h-5 text-gray-500" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{list.name}</h3>
                      <div className="flex items-center gap-3 text-xs text-muted mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(list.updated_at)}
                        </span>
                        <span>
                          {list.checked_count}/{list.items_count} items
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleRestore(list.id)}
                        disabled={actionLoading === list.id}
                        className="p-2 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                        title="Restaurar lista"
                      >
                        {actionLoading === list.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RotateCcw className="w-4 h-4 text-green-600" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(list.id)}
                        disabled={actionLoading === list.id}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Eliminar permanentemente"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                </Card>
              )
            })}

            {/* Warning */}
            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-900/30 mt-6">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  Las listas eliminadas permanentemente no se pueden recuperar
                </p>
                <p className="text-amber-700 dark:text-amber-300 mt-1">
                  Restaura las listas que quieras conservar antes de eliminarlas.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
