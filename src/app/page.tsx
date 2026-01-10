import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { Card } from '@/components/ui/Card'
import { Plus, ShoppingBag, TrendingDown, Users } from 'lucide-react'
import Link from 'next/link'
import { GlobalSearch } from '@/components/search/GlobalSearch'
import { RecipeSection } from '@/components/recipes/RecipeSection'

export default async function Home() {
  const supabase = await createClient()

  // El middleware ya verificó la autenticación, obtenemos el usuario de la sesión
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user

  if (!user) {
    // Fallback - el middleware debería haber redirigido
    return null
  }

  // Ejecutar queries en PARALELO para mayor velocidad
  const [ownListsResult, sharedListsResult, allUserListsResult] = await Promise.all([
    supabase
      .from('shopping_lists')
      .select('id, name, updated_at, list_items(count)')
      .eq('owner_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(5),
    supabase
      .from('list_collaborators')
      .select('shopping_lists(id, name, updated_at, list_items(count))')
      .eq('user_id', user.id)
      .limit(5),
    // Todas las listas del usuario (para selector de recetas)
    supabase
      .from('shopping_lists')
      .select('id, name, owner_id, share_code, created_at, updated_at')
      .eq('owner_id', user.id)
      .eq('is_archived', false)
      .order('updated_at', { ascending: false })
      .limit(20)
  ])

  interface ListItem {
    id: string
    name: string
    updated_at: string
    list_items: { count: number }[]
  }

  const ownLists = ownListsResult.data || []
  const allSharedLists = (sharedListsResult.data?.map((s: any) => s.shopping_lists).filter(Boolean) || []) as ListItem[]
  const allUserLists = allUserListsResult.data || []

  // Combinar y ordenar
  const lists = [...ownLists, ...allSharedLists]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5)

  return (
    <div className="min-h-screen pb-20">
      <Header />

      <main className="p-4 space-y-6">
        {/* Welcome section */}
        <section>
          <h2 className="text-2xl font-bold mb-1">Hola!</h2>
          <p className="text-gray-500 mb-4">Que vas a comprar hoy?</p>
          {/* Global Search */}
          <GlobalSearch userId={user.id} />
        </section>

        {/* Quick actions */}
        <section className="grid grid-cols-2 gap-3">
          <Link href="/lists/new" prefetch={true}>
            <Card variant="elevated" className="h-full hover:scale-[1.02] transition-transform cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Plus className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Nueva lista</p>
                  <p className="text-xs text-gray-500">Crear lista</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/compare" prefetch={true}>
            <Card variant="elevated" className="h-full hover:scale-[1.02] transition-transform cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="font-semibold">Comparar</p>
                  <p className="text-xs text-gray-500">Mejores precios</p>
                </div>
              </div>
            </Card>
          </Link>
        </section>

        {/* Recent lists */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-lg">Tus listas</h3>
            <Link href="/lists" className="text-primary text-sm font-medium" prefetch={true}>
              Ver todas
            </Link>
          </div>

          {lists.length > 0 ? (
            <div className="space-y-3">
              {lists.map((list) => (
                <Link key={list.id} href={`/lists/${list.id}`} prefetch={true}>
                  <Card variant="outlined" className="hover:border-primary transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                        <ShoppingBag className="w-5 h-5 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{list.name}</p>
                        <p className="text-sm text-gray-500">
                          {(list.list_items as { count: number }[])?.[0]?.count || 0} productos
                        </p>
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(list.updated_at).toLocaleDateString('es-ES')}
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card variant="outlined" className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-4">No tienes listas todavia</p>
              <Link href="/lists/new" className="inline-flex items-center gap-2 text-primary font-medium">
                <Plus className="w-4 h-4" />
                Crear tu primera lista
              </Link>
            </Card>
          )}
        </section>

        {/* Recetas */}
        <RecipeSection userId={user.id} userLists={allUserLists} />

        {/* Features preview */}
        <section>
          <h3 className="font-semibold text-lg mb-3">Funcionalidades</h3>
          <div className="grid grid-cols-1 gap-3">
            <Link href="/lists/shared" prefetch={true}>
              <Card variant="outlined" className="hover:border-primary transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Listas colaborativas</p>
                    <p className="text-sm text-gray-500">Comparte y edita en tiempo real</p>
                  </div>
                  <div className="text-gray-400">→</div>
                </div>
              </Card>
            </Link>

            <Link href="/compare" prefetch={true}>
              <Card variant="outlined" className="hover:border-primary transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                    <TrendingDown className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Compara precios</p>
                    <p className="text-sm text-gray-500">Encuentra los mejores precios cerca</p>
                  </div>
                  <div className="text-gray-400">→</div>
                </div>
              </Card>
            </Link>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  )
}
