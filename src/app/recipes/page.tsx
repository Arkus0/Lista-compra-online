'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Search, ChefHat, Shuffle, Link2, Loader2, X, ArrowRight,
  Plus, Users, Clock, BookOpen, ArrowLeft
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRecipes } from '@/hooks/useRecipes'
import { RecipeCard } from '@/components/recipes/RecipeCard'
import { RecipeDetail } from '@/components/recipes/RecipeDetail'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { TheMealDBRecipe, RecipeIngredient, UserRecipe, ShoppingList } from '@/lib/supabase/types'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'

type TabType = 'search' | 'my-recipes'

export default function RecipesPage() {
  const router = useRouter()
  const supabase = createClient()

  const [activeTab, setActiveTab] = useState<TabType>('search')
  const [user, setUser] = useState<any>(null)
  const [userLists, setUserLists] = useState<ShoppingList[]>([])

  // Search tab state
  const {
    recipes,
    isLoading: isSearching,
    error: searchError,
    searchRecipes,
    getRandomRecipes,
    parseRecipeUrl,
  } = useRecipes()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRecipe, setSelectedRecipe] = useState<TheMealDBRecipe | null>(null)
  const [showUrlImport, setShowUrlImport] = useState(false)
  const [importUrl, setImportUrl] = useState('')
  const [importedRecipe, setImportedRecipe] = useState<any>(null)

  // My recipes state
  const [myRecipes, setMyRecipes] = useState<UserRecipe[]>([])
  const [sharedRecipes, setSharedRecipes] = useState<UserRecipe[]>([])
  const [isLoadingMyRecipes, setIsLoadingMyRecipes] = useState(false)

  // Export to list state
  const [showListSelector, setShowListSelector] = useState(false)
  const [ingredientsToExport, setIngredientsToExport] = useState<RecipeIngredient[]>([])
  const [isExporting, setIsExporting] = useState(false)
  const [exportSuccess, setExportSuccess] = useState(false)
  const [exportMessage, setExportMessage] = useState('')

  // Join recipe by code
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [joinError, setJoinError] = useState('')

  // Load user and lists
  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        // Load user's lists
        const { data: lists } = await supabase
          .from('shopping_lists')
          .select('*')
          .eq('owner_id', user.id)
          .or('is_archived.eq.false,is_archived.is.null')
          .order('updated_at', { ascending: false })
          .limit(20)
        if (lists) setUserLists(lists)
      }
    }
    loadUser()
  }, [supabase])

  // Load random recipes on mount
  useEffect(() => {
    getRandomRecipes()
  }, [getRandomRecipes])

  // Load my recipes when tab changes
  useEffect(() => {
    if (activeTab === 'my-recipes' && user) {
      loadMyRecipes()
    }
  }, [activeTab, user])

  const loadMyRecipes = async () => {
    if (!user) return
    setIsLoadingMyRecipes(true)

    try {
      // Load own recipes
      const { data: ownRecipes } = await supabase
        .from('user_recipes')
        .select('*')
        .eq('owner_id', user.id)
        .order('updated_at', { ascending: false })

      // Load shared recipes
      const { data: collabs } = await supabase
        .from('recipe_collaborators')
        .select('recipe_id')
        .eq('user_id', user.id)

      let shared: UserRecipe[] = []
      if (collabs && collabs.length > 0) {
        const recipeIds = collabs.map(c => c.recipe_id)
        const { data: sharedData } = await supabase
          .from('user_recipes')
          .select('*')
          .in('id', recipeIds)
          .order('updated_at', { ascending: false })
        if (sharedData) shared = sharedData
      }

      setMyRecipes(ownRecipes || [])
      setSharedRecipes(shared)
    } catch (err) {
      console.error('Error loading recipes:', err)
    } finally {
      setIsLoadingMyRecipes(false)
    }
  }

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

  const handleExportToList = (ingredients: RecipeIngredient[]) => {
    setIngredientsToExport(ingredients)
    setShowListSelector(true)
    setSelectedRecipe(null)
  }

  const handleExportToSelectedList = async (listId: string) => {
    if (ingredientsToExport.length === 0 || !user) return
    setIsExporting(true)

    try {
      const { data: existingItems } = await supabase
        .from('list_items')
        .select('name, position')
        .eq('list_id', listId)

      const existingNames = new Set(
        (existingItems || []).map(item => item.name.toLowerCase().trim())
      )

      const newIngredients = ingredientsToExport.filter(
        ing => !existingNames.has(ing.name.toLowerCase().trim())
      )

      const skippedCount = ingredientsToExport.length - newIngredients.length

      if (newIngredients.length === 0) {
        setExportSuccess(true)
        setExportMessage('Todos los ingredientes ya están en la lista')
        setTimeout(() => {
          setShowListSelector(false)
          setIngredientsToExport([])
          setExportSuccess(false)
          setExportMessage('')
        }, 2000)
        return
      }

      let maxPosition = (existingItems || []).reduce(
        (max, item) => Math.max(max, item.position ?? 0),
        -1
      )

      const itemsToInsert = newIngredients.map((ing) => {
        maxPosition++
        return {
          list_id: listId,
          name: ing.name,
          quantity: parseInt(ing.quantity) || 1,
          unit: ing.unit || null,
          category: ing.category || 'pantry',
          added_by: user.id,
          position: maxPosition,
        }
      })

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
      }, 2000)
    } catch (err) {
      console.error('Error exporting ingredients:', err)
    } finally {
      setIsExporting(false)
    }
  }

  const handleJoinByCode = async () => {
    if (!joinCode.trim()) return
    setIsJoining(true)
    setJoinError('')

    try {
      const { data, error } = await supabase.rpc('join_recipe_by_code', {
        share_code_input: joinCode.trim().toUpperCase()
      })

      if (error) throw error

      if (data.success) {
        setShowJoinModal(false)
        setJoinCode('')
        loadMyRecipes()
        router.push(`/recipes/${data.recipe_id}`)
      } else {
        setJoinError(data.error || 'Error al unirse')
      }
    } catch (err) {
      console.error('Error joining recipe:', err)
      setJoinError('Error al unirse a la receta')
    } finally {
      setIsJoining(false)
    }
  }

  // Save TheMealDB recipe to my recipes
  const handleSaveRecipe = async (recipe: TheMealDBRecipe) => {
    if (!user) return

    try {
      const shareCode = Math.random().toString(36).substring(2, 8).toUpperCase()

      const { data, error } = await supabase
        .from('user_recipes')
        .insert({
          owner_id: user.id,
          title: recipe.title,
          image_url: recipe.image_url,
          source_type: 'themealdb',
          external_id: recipe.id,
          ingredients: recipe.ingredients,
          instructions: recipe.instructions,
          category: recipe.category,
          cuisine: recipe.cuisine,
          share_code: shareCode,
        })
        .select()
        .single()

      if (error) throw error

      setSelectedRecipe(null)
      setActiveTab('my-recipes')
      loadMyRecipes()
    } catch (err) {
      console.error('Error saving recipe:', err)
    }
  }

  return (
    <div className="min-h-screen pb-20 bg-background">
      <Header />

      <main className="p-4 space-y-4">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="w-10 h-10 rounded-xl bg-secondary hover:bg-hover flex items-center justify-center text-muted transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <ChefHat className="w-6 h-6 text-primary" />
              Recetas
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowJoinModal(true)}
              className="w-10 h-10 rounded-xl bg-secondary hover:bg-hover flex items-center justify-center text-muted transition-colors"
              title="Unirse con código"
            >
              <Link2 className="w-5 h-5" />
            </button>
            <Link
              href="/recipes/new"
              className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
              title="Nueva receta"
            >
              <Plus className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-secondary rounded-xl">
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'search'
                ? 'bg-card shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Search className="w-4 h-4 inline mr-2" />
            Buscar
          </button>
          <button
            onClick={() => setActiveTab('my-recipes')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'my-recipes'
                ? 'bg-card shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <BookOpen className="w-4 h-4 inline mr-2" />
            Mis Recetas
          </button>
        </div>

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="space-y-4">
            {/* Help message */}
            <p className="text-xs text-muted-foreground bg-secondary/50 px-3 py-2 rounded-lg">
              Busca recetas en inglés o usa la traducción de tu navegador 😊
            </p>

            {/* Search bar */}
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

            {/* URL Import button */}
            <button
              onClick={() => setShowUrlImport(true)}
              className="text-sm text-primary font-medium flex items-center gap-1 hover:underline"
            >
              <Link2 className="w-4 h-4" />
              Importar desde URL
            </button>

            {/* Loading */}
            {isSearching && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}

            {/* Error */}
            {searchError && (
              <div className="text-center py-6 text-red-500 text-sm">
                {searchError}
              </div>
            )}

            {/* Results */}
            {!isSearching && recipes.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {recipes.slice(0, 9).map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    onSelect={setSelectedRecipe}
                  />
                ))}
              </div>
            )}

            {/* No results */}
            {!isSearching && !searchError && recipes.length === 0 && searchQuery && (
              <div className="text-center py-8 text-muted-foreground">
                <ChefHat className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No se encontraron recetas para "{searchQuery}"</p>
              </div>
            )}
          </div>
        )}

        {/* My Recipes Tab */}
        {activeTab === 'my-recipes' && (
          <div className="space-y-6">
            {isLoadingMyRecipes ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Own recipes */}
                <section>
                  <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <ChefHat className="w-5 h-5 text-primary" />
                    Mis Recetas ({myRecipes.length})
                  </h2>

                  {myRecipes.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {myRecipes.map((recipe) => (
                        <Link
                          key={recipe.id}
                          href={`/recipes/${recipe.id}`}
                          className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow"
                        >
                          {recipe.image_url ? (
                            <img
                              src={recipe.image_url}
                              alt={recipe.title}
                              className="w-full h-24 object-cover"
                            />
                          ) : (
                            <div className="w-full h-24 bg-secondary flex items-center justify-center">
                              <ChefHat className="w-8 h-8 text-muted" />
                            </div>
                          )}
                          <div className="p-2">
                            <p className="font-medium text-sm truncate">{recipe.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {recipe.ingredients?.length || 0} ingredientes
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-secondary/30 rounded-xl">
                      <ChefHat className="w-12 h-12 mx-auto mb-2 text-muted" />
                      <p className="text-muted-foreground mb-3">No tienes recetas todavía</p>
                      <Link
                        href="/recipes/new"
                        className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
                      >
                        <Plus className="w-4 h-4" />
                        Crear tu primera receta
                      </Link>
                    </div>
                  )}
                </section>

                {/* Shared recipes */}
                {sharedRecipes.length > 0 && (
                  <section>
                    <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-500" />
                      Compartidas conmigo ({sharedRecipes.length})
                    </h2>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {sharedRecipes.map((recipe) => (
                        <Link
                          key={recipe.id}
                          href={`/recipes/${recipe.id}`}
                          className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow"
                        >
                          {recipe.image_url ? (
                            <img
                              src={recipe.image_url}
                              alt={recipe.title}
                              className="w-full h-24 object-cover"
                            />
                          ) : (
                            <div className="w-full h-24 bg-secondary flex items-center justify-center">
                              <ChefHat className="w-8 h-8 text-muted" />
                            </div>
                          )}
                          <div className="p-2">
                            <p className="font-medium text-sm truncate">{recipe.title}</p>
                            <div className="flex items-center gap-1 text-xs text-blue-500">
                              <Users className="w-3 h-3" />
                              Compartida
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        )}
      </main>

      <BottomNav />

      {/* Recipe Detail Modal */}
      {selectedRecipe && (
        <RecipeDetail
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          onExportToList={handleExportToList}
          onSave={() => handleSaveRecipe(selectedRecipe)}
        />
      )}

      {/* URL Import Modal */}
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
              disabled={!importUrl.trim() || isSearching}
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            </Button>
          </div>

          {searchError && (
            <p className="text-sm text-red-500">{searchError}</p>
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

      {/* List Selector Modal */}
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

      {/* Join by Code Modal */}
      <Modal
        isOpen={showJoinModal}
        onClose={() => {
          setShowJoinModal(false)
          setJoinCode('')
          setJoinError('')
        }}
        title="Unirse a receta"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Introduce el código de la receta compartida.
          </p>

          <Input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="Código de receta"
            className="text-center text-xl font-mono tracking-widest uppercase"
            maxLength={6}
          />

          {joinError && (
            <p className="text-sm text-red-500 text-center">{joinError}</p>
          )}

          <Button
            onClick={handleJoinByCode}
            disabled={joinCode.length < 4 || isJoining}
            className="w-full"
          >
            {isJoining ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Unirse
          </Button>
        </div>
      </Modal>
    </div>
  )
}
