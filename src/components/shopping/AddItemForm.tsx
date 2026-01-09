'use client'

import { useState, useRef, useEffect, useCallback, memo } from 'react'
import { Plus, ChevronUp, Image as ImageIcon, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CATEGORIES, detectCategory, CategoryId } from '@/lib/constants'
import { useImageUpload } from '@/hooks/useImageUpload'
import { UserFavoriteItem } from '@/lib/supabase/types'

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
  
  // Estados para Sugerencias
  const [suggestions, setSuggestions] = useState<UserFavoriteItem[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const { upload, isUploading } = useImageUpload({ bucket: 'list-images' })

  // Debounce del nombre para detección de categoría y sugerencias (300ms)
  const debouncedName = useDebounce(name, 300)

  // Autodetección de categoría y Filtrado de Sugerencias
  useEffect(() => {
    // 1. Filtrar Sugerencias
    if (name.trim().length > 0 && suggestionsSource.length > 0) {
      const matches = suggestionsSource.filter(item => 
        item.name.toLowerCase().includes(name.toLowerCase()) &&
        item.name.toLowerCase() !== name.toLowerCase()
      ).slice(0, 3) // Top 3
      
      setSuggestions(matches)
      setShowSuggestions(matches.length > 0)
    } else {
      setShowSuggestions(false)
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

  const handleSuggestionClick = (suggestion: UserFavoriteItem) => {
    setName(suggestion.name)
    if (suggestion.category) {
      setSelectedCategory(suggestion.category as CategoryId)
      setManuallySelected(true)
    }
    setShowSuggestions(false)
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

  // Obtener la configuración visual de la categoría actual
  const CurrentCategoryConfig = CATEGORIES[selectedCategory]

  return (
    <div className="sticky bottom-0 bg-background border-t border-border-light z-30 pb-safe">
      {/* Sugerencias Flotantes */}
      {showSuggestions && (
        <div className="absolute bottom-full left-4 right-4 mb-2 bg-card rounded-xl shadow-lg border border-border overflow-hidden animate-in slide-in-from-bottom-2 z-20">
          <div className="bg-secondary/50 px-4 py-1 text-xs text-muted font-medium">Sugerencias de favoritos</div>
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full text-left px-4 py-3 hover:bg-secondary flex items-center justify-between group transition-colors border-b border-border/50 last:border-0"
            >
              <span className="font-medium text-foreground">{suggestion.name}</span>
              <span className="text-xs text-muted group-hover:text-primary transition-colors">
                {CATEGORIES[suggestion.category as CategoryId]?.label || 'General'}
              </span>
            </button>
          ))}
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

          {/* Input de Texto y Botón de Imagen */}
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
              placeholder="Añadir producto..."
              className="w-full h-12 rounded-xl bg-secondary pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-gray-400"
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
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`absolute right-2 p-2 rounded-lg transition-colors ${imageFile ? 'text-primary bg-primary/10' : 'text-gray-400 hover:text-gray-600'}`}
              title="Añadir foto"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
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
    </div>
  )
}

export const AddItemForm = memo(AddItemFormComponent)
AddItemForm.displayName = 'AddItemForm'
