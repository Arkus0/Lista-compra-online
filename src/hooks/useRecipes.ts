'use client'

import { useState, useCallback } from 'react'
import { TheMealDBRecipe, RecipeIngredient } from '@/lib/supabase/types'

interface RecipeCategory {
  id: string
  name: string
  image: string
  description: string
}

interface ParsedRecipe {
  title: string
  description: string | null
  image_url: string | null
  ingredients: RecipeIngredient[]
  instructions: string | null
  servings: number | null
  source_url: string
}

export function useRecipes() {
  const [recipes, setRecipes] = useState<TheMealDBRecipe[]>([])
  const [categories, setCategories] = useState<RecipeCategory[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchRecipes = useCallback(async (query: string) => {
    if (!query.trim()) {
      setRecipes([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/recipes/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()

      if (data.error) {
        setError(data.error)
        setRecipes([])
      } else {
        setRecipes(data.recipes || [])
      }
    } catch (err) {
      setError('Error al buscar recetas')
      setRecipes([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getRandomRecipes = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/recipes/search?random=true')
      const data = await response.json()

      if (data.error) {
        setError(data.error)
        setRecipes([])
      } else {
        setRecipes(data.recipes || [])
      }
    } catch (err) {
      setError('Error al obtener recetas')
      setRecipes([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getRecipesByCategory = useCallback(async (category: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/recipes/search?category=${encodeURIComponent(category)}`)
      const data = await response.json()

      if (data.error) {
        setError(data.error)
        setRecipes([])
      } else {
        setRecipes(data.recipes || [])
      }
    } catch (err) {
      setError('Error al obtener recetas')
      setRecipes([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/recipes/search', { method: 'POST' })
      const data = await response.json()

      if (data.categories) {
        setCategories(data.categories)
      }
    } catch (err) {
      console.error('Error fetching categories:', err)
    }
  }, [])

  const parseRecipeUrl = useCallback(async (url: string): Promise<ParsedRecipe | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/recipes/parse-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })

      const data = await response.json()

      if (data.error) {
        setError(data.error)
        return null
      }

      return data.recipe
    } catch (err) {
      setError('Error al procesar la URL')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearRecipes = useCallback(() => {
    setRecipes([])
    setError(null)
  }, [])

  return {
    recipes,
    categories,
    isLoading,
    error,
    searchRecipes,
    getRandomRecipes,
    getRecipesByCategory,
    getCategories,
    parseRecipeUrl,
    clearRecipes,
  }
}
