'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, ChefHat, Clock, Users as UsersIcon, Edit2, Trash2,
  Share2, ShoppingCart, QrCode, Link as LinkIcon, Check, X,
  Camera, Loader2, Plus, MoreVertical, UserPlus
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { UserRecipe, RecipeIngredient, ShoppingList } from '@/lib/supabase/types'
import { useImageUpload } from '@/hooks/useImageUpload'

const CATEGORIES = [
  'Desayuno', 'Almuerzo', 'Cena', 'Postre', 'Snack',
  'Sopa', 'Ensalada', 'Pasta', 'Arroces', 'Carnes',
  'Pescados', 'Vegetariano', 'Vegano', 'Otro'
]

const CUISINES = [
  'Española', 'Italiana', 'Mexicana', 'Japonesa', 'China',
  'India', 'Francesa', 'Americana', 'Mediterránea', 'Otra'
]

export default function RecipeDetailPage() {
  const router = useRouter()
  const params = useParams()
  const recipeId = params.id as string
  const supabase = createClient()
  const { upload: uploadImage, isUploading } = useImageUpload({ bucket: 'recipe-images' })

  const [user, setUser] = useState<any>(null)
  const [recipe, setRecipe] = useState<UserRecipe | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Edit mode
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<UserRecipe>>({})

  // Modals
  const [showMenu, setShowMenu] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  // Export to list
  const [lists, setLists] = useState<ShoppingList[]>([])
  const [selectedListId, setSelectedListId] = useState('')
  const [isExporting, setIsExporting] = useState(false)

  // Load recipe and user
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      // Load recipe
      const { data: recipeData, error } = await supabase
        .from('user_recipes')
        .select('*')
        .eq('id', recipeId)
        .single()

      if (error || !recipeData) {
        console.error('Error loading recipe:', error)
        router.push('/recipes')
        return
      }

      setRecipe(recipeData)
      setIsOwner(recipeData.owner_id === user.id)

      // Load user's lists for export
      const { data: listsData } = await supabase
        .from('shopping_lists')
        .select('*')
        .order('created_at', { ascending: false })

      if (listsData) {
        setLists(listsData)
        if (listsData.length > 0) {
          setSelectedListId(listsData[0].id)
        }
      }

      setIsLoading(false)
    }

    loadData()
  }, [supabase, router, recipeId])

  const startEditing = () => {
    if (!recipe) return
    setEditData({
      title: recipe.title,
      description: recipe.description,
      image_url: recipe.image_url,
      category: recipe.category,
      cuisine: recipe.cuisine,
      servings: recipe.servings,
      prep_time: recipe.prep_time,
      cook_time: recipe.cook_time,
      ingredients: [...recipe.ingredients],
      instructions: recipe.instructions,
    })
    setIsEditing(true)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const path = `recipes/${Date.now()}_${Math.random().toString(36).slice(2)}`
    const url = await uploadImage(file, path)
    if (url) {
      setEditData(prev => ({ ...prev, image_url: url }))
    }
  }

  const addIngredient = () => {
    const ingredients = editData.ingredients || []
    setEditData(prev => ({
      ...prev,
      ingredients: [...ingredients, { name: '', quantity: '', unit: '' }]
    }))
  }

  const removeIngredient = (index: number) => {
    const ingredients = editData.ingredients || []
    setEditData(prev => ({
      ...prev,
      ingredients: ingredients.filter((_, i) => i !== index)
    }))
  }

  const updateIngredient = (index: number, field: keyof RecipeIngredient, value: string) => {
    const ingredients = [...(editData.ingredients || [])]
    ingredients[index] = { ...ingredients[index], [field]: value }
    setEditData(prev => ({ ...prev, ingredients }))
  }

  const saveChanges = async () => {
    if (!recipe || !editData.title?.trim()) return

    setIsSaving(true)

    try {
      const validIngredients = (editData.ingredients || []).filter(ing => ing.name.trim())

      const { error } = await supabase
        .from('user_recipes')
        .update({
          title: editData.title.trim(),
          description: editData.description?.trim() || null,
          image_url: editData.image_url || null,
          category: editData.category || null,
          cuisine: editData.cuisine || null,
          servings: editData.servings || 4,
          prep_time: editData.prep_time || null,
          cook_time: editData.cook_time || null,
          ingredients: validIngredients,
          instructions: editData.instructions?.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', recipe.id)

      if (error) throw error

      // Reload recipe
      const { data: updatedRecipe } = await supabase
        .from('user_recipes')
        .select('*')
        .eq('id', recipe.id)
        .single()

      if (updatedRecipe) {
        setRecipe(updatedRecipe)
      }

      setIsEditing(false)
    } catch (err) {
      console.error('Error saving recipe:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!recipe) return

    setIsSaving(true)

    try {
      const { error } = await supabase
        .from('user_recipes')
        .delete()
        .eq('id', recipe.id)

      if (error) throw error

      router.push('/recipes')
    } catch (err) {
      console.error('Error deleting recipe:', err)
      setIsSaving(false)
    }
  }

  const handleCopyLink = () => {
    if (!recipe?.share_code) return
    const url = `${window.location.origin}/join-recipe/${recipe.share_code}`
    navigator.clipboard.writeText(url)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const handleExportToList = async () => {
    if (!recipe || !selectedListId) return

    setIsExporting(true)

    try {
      const itemsToInsert = recipe.ingredients
        .filter(ing => ing.name.trim())
        .map(ing => ({
          list_id: selectedListId,
          name: ing.name,
          quantity: ing.quantity ? parseFloat(ing.quantity) || 1 : 1,
          unit: ing.unit || null,
          category: 'otros',
          checked: false,
          added_by: user.id,
        }))

      if (itemsToInsert.length > 0) {
        const { error } = await supabase
          .from('list_items')
          .insert(itemsToInsert)

        if (error) throw error
      }

      setShowExportModal(false)
      router.push(`/lists/${selectedListId}`)
    } catch (err) {
      console.error('Error exporting to list:', err)
    } finally {
      setIsExporting(false)
    }
  }

  const shareUrl = typeof window !== 'undefined' && recipe?.share_code
    ? `${window.location.origin}/join-recipe/${recipe.share_code}`
    : ''

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <ChefHat className="w-16 h-16 text-muted mb-4" />
        <p className="text-muted-foreground">Receta no encontrada</p>
        <Link href="/recipes" className="mt-4 text-primary hover:underline">
          Volver a recetas
        </Link>
      </div>
    )
  }

  // Edit mode UI
  if (isEditing) {
    return (
      <div className="min-h-screen bg-background pb-8">
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="w-10 h-10 rounded-xl bg-secondary hover:bg-hover flex items-center justify-center text-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <h1 className="text-lg font-bold">Editar Receta</h1>
            </div>
            <Button
              onClick={saveChanges}
              disabled={isSaving || !editData.title?.trim()}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Guardar
            </Button>
          </div>
        </header>

        <div className="p-4 space-y-6">
          {/* Image */}
          <div className="relative">
            {editData.image_url ? (
              <div className="relative h-48 rounded-xl overflow-hidden">
                <img src={editData.image_url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setEditData(prev => ({ ...prev, image_url: '' }))}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-48 bg-secondary rounded-xl border-2 border-dashed border-border cursor-pointer hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                />
                {isUploading ? (
                  <Loader2 className="w-8 h-8 animate-spin text-muted" />
                ) : (
                  <>
                    <Camera className="w-8 h-8 text-muted mb-2" />
                    <span className="text-sm text-muted-foreground">Añadir foto</span>
                  </>
                )}
              </label>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">Título *</label>
            <Input
              value={editData.title || ''}
              onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Nombre de la receta"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Descripción</label>
            <textarea
              value={editData.description || ''}
              onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Breve descripción..."
              className="w-full h-20 px-4 py-3 rounded-xl border-2 border-border bg-input-bg text-foreground placeholder:text-muted-light focus:outline-none focus:border-primary transition-colors resize-none"
            />
          </div>

          {/* Category & Cuisine */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Categoría</label>
              <select
                value={editData.category || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full h-10 px-4 rounded-xl border-2 border-border bg-input-bg text-foreground focus:outline-none focus:border-primary transition-colors"
              >
                <option value="">Seleccionar...</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Cocina</label>
              <select
                value={editData.cuisine || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, cuisine: e.target.value }))}
                className="w-full h-10 px-4 rounded-xl border-2 border-border bg-input-bg text-foreground focus:outline-none focus:border-primary transition-colors"
              >
                <option value="">Seleccionar...</option>
                {CUISINES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Times & Servings */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Prep (min)
              </label>
              <Input
                type="number"
                value={editData.prep_time || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, prep_time: parseInt(e.target.value) || null }))}
                placeholder="15"
                min={0}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Cocción
              </label>
              <Input
                type="number"
                value={editData.cook_time || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, cook_time: parseInt(e.target.value) || null }))}
                placeholder="30"
                min={0}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                <UsersIcon className="w-4 h-4 inline mr-1" />
                Raciones
              </label>
              <Input
                type="number"
                value={editData.servings || 4}
                onChange={(e) => setEditData(prev => ({ ...prev, servings: parseInt(e.target.value) || 4 }))}
                min={1}
              />
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <label className="block text-sm font-medium mb-2">Ingredientes</label>
            <div className="space-y-2">
              {(editData.ingredients || []).map((ing, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={ing.name}
                    onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                    placeholder="Ingrediente"
                    className="flex-1"
                  />
                  <Input
                    value={ing.quantity}
                    onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                    placeholder="Cant."
                    className="w-20"
                  />
                  <Input
                    value={ing.unit}
                    onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                    placeholder="Unid."
                    className="w-20"
                  />
                  {(editData.ingredients?.length || 0) > 1 && (
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addIngredient}
                className="w-full py-2 border-2 border-dashed border-border rounded-xl text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Añadir ingrediente
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <ChefHat className="w-4 h-4 inline mr-1" />
              Instrucciones
            </label>
            <textarea
              value={editData.instructions || ''}
              onChange={(e) => setEditData(prev => ({ ...prev, instructions: e.target.value }))}
              placeholder="Escribe los pasos..."
              className="w-full h-40 px-4 py-3 rounded-xl border-2 border-border bg-input-bg text-foreground placeholder:text-muted-light focus:outline-none focus:border-primary transition-colors resize-none"
            />
          </div>
        </div>
      </div>
    )
  }

  // View mode UI
  return (
    <div className="min-h-screen bg-background">
      {/* Header with image */}
      <div className="relative h-56 sm:h-72">
        {recipe.image_url ? (
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-secondary flex items-center justify-center">
            <ChefHat className="w-20 h-20 text-muted" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Back button */}
        <Link
          href="/recipes"
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        {/* Menu button */}
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-12 w-48 bg-card border border-border rounded-xl shadow-xl z-40 py-1 animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={() => { setShowMenu(false); setShowShareModal(true) }}
                  className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-hover flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4 text-muted" />
                  Compartir receta
                </button>

                {isOwner && (
                  <>
                    <button
                      onClick={() => { setShowMenu(false); startEditing() }}
                      className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-hover flex items-center gap-2"
                    >
                      <Edit2 className="w-4 h-4 text-muted" />
                      Editar receta
                    </button>

                    <div className="h-px bg-border-light my-1" />

                    <button
                      onClick={() => { setShowMenu(false); setShowDeleteModal(true) }}
                      className="w-full px-4 py-2 text-left text-sm text-danger hover:bg-danger/10 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar receta
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Info overlay */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-2 mb-2">
            {recipe.category && (
              <span className="px-2 py-1 bg-primary text-primary-foreground rounded-full text-xs font-medium">
                {recipe.category}
              </span>
            )}
            {recipe.cuisine && (
              <span className="px-2 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full text-xs">
                {recipe.cuisine}
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white line-clamp-2">
            {recipe.title}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="pb-24">
        {/* Meta info */}
        <div className="p-4 border-b border-border flex gap-4">
          {recipe.prep_time && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Prep: {recipe.prep_time}min</span>
            </div>
          )}
          {recipe.cook_time && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Cocción: {recipe.cook_time}min</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <UsersIcon className="w-4 h-4" />
            <span>{recipe.servings} raciones</span>
          </div>
        </div>

        {/* Description */}
        {recipe.description && (
          <div className="p-4 border-b border-border">
            <p className="text-muted-foreground">{recipe.description}</p>
          </div>
        )}

        {/* Ingredients */}
        <div className="p-4 border-b border-border">
          <h2 className="font-bold text-lg flex items-center gap-2 mb-3">
            <ShoppingCart className="w-5 h-5 text-primary" />
            Ingredientes ({recipe.ingredients.length})
          </h2>

          <div className="space-y-1">
            {recipe.ingredients.map((ing, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-secondary/50"
              >
                <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                <span className="flex-1 text-sm">
                  <span className="font-medium">{ing.name}</span>
                  {(ing.quantity || ing.unit) && (
                    <span className="text-muted-foreground ml-1">
                      - {ing.quantity} {ing.unit}
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        {recipe.instructions && (
          <div className="p-4">
            <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-primary" />
              Preparación
            </h2>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {recipe.instructions.split('\n').map((paragraph, i) => (
                paragraph.trim() && (
                  <p key={i} className="text-sm text-muted-foreground mb-3 leading-relaxed">
                    {paragraph}
                  </p>
                )
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fixed bottom button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-md border-t border-border">
        <Button
          onClick={() => setShowExportModal(true)}
          disabled={recipe.ingredients.length === 0}
          className="w-full h-12 text-base font-semibold"
        >
          <ShoppingCart className="w-5 h-5 mr-2" />
          Añadir a lista de compras
        </Button>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <Modal isOpen={true} onClose={() => setShowShareModal(false)} title="Compartir receta">
          <div className="space-y-6 flex flex-col items-center">
            <div className="bg-white p-4 rounded-xl border-2 border-dashed border-gray-200">
              {shareUrl && (
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(shareUrl)}`}
                  alt="QR Code"
                  className="w-40 h-40 mix-blend-multiply"
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
            <div className="w-full p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm flex items-center gap-2">
              <QrCode className="w-4 h-4" />
              <span>Código de receta: <strong>{recipe.share_code || 'N/A'}</strong></span>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Comparte este código o enlace para que otros puedan ver tu receta
            </p>
          </div>
        </Modal>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <Modal isOpen={true} onClose={() => setShowDeleteModal(false)} title="¿Eliminar receta?">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto text-danger">
              <Trash2 className="w-6 h-6" />
            </div>
            <p className="text-muted-foreground">
              Vas a eliminar <strong>{recipe.title}</strong>. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-center mt-6">
              <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancelar</Button>
              <Button variant="danger" onClick={handleDelete} isLoading={isSaving}>Sí, eliminar</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Export to List Modal */}
      {showExportModal && (
        <Modal isOpen={true} onClose={() => setShowExportModal(false)} title="Añadir a lista">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Se añadirán {recipe.ingredients.length} ingredientes a la lista seleccionada.
            </p>

            <div>
              <label className="block text-sm font-medium mb-2">Selecciona una lista</label>
              <select
                value={selectedListId}
                onChange={(e) => setSelectedListId(e.target.value)}
                className="w-full h-10 px-4 rounded-xl border-2 border-border bg-input-bg text-foreground focus:outline-none focus:border-primary transition-colors"
              >
                {lists.map(list => (
                  <option key={list.id} value={list.id}>{list.name}</option>
                ))}
              </select>
            </div>

            {lists.length === 0 && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                No tienes listas. Crea una primero.
              </p>
            )}

            <div className="flex gap-3 justify-end mt-4">
              <Button variant="ghost" onClick={() => setShowExportModal(false)}>Cancelar</Button>
              <Button
                onClick={handleExportToList}
                isLoading={isExporting}
                disabled={!selectedListId || lists.length === 0}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Añadir
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
