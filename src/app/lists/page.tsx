import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Plus, ShoppingBag, Users } from 'lucide-react'
import Link from 'next/link'
import { ListMenuButton } from '@/components/shopping/ListMenuButton'

export default async function ListsPage() {
  const supabase = await createClient()

  // El middleware ya verificó la autenticación
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user

  if (!user) {
    return null
  }

  // Ejecutar queries en PARALELO
  const [ownListsResult, sharedListsResult] = await Promise.all([
    supabase
      .from('shopping_lists')
      .select('id, name, updated_at, list_items(count)')
      .eq('owner_id', user.id)
      .order('updated_at', { ascending: false }),
    supabase
      .from('list_collaborators')
      .select('shopping_lists(id, name, updated_at, list_items(count))')
      .eq('user_id', user.id)
  ])

  interface SharedList {
    id: string
    name: string
    updated_at: string
    list_items: { count: number }[]
  }

  const ownLists = ownListsResult.data || []
  const allSharedLists = (sharedListsResult.data?.map(s => s.shopping_lists).filter(Boolean) || []) as unknown as SharedList[]

  return (
    <div className="min-h-screen pb-20">
      <Header title="Mis Listas" />

      <main className="p-4 space-y-6">
        {/* Botón Crear nueva lista */}
        <Link href="/lists/new" prefetch={true}>
          <Button className="w-full" size="lg">
            <Plus className="w-5 h-5" />
            Nueva lista
          </Button>
        </Link>

        {/* Sección: Mis listas (Propias) */}
        <section>
          <h3 className="font-semibold text-lg mb-3">Mis listas</h3>
          {ownLists.length > 0 ? (
            <div className="space-y-3">
              {ownLists.map((list) => (
                <Link key={list.id} href={`/lists/${list.id}`} prefetch={true}>
                  <Card variant="outlined" className="hover:border-primary transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <ShoppingBag className="w-6 h-6 text-primary" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{list.name}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>{(list.list_items as { count: number }[])?.[0]?.count || 0} productos</span>
                          <span>•</span>
                          <span>{new Date(list.updated_at).toLocaleDateString('es-ES')}</span>
                        </div>
                      </div>

                      <ListMenuButton listId={list.id} listName={list.name} />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card variant="outlined" className="text-center py-8">
              <p className="text-gray-500">No tienes listas propias</p>
            </Card>
          )}
        </section>

        {/* Sección: Compartidas conmigo */}
        {allSharedLists.length > 0 && (
          <section>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Compartidas conmigo
            </h3>
            <div className="space-y-3">
              {allSharedLists.map((list) => (
                <Link key={list.id} href={`/lists/${list.id}`} prefetch={true}>
                  <Card variant="outlined" className="hover:border-primary transition-colors cursor-pointer">
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
          </section>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
