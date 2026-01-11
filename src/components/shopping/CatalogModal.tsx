'use client'

import { memo, useMemo, useCallback, useState } from 'react'
import { LayoutGrid, X, Plus } from 'lucide-react'
import { ListItem } from '@/lib/supabase/types'
import { CATEGORIES, CategoryId, getProductEmoji } from '@/lib/constants'

// --- DATOS DEL CATÁLOGO RÁPIDO ---
const QUICK_CATALOG: Record<CategoryId, string[]> = {
  'fruits-veg': [
    'Manzanas', 'Plátanos', 'Lechuga', 'Tomates', 'Zanahorias',
    'Cebollas', 'Patatas', 'Aguacate', 'Limones', 'Ajos',
    'Pimientos', 'Naranjas', 'Calabacín', 'Pepino'
  ],
  'meat-fish': [
    'Pollo', 'Ternera', 'Carne picada', 'Jamón serrano', 'Jamón cocido',
    'Pechuga de pavo', 'Salmón', 'Atún', 'Huevos', 'Bacon',
    'Lomo', 'Salchichas', 'Merluza', 'Gambas'
  ],
  'dairy': [
    'Leche entera', 'Leche semi', 'Queso', 'Yogur natural', 'Yogur sabores',
    'Mantequilla', 'Nata cocinar', 'Queso rallado', 'Leche vegetal', 'Queso fresco'
  ],
  'pantry': [
    'Arroz', 'Pasta', 'Pan', 'Aceite de oliva', 'Azúcar',
    'Sal', 'Harina', 'Tomate frito', 'Legumbres', 'Cereales',
    'Galletas', 'Café molido', 'Cacao en polvo', 'Especias'
  ],
  'frozen': [
    'Pizza', 'Guisantes', 'Helado', 'Verduras salteadas', 'Croquetas',
    'Pescado congelado', 'Patatas fritas', 'Hielo', 'Frutos rojos'
  ],
  'beverages': [
    'Agua mineral', 'Refrescos', 'Cerveza', 'Vino tinto', 'Vino blanco',
    'Zumo de naranja', 'Zumo de piña', 'Gaseosa', 'Aquarius'
  ],
  'household': [
    'Papel higiénico', 'Detergente ropa', 'Suavizante', 'Pastillas lavavajillas',
    'Papel de cocina', 'Bolsas de basura', 'Fregasuelos', 'Lejía', 'Estropajos'
  ],
  'hygiene': [
    'Gel de ducha', 'Champú', 'Pasta de dientes', 'Desodorante', 'Jabón de manos',
    'Compresas/Tampones', 'Espuma afeitar', 'Cuchillas', 'Crema hidratante'
  ],
  'pets': [
    'Comida perro', 'Comida gato', 'Arena de gato', 'Premios mascotas', 'Bolsas caca'
  ],
  'other': [
    'Pilas', 'Bombillas', 'Velas', 'Papel aluminio', 'Papel film'
  ]
}

interface CatalogItemProps {
  itemName: string
  categoryId: CategoryId
  quantity: number
  itemId?: string
  onAdd: (name: string, category: string, e: React.MouseEvent) => void
  onRemove: (id: string, e: React.MouseEvent) => void
}

