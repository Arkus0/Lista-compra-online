// src/components/shopping/AddItemForm.tsx
'use client'

import { useState, useRef, useEffect, useCallback, memo } from 'react'
import { Plus, ChevronUp, Loader2, Mic, MicOff, ScanBarcode, Star, LayoutGrid, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CATEGORIES, detectCategory, CategoryId, searchProducts } from '@/lib/constants'
import { useVoiceInput } from '@/hooks/useVoiceInput'
import { UserFavoriteItem } from '@/lib/supabase/types'
import { BarcodeScannerModal } from './BarcodeScannerModal'

interface AddItemFormProps {
  onAdd: (name: string, category: string, imageUrl?: string) => void | Promise<void>
  onOpenCatalog?: () => void
  suggestionsSource?: UserFavoriteItem[]
  // Eliminamos props de visibilidad externa ya que el Drawer controla eso
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

function AddItemFormComponent({ 
  onAdd, 
  onOpenCatalog,
  suggestionsSource = []
}: AddItemFormProps) {
  const [name, setName] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('other')
  const [showCategories, setShowCategories] = useState(false)
  const [manuallySelected, setManuallySelected] = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Voice Input Hook
  const { isListening, transcript, isSupported: voiceSupported, startListening, stopListening } = useVoiceInput()

  useEffect(() => {
    if (transcript) setName(transcript)
  }, [transcript])

  const debouncedName = useDebounce(name, 300)

  // Lógica de sugerencias (Simplificada)
  useEffect(() => {
    if (name.trim().length >= 2) {
      const normalizedName = name.toLowerCase()
      const combinedSuggestions: any[] = []
      const addedNames = new Set<string>()

      suggestionsSource
        .filter(item => item.name.toLowerCase().includes(normalizedName) && item.name.toLowerCase() !== normalizedName)
        .slice(0, 5)
        .forEach(fav => {
          if (!addedNames.has(fav.name.toLowerCase())) {
            combinedSuggestions.push({
              id: fav.id, name: fav.name, category: fav.category, source: 'favorite', quantity: fav.quantity
            })
            addedNames.add(fav.name.toLowerCase())
          }
        })

      const commonMatches = searchProducts(name, 5)
      commonMatches.forEach(product => {
        if (!addedNames.has(product.name.toLowerCase())) {
          combinedSuggestions.push({
            id: `common-${product.name}`, name: product.name, category: product.category, source: 'common'
          })
          addedNames.add(product.name.toLowerCase())
        }
      })

      setSuggestions(combinedSuggestions)
      setShowSuggestions(combinedSuggestions.length > 0)
    } else {
      setShowSuggestions(false)
      setSuggestions([])
    }

    if (!manuallySelected && debouncedName.trim().length > 2) {
      const detected = detectCategory(debouncedName)
      if (detected !== 'other') setSelectedCategory(detected)
    }
  }, [debouncedName, manuallySelected, name, suggestionsSource])

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (name.trim() && !isSubmitting) {
      setIsSubmitting(true)
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50)
      
      await onAdd(name.trim(), selectedCategory, undefined)
      
      setName('')
      setSelectedCategory('other')
      setShowCategories(false)
      setManuallySelected(false)
      setShowSuggestions(false)
      setIsSubmitting(false)
      
      // Mantener foco es buena UX en listas rápidas
      setTimeout(() => inputRef.current?.focus(), 10)
    }
  }, [name, selectedCategory, onAdd, isSubmitting])

  const handleSuggestionClick = async (suggestion: any) => {
    const categoryToUse = suggestion.category ? (suggestion.category as CategoryId) : 'other'
    setShowSuggestions(false)
    if (!isSubmitting) {
      setIsSubmitting(true)
      await onAdd(suggestion.name, categoryToUse, undefined)
      setName('')
      setSelectedCategory('other')
      setManuallySelected(false)
      setIsSubmitting(false)
    }
  }

  const handleCategorySelect = useCallback((categoryId: CategoryId) => {
    setSelectedCategory(categoryId)
    setShowCategories(false)
    setManuallySelected(true)
    inputRef.current?.focus()
  }, [])

  const handleBarcodeProductFound = useCallback((productName: string, category?: string) => {
    setName(productName)
    if (category) {
      setSelectedCategory(category as CategoryId)
      setManuallySelected(true)
    }
    inputRef.current?.focus()
  }, [])

  const handleVoiceButton = useCallback(() => {
    if (isListening) stopListening()
    else startListening()
  }, [isListening, startListening, stopListening])

  const CurrentCategoryConfig = CATEGORIES[selectedCategory]

  return (
    <div className="w-full bg-card pt-2 pb-4">
      {/* Sugerencias integradas en el flujo */}
      {showSuggestions && (
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide mask-fade-sides">
          {suggestions.map((suggestion) => {
            const CategoryConfig = suggestion.category ? CATEGORIES[suggestion.category as CategoryId] : null
            return (
              <button
                key={suggestion.id}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className="flex items-center gap-1.5 px-3 py-2 bg-secondary/50 rounded-xl border border-border/50 hover:bg-secondary whitespace-nowrap active:scale-95 transition-transform"
              >
                {suggestion.source === 'favorite' && <Star className="w-3 h-3 text-amber-500 fill-amber-500 flex-shrink-0" />}
                <span className="font-medium text-sm text-foreground">{suggestion.name}</span>
                {CategoryConfig && <div className={`w-2 h-2 rounded-full ${CategoryConfig.color.split(' ')[0].replace('text-', 'bg-')}`} />}
              </button>
            )
          })}
        </div>
      )}

      <form onSubmit={handleSubmit} className="relative">
        {/* Selector de Categorías (Overlay relativo) */}
        {showCategories && (
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-popover rounded-xl shadow-xl border border-border p-3 grid grid-cols-5 gap-2 animate-in slide-in-from-bottom-2 z-50">
            {Object.values(CATEGORIES).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategorySelect(cat.id)}
                className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all ${selectedCategory === cat.id ? 'bg-primary/10 text-primary ring-1 ring-primary/20' : 'hover:bg-muted text-muted-foreground'}`}
              >
                <cat.icon className="w-5 h-5 mb-1" />
                <span className="text-[10px] truncate w-full text-center leading-tight">{cat.label.split(' ')[0]}</span>
              </button>
            ))}
            <button type="button" onClick={() => setShowCategories(false)} className="col-span-5 flex items-center justify-center pt-2 border-t border-border mt-1">
                <ChevronUp className="w-4 h-4 rotate-180 text-muted-foreground"/>
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
           {/* Botón Catálogo */}
           {onOpenCatalog && (
             <button
               type="button"
               onClick={onOpenCatalog}
               className="flex-shrink-0 w-11 h-11 rounded-xl bg-secondary text-foreground hover:bg-primary/10 hover:text-primary transition-colors flex items-center justify-center"
               title="Catálogo"
             >
               <LayoutGrid className="w-5 h-5" />
             </button>
          )}

          {/* Botón Categoría */}
          <button 
            type="button" 
            onClick={() => setShowCategories(!showCategories)} 
            className={`flex-shrink-0 w-11 h-11 rounded-xl border flex items-center justify-center transition-all relative ${showCategories ? 'border-primary ring-2 ring-primary/20' : 'border-border'} ${CurrentCategoryConfig.color}`}
          >
            <CurrentCategoryConfig.icon className="w-5 h-5" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-card rounded-full shadow border border-border-light flex items-center justify-center"><ChevronUp className="w-2.5 h-2.5 text-muted" /></div>
          </button>

          {/* Input Principal */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (e.target.value.trim() === '') { setManuallySelected(false); setSelectedCategory('other') }
              }}
              placeholder={isListening ? "Escuchando..." : "Añadir item..."}
              className={`w-full h-11 rounded-xl bg-secondary px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground ${isListening ? 'ring-2 ring-red-500 bg-red-50' : ''}`}
              autoComplete="off"
              // AutoFocus es seguro dentro de un Drawer abierto
              autoFocus
            />
            {/* Botón X para limpiar el input */}
            {name && (
              <button
                type="button"
                onClick={() => {
                  setName('')
                  setManuallySelected(false)
                  setSelectedCategory('other')
                  setShowSuggestions(false)
                  inputRef.current?.focus()
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted/50 transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Botones de acción derecha */}
          {!name && (
            <>
              {voiceSupported && (
                <button type="button" onClick={handleVoiceButton} className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${isListening ? 'text-white bg-red-500 animate-pulse' : 'text-muted-foreground bg-secondary hover:text-primary'}`}>
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
              )}
              <button type="button" onClick={() => setShowBarcodeScanner(true)} className="w-11 h-11 rounded-xl bg-secondary text-muted-foreground hover:text-primary flex items-center justify-center"><ScanBarcode className="w-5 h-5" /></button>
            </>
          )}

          {name && (
            <Button type="submit" disabled={isSubmitting} className="w-11 h-11 rounded-xl p-0 flex items-center justify-center shrink-0 shadow-sm animate-in zoom-in">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-6 h-6" />}
            </Button>
          )}
        </div>
      </form>

      <BarcodeScannerModal isOpen={showBarcodeScanner} onClose={() => setShowBarcodeScanner(false)} onProductFound={handleBarcodeProductFound} />
    </div>
  )
}

export const AddItemForm = memo(AddItemFormComponent)
