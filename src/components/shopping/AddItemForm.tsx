'use client'

import { useState, useRef, useEffect, useCallback, memo } from 'react'
import { Plus, ChevronUp, Image as ImageIcon, X, Loader2, Mic, MicOff, ScanBarcode, Star, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CATEGORIES, detectCategory, CategoryId, searchProducts, CommonProduct } from '@/lib/constants'
import { useImageUpload } from '@/hooks/useImageUpload'
import { useVoiceInput } from '@/hooks/useVoiceInput'
import { UserFavoriteItem } from '@/lib/supabase/types'
import { BarcodeScannerModal } from './BarcodeScannerModal'

interface AddItemFormProps {
  onAdd: (name: string, category: string, imageUrl?: string) => void | Promise<void>
  suggestionsSource?: UserFavoriteItem[] // Fuente para el autocompletado
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

  // Estados para Imagen
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Estados para Sugerencias - tipo unificado para favoritos y productos comunes
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

  const inputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const { upload, isUploading } = useImageUpload({ bucket: 'list-images' })

  // Hook de reconocimiento de voz
  const {
    isListening,
    transcript,
    isSupported: voiceSupported,
    startListening,
    stopListening,
    error: voiceError
  } = useVoiceInput()

  // Actualizar el nombre cuando se detecta voz
  useEffect(() => {
    if (transcript) {
      setName(transcript)
    }
  }, [transcript])

  // Debounce del nombre para detección de categoría y sugerencias (300ms)
  const debouncedName = useDebounce(name, 300)

  // Autodetección de categoría y Filtrado de Sugerencias
  useEffect(() => {
    // 1. Filtrar Sugerencias combinando favoritos y productos comunes
    if (name.trim().length >= 2) {
      const normalizedName = name.toLowerCase()
      const combinedSuggestions: Suggestion[] = []
      const addedNames = new Set<string>()

      // Primero añadir favoritos (tienen prioridad)
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

      // Luego añadir productos comunes que no estén ya
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

      // Limitar a 5 sugerencias totales
      setSuggestions(combinedSuggestions.slice(0, 5))
      setShowSuggestions(combinedSuggestions.length > 0)
    } else {
      setShowSuggestions(false)
      setSuggestions([])
    }

    // 2. Autodetectar categoría (si no es manual)
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const clearImage = useCallback(() => {
    setImageFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      let finalImageUrl = undefined

      // Subir imagen si existe
      if (imageFile) {
        // Generar nombre único: items/TIMESTAMP_RANDOM.jpg
        const path = `items/${Date.now()}_${Math.random().toString(36).slice(2)}`
        const uploadedUrl = await upload(imageFile, path)
        if (uploadedUrl) finalImageUrl = uploadedUrl
      }

      await onAdd(name.trim(), selectedCategory, finalImageUrl)

      // Resetear estados
      setName('')
      setSelectedCategory('other')
      setShowCategories(false)
      setManuallySelected(false)
      clearImage()
      setShowSuggestions(false)

      // Mantener foco para añadir productos rápido
      inputRef.current?.focus()
    }
  }, [name, selectedCategory, imageFile, onAdd, upload, clearImage])

  const handleSuggestionClick = async (suggestion: Suggestion) => {
    // Añadir el item automáticamente en lugar de solo rellenar el input
    const category = suggestion.category ? (suggestion.category as CategoryId) : 'other'
    await onAdd(suggestion.name, category)

    // Resetear estados
    setName('')
    setSelectedCategory('other')
    setShowSuggestions(false)
    setManuallySelected(false)

    // Mantener foco
    inputRef.current?.focus()
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

  // Handler para cuando el escáner encuentra un producto
  const handleBarcodeProductFound = useCallback((productName: string, category?: string) => {
    setName(productName)
    if (category) {
      setSelectedCategory(category as CategoryId)
      setManuallySelected(true)
    }
    inputRef.current?.focus()
  }, [])

  // Handler para abrir el escáner de código de barras
  const handleOpenBarcodeScanner = useCallback(() => {
    // Blur del input para ocultar el teclado
    inputRef.current?.blur()
    setShowBarcodeScanner(true)
  }, [])

  // Handler para el botón de voz (push-to-talk)
  const handleVoiceMouseDown = useCallback(() => {
    if (!isListening) {
      // Blur del input para ocultar el teclado
      inputRef.current?.blur()
      startListening()
    }
  }, [isListening, startListening])

  const handleVoiceMouseUp = useCallback(() => {
    if (isListening) {
      stopListening()
      // Volver a enfocar el input después de soltar
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isListening, stopListening])

  // Handler para touch devices
  const handleVoiceTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    if (!isListening) {
      inputRef.current?.blur()
      startListening()
    }
  }, [isListening, startListening])

  const handleVoiceTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    if (isListening) {
      stopListening()
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isListening, stopListening])

