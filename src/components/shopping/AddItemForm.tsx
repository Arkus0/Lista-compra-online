'use client'

import { useState, useRef, useEffect, useCallback, memo } from 'react'
import { Plus, ChevronUp, Loader2, Mic, MicOff, ScanBarcode, Star, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CATEGORIES, detectCategory, CategoryId, searchProducts } from '@/lib/constants'
import { useVoiceInput } from '@/hooks/useVoiceInput'
import { UserFavoriteItem } from '@/lib/supabase/types'
import { BarcodeScannerModal } from './BarcodeScannerModal'

interface AddItemFormProps {
  onAdd: (name: string, category: string, imageUrl?: string) => void | Promise<void>
  suggestionsSource?: UserFavoriteItem[]
}

// Hook personalizado para debounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

function AddItemFormComponent({ onAdd, suggestionsSource = [] }: AddItemFormProps) {
  const [name, setName] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('other')
  const [showCategories, setShowCategories] = useState(false)
  const [manuallySelected, setManuallySelected] = useState(false)

  // Estados para Sugerencias
  type Suggestion = {
    id: string
    name: string
    category: CategoryId | string | null
    source: 'favorite' | 'common'
    quantity?: number
  }
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Estados para Escáner de código de barras
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)

  // Estados para control de visibilidad y UI
  const [isInputFocused, setIsInputFocused] = useState(false)
  const [isFormVisible, setIsFormVisible] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Hook de reconocimiento de voz
  const {
    isListening,
    transcript,
    isSupported: voiceSupported,
    startListening,
    stopListening,
  } = useVoiceInput()

  // Actualizar el nombre cuando se detecta voz
  useEffect(() => {
    if (transcript) {
      setName(transcript)
    }
  }, [transcript])

  // Debounce del nombre para detección de categoría y sugerencias
  const debouncedName = useDebounce(name, 300)

  // Autodetección de categoría y Filtrado de Sugerencias
  useEffect(() => {
    if (name.trim().length >= 2) {
      const normalizedName = name.toLowerCase()
      const combinedSuggestions: Suggestion[] = []
      const addedNames = new Set<string>()

      // 1. Favoritos
      suggestionsSource
        .filter(item =>
          item.name.toLowerCase().includes(normalizedName) &&
          item.name.toLowerCase() !== normalizedName
        )
        .slice(0, 3)
        .forEach(fav => {
          if (!addedNames.has(fav.name.toLowerCase())) {
            combinedSuggestions.push({
              id: fav.id,
              name: fav.name,
              category: fav.category,
              source: 'favorite',
              quantity: fav.quantity
            })
            addedNames.add(fav.name.toLowerCase())
          }
        })

      // 2. Productos comunes
      const commonMatches = searchProducts(name, 5)
      commonMatches.forEach(product => {
        if (!addedNames.has(product.name.toLowerCase())) {
          combinedSuggestions.push({
            id: `common-${product.name}`,
            name: product.name,
            category: product.category,
            source: 'common'
          })
          addedNames.add(product.name.toLowerCase())
        }
      })

      setSuggestions(combinedSuggestions.slice(0, 5))
      setShowSuggestions(combinedSuggestions.length > 0)
    } else {
      setShowSuggestions(false)
      setSuggestions([])
    }

    // Autodetectar categoría
    if (!manuallySelected && debouncedName.trim().length > 2) {
      const detected = detectCategory(debouncedName)
      if (detected !== 'other') {
        setSelectedCategory(detected)
      }
    }
  }, [debouncedName, manuallySelected, name, suggestionsSource])

  // Cerrar menú al hacer click fuera
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

  // Ocultar formulario al hacer scroll
  useEffect(() => {
    let lastScrollY = window.scrollY

    const handleScroll = () => {
      const currentScrollY = window.scrollY
      // Ocultar si bajamos scroll (>50px)
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsFormVisible(false)
      } else {
        setIsFormVisible(true)
      }
      lastScrollY = currentScrollY

      // Resetear timer para volver a mostrarlo
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
      
      scrollTimeoutRef.current = setTimeout(() => {
        setIsFormVisible(true)
      }, 1000)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
    }
  }, [])

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (name.trim() && !isSubmitting) {
      setIsSubmitting(true)

      await onAdd(name.trim(), selectedCategory, undefined)

      // Resetear estados
      setName('')
      setSelectedCategory('other')
      setShowCategories(false)
      setManuallySelected(false)
      setShowSuggestions(false)
      setIsSubmitting(false)

      // Mantener foco
      inputRef.current?.focus()
    }
  }, [name, selectedCategory, onAdd, isSubmitting])

  const handleSuggestionClick = async (suggestion: Suggestion) => {
    const categoryToUse = suggestion.category ? (suggestion.category as CategoryId) : 'other'
    
    setShowSuggestions(false)

    // Añadir inmediatamente
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
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  const CurrentCategoryConfig = CATEGORIES[selectedCategory]

  return (
    <div 
      className={`sticky bottom-0 bg-card border-t border-border-light z-30 pb-safe transition-transform duration-300 ${
        isFormVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      {/* Sugerencias Flotantes */}
      {showSuggestions && (
        <div className="absolute bottom-full left-4 right-4 mb-2 bg-card rounded-xl shadow-lg border border-border overflow-hidden animate-in slide-in-from-bottom-2 z-20">
          <div className="bg-secondary/50 px-4 py-1.5 text-xs text-muted font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Sugerencias
          </div>
          {suggestions.map((suggestion) => {
            const CategoryConfig = suggestion.category ? CATEGORIES[suggestion.category as CategoryId] : null
            return (
              <button
                key={suggestion.id}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left px-4 py-2.5 hover:bg-secondary flex items-center justify-between group transition-colors border-b border-border/50 last:border-0"
              >
                <div className="flex items-center gap-2">
                  {suggestion.source === 'favorite' && (
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500 flex-shrink-0" />
                  )}
                  <span className="font-medium text-foreground">{suggestion.name}</span>
                  {suggestion.quantity && suggestion.quantity > 1 && (
                    <span className="text-xs text-muted bg-secondary px-1.5 py-0.5 rounded">x{suggestion.quantity}</span>
                  )}
                </div>
                {CategoryConfig && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${CategoryConfig.color}`}>
                    {CategoryConfig.label.split(' ')[0]}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="p-4 max-w-md mx-auto relative"
      >
        {/* Selector de Categorías (Pop-up) */}
        {showCategories && (
          <div className="absolute bottom-full left-4 right-4 mb-2 bg-card rounded-xl shadow-xl border border-border p-3 grid grid-cols-5 gap-2 animate-in slide-in-from-bottom-2 z-40">
            {Object.values(CATEGORIES).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategorySelect(cat.id)}
                className={`
                  flex flex-col items-center justify-center p-2 rounded-lg transition-all
                  ${selectedCategory === cat.id
                    ? 'bg-primary/10 text-primary ring-2 ring-primary/20 scale-105'
                    : 'hover:bg-hover text-muted'
                  }
                `}
              >
                <cat.icon className="w-6 h-6 mb-1.5" />
                <span className="text-[10px] truncate w-full text-center font-medium leading-tight">
                  {cat.label.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Layout principal */}
        <div className="flex items-center gap-2">
          {/* Botón Trigger de Categoría */}
          <button
            type="button"
            onClick={toggleCategories}
            className={`
              flex-shrink-0 w-11 h-11 rounded-xl border flex items-center justify-center transition-all duration-300 relative
              ${showCategories ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'}
              ${CurrentCategoryConfig.color}
            `}
            aria-label="Seleccionar categoría"
          >
            <CurrentCategoryConfig.icon className="w-5 h-5" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-card rounded-full shadow border border-border-light flex items-center justify-center">
              <ChevronUp className="w-2.5 h-2.5 text-muted" />
            </div>
          </button>

          {/* Input de Texto */}
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
              onBlur={() => {
                // Retrasar blur para permitir clicks en botones
                setTimeout(() => setIsInputFocused(false), 200)
              }}
              placeholder={isListening ? "Escuchando..." : "Añadir producto..."}
              className={`
                w-full h-11 rounded-xl bg-secondary px-4
                focus:outline-none focus:ring-2 focus:ring-primary/50
                transition-all placeholder:text-muted-light
                ${isListening ? 'ring-2 ring-red-500 bg-red-50 dark:bg-red-900/20' : ''}
              `}
              autoComplete="off"
            />
          </div>

          {/* Botones auxiliares - Solo visibles en focus */}
          {isInputFocused && (
            <div className="flex items-center gap-1 flex-shrink-0 animate-in fade-in slide-in-from-right-2 duration-200">
              {/* Botón de Voz */}
              {voiceSupported && (
                <button
                  type="button"
                  onClick={handleVoiceButton}
                  className={`
                    w-10 h-10 rounded-xl flex items-center justify-center transition-all
                    ${isListening
                      ? 'text-white bg-red-500 animate-pulse'
                      : 'text-muted hover:text-primary hover:bg-secondary'
                    }
                  `}
                  aria-label={isListening ? "Detener grabación" : "Añadir por voz"}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
              )}

              {/* Botón de Escáner */}
              <button
                type="button"
                onClick={() => setShowBarcodeScanner(true)}
                className="w-10 h-10 rounded-xl text-muted hover:text-primary hover:bg-secondary flex items-center justify-center transition-colors"
                aria-label="Escanear código de barras"
              >
                <ScanBarcode className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Botón Submit */}
          <Button
            type="submit"
            disabled={!name.trim() || isSubmitting}
            className="w-11 h-11 rounded-xl p-0 flex items-center justify-center shrink-0"
            aria-label="Añadir producto"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
          </Button>
        </div>
      </form>

      {/* Modal del escáner */}
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
