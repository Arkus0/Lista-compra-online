import { NextRequest, NextResponse } from 'next/server'
import { TheMealDBRecipe, RecipeIngredient } from '@/lib/supabase/types'

// Traducciones básicas inglés -> español
const TRANSLATIONS: Record<string, string> = {
  // Categorías
  'Beef': 'Ternera', 'Chicken': 'Pollo', 'Dessert': 'Postre', 'Lamb': 'Cordero',
  'Miscellaneous': 'Varios', 'Pasta': 'Pasta', 'Pork': 'Cerdo', 'Seafood': 'Mariscos',
  'Side': 'Guarnición', 'Starter': 'Entrante', 'Vegan': 'Vegano', 'Vegetarian': 'Vegetariano',
  'Breakfast': 'Desayuno', 'Goat': 'Cabra',

  // Cocinas
  'American': 'Americana', 'British': 'Británica', 'Canadian': 'Canadiense',
  'Chinese': 'China', 'Croatian': 'Croata', 'Dutch': 'Holandesa', 'Egyptian': 'Egipcia',
  'Filipino': 'Filipina', 'French': 'Francesa', 'Greek': 'Griega', 'Indian': 'India',
  'Irish': 'Irlandesa', 'Italian': 'Italiana', 'Jamaican': 'Jamaicana', 'Japanese': 'Japonesa',
  'Kenyan': 'Keniata', 'Malaysian': 'Malasia', 'Mexican': 'Mexicana', 'Moroccan': 'Marroquí',
  'Polish': 'Polaca', 'Portuguese': 'Portuguesa', 'Russian': 'Rusa', 'Spanish': 'Española',
  'Thai': 'Tailandesa', 'Tunisian': 'Tunecina', 'Turkish': 'Turca', 'Vietnamese': 'Vietnamita',
  'Unknown': 'Desconocida',

  // Ingredientes comunes
  'chicken': 'pollo', 'beef': 'ternera', 'pork': 'cerdo', 'lamb': 'cordero',
  'fish': 'pescado', 'salmon': 'salmón', 'tuna': 'atún', 'shrimp': 'gambas', 'prawns': 'langostinos',
  'egg': 'huevo', 'eggs': 'huevos', 'milk': 'leche', 'cream': 'nata', 'butter': 'mantequilla',
  'cheese': 'queso', 'flour': 'harina', 'sugar': 'azúcar', 'salt': 'sal', 'pepper': 'pimienta',
  'oil': 'aceite', 'olive oil': 'aceite de oliva', 'vegetable oil': 'aceite vegetal',
  'onion': 'cebolla', 'onions': 'cebollas', 'garlic': 'ajo', 'garlic clove': 'diente de ajo',
  'tomato': 'tomate', 'tomatoes': 'tomates', 'potato': 'patata', 'potatoes': 'patatas',
  'carrot': 'zanahoria', 'carrots': 'zanahorias', 'celery': 'apio',
  'bell pepper': 'pimiento', 'red pepper': 'pimiento rojo', 'green pepper': 'pimiento verde',
  'mushroom': 'champiñón', 'mushrooms': 'champiñones',
  'rice': 'arroz', 'pasta': 'pasta', 'noodles': 'fideos', 'bread': 'pan',
  'lemon': 'limón', 'lime': 'lima', 'orange': 'naranja',
  'parsley': 'perejil', 'basil': 'albahaca', 'oregano': 'orégano', 'thyme': 'tomillo',
  'rosemary': 'romero', 'cilantro': 'cilantro', 'coriander': 'cilantro',
  'cumin': 'comino', 'paprika': 'pimentón', 'chili': 'chile', 'ginger': 'jengibre',
  'soy sauce': 'salsa de soja', 'vinegar': 'vinagre', 'wine': 'vino',
  'chicken stock': 'caldo de pollo', 'beef stock': 'caldo de ternera', 'vegetable stock': 'caldo de verduras',
  'water': 'agua', 'broth': 'caldo',
  'spinach': 'espinacas', 'lettuce': 'lechuga', 'cabbage': 'col', 'broccoli': 'brócoli',
  'zucchini': 'calabacín', 'eggplant': 'berenjena', 'cucumber': 'pepino',
  'corn': 'maíz', 'peas': 'guisantes', 'beans': 'judías', 'lentils': 'lentejas',
  'chickpeas': 'garbanzos', 'kidney beans': 'alubias rojas',
  'bacon': 'bacon', 'ham': 'jamón', 'sausage': 'salchicha',
  'honey': 'miel', 'maple syrup': 'sirope de arce',
  'vanilla': 'vainilla', 'cinnamon': 'canela', 'nutmeg': 'nuez moscada',
  'chocolate': 'chocolate', 'cocoa': 'cacao',
  'almond': 'almendra', 'almonds': 'almendras', 'walnut': 'nuez', 'walnuts': 'nueces',
  'peanut': 'cacahuete', 'peanuts': 'cacahuetes',
  'coconut': 'coco', 'coconut milk': 'leche de coco',
  'baking powder': 'levadura', 'yeast': 'levadura',

  // Unidades
  'cup': 'taza', 'cups': 'tazas', 'tbsp': 'cucharada', 'tsp': 'cucharadita',
  'tablespoon': 'cucharada', 'tablespoons': 'cucharadas',
  'teaspoon': 'cucharadita', 'teaspoons': 'cucharaditas',
  'oz': 'oz', 'lb': 'lb', 'kg': 'kg', 'g': 'g', 'ml': 'ml', 'l': 'l',
  'piece': 'pieza', 'pieces': 'piezas', 'clove': 'diente', 'cloves': 'dientes',
  'pinch': 'pizca', 'bunch': 'manojo', 'handful': 'puñado',
  'slice': 'rodaja', 'slices': 'rodajas', 'can': 'lata', 'cans': 'latas',
  'small': 'pequeño', 'medium': 'mediano', 'large': 'grande',
}

