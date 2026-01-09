'use client'

import { useState, useRef, useEffect, useCallback, memo } from 'react'
import { Plus, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CATEGORIES, detectCategory, CategoryId } from '@/lib/constants'

interface AddItemFormProps {
  onAdd: (name: string, category: string) => void | Promise<void>
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

function AddItemFormComponent({ onAdd }: AddItemFormProps) {
  const [name, setName] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('other')
  const [showCategories, setShowCategories] = useState(false)
  const [manuallySelected, setManuallySelected] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  // Debounce del nombre para detección de categoría (300ms)
  const debouncedName = useDebounce(name, 300)

  // Autodetección de categoría con debounce
  useEffect(() => {
    // Solo autodetectar si no se ha seleccionado manualmente y hay texto suficiente
    if (!manuallySelected && debouncedName.trim().length > 2) {
      const detected = detectCategory(debouncedName)
      if (detected !== 'other') {
        setSelectedCategory(detected)
      }
    }
  }, [debouncedName, manuallySelected])

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    if (!showCategories) return

    const handleClickOutside = (e: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(e.target as Node)) {
        setShowCategories(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showCategories])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onAdd(name.trim(), selectedCategory)

      // Resetear estados
      setName('')
      setSelectedCategory('other')
      setShowCategories(false)
      setManuallySelected(false)

      // Mantener foco para añadir productos rápido
      inputRef.current?.focus()
    }
  }, [name, selectedCategory, onAdd])

  const handleCategorySelect = useCallback((categoryId: CategoryId) => {
    setSelectedCategory(categoryId)
    setShowCategories(false)
    setManuallySelected(true)
    inputRef.current?.focus()
  }, [])

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value)
    // Si el usuario borra todo, resetear la selección manual
    if (e.target.value.trim() === '') {
      setManuallySelected(false)
      setSelectedCategory('other')
    }
  }, [])

  const toggleCategories = useCallback(() => {
    setShowCategories(prev => !prev)
  }, [])

  // Obtener la configuración visual de la categoría actual
  const CurrentCategoryConfig = CATEGORIES[selectedCategory]

  return (
    <div className="sticky bottom-0 bg-background border-t border-gray-100 z-30 pb-safe">
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="p-4 max-w-md mx-auto relative"
      >
        {/* Selector de Categorías (Pop-up) */}
        {showCategories && (
          <div className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-xl shadow-xl border border-gray-100 p-3 grid grid-cols-5 gap-2 animate-in slide-in-from-bottom-2 z-40">
            {Object.values(CATEGORIES).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategorySelect(cat.id)}
                className={`
                  flex flex-col items-center justify-center p-2 rounded-lg transition-all
                  ${selectedCategory === cat.id
                    ? 'bg-primary/10 text-primary ring-2 ring-primary/20 scale-105'
                    : 'hover:bg-gray-50 text-gray-500'
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

            {/* Indicador pequeño de que es un menú */}
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full shadow border border-gray-100 flex items-center justify-center">
              <ChevronUp className="w-2.5 h-2.5 text-gray-400" />
            </div>
          </button>

          {/* Input de Texto */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="Añadir producto..."
              className="w-full h-12 rounded-xl bg-secondary pl-4 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-gray-400"
              autoComplete="off"
            />
          </div>

          {/* Botón Submit */}
          <Button
            type="submit"
            disabled={!name.trim()}
            className="w-12 h-12 rounded-xl p-0 flex items-center justify-center shrink-0"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </div>
      </form>
    </div>
  )
}

// Memoizar el componente
export const AddItemForm = memo(AddItemFormComponent)
AddItemForm.displayName = 'AddItemForm'