  // Obtener la configuración visual de la categoría actual
  const CurrentCategoryConfig = CATEGORIES[selectedCategory]

  return (
    <div className="sticky bottom-0 bg-background border-t border-border-light z-30 pb-safe">
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
                <div className="flex items-center gap-2">
                  {CategoryConfig && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${CategoryConfig.color}`}>
                      {CategoryConfig.label.split(' ')[0]}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Previsualización de Imagen */}
      {previewUrl && (
        <div className="absolute bottom-full right-4 mb-2 w-20 h-20 bg-card rounded-xl shadow-lg border border-border p-1 animate-in zoom-in-95 z-10">
          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover rounded-lg" />
          <button 
            type="button"
            onClick={clearImage}
            className="absolute -top-2 -right-2 bg-danger text-white rounded-full p-1 shadow-md hover:scale-110 transition-transform"
          >
            <X className="w-3 h-3" />
          </button>
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

        <div className="flex gap-3">
          {/* Botón Trigger de Categoría */}
          <button
            type="button"
            onClick={toggleCategories}
            className={`
              flex-shrink-0 w-12 h-12 rounded-xl border flex items-center justify-center transition-all duration-300 relative
              ${showCategories ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200 hover:border-primary/50'}
              ${CurrentCategoryConfig.color}
            `}
          >
            <CurrentCategoryConfig.icon className="w-6 h-6" />

            {/* Indicador pequeño */}
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full shadow border border-gray-100 flex items-center justify-center">
              <ChevronUp className="w-2.5 h-2.5 text-gray-400" />
            </div>
          </button>

          {/* Input de Texto */}
          <div className="flex-1 relative flex items-center">
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
              placeholder={isListening ? "Escuchando..." : "Añadir producto..."}
              className={`w-full h-12 rounded-xl bg-secondary pl-4 pr-24 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-gray-400 ${isListening ? 'ring-2 ring-red-500 bg-red-50' : ''}`}
              autoComplete="off"
            />

            {/* Input File oculto */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />

            {/* Botones dentro del input */}
            <div className="absolute right-2 flex items-center gap-1">
              {/* Botón de Voz (Push-to-Talk) */}
              {voiceSupported && (
                <button
                  type="button"
                  onMouseDown={handleVoiceMouseDown}
                  onMouseUp={handleVoiceMouseUp}
                  onMouseLeave={handleVoiceMouseUp}
                  onTouchStart={handleVoiceTouchStart}
                  onTouchEnd={handleVoiceTouchEnd}
                  className={`p-2 rounded-lg transition-all ${
                    isListening
                      ? 'text-red-500 bg-red-100 animate-pulse'
                      : 'text-gray-400 hover:text-primary hover:bg-primary/10'
                  }`}
                  title={isListening ? "Suelta para detener" : "Mantén presionado para hablar"}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              )}

              {/* Botón de Escáner */}
              <button
                type="button"
                onClick={handleOpenBarcodeScanner}
                className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
                title="Escanear código de barras"
              >
                <ScanBarcode className="w-4 h-4" />
              </button>

              {/* Botón de Imagen */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`p-2 rounded-lg transition-colors ${imageFile ? 'text-primary bg-primary/10' : 'text-gray-400 hover:text-primary hover:bg-primary/10'}`}
                title="Añadir foto"
              >
                <ImageIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Botón Submit */}
          <Button
            type="submit"
            disabled={!name.trim() || isUploading}
            className="w-12 h-12 rounded-xl p-0 flex items-center justify-center shrink-0"
          >
            {isUploading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Plus className="w-6 h-6" />
            )}
          </Button>
        </div>
      </form>

      {/* Modal del escáner de código de barras */}
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
