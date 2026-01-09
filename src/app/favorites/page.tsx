'use client'

import { Header } from '@/components/layout/Header'
import { useFavorites } from '@/hooks/useFavorites'
import { Star, Plus, Trash2, Loader2, ShoppingBag } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useState } from 'react'
import Link from 'next/link'

export default function FavoritesPage() {
  const { favoriteItems, isLoading, removeFavoriteItem } = useFavorites()
  const [removingId, setRemovingId] = useState<string | null>(null)

  const handleRemove = async (itemId: string) => {
    setRemovingId(itemId)
    await removeFavoriteItem(itemId)
    setRemovingId(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header title="Favoritos" />

      <main className="container max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/20 rounded-xl flex items-center justify-center">
              <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Elementos Favoritos</h1>
              <p className="text-sm text-muted">
                Gestiona tus productos favoritos para añadirlos rápidamente a tus listas
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : favoriteItems.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-10 h-10 text-muted" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No tienes favoritos</h2>
            <p className="text-muted mb-6">
              Cuando estés en una lista, toca la estrella de cualquier producto para añadirlo a tus favoritos
            </p>
            <Link href="/">
              <Button>
                <ShoppingBag className="w-4 h-4 mr-2" />
                Ver mis listas
              </Button>
            </Link>
          </Card>
        ) : (
          <>
            {/* Stats */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted">
                {favoriteItems.length} {favoriteItems.length === 1 ? 'elemento' : 'elementos'}
              </p>
            </div>

            {/* Grid de favoritos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {favoriteItems.map((favorite) => (
                <Card
                  key={favorite.id}
                  className="group relative p-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500 flex-shrink-0" />
                        <h3 className="font-medium truncate">{favorite.name}</h3>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted">
                        {favorite.quantity > 1 && (
                          <span>
                            {favorite.quantity}
                            {favorite.unit && ` ${favorite.unit}`}
                          </span>
                        )}
                        {favorite.category && (
                          <>
                            {favorite.quantity > 1 && <span>•</span>}
                            <span className="truncate">{favorite.category}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemove(favorite.id)}
                      disabled={removingId === favorite.id}
                      className="flex-shrink-0 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                      title="Eliminar de favoritos"
                    >
                      {removingId === favorite.id ? (
                        <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 text-red-500" />
                      )}
                    </button>
                  </div>
                </Card>
              ))}
            </div>

            {/* Info */}
            <Card className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/30">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                    ¿Cómo usar favoritos?
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    En cualquier lista, toca el ícono de estrella junto a un producto para añadirlo a favoritos.
                    Luego podrás añadirlo rápidamente a otras listas desde la sección de favoritos en la parte inferior.
                  </p>
                </div>
              </div>
            </Card>
          </>
        )}
      </main>
    </div>
  )
}
