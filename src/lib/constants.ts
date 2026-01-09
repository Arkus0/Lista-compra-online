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

// Lista de productos comunes para sugerencias predictivas
export interface CommonProduct {
  name: string
  category: CategoryId
}

export const COMMON_PRODUCTS: CommonProduct[] = [
  // Frutas y Verduras
  { name: 'Manzanas', category: 'fruits-veg' },
  { name: 'Plátanos', category: 'fruits-veg' },
  { name: 'Naranjas', category: 'fruits-veg' },
  { name: 'Limones', category: 'fruits-veg' },
  { name: 'Tomates', category: 'fruits-veg' },
  { name: 'Lechuga', category: 'fruits-veg' },
  { name: 'Cebollas', category: 'fruits-veg' },
  { name: 'Ajos', category: 'fruits-veg' },
  { name: 'Patatas', category: 'fruits-veg' },
  { name: 'Zanahorias', category: 'fruits-veg' },
  { name: 'Pimientos', category: 'fruits-veg' },
  { name: 'Pepinos', category: 'fruits-veg' },
  { name: 'Calabacín', category: 'fruits-veg' },
  { name: 'Berenjenas', category: 'fruits-veg' },
  { name: 'Aguacates', category: 'fruits-veg' },
  { name: 'Fresas', category: 'fruits-veg' },
  { name: 'Uvas', category: 'fruits-veg' },
  { name: 'Sandía', category: 'fruits-veg' },
  { name: 'Melón', category: 'fruits-veg' },
  { name: 'Espinacas', category: 'fruits-veg' },

  // Carnes y Pescados
  { name: 'Pollo', category: 'meat-fish' },
  { name: 'Pechuga de pollo', category: 'meat-fish' },
  { name: 'Carne picada', category: 'meat-fish' },
  { name: 'Filetes de ternera', category: 'meat-fish' },
  { name: 'Chuletas de cerdo', category: 'meat-fish' },
  { name: 'Jamón serrano', category: 'meat-fish' },
  { name: 'Jamón cocido', category: 'meat-fish' },
  { name: 'Salchichas', category: 'meat-fish' },
  { name: 'Bacon', category: 'meat-fish' },
  { name: 'Chorizo', category: 'meat-fish' },
  { name: 'Salmón', category: 'meat-fish' },
  { name: 'Merluza', category: 'meat-fish' },
  { name: 'Atún', category: 'meat-fish' },
  { name: 'Gambas', category: 'meat-fish' },
  { name: 'Mejillones', category: 'meat-fish' },

  // Lácteos y Huevos
  { name: 'Leche', category: 'dairy' },
  { name: 'Leche entera', category: 'dairy' },
  { name: 'Leche desnatada', category: 'dairy' },
  { name: 'Leche sin lactosa', category: 'dairy' },
  { name: 'Huevos', category: 'dairy' },
  { name: 'Yogur natural', category: 'dairy' },
  { name: 'Yogures', category: 'dairy' },
  { name: 'Queso', category: 'dairy' },
  { name: 'Queso rallado', category: 'dairy' },
  { name: 'Queso fresco', category: 'dairy' },
  { name: 'Mantequilla', category: 'dairy' },
  { name: 'Nata', category: 'dairy' },
  { name: 'Nata para cocinar', category: 'dairy' },

  // Despensa
  { name: 'Pan', category: 'pantry' },
  { name: 'Pan de molde', category: 'pantry' },
  { name: 'Arroz', category: 'pantry' },
  { name: 'Pasta', category: 'pantry' },
  { name: 'Espaguetis', category: 'pantry' },
  { name: 'Macarrones', category: 'pantry' },
  { name: 'Aceite de oliva', category: 'pantry' },
  { name: 'Aceite de girasol', category: 'pantry' },
  { name: 'Sal', category: 'pantry' },
  { name: 'Azúcar', category: 'pantry' },
  { name: 'Harina', category: 'pantry' },
  { name: 'Galletas', category: 'pantry' },
  { name: 'Cereales', category: 'pantry' },
  { name: 'Tomate frito', category: 'pantry' },
  { name: 'Atún en lata', category: 'pantry' },
  { name: 'Legumbres', category: 'pantry' },
  { name: 'Garbanzos', category: 'pantry' },
  { name: 'Lentejas', category: 'pantry' },
  { name: 'Alubias', category: 'pantry' },
  { name: 'Miel', category: 'pantry' },
  { name: 'Mermelada', category: 'pantry' },
  { name: 'Chocolate', category: 'pantry' },

  // Congelados
  { name: 'Pizza congelada', category: 'frozen' },
  { name: 'Verduras congeladas', category: 'frozen' },
  { name: 'Guisantes congelados', category: 'frozen' },
  { name: 'Helado', category: 'frozen' },
  { name: 'Pescado congelado', category: 'frozen' },
  { name: 'Nuggets', category: 'frozen' },
  { name: 'Croquetas', category: 'frozen' },

  // Bebidas
  { name: 'Agua', category: 'beverages' },
  { name: 'Agua con gas', category: 'beverages' },
  { name: 'Refrescos', category: 'beverages' },
  { name: 'Coca-Cola', category: 'beverages' },
  { name: 'Zumo de naranja', category: 'beverages' },
  { name: 'Zumo', category: 'beverages' },
  { name: 'Cerveza', category: 'beverages' },
  { name: 'Vino', category: 'beverages' },
  { name: 'Vino tinto', category: 'beverages' },
  { name: 'Café', category: 'beverages' },
  { name: 'Té', category: 'beverages' },

  // Hogar y Limpieza
  { name: 'Detergente', category: 'household' },
  { name: 'Suavizante', category: 'household' },
  { name: 'Lavavajillas', category: 'household' },
  { name: 'Limpiador multiusos', category: 'household' },
  { name: 'Lejía', category: 'household' },
  { name: 'Papel higiénico', category: 'household' },
  { name: 'Papel de cocina', category: 'household' },
  { name: 'Servilletas', category: 'household' },
  { name: 'Bolsas de basura', category: 'household' },
  { name: 'Estropajo', category: 'household' },
  { name: 'Fregona', category: 'household' },

  // Higiene Personal
  { name: 'Champú', category: 'hygiene' },
  { name: 'Gel de ducha', category: 'hygiene' },
  { name: 'Jabón', category: 'hygiene' },
  { name: 'Pasta de dientes', category: 'hygiene' },
  { name: 'Cepillo de dientes', category: 'hygiene' },
  { name: 'Desodorante', category: 'hygiene' },
  { name: 'Crema hidratante', category: 'hygiene' },
  { name: 'Maquinillas de afeitar', category: 'hygiene' },
  { name: 'Pañuelos', category: 'hygiene' },

  // Mascotas
  { name: 'Comida para perro', category: 'pets' },
  { name: 'Comida para gato', category: 'pets' },
  { name: 'Arena para gatos', category: 'pets' },
  { name: 'Pienso', category: 'pets' },
]

// Función de búsqueda predictiva mejorada
export function searchProducts(query: string, maxResults: number = 5): CommonProduct[] {
  if (!query || query.length < 2) return []

  const normalizedQuery = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")

  // Buscar coincidencias
  const matches = COMMON_PRODUCTS.filter(product => {
    const normalizedName = product.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    return normalizedName.includes(normalizedQuery)
  })

  // Ordenar por relevancia (coincidencias al inicio primero)
  matches.sort((a, b) => {
    const aName = a.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    const bName = b.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")

    const aStartsWith = aName.startsWith(normalizedQuery)
    const bStartsWith = bName.startsWith(normalizedQuery)

    if (aStartsWith && !bStartsWith) return -1
    if (!aStartsWith && bStartsWith) return 1
    return aName.localeCompare(bName)
  })

  return matches.slice(0, maxResults)
}

