'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, ChefHat, Plus, Trash2, Clock, Users as UsersIcon,
  Camera, Loader2, X
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useImageUpload } from '@/hooks/useImageUpload'
import { RecipeIngredient } from '@/lib/supabase/types'

const CATEGORIES = [
  'Desayuno', 'Almuerzo', 'Cena', 'Postre', 'Snack',
  'Sopa', 'Ensalada', 'Pasta', 'Arroces', 'Carnes',
  'Pescados', 'Vegetariano', 'Vegano', 'Otro'
]

const CUISINES = [
  'Española', 'Italiana', 'Mexicana', 'Japonesa', 'China',
  'India', 'Francesa', 'Americana', 'Mediterránea', 'Otra'
]

export default function NewRecipePage() {
  const router = useRouter()
  const supabase = createClient()
  const { upload: uploadImage, isUploading } = useImageUpload({ bucket: 'recipe-images' })

  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [category, setCategory] = useState('')
  const [cuisine, setCuisine] = useState('')
  const [servings, setServings] = useState(4)
  const [prepTime, setPrepTime] = useState<number | ''>('')
  const [cookTime, setCookTime] = useState<number | ''>('')
  const [instructions, setInstructions] = useState('')

  // Ingredients
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([
    { name: '', quantity: '', unit: '' }
  ])

  // Load user
  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
    }
    loadUser()
  }, [supabase, router])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const path = `recipes/${Date.now()}_${Math.random().toString(36).slice(2)}`
    const url = await uploadImage(file, path)
    if (url) {
      setImageUrl(url)
    }
  }

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', quantity: '', unit: '' }])
  }

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index))
  }

  const updateIngredient = (index: number, field: keyof RecipeIngredient, value: string) => {
    const updated = [...ingredients]
    updated[index] = { ...updated[index], [field]: value }
    setIngredients(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !title.trim()) return

    setIsLoading(true)

    try {
      // Filter out empty ingredients
      const validIngredients = ingredients.filter(ing => ing.name.trim())

      // Generate share code
      const shareCode = Math.random().toString(36).substring(2, 8).toUpperCase()

      const { data, error } = await supabase
        .from('user_recipes')
        .insert({
          owner_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          image_url: imageUrl || null,
          category: category || null,
          cuisine: cuisine || null,
          servings: servings || 4,
          prep_time: prepTime || null,
          cook_time: cookTime || null,
          ingredients: validIngredients,
          instructions: instructions.trim() || null,
          source_type: 'manual',
          share_code: shareCode,
        })
        .select()
        .single()

      if (error) throw error

      router.push(`/recipes/${data.id}`)
    } catch (err) {
      console.error('Error creating recipe:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href="/recipes"
              className="w-10 h-10 rounded-xl bg-secondary hover:bg-hover flex items-center justify-center text-muted transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-bold">Nueva Receta</h1>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !title.trim()}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Guardar
          </Button>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        {/* Image */}
        <div className="relative">
          {imageUrl ? (
            <div className="relative h-48 rounded-xl overflow-hidden">
              <img src={imageUrl} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setImageUrl('')}
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
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nombre de la receta"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-2">Descripción</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Breve descripción de la receta..."
            className="w-full h-20 px-4 py-3 rounded-xl border-2 border-border bg-input-bg text-foreground placeholder:text-muted-light focus:outline-none focus:border-primary transition-colors resize-none"
          />
        </div>

        {/* Category & Cuisine */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Categoría</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
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
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value)}
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
              value={prepTime}
              onChange={(e) => setPrepTime(e.target.value ? parseInt(e.target.value) : '')}
              placeholder="15"
              min={0}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Cocción (min)
            </label>
            <Input
              type="number"
              value={cookTime}
              onChange={(e) => setCookTime(e.target.value ? parseInt(e.target.value) : '')}
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
              value={servings}
              onChange={(e) => setServings(parseInt(e.target.value) || 4)}
              min={1}
            />
          </div>
        </div>

        {/* Ingredients */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Ingredientes
          </label>
          <div className="space-y-2">
            {ingredients.map((ing, index) => (
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
                {ingredients.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeIngredient(index)}
                    className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 flex items-center justify-center hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
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
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Escribe los pasos de la receta..."
            className="w-full h-40 px-4 py-3 rounded-xl border-2 border-border bg-input-bg text-foreground placeholder:text-muted-light focus:outline-none focus:border-primary transition-colors resize-none"
          />
        </div>
      </form>
    </div>
  )
}
