'use client'

import { Header } from '@/components/layout/Header'
import { useFavorites } from '@/hooks/useFavorites'
import { useUser } from '@/store/useStore'
import { Star, Plus, Trash2, Loader2, Edit2, X } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useState } from 'react'
import { UserFavoriteItem } from '@/lib/supabase/types'
import { CATEGORIES, CategoryId } from '@/lib/constants'

export default function FavoritesPage() {
  const user = useUser()
  const { favoriteItems, isLoading, addFavoriteItem, removeFavoriteItem } = useFavorites(user?.id)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<UserFavoriteItem | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Form state - sin unidad, solo nombre, cantidad y categoría
  const [formData, setFormData] = useState({
    name: '',
    quantity: 1,
    category: '' as CategoryId | '',
  })

  const resetForm = () => {
    setFormData({ name: '', quantity: 1, category: '' })
    setEditingItem(null)
    setIsAdding(false)
  }

  const handleEdit = (favorite: UserFavoriteItem) => {
    setFormData({
      name: favorite.name,
      quantity: favorite.quantity,
      category: (favorite.category || '') as CategoryId | '',
    })
    setEditingItem(favorite)
    setIsAdding(false)
  }

  const handleAdd = () => {
    setFormData({ name: '', quantity: 1, category: '' })
    setEditingItem(null)
    setIsAdding(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setIsSaving(true)

    if (editingItem) {
      // Si estamos editando, eliminamos el viejo y creamos uno nuevo
      await removeFavoriteItem(editingItem.id)
    }

    const success = await addFavoriteItem({
      name: formData.name.trim(),
      quantity: formData.quantity,
      unit: null,
      category: formData.category || null,
    })

    setIsSaving(false)

    if (success) {
      resetForm()
    }
  }

  const handleRemove = async (itemId: string) => {
    setRemovingId(itemId)
    await removeFavoriteItem(itemId)
    setRemovingId(null)
  }

  // Usar las categorías del sistema
  const categoryList = Object.values(CATEGORIES)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      <Header title="Favoritos" />

      <main className="container max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
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
            {!isLoading && favoriteItems.length > 0 && (
              <Button onClick={handleAdd} size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Añadir
              </Button>
            )}
          </div>
        </div>

        {/* Formulario de añadir/editar */}
        {(isAdding || editingItem) && (
          <Card className="p-4 mb-6 border-2 border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                {editingItem ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {editingItem ? 'Editar favorito' : 'Nuevo favorito'}
              </h3>
              <button
                onClick={resetForm}
                className="p-1 hover:bg-secondary rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Nombre del producto"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Leche"
                  required
                  autoFocus
                />
                <Input
                  label="Cantidad"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">
                  Categoría
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {categoryList.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: cat.id })}
                      className={`flex flex-col items-center p-2 rounded-lg text-xs transition-all ${
                        formData.category === cat.id
                          ? 'bg-primary/10 text-primary ring-2 ring-primary/30 scale-105'
                          : 'bg-secondary text-muted hover:bg-secondary/80'
                      }`}
                    >
                      <cat.icon className="w-5 h-5 mb-1" />
                      <span className="truncate w-full text-center">{cat.label.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="ghost" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving || !formData.name.trim()}>
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      {editingItem ? 'Actualizar' : 'Añadir'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        )}

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
              Puedes añadir favoritos desde tus listas o crear uno nuevo aquí
            </p>
            <Button onClick={handleAdd} variant="primary">
              <Plus className="w-4 h-4 mr-2" />
              Crear favorito
            </Button>
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
                  className="group relative p-4 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => handleEdit(favorite)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500 flex-shrink-0" />
                        <h3 className="font-medium truncate">{favorite.name}</h3>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted">
                        {favorite.quantity > 1 && (
                          <span>x{favorite.quantity}</span>
                        )}
                        {favorite.category && CATEGORIES[favorite.category as CategoryId] && (
                          <>
                            {favorite.quantity > 1 && <span>•</span>}
                            <div className="flex items-center gap-1">
                              {(() => {
                                const Cat = CATEGORIES[favorite.category as CategoryId]
                                return Cat ? <Cat.icon className="w-3 h-3" /> : null
                              })()}
                              <span className="truncate">{CATEGORIES[favorite.category as CategoryId]?.label}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEdit(favorite)
                        }}
                        className="flex-shrink-0 p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4 text-blue-500" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemove(favorite.id)
                        }}
                        disabled={removingId === favorite.id}
                        className="flex-shrink-0 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                        title="Eliminar de favoritos"
                      >
                        {removingId === favorite.id ? (
                          <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4 text-red-500" />
                        )}
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Info */}
            <Card className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/30">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <Star className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                    Gestiona tus favoritos
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Haz clic en cualquier favorito para editarlo. También puedes añadir favoritos desde tus listas
                    tocando la estrella junto a un producto.
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
