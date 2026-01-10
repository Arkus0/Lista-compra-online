'use client'

import { useState } from 'react'
import { X, ChefHat, Clock, Users, ShoppingCart, Check, ExternalLink } from 'lucide-react'
import { TheMealDBRecipe, RecipeIngredient } from '@/lib/supabase/types'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

interface RecipeDetailProps {
  recipe: TheMealDBRecipe | null
  onClose: () => void
  onExportToList: (ingredients: RecipeIngredient[]) => void
}

export function RecipeDetail({ recipe, onClose, onExportToList }: RecipeDetailProps) {
  const [selectedIngredients, setSelectedIngredients] = useState<Set<number>>(new Set())
  const [showExportConfirm, setShowExportConfirm] = useState(false)

  if (!recipe) return null

  const toggleIngredient = (index: number) => {
    const newSelected = new Set(selectedIngredients)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedIngredients(newSelected)
  }

  const selectAll = () => {
    setSelectedIngredients(new Set(recipe.ingredients.map((_, i) => i)))
  }

  const deselectAll = () => {
    setSelectedIngredients(new Set())
  }

  const handleExport = () => {
    const ingredientsToExport = recipe.ingredients.filter((_, i) => selectedIngredients.has(i))
    if (ingredientsToExport.length > 0) {
      onExportToList(ingredientsToExport)
      setShowExportConfirm(true)
      setTimeout(() => {
        setShowExportConfirm(false)
        onClose()
      }, 1500)
    }
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
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-colors"
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
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              Ingredientes ({recipe.ingredients.length})
            </h2>
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="text-xs text-primary hover:underline"
              >
                Todos
              </button>
              <span className="text-muted">|</span>
              <button
                onClick={deselectAll}
                className="text-xs text-muted-foreground hover:underline"
              >
                Ninguno
              </button>
            </div>
          </div>

          <div className="space-y-1">
            {recipe.ingredients.map((ing, index) => (
              <button
                key={index}
                onClick={() => toggleIngredient(index)}
                className={`
                  w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors
                  ${selectedIngredients.has(index)
                    ? 'bg-primary/10 border border-primary/30'
                    : 'bg-secondary/50 hover:bg-secondary border border-transparent'
                  }
                `}
              >
                <div
                  className={`
                    w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors
                    ${selectedIngredients.has(index)
                      ? 'bg-primary border-primary'
                      : 'border-gray-300 dark:border-gray-600'
                    }
                  `}
                >
                  {selectedIngredients.has(index) && (
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  )}
                </div>
                <span className="flex-1 text-sm">
                  <span className="font-medium">{ing.name}</span>
                  {(ing.quantity || ing.unit) && (
                    <span className="text-muted-foreground ml-1">
                      - {ing.quantity} {ing.unit}
                    </span>
                  )}
                </span>
              </button>
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

      {/* Botón de exportar fijo */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-md border-t border-border">
        {showExportConfirm ? (
          <div className="flex items-center justify-center gap-2 text-green-600 py-3">
            <Check className="w-5 h-5" />
            <span className="font-medium">¡Ingredientes añadidos!</span>
          </div>
        ) : (
          <Button
            onClick={handleExport}
            disabled={selectedIngredients.size === 0}
            className="w-full h-12 text-base font-semibold"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Añadir {selectedIngredients.size} ingrediente{selectedIngredients.size !== 1 ? 's' : ''} a la lista
          </Button>
        )}
      </div>
    </div>
  )
}
