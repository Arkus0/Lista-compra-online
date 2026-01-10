import { NextRequest, NextResponse } from 'next/server'
import { RecipeIngredient } from '@/lib/supabase/types'

interface ParsedRecipe {
  title: string
  description: string | null
  image_url: string | null
  ingredients: RecipeIngredient[]
  instructions: string | null
  servings: number | null
  source_url: string
}

function parseIngredientString(str: string): RecipeIngredient {
  // Intentar extraer cantidad, unidad y nombre
  // Ejemplos: "2 tazas de arroz", "500g de pollo", "1/2 cebolla", "sal al gusto"

  const cleaned = str.trim()

  // Regex para cantidad numérica al inicio
  const quantityMatch = cleaned.match(/^([\d.,/]+(?:\s*[-–]\s*[\d.,/]+)?)\s*/)
  const quantity = quantityMatch?.[1]?.trim() || '1'
  const remaining = quantityMatch ? cleaned.slice(quantityMatch[0].length) : cleaned

  // Unidades comunes
  const unitPatterns = [
    'cucharadas?', 'cucharaditas?', 'tazas?', 'vasos?',
    'kg', 'g', 'gramos?', 'ml', 'l', 'litros?',
    'unidades?', 'piezas?', 'dientes?', 'rodajas?',
    'latas?', 'paquetes?', 'sobres?', 'ramas?', 'hojas?',
    'pizca', 'puñado', 'manojo',
    'cups?', 'tbsp', 'tsp', 'oz', 'lb',
  ]

  const unitRegex = new RegExp(`^(${unitPatterns.join('|')})\\s*(?:de\\s+)?`, 'i')
  const unitMatch = remaining.match(unitRegex)
  const unit = unitMatch?.[1] || ''
  const name = unitMatch ? remaining.slice(unitMatch[0].length).trim() : remaining.trim()

  return {
    name: name.charAt(0).toUpperCase() + name.slice(1),
    quantity,
    unit,
  }
}

function extractSchemaOrgRecipe(html: string): ParsedRecipe | null {
  // Buscar JSON-LD con @type Recipe
  const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)

  if (!jsonLdMatches) return null

  for (const match of jsonLdMatches) {
    const jsonContent = match.replace(/<script[^>]*>|<\/script>/gi, '').trim()

    try {
      const data = JSON.parse(jsonContent)

      // Puede ser un array o un objeto
      const recipes = Array.isArray(data) ? data : [data]

      for (const item of recipes) {
        // Buscar Recipe en @graph o directamente
        let recipe = null

        if (item['@type'] === 'Recipe') {
          recipe = item
        } else if (item['@graph']) {
          recipe = item['@graph'].find((g: any) =>
            g['@type'] === 'Recipe' || (Array.isArray(g['@type']) && g['@type'].includes('Recipe'))
          )
        }

        if (recipe) {
          // Extraer ingredientes
          const ingredients: RecipeIngredient[] = []

          if (recipe.recipeIngredient) {
            const ingredientList = Array.isArray(recipe.recipeIngredient)
              ? recipe.recipeIngredient
              : [recipe.recipeIngredient]

            for (const ing of ingredientList) {
              if (typeof ing === 'string') {
                ingredients.push(parseIngredientString(ing))
              }
            }
          }

          // Extraer instrucciones
          let instructions = ''
          if (recipe.recipeInstructions) {
            if (typeof recipe.recipeInstructions === 'string') {
              instructions = recipe.recipeInstructions
            } else if (Array.isArray(recipe.recipeInstructions)) {
              instructions = recipe.recipeInstructions
                .map((step: any) => {
                  if (typeof step === 'string') return step
                  if (step.text) return step.text
                  if (step.itemListElement) {
                    return step.itemListElement.map((s: any) => s.text || s).join('\n')
                  }
                  return ''
                })
                .filter(Boolean)
                .join('\n\n')
            }
          }

          // Extraer imagen
          let image_url = null
          if (recipe.image) {
            if (typeof recipe.image === 'string') {
              image_url = recipe.image
            } else if (Array.isArray(recipe.image)) {
              image_url = recipe.image[0]
            } else if (recipe.image.url) {
              image_url = recipe.image.url
            }
          }

          return {
            title: recipe.name || 'Receta sin nombre',
            description: recipe.description || null,
            image_url,
            ingredients,
            instructions: instructions || null,
            servings: recipe.recipeYield ? parseInt(recipe.recipeYield) || null : null,
            source_url: '',
          }
        }
      }
    } catch (e) {
      // JSON inválido, continuar con siguiente match
      continue
    }
  }

  return null
}

function extractMetaTags(html: string): ParsedRecipe | null {
  // Fallback: extraer de meta tags og: y otros
  const getMetaContent = (property: string): string | null => {
    const match = html.match(
      new RegExp(`<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i')
    ) || html.match(
      new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${property}["']`, 'i')
    )
    return match?.[1] || null
  }

  const title = getMetaContent('og:title') ||
    html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ||
    null

  if (!title) return null

  return {
    title,
    description: getMetaContent('og:description') || getMetaContent('description'),
    image_url: getMetaContent('og:image'),
    ingredients: [],
    instructions: null,
    servings: null,
    source_url: '',
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json(
        { error: 'URL requerida' },
        { status: 400 }
      )
    }

    // Validar URL
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      return NextResponse.json(
        { error: 'URL inválida' },
        { status: 400 }
      )
    }

    // Fetch HTML
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RecipeBot/1.0)',
        'Accept': 'text/html',
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'No se pudo acceder a la página' },
        { status: 400 }
      )
    }

    const html = await response.text()

    // Intentar Schema.org primero
    let recipe = extractSchemaOrgRecipe(html)

    // Fallback a meta tags
    if (!recipe || recipe.ingredients.length === 0) {
      const metaRecipe = extractMetaTags(html)
      if (metaRecipe) {
        recipe = {
          ...metaRecipe,
          ingredients: recipe?.ingredients || [],
          instructions: recipe?.instructions || null,
        }
      }
    }

    if (!recipe) {
      return NextResponse.json(
        { error: 'No se encontró información de receta en esta página' },
        { status: 404 }
      )
    }

    recipe.source_url = url

    return NextResponse.json({ recipe })

  } catch (error) {
    console.error('Error parsing recipe URL:', error)
    return NextResponse.json(
      { error: 'Error al procesar la URL' },
      { status: 500 }
    )
  }
}