function translate(text: string): string {
  if (!text) return text

  // Primero buscar traducción exacta
  const lowerText = text.toLowerCase().trim()
  if (TRANSLATIONS[lowerText]) {
    return TRANSLATIONS[lowerText]
  }

  // Intentar traducir palabra por palabra
  let translated = text.toLowerCase()
  const sortedKeys = Object.keys(TRANSLATIONS).sort((a, b) => b.length - a.length)

  for (const key of sortedKeys) {
    const regex = new RegExp(`\\b${key}\\b`, 'gi')
    translated = translated.replace(regex, TRANSLATIONS[key])
  }

  // Capitalizar primera letra
  return translated.charAt(0).toUpperCase() + translated.slice(1)
}

function parseIngredients(meal: any): RecipeIngredient[] {
  const ingredients: RecipeIngredient[] = []

  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`]
    const measure = meal[`strMeasure${i}`]

    if (ingredient && ingredient.trim()) {
      const translatedIngredient = translate(ingredient)
      const translatedMeasure = measure ? translate(measure.trim()) : ''

      // Intentar separar cantidad y unidad
      const measureMatch = translatedMeasure.match(/^([\d.,/\s]+)?\s*(.*)$/)
      const quantity = measureMatch?.[1]?.trim() || ''
      const unit = measureMatch?.[2]?.trim() || ''

      ingredients.push({
        name: translatedIngredient,
        quantity: quantity || '1',
        unit: unit,
      })
    }
  }

  return ingredients
}

function normalizeMeal(meal: any): TheMealDBRecipe {
  return {
    id: meal.idMeal,
    title: meal.strMeal,
    category: translate(meal.strCategory || 'Unknown'),
    cuisine: translate(meal.strArea || 'Unknown'),
    instructions: meal.strInstructions || '',
    image_url: meal.strMealThumb || '',
    ingredients: parseIngredients(meal),
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  const category = searchParams.get('category')
  const random = searchParams.get('random')

  try {
    let apiUrl: string

    if (random === 'true') {
      // Obtener varias recetas aleatorias
      const randomRecipes: TheMealDBRecipe[] = []
      for (let i = 0; i < 6; i++) {
        const res = await fetch('https://www.themealdb.com/api/json/v1/1/random.php')
        const data = await res.json()
        if (data.meals?.[0]) {
          randomRecipes.push(normalizeMeal(data.meals[0]))
        }
      }
      return NextResponse.json({ recipes: randomRecipes })
    } else if (category) {
      apiUrl = `https://www.themealdb.com/api/json/v1/1/filter.php?c=${encodeURIComponent(category)}`
    } else if (query) {
      apiUrl = `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`
    } else {
      // Por defecto, buscar recetas populares
      apiUrl = 'https://www.themealdb.com/api/json/v1/1/search.php?s='
    }

    const response = await fetch(apiUrl)
    const data = await response.json()

    if (!data.meals) {
      return NextResponse.json({ recipes: [] })
    }

    // Si es filter por categoría, solo tenemos ID, nombre e imagen
    // Necesitamos hacer fetch de detalles para cada uno
    if (category) {
      const detailedRecipes: TheMealDBRecipe[] = []
      const meals = data.meals.slice(0, 12) // Limitar a 12

      for (const meal of meals) {
        const detailRes = await fetch(
          `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`
        )
        const detailData = await detailRes.json()
        if (detailData.meals?.[0]) {
          detailedRecipes.push(normalizeMeal(detailData.meals[0]))
        }
      }

      return NextResponse.json({ recipes: detailedRecipes })
    }

    const recipes = data.meals.map(normalizeMeal)
    return NextResponse.json({ recipes })

  } catch (error) {
    console.error('Error fetching recipes:', error)
    return NextResponse.json(
      { error: 'Error al buscar recetas' },
      { status: 500 }
    )
  }
}

// GET categories
export async function POST(request: NextRequest) {
  try {
    const response = await fetch(
      'https://www.themealdb.com/api/json/v1/1/categories.php'
    )
    const data = await response.json()

    const categories = data.categories?.map((cat: any) => ({
      id: cat.strCategory,
      name: translate(cat.strCategory),
      image: cat.strCategoryThumb,
      description: cat.strCategoryDescription,
    })) || []

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Error al obtener categorías' },
      { status: 500 }
    )
  }
}
