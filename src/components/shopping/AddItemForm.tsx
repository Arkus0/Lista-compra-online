'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, Tag } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface AddItemFormProps {
  onAdd: (name: string, category?: string) => void
}

const categories = [
  { value: 'frutas', label: 'Frutas', emoji: '🍎' },
  { value: 'verduras', label: 'Verduras', emoji: '🥬' },
  { value: 'carnes', label: 'Carnes', emoji: '🥩' },
  { value: 'pescados', label: 'Pescados', emoji: '🐟' },
  { value: 'lacteos', label: 'Lácteos', emoji: '🧀' },
  { value: 'panaderia', label: 'Panadería', emoji: '🥖' },
  { value: 'bebidas', label: 'Bebidas', emoji: '🥤' },
  { value: 'limpieza', label: 'Limpieza', emoji: '🧹' },
  { value: 'otros', label: 'Otros', emoji: '📦' },
]

export function AddItemForm({ onAdd }: AddItemFormProps) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [showCategories, setShowCategories] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onAdd(name.trim(), category || undefined)
      setName('')
      setCategory('')
      inputRef.current?.focus()
    }
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showCategories && !(e.target as Element).closest('.category-selector')) {
        setShowCategories(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showCategories])

  const selectedCategory = categories.find(c => c.value === category)

  return (
    <form onSubmit={handleSubmit} className="sticky bottom-0 bg-background p-4 border-t border-gray-100">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Añadir producto..."
            leftIcon={<Plus className="w-5 h-5" />}
          />
        </div>

        {/* Category selector */}
        <div className="relative category-selector">
          <button
            type="button"
            onClick={() => setShowCategories(!showCategories)}
            className={`
              h-full px-3 rounded-xl border border-gray-200
              flex items-center gap-2 transition-colors
              ${category ? 'bg-primary/10 border-primary' : 'hover:bg-secondary'}
            `}
          >
            {selectedCategory ? (
              <span>{selectedCategory.emoji}</span>
            ) : (
              <Tag className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {showCategories && (
            <div className="absolute bottom-full right-0 mb-2 bg-background rounded-xl shadow-lg border border-gray-100 p-2 min-w-[160px] z-10">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => {
                    setCategory(category === cat.value ? '' : cat.value)
                    setShowCategories(false)
                  }}
                  className={`
                    w-full px-3 py-2 rounded-lg text-left flex items-center gap-2
                    transition-colors
                    ${category === cat.value ? 'bg-primary/10 text-primary' : 'hover:bg-secondary'}
                  `}
                >
                  <span>{cat.emoji}</span>
                  <span className="text-sm">{cat.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <Button type="submit" disabled={!name.trim()}>
          <Plus className="w-5 h-5" />
        </Button>
      </div>
    </form>
  )
}
