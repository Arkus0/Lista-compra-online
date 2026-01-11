'use client'

import { X, ChefHat, ShoppingCart, BookmarkPlus, Loader2, Check } from 'lucide-react'
import { TheMealDBRecipe, RecipeIngredient } from '@/lib/supabase/types'
import { Button } from '@/components/ui/Button'

interface RecipeDetailProps {
  recipe: TheMealDBRecipe | null
  onClose: () => void
  onExportToList: (ingredients: RecipeIngredient[]) => void
  onSave?: () => void
  isSaving?: boolean
  isSaved?: boolean
}

export function RecipeDetail({ 
  recipe, 
  onClose, 
  onExportToList, 
  onSave, 
  isSaving = false, 
  isSaved = false 
}: RecipeDetailProps) {
  if (!recipe) return null

  const handleExport = () => {
    // Exportar TODOS los ingredientes
    onExportToList(recipe.ingredients)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background animate-in slide-in-from-bottom duration-300">
      {/* Header con imagen */}
      <div className="relative h-56 sm:h-72 flex-shrink-0">
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

        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Info sobre imagen */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 bg-primary text-primary-foreground rounded-full text-xs font-medium">
              {recipe.category}
            </span>
            <span className="px-2 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full text-xs">
              {recipe.cuisine}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white line-clamp-2">
            {recipe.title}
          </h1>
        </div>
      </div>

      {/* Contenido scrolleable */}
      <div className="flex-1 overflow-y-auto">
        {/* Ingredientes */}
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

        {/* Instrucciones */}
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

        {/* Espacio para el botón fijo */}
        <div className="h-24" />
      </div>

      {/* Botones fijos */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-md border-t border-border z-20">
        <div className="flex gap-2">
          {onSave && (
            <Button
              onClick={onSave}
              disabled={isSaving || isSaved}
              variant="secondary"
              className={`h-12 px-4 transition-all ${isSaved ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800' : ''}`}
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isSaved ? (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Guardado
                </>
              ) : (
                <>
                  <BookmarkPlus className="w-5 h-5 mr-2" />
                  Guardar
                </>
              )}
            </Button>
          )}
          
          <Button
            onClick={handleExport}
            disabled={recipe.ingredients.length === 0}
            className={`h-12 text-base font-semibold ${onSave ? 'flex-1' : 'w-full'}`}
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Añadir a lista
          </Button>
        </div>
      </div>
    </div>
  )
}