// Memoized catalog item for optimal performance
const CatalogItem = memo(function CatalogItem({
  itemName,
  categoryId,
  quantity,
  itemId,
  onAdd,
  onRemove,
}: CatalogItemProps) {
  const hasItem = quantity > 0

  const handleAdd = useCallback((e: React.MouseEvent) => {
    onAdd(itemName, categoryId, e)
  }, [itemName, categoryId, onAdd])

  const handleRemove = useCallback((e: React.MouseEvent) => {
    if (itemId) onRemove(itemId, e)
  }, [itemId, onRemove])

  return (
    <div
      className={`
        aspect-square flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-200
        ${hasItem
          ? 'bg-primary/10 border-primary shadow-[0_0_0_2px] shadow-primary/20'
          : 'bg-card border-border shadow-sm'
        }
      `}
    >
      {hasItem ? (
        // Show quantity with +/- buttons
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={handleRemove}
            className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 flex items-center justify-center hover:bg-red-200 dark:hover:bg-red-900/50 active:scale-95 transition-all"
          >
            <span className="text-xl font-bold leading-none">−</span>
          </button>
          <span className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-base font-bold">
            {quantity}
          </span>
          <button
            onClick={handleAdd}
            className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center hover:bg-green-200 dark:hover:bg-green-900/50 active:scale-95 transition-all"
          >
            <span className="text-xl font-bold leading-none">+</span>
          </button>
        </div>
      ) : (
        // Show add button
        <button
          onClick={handleAdd}
          className="w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors bg-secondary text-muted-foreground hover:bg-primary hover:text-primary-foreground active:scale-95"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
      <span className="text-2xl mb-1">{getProductEmoji(itemName, categoryId)}</span>
      <span className="text-sm text-center font-medium leading-tight line-clamp-2">{itemName}</span>
    </div>
  )
})

// Memoized category tab
const CategoryTab = memo(function CategoryTab({
  category,
  isActive,
  onClick,
}: {
  category: typeof CATEGORIES[CategoryId]
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 min-w-[70px] p-2 rounded-xl transition-all ${
        isActive
          ? 'bg-primary text-primary-foreground shadow-md scale-105'
          : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
      }`}
    >
      <category.icon className="w-6 h-6" />
      <span className="text-[10px] font-medium leading-none">{category.label.split(' ')[0]}</span>
    </button>
  )
})

interface CatalogModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (name: string, category: string) => void
  onRemove: (id: string) => void
  currentItems: ListItem[]
}

function CatalogModalComponent({
  isOpen,
  onClose,
  onSelect,
  onRemove,
  currentItems
}: CatalogModalProps) {
  const [activeTab, setActiveTab] = useState<CategoryId>('fruits-veg')

  // Memoize the quantity map - only recompute when currentItems changes
  const itemQuantityMap = useMemo(() => {
    const map = new Map<string, { quantity: number; id: string }>()
    currentItems.filter(i => !i.checked).forEach(item => {
      const key = item.name.toLowerCase()
      map.set(key, { quantity: item.quantity || 1, id: item.id })
    })
    return map
  }, [currentItems])

  // Memoize handlers with vibration
  const handleAddClick = useCallback((item: string, categoryId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10)
    onSelect(item, categoryId)
  }, [onSelect])

  const handleRemoveClick = useCallback((itemId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10)
    onRemove(itemId)
  }, [onRemove])

  // Get items for current tab with quantity info
  const currentTabItems = useMemo(() => {
    return QUICK_CATALOG[activeTab]?.map(itemName => {
      const itemData = itemQuantityMap.get(itemName.toLowerCase())
      return {
        name: itemName,
        quantity: itemData?.quantity || 0,
        id: itemData?.id,
      }
    }) || []
  }, [activeTab, itemQuantityMap])

  // Memoize category list
  const categories = useMemo(() => Object.values(CATEGORIES), [])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background animate-in slide-in-from-bottom duration-300">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-card">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <LayoutGrid className="w-5 h-5 text-primary" />
          Catálogo Rápido
        </h2>
        <button onClick={onClose} className="p-2 bg-secondary rounded-full hover:bg-gray-200 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex overflow-x-auto py-3 px-2 gap-2 border-b border-border bg-card/50 no-scrollbar">
        {categories.map(cat => (
          <CategoryTab
            key={cat.id}
            category={cat}
            isActive={activeTab === cat.id}
            onClick={() => setActiveTab(cat.id)}
          />
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-secondary/10">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pb-20">
          {currentTabItems.map((item) => (
            <CatalogItem
              key={item.name}
              itemName={item.name}
              categoryId={activeTab}
              quantity={item.quantity}
              itemId={item.id}
              onAdd={handleAddClick}
              onRemove={handleRemoveClick}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// Export memoized component
export const CatalogModal = memo(CatalogModalComponent, (prevProps, nextProps) => {
  // Only re-render if isOpen changes or if open and items/callbacks change
  if (prevProps.isOpen !== nextProps.isOpen) return false
  if (!prevProps.isOpen && !nextProps.isOpen) return true

  return (
    prevProps.currentItems === nextProps.currentItems &&
    prevProps.onSelect === nextProps.onSelect &&
    prevProps.onRemove === nextProps.onRemove &&
    prevProps.onClose === nextProps.onClose
  )
})
