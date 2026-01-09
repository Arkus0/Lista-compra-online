'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  FileText,
  Plus,
  Trash2,
  Loader2,
  ShoppingBag,
  ChevronRight,
  Sparkles
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ShoppingList } from '@/lib/supabase/types'

interface TemplateWithItems extends ShoppingList {
  items_count?: number
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<TemplateWithItems[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [creatingFromId, setCreatingFromId] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth')
      return
    }

    const { data: templateLists } = await supabase
      .from('shopping_lists')
      .select('*')
      .eq('owner_id', user.id)
      .eq('is_template', true)
      .order('created_at', { ascending: false })

    if (templateLists) {
      const templatesWithCounts = await Promise.all(
        templateLists.map(async (template) => {
          const { count } = await supabase
            .from('list_items')
            .select('*', { count: 'exact', head: true })
            .eq('list_id', template.id)

          return { ...template, items_count: count || 0 }
        })
      )

      setTemplates(templatesWithCounts)
    }

    setIsLoading(false)
  }

  const handleCreateFromTemplate = async (template: TemplateWithItems) => {
    setCreatingFromId(template.id)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Crear nueva lista desde plantilla
    const { data: newList, error: listError } = await supabase
      .from('shopping_lists')
      .insert({
        name: template.name.replace(' (plantilla)', ''),
        owner_id: user.id,
        is_template: false
      })
      .select()
      .single()

    if (listError || !newList) {
      setCreatingFromId(null)
      return
    }

    // Copiar items de la plantilla
    const { data: templateItems } = await supabase
      .from('list_items')
      .select('*')
      .eq('list_id', template.id)

    if (templateItems && templateItems.length > 0) {
      const itemsCopy = templateItems.map((item, index) => ({
        list_id: newList.id,
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

    router.push(`/lists/${newList.id}`)
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('¿Eliminar esta plantilla?')) return

    await supabase.from('shopping_lists').delete().eq('id', templateId)
    setTemplates(prev => prev.filter(t => t.id !== templateId))
  }

  return (
    <div className="min-h-screen pb-24">
      <Header title="Plantillas" showBack />

      <main className="p-4 space-y-4">
        {/* Header info */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
            <FileText className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Plantillas de Listas</h1>
            <p className="text-sm text-muted">
              Crea listas rápidamente desde plantillas guardadas
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted" />
          </div>
        ) : templates.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-purple-400" />
            </div>
            <h2 className="text-lg font-semibold mb-2">No tienes plantillas</h2>
            <p className="text-sm text-muted mb-4">
              Guarda una lista como plantilla desde el menú de opciones de cualquier lista
            </p>
            <Button variant="secondary" onClick={() => router.push('/lists')}>
              <ShoppingBag className="w-4 h-4 mr-2" />
              Ir a mis listas
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {templates.map((template) => (
              <Card key={template.id} className="overflow-hidden">
                <div className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-purple-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{template.name}</h3>
                    <p className="text-xs text-muted">
                      {template.items_count} {template.items_count === 1 ? 'producto' : 'productos'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => handleCreateFromTemplate(template)}
                  disabled={creatingFromId === template.id}
                  className="w-full px-4 py-3 bg-purple-50 dark:bg-purple-900/10 border-t border-purple-100 dark:border-purple-900/30 flex items-center justify-center gap-2 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/20 transition-colors disabled:opacity-50"
                >
                  {creatingFromId === template.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Crear lista desde esta plantilla
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </Card>
            ))}
          </div>
        )}

        {/* Tip */}
        <Card className="p-4 bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/30 mt-6">
          <div className="flex gap-3">
            <Sparkles className="w-5 h-5 text-blue-600 shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                Tip: Crea plantillas para compras recurrentes
              </p>
              <p className="text-blue-700 dark:text-blue-300">
                Guarda tu lista semanal de supermercado como plantilla y créala con un toque cada semana.
              </p>
            </div>
          </div>
        </Card>
      </main>

      <BottomNav />
    </div>
  )
}
