'use client'

import { useState, useRef, useEffect, useCallback, memo } from 'react'
import { Plus, ChevronUp, Loader2, Mic, MicOff, ScanBarcode, Star } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CATEGORIES, detectCategory, CategoryId, searchProducts } from '@/lib/constants'
import { useVoiceInput } from '@/hooks/useVoiceInput'
import { UserFavoriteItem } from '@/lib/supabase/types'
import { BarcodeScannerModal } from './BarcodeScannerModal'

interface AddItemFormProps {
  onAdd: (name: string, category: string, imageUrl?: string) => void | Promise<void>
  suggestionsSource?: UserFavoriteItem[]
  isVisible?: boolean
  onFocusChange?: (isFocused: boolean) => void
}

// Hook personalizado para debounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

function AddItemFormComponent({ onAdd, suggestionsSource = [], isVisible = true, onFocusChange }: AddItemFormProps) {
  const [name, setName] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('other')
  const [showCategories, setShowCategories] = useState(false)
  const [manuallySelected, setManuallySelected] = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
  const [isInputFocused, setIsInputFocused] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  
  // Comunicar cambio de foco al padre, pero mantenemos estado local para respuesta inmediata
  useEffect(() => {
    onFocusChange?.(isInputFocused)
  }, [isInputFocused, onFocusChange])

  const { isListening, transcript, isSupported: voiceSupported, startListening, stopListening } = useVoiceInput()

  useEffect(() => {
    if (transcript) setName(transcript)
  }, [transcript])

  const debouncedName = useDebounce(name, 300)

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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(e.target as Node)) {
        setShowCategories(false)
        setShowSuggestions(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (name.trim() && !isSubmitting) {
      setIsSubmitting(true)
      await onAdd(name.trim(), selectedCategory, undefined)
      setName('')
      setSelectedCategory('other')
      setShowCategories(false)
      setManuallySelected(false)
      setShowSuggestions(false)
      setIsSubmitting(false)
      // Mantener el foco permite seguir añadiendo items rápidamente
      inputRef.current?.focus()
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
      inputRef.current?.focus()
    }
  }

  const handleCategorySelect = useCallback((categoryId: CategoryId) => {
    setSelectedCategory(categoryId)
    setShowCategories(false)
    setManuallySelected(true)
    inputRef.current?.focus()
  }, [])

  const toggleCategories = useCallback(() => {
    setShowCategories(prev => !prev)
    setShowSuggestions(false)
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

  // LÓGICA CRÍTICA:
  // Si el input tiene foco localmente, FORZAMOS que sea visible.
  // Esto evita que una actualización del padre (handleListScroll) oculte el form
  // mientras el teclado está intentando abrirse, lo que causaría que el teclado se cerrara.
  const shouldBeVisible = isVisible || isInputFocused

  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 w-full bg-card border-t border-border-light z-30 pb-safe transition-transform duration-300 ${
        shouldBeVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      {/* Sugerencias Flotantes */}
      {showSuggestions && (
        <div className="absolute bottom-full left-0 right-0 mb-2 px-4 flex gap-2 overflow-x-auto pb-2 z-20 scrollbar-hide mask-fade-sides">
          {suggestions.map((suggestion) => {
            const CategoryConfig = suggestion.category ? CATEGORIES[suggestion.category as CategoryId] : null
            return (
              <button
                key={suggestion.id}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className="flex items-center gap-1.5 px-3 py-2 bg-card rounded-xl shadow-md border border-border/50 hover:bg-secondary whitespace-nowrap transition-transform active:scale-95 flex-shrink-0"
              >
                {suggestion.source === 'favorite' && (
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500 flex-shrink-0" />
                )}
                <span className="font-medium text-sm text-foreground">{suggestion.name}</span>
                {suggestion.quantity && suggestion.quantity > 1 && (
                  <span className="text-[10px] text-muted bg-secondary px-1 py-0.5 rounded">x{suggestion.quantity}</span>
                )}
                {CategoryConfig && (
                  <div className={`w-2 h-2 rounded-full ${CategoryConfig.color.split(' ')[0].replace('text-', 'bg-')}`} />
                )}
              </button>
            )
          })}
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="p-4 max-w-md mx-auto relative">
        {/* Selector de Categorías */}
        {showCategories && (
          <div className="absolute bottom-full left-4 right-4 mb-2 bg-card rounded-xl shadow-xl border border-border p-3 grid grid-cols-5 gap-2 animate-in slide-in-from-bottom-2 z-40">
            {Object.values(CATEGORIES).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategorySelect(cat.id)}
                className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all ${selectedCategory === cat.id ? 'bg-primary/10 text-primary ring-2 ring-primary/20 scale-105' : 'hover:bg-hover text-muted'}`}
              >
                <cat.icon className="w-6 h-6 mb-1.5" />
                <span className="text-[10px] truncate w-full text-center font-medium leading-tight">{cat.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        )}

        {/* Layout principal */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleCategories}
            className={`flex-shrink-0 w-11 h-11 rounded-xl border flex items-center justify-center transition-all duration-300 relative ${showCategories ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'} ${CurrentCategoryConfig.color}`}
          >
            <CurrentCategoryConfig.icon className="w-5 h-5" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-card rounded-full shadow border border-border-light flex items-center justify-center">
              <ChevronUp className="w-2.5 h-2.5 text-muted" />
            </div>
          </button>

          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (e.target.value.trim() === '') {
                  setManuallySelected(false)
                  setSelectedCategory('other')
                }
              }}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setTimeout(() => setIsInputFocused(false), 200)}
              placeholder={isListening ? "Escuchando..." : "Añadir producto..."}
              className={`w-full h-11 rounded-xl bg-secondary px-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-light ${isListening ? 'ring-2 ring-red-500 bg-red-50 dark:bg-red-900/20' : ''}`}
              autoComplete="off"
            />
          </div>

          {/* Mostrar botones extra solo si hay foco (y por ende el teclado está abierto o abriéndose) */}
          {isInputFocused && (
            <div className="flex items-center gap-1 flex-shrink-0 animate-in fade-in slide-in-from-right-2 duration-200">
              {voiceSupported && (
                <button type="button" onClick={handleVoiceButton} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isListening ? 'text-white bg-red-500 animate-pulse' : 'text-muted hover:text-primary hover:bg-secondary'}`}>
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
              )}
              <button type="button" onClick={() => setShowBarcodeScanner(true)} className="w-10 h-10 rounded-xl text-muted hover:text-primary hover:bg-secondary flex items-center justify-center transition-colors">
                <ScanBarcode className="w-5 h-5" />
              </button>
            </div>
          )}

          <Button type="submit" disabled={!name.trim() || isSubmitting} className="w-11 h-11 rounded-xl p-0 flex items-center justify-center shrink-0">
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
          </Button>
        </div>
      </form>

      <BarcodeScannerModal
        isOpen={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onProductFound={handleBarcodeProductFound}
      />
    </div>
  )
}

export const AddItemForm = memo(AddItemFormComponent)
AddItemForm.displayName = 'AddItemForm'
