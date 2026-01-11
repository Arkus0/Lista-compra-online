'use client'

import { useEffect } from 'react' // Importamos useEffect
import { X, Clock, Users, ChefHat, ExternalLink, Save, ArrowRight, Check } from 'lucide-react' // AÑADIDO: Check
import { TheMealDBRecipe, RecipeIngredient } from '@/lib/supabase/types'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface RecipeDetailProps {
  recipe: TheMealDBRecipe
  onClose: () => void
  onExportToList: (ingredients: RecipeIngredient[]) => void
  onSave: () => void
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
  
  // BLOQUEO DE SCROLL DEL FONDO
  useEffect(() => {
    // Al montar: bloquear scroll
    document.body.style.overflow = 'hidden'
    
    // Al desmontar: desbloquear scroll
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-card w-full max-w-2xl max-h-[90dvh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Image */}
        <div className="relative h-48 sm:h-64 flex-shrink-0 group">
          {recipe.image_url ? (
            <img
              src={recipe.image_url}
              alt={recipe.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-secondary flex items-center justify-center">
              <ChefHat className="w-16 h-16 text-muted" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors backdrop-blur-md z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-4 right-4 text-white">
            <Badge variant="secondary" className="mb-2 bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md">
              {recipe.category}
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold leading-tight line-clamp-2 text-shadow-sm">{recipe.title}</h2>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 overscroll-contain">
          {/* Metadata */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground border-b border-border pb-4">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span>{recipe.cuisine}</span>
            </div>
            {recipe.source_url && (
              <a 
                href={recipe.source_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-primary hover:underline ml-auto"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Ver receta original</span>
              </a>
            )}
          </div>

          {/* Ingredients */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                Ingredientes
                <span className="text-xs font-normal text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                  {recipe.ingredients.length}
                </span>
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {recipe.ingredients.map((ing, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-colors">
                  <div className="w-2 h-2 rounded-full bg-primary/70 flex-shrink-0 shadow-[0_0_8px] shadow-primary/30" />
                  <span className="font-medium text-sm sm:text-base">{ing.name}</span>
                  {ing.quantity && <span className="text-muted-foreground text-xs sm:text-sm ml-auto font-mono bg-background/50 px-1.5 py-0.5 rounded">{ing.quantity} {ing.unit}</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          {recipe.instructions && (
            <div>
              <h3 className="font-semibold text-lg mb-3">Instrucciones</h3>
              <div className="prose prose-sm dark:prose-invert text-muted-foreground whitespace-pre-line leading-relaxed bg-secondary/10 p-4 rounded-xl border border-border/50">
                {recipe.instructions}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions - Fixed at bottom */}
        <div className="p-4 bg-background/95 backdrop-blur-md border-t border-border flex gap-3 flex-shrink-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          <Button 
            variant="outline" 
            className={`flex-1 gap-2 transition-all ${isSaved ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900' : ''}`}
            onClick={onSave}
            disabled={isSaving || isSaved}
          >
            {isSaved ? (
              <>
                <Check className="w-4 h-4" /> Guardado
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> {isSaving ? 'Guardando...' : 'Guardar'}
              </>
            )}
          </Button>
          <Button 
            className="flex-[1.5] gap-2 shadow-lg shadow-primary/20"
            onClick={() => onExportToList(recipe.ingredients)}
          >
            Añadir a lista <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
