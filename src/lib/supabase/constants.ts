import { 
  Carrot, Beef, Milk, Cookie, Snowflake, 
  Coffee, SprayCan, Sparkles, Dog, Package,
  LucideIcon
} from 'lucide-react'

export type CategoryId = 
  | 'fruits-veg' | 'meat-fish' | 'dairy' | 'pantry' 
  | 'frozen' | 'beverages' | 'household' | 'hygiene' 
  | 'pets' | 'other'

interface CategoryConfig {
  id: CategoryId
  label: string
  icon: LucideIcon
  color: string // Tailwind color class helper
  keywords: string[] // Palabras clave para autodetectar
}

export const CATEGORIES: Record<CategoryId, CategoryConfig> = {
  'fruits-veg': {
    id: 'fruits-veg',
    label: 'Frutas y Verduras',
    icon: Carrot,
    color: 'text-green-600 bg-green-50',
    keywords: ['manzana', 'platano', 'lechuga', 'tomate', 'patata', 'cebolla', 'ajo', 'fruta', 'verdura']
  },
  'meat-fish': {
    id: 'meat-fish',
    label: 'Carnes y Pescados',
    icon: Beef,
    color: 'text-red-600 bg-red-50',
    keywords: ['pollo', 'carne', 'pescado', 'jamon', 'salchicha', 'hamburguesa', 'filete', 'atun']
  },
  'dairy': {
    id: 'dairy',
    label: 'Lácteos y Huevos',
    icon: Milk,
    color: 'text-yellow-600 bg-yellow-50',
    keywords: ['leche', 'queso', 'yogur', 'huevo', 'mantequilla', 'nata']
  },
  'pantry': {
    id: 'pantry',
    label: 'Despensa',
    icon: Cookie,
    color: 'text-orange-600 bg-orange-50',
    keywords: ['pan', 'arroz', 'pasta', 'aceite', 'sal', 'azucar', 'harina', 'galletas', 'cereal']
  },
  'frozen': {
    id: 'frozen',
    label: 'Congelados',
    icon: Snowflake,
    color: 'text-blue-400 bg-blue-50',
    keywords: ['congelado', 'helado', 'hielo', 'guisantes']
  },
  'beverages': {
    id: 'beverages',
    label: 'Bebidas',
    icon: Coffee,
    color: 'text-teal-600 bg-teal-50',
    keywords: ['agua', 'refresco', 'cerveza', 'vino', 'zumo', 'cafe', 'te']
  },
  'household': {
    id: 'household',
    label: 'Hogar y Limpieza',
    icon: SprayCan,
    color: 'text-purple-600 bg-purple-50',
    keywords: ['limpiador', 'detergente', 'suavizante', 'papel', 'servilletas', 'basura']
  },
  'hygiene': {
    id: 'hygiene',
    label: 'Higiene Personal',
    icon: Sparkles,
    color: 'text-pink-600 bg-pink-50',
    keywords: ['champu', 'gel', 'jabon', 'pasta', 'cepillo', 'desodorante']
  },
  'pets': {
    id: 'pets',
    label: 'Mascotas',
    icon: Dog,
    color: 'text-stone-600 bg-stone-50',
    keywords: ['perro', 'gato', 'pienso', 'arena']
  },
  'other': {
    id: 'other',
    label: 'Otros',
    icon: Package,
    color: 'text-gray-600 bg-gray-50',
    keywords: []
  }
}

// Función helper para detectar categoría
export function detectCategory(text: string): CategoryId {
  const normalizedText = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  
  for (const cat of Object.values(CATEGORIES)) {
    if (cat.id === 'other') continue
    if (cat.keywords.some(k => normalizedText.includes(k))) {
      return cat.id
    }
  }
  return 'other'
}
