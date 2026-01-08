import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { Card } from '@/components/ui/Card'
import { MapPin, Store, TrendingDown, Settings2, ShoppingCart } from 'lucide-react'
import Link from 'next/link'

export default async function ComparePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  // Obtener listas del usuario para comparar
  const { data: lists } = await supabase
    .from('shopping_lists')
    .select('*, list_items(count)')
    .eq('owner_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(10)

  return (
    <div className="min-h-screen pb-20">
      <Header title="Comparar Precios" />

      <main className="p-4 space-y-6">
        {/* Info banner */}
        <Card variant="elevated" className="bg-gradient-to-r from-primary/10 to-accent/10">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shrink-0">
              <TrendingDown className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Encuentra los mejores precios</h2>
              <p className="text-sm text-gray-600 mt-1">
                Selecciona una lista y te mostramos donde comprar mas barato
              </p>
            </div>
          </div>
        </Card>

        {/* Purchase modes */}
        <section>
          <h3 className="font-semibold text-lg mb-3">Modo de compra</h3>
          <div className="grid grid-cols-1 gap-3">
            <Card variant="outlined" className="cursor-pointer hover:border-primary transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                  <Store className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Un solo supermercado</p>
                  <p className="text-sm text-gray-500">El mas barato en total</p>
                </div>
                <input type="radio" name="mode" defaultChecked className="w-5 h-5 accent-primary" />
              </div>
            </Card>

            <Card variant="outlined" className="cursor-pointer hover:border-primary transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Varios supermercados</p>
                  <p className="text-sm text-gray-500">Cada producto donde sea mas barato</p>
                </div>
                <input type="radio" name="mode" className="w-5 h-5 accent-primary" />
              </div>
            </Card>

            <Card variant="outlined" className="cursor-pointer hover:border-primary transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                  <Settings2 className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Hibrido</p>
                  <p className="text-sm text-gray-500">Balance entre precio y comodidad</p>
                </div>
                <input type="radio" name="mode" className="w-5 h-5 accent-primary" />
              </div>
            </Card>
          </div>
        </section>

        {/* Location */}
        <section>
          <h3 className="font-semibold text-lg mb-3">Ubicacion</h3>
          <Card variant="outlined">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-red-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Tu ubicacion</p>
                <p className="text-sm text-gray-500">Radio: 5km</p>
              </div>
              <button className="text-primary text-sm font-medium">
                Cambiar
              </button>
            </div>
          </Card>
        </section>

        {/* Select list */}
        <section>
          <h3 className="font-semibold text-lg mb-3">Selecciona una lista</h3>
          {lists && lists.length > 0 ? (
            <div className="space-y-3">
              {lists.map((list) => (
                <Card
                  key={list.id}
                  variant="outlined"
                  className="cursor-pointer hover:border-primary transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <input type="radio" name="list" className="w-5 h-5 accent-primary" />
                    <div className="flex-1">
                      <p className="font-medium">{list.name}</p>
                      <p className="text-sm text-gray-500">
                        {(list.list_items as { count: number }[])?.[0]?.count || 0} productos
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card variant="outlined" className="text-center py-8">
              <p className="text-gray-500 mb-4">No tienes listas para comparar</p>
              <Link href="/lists/new" className="text-primary font-medium">
                Crear una lista
              </Link>
            </Card>
          )}
        </section>

        {/* Compare button */}
        <button
          className="w-full py-4 bg-primary text-white font-semibold rounded-xl
                     hover:bg-primary-dark transition-colors disabled:opacity-50"
          disabled={!lists || lists.length === 0}
        >
          Comparar precios
        </button>

        {/* Coming soon notice */}
        <Card variant="outlined" className="bg-accent/5 border-accent/20">
          <div className="text-center">
            <p className="text-sm text-accent font-medium">Proximamente</p>
            <p className="text-xs text-gray-500 mt-1">
              Esta funcionalidad esta en desarrollo. Pronto podras comparar precios reales.
            </p>
          </div>
        </Card>
      </main>

      <BottomNav />
    </div>
  )
}
