'use client'

import { memo } from 'react'
import { Clock, Users, ChefHat } from 'lucide-react'
import { TheMealDBRecipe } from '@/lib/supabase/types'

interface RecipeCardProps {
  recipe: TheMealDBRecipe
  onSelect: (recipe: TheMealDBRecipe) => void
  compact?: boolean
}

function RecipeCardComponent({ recipe, onSelect, compact = false }: RecipeCardProps) {
  if (compact) {
    return (
      <button
        onClick={() => onSelect(recipe)}
        className="flex items-center gap-3 p-2 bg-card rounded-xl border border-border hover:border-primary/50 hover:shadow-md transition-all text-left w-full group"
      >
        <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-secondary">
          {recipe.image_url ? (
            <img
              src={recipe.image_url}
              alt={recipe.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-muted" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{recipe.title}</p>
          <p className="text-xs text-muted-foreground truncate">
            {recipe.cuisine} • {recipe.ingredients.length} ingredientes
          </p>
        </div>
      </button>
    )
  }

  return (
    <button
      onClick={() => onSelect(recipe)}
      className="bg-card rounded-2xl border border-border overflow-hidden hover:border-primary/50 hover:shadow-lg transition-all text-left group"
    >
      <div className="aspect-[4/3] relative overflow-hidden bg-secondary">
        {recipe.image_url ? (
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ChefHat className="w-12 h-12 text-muted" />
          </div>
        )}
        <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-full text-white text-xs font-medium">
          {recipe.category}
        </div>
      </div>

      <div className="p-3">
        <h3 className="font-semibold text-sm line-clamp-2 mb-1 group-hover:text-primary transition-colors">
          {recipe.title}
        </h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {recipe.cuisine}
          </span>
          <span>•</span>
          <span>{recipe.ingredients.length} ingr.</span>
        </div>
      </div>
    </button>
  )
}

export const RecipeCard = memo(RecipeCardComponent)
