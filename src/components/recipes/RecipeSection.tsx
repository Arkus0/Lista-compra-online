'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Search, ChefHat, Shuffle, Link2, Loader2, X, ArrowRight, BookOpen } from 'lucide-react'
import { useRecipes } from '@/hooks/useRecipes'
import { RecipeCard } from './RecipeCard'
import { RecipeDetail } from './RecipeDetail'
import { RecipeIngredient, TheMealDBRecipe, ShoppingList } from '@/lib/supabase/types'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import type { User } from '@supabase/supabase-js'

interface RecipeSectionProps {
  userId: string
  userLists: ShoppingList[]
}

export function RecipeSection({ userId, userLists }: RecipeSectionProps) {
  const {
    recipes,
    isLoading,
    error,
    searchRecipes,
    getRandomRecipes,
    parseRecipeUrl,
    clearRecipes,
  } = useRecipes()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRecipe, setSelectedRecipe] = useState<TheMealDBRecipe | null>(null)
  
  // URL Import states
  const [showUrlImport, setShowUrlImport] = useState(false)
  const [importUrl, setImportUrl] = useState('')
  const [importedRecipe, setImportedRecipe] = useState<any>(null)
  
  // Export states
  const [showListSelector, setShowListSelector] = useState(false)
  const [ingredientsToExport, setIngredientsToExport] = useState<RecipeIngredient[]>([])
  const [isExporting, setIsExporting] = useState(false)
  const [exportSuccess, setExportSuccess] = useState(false)
  const [exportMessage, setExportMessage] = useState('')

  // Save Recipe states
  const [isSavingRecipe, setIsSavingRecipe] = useState(false)
  const [isRecipeSaved, setIsRecipeSaved] = useState(false)

  // Auth state
  const [authUser, setAuthUser] = useState<User | null>(null)

  const supabase = createClient()
  const { showToast } = useToast()

  // Obtener usuario autenticado del cliente
  useEffect(() => {
    const getAuthUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setAuthUser(user)
    }
    getAuthUser()
  }, [supabase])

  // Cargar recetas aleatorias al inicio
  useEffect(() => {
    getRandomRecipes()
  }, [getRandomRecipes])

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      searchRecipes(searchQuery)
    }
  }, [searchQuery, searchRecipes])

  const handleClearSearch = () => {
    setSearchQuery('')
    getRandomRecipes()
  }

  const handleImportUrl = async () => {
    if (!importUrl.trim()) return

    const recipe = await parseRecipeUrl(importUrl)
    if (recipe) {
      setImportedRecipe(recipe)
    }
  }

  const handleSaveRecipe = async () => {
    if (!selectedRecipe || isSavingRecipe || !authUser) {
      if (!authUser) {
        showToast('Debes iniciar sesión para guardar recetas', 'error')
      }
      return
    }

    setIsSavingRecipe(true)

    try {
      // Generar código de compartir
      const shareCode = Math.random().toString(36).substring(2, 8).toUpperCase()

      // Preparar objeto para guardar en user_recipes
      const newRecipe = {
        owner_id: authUser.id,
        title: selectedRecipe.title,
        description: `Receta de ${selectedRecipe.cuisine} - ${selectedRecipe.category}`,
        image_url: selectedRecipe.image_url,
        source_type: 'themealdb' as const,
        external_id: selectedRecipe.id,
        category: selectedRecipe.category,
        cuisine: selectedRecipe.cuisine,
        ingredients: selectedRecipe.ingredients,
        instructions: selectedRecipe.instructions,
        servings: 4,
        share_code: shareCode,
      }

      const { error } = await supabase
        .from('user_recipes')
        .insert(newRecipe)

      if (error) throw error

      setIsRecipeSaved(true)
      showToast('¡Receta guardada en Mis Recetas!', 'success')

      // Resetear estado después de unos segundos
      setTimeout(() => {
        setIsRecipeSaved(false)
      }, 3000)

    } catch (err) {
      console.error('Error saving recipe:', err)
      showToast('Error al guardar la receta', 'error')
    } finally {
      setIsSavingRecipe(false)
    }
  }

  const handleExportToList = (ingredients: RecipeIngredient[]) => {
    setIngredientsToExport(ingredients)
    setShowListSelector(true)
    // No cerramos selectedRecipe aquí para que el usuario pueda seguir viendo la receta
    // si lo prefiere, pero el modal de lista se superpondrá
  }

  const handleExportToSelectedList = async (listId: string) => {
    if (ingredientsToExport.length === 0) return

    setIsExporting(true)

    try {
      // Obtener items existentes de la lista (nombre y posición)
      const { data: existingItems } = await supabase
        .from('list_items')
        .select('name, position')
        .eq('list_id', listId)

      // Crear set de nombres existentes (lowercase para comparación)
      const existingNames = new Set(
        (existingItems || []).map(item => item.name.toLowerCase().trim())
      )

      // Filtrar ingredientes que NO están en la lista
      const newIngredients = ingredientsToExport.filter(
        ing => !existingNames.has(ing.name.toLowerCase().trim())
      )

      const skippedCount = ingredientsToExport.length - newIngredients.length

      if (newIngredients.length === 0) {
        // Todos los ingredientes ya están en la lista
        setExportSuccess(true)
        setExportMessage('Todos los ingredientes ya están en la lista')
        setTimeout(() => {
          setShowListSelector(false)
          setIngredientsToExport([])
          setExportSuccess(false)
          setExportMessage('')
          // Si veníamos de una receta seleccionada, la cerramos también si queremos
          // setSelectedRecipe(null) 
        }, 2000)
        return
      }

      // Calcular posición máxima
      let maxPosition = (existingItems || []).reduce(
        (max, item) => Math.max(max, item.position ?? 0),
        -1
      )

      // Preparar items para insertar (siempre cantidad 1)
      const itemsToInsert = newIngredients.map((ing) => {
        maxPosition++
        return {
          list_id: listId,
          name: ing.name,
          quantity: 1,
          unit: null,
          category: ing.category || 'pantry',
          added_by: userId,
          position: maxPosition,
        }
      })

      // Insertar los items nuevos
      const { error } = await supabase
        .from('list_items')
        .insert(itemsToInsert)

      if (error) throw error

      setExportSuccess(true)
      setExportMessage(
        skippedCount > 0
          ? `¡${newIngredients.length} añadidos! (${skippedCount} ya estaban)`
          : `¡${newIngredients.length} ingredientes añadidos!`
      )
      setTimeout(() => {
        setShowListSelector(false)
        setIngredientsToExport([])
        setExportSuccess(false)
        setExportMessage('')
        // Opcional: Cerrar la receta al terminar de exportar
        if (selectedRecipe) setSelectedRecipe(null)
      }, 2000)

    } catch (err) {
      console.error('Error exporting ingredients:', err)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <ChefHat className="w-5 h-5 text-primary" />
          Recetas
        </h3>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowUrlImport(true)}
            className="text-sm text-primary font-medium flex items-center gap-1 hover:underline"
          >
            <Link2 className="w-4 h-4" />
            Importar
          </button>
          <Link
            href="/recipes"
            className="text-sm text-primary font-medium flex items-center gap-1 hover:underline"
          >
            <BookOpen className="w-4 h-4" />
            Mis recetas
          </Link>
        </div>
      </div>

      {/* Ayuda traducción */}
      <p className="text-xs text-muted-foreground bg-secondary/50 px-3 py-2 rounded-lg">
        Puedes traducir la receta con tu móvil o tablet pinchando en la opción de traducir de tu navegador 😊
      </p>

      {/* Buscador */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar recetas..."
            className="w-full h-10 pl-10 pr-10 rounded-xl bg-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={getRandomRecipes}
          className="w-10 h-10 rounded-xl bg-secondary hover:bg-hover flex items-center justify-center text-muted hover:text-primary transition-colors"
          title="Recetas aleatorias"
        >
          <Shuffle className="w-4 h-4" />
        </button>
      </form>

      {/* Estado de carga */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-center py-6 text-red-500 text-sm">
          {error}
        </div>
      )}

      {/* Resultados */}
      {!isLoading && recipes.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {recipes.slice(0, 6).map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onSelect={(r) => {
                setSelectedRecipe(r)
                setIsRecipeSaved(false) // Resetear estado al abrir nueva receta
              }}
            />
          ))}
        </div>
      )}

      {/* Sin resultados */}
      {!isLoading && !error && recipes.length === 0 && searchQuery && (
        <div className="text-center py-8 text-muted-foreground">
          <ChefHat className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p>No se encontraron recetas para "{searchQuery}"</p>
        </div>
      )}

      {/* Detalle de receta */}
      {selectedRecipe && (
        <RecipeDetail
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          onExportToList={handleExportToList}
          onSave={handleSaveRecipe}
          isSaving={isSavingRecipe}
          isSaved={isRecipeSaved}
        />
      )}

      {/* Modal importar URL */}
      <Modal
        isOpen={showUrlImport}
        onClose={() => {
          setShowUrlImport(false)
          setImportUrl('')
          setImportedRecipe(null)
        }}
        title="Importar receta desde URL"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Pega el enlace de una receta para extraer sus ingredientes.
          </p>

          <div className="flex gap-2">
            <input
              type="url"
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              placeholder="https://recetas.com/paella..."
              className="flex-1 h-10 px-4 rounded-xl bg-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            />
            <Button
              onClick={handleImportUrl}
              disabled={!importUrl.trim() || isLoading}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            </Button>
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          {importedRecipe && (
            <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                {importedRecipe.image_url && (
                  <img
                    src={importedRecipe.image_url}
                    alt=""
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold truncate">{importedRecipe.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {importedRecipe.ingredients.length} ingredientes
                  </p>
                </div>
              </div>

              {importedRecipe.ingredients.length > 0 && (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {importedRecipe.ingredients.map((ing: RecipeIngredient, i: number) => (
                    <div key={i} className="text-sm py-1 px-2 bg-background rounded">
                      {ing.name} {ing.quantity && `- ${ing.quantity} ${ing.unit}`}
                    </div>
                  ))}
                </div>
              )}

              <Button
                onClick={() => {
                  setIngredientsToExport(importedRecipe.ingredients)
                  setShowUrlImport(false)
                  setShowListSelector(true)
                }}
                className="w-full"
                disabled={importedRecipe.ingredients.length === 0}
              >
                Añadir a lista
              </Button>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal selector de lista */}
      <Modal
        isOpen={showListSelector}
        onClose={() => {
          setShowListSelector(false)
          setIngredientsToExport([])
        }}
        title="Seleccionar lista"
      >
        {exportSuccess ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-3">
              <ChefHat className="w-8 h-8 text-green-600" />
            </div>
            <p className="font-semibold text-green-600">{exportMessage}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Añadir {ingredientsToExport.length} ingredientes a:
            </p>

            {userLists.length === 0 ? (
              <p className="text-center py-4 text-muted-foreground">
                No tienes listas. Crea una primero.
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {userLists.map((list) => (
                  <button
                    key={list.id}
                    onClick={() => handleExportToSelectedList(list.id)}
                    disabled={isExporting}
                    className="w-full p-3 text-left bg-secondary/50 hover:bg-secondary rounded-xl transition-colors flex items-center justify-between disabled:opacity-50"
                  >
                    <span className="font-medium">{list.name}</span>
                    {isExporting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ArrowRight className="w-4 h-4 text-muted" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </section>
  )
}
