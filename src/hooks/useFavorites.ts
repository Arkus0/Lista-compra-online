'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserFavoriteItem, ListItem } from '@/lib/supabase/types'

interface UseFavoritesReturn {
  favoriteItems: UserFavoriteItem[]
  favoriteLists: Set<string>
  isLoading: boolean
  addFavoriteItem: (item: Omit<UserFavoriteItem, 'id' | 'user_id' | 'created_at'>) => Promise<boolean>
  removeFavoriteItem: (itemId: string) => Promise<boolean>
  toggleFavoriteList: (listId: string) => Promise<boolean>
  isListFavorite: (listId: string) => boolean
  addItemToListFromFavorite: (favorite: UserFavoriteItem, listId: string) => Promise<{ item: ListItem, action: 'created' | 'updated' } | null>
}

export function useFavorites(userId?: string): UseFavoritesReturn {
  const [favoriteItems, setFavoriteItems] = useState<UserFavoriteItem[]>([])
  const [favoriteLists, setFavoriteLists] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)

  // Cargar favoritos al iniciar
  useEffect(() => {
    if (!userId) {
      setIsLoading(false)
      return
    }

    const loadFavorites = async () => {
      const supabase = createClient()

      // Cargar items favoritos
      const { data: items } = await supabase
        .from('user_favorite_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (items) {
        setFavoriteItems(items)
      }

      // Cargar listas favoritas
      const { data: lists } = await supabase
        .from('user_favorite_lists')
        .select('list_id')
        .eq('user_id', userId)

      if (lists) {
        setFavoriteLists(new Set(lists.map((l) => l.list_id)))
      }

      setIsLoading(false)
    }

    loadFavorites()
  }, [userId])

  // Añadir item favorito
  const addFavoriteItem = useCallback(
    async (item: Omit<UserFavoriteItem, 'id' | 'user_id' | 'created_at'>): Promise<boolean> => {
      if (!userId) return false

      const supabase = createClient()

      const { data, error } = await supabase
        .from('user_favorite_items')
        .insert({
          user_id: userId,
          ...item,
        })
        .select()
        .single()

      if (error) {
        // Si ya existe, no es error
        if (error.code === '23505') return true
        console.error('Error adding favorite item:', error)
        return false
      }

      if (data) {
        setFavoriteItems((prev) => [data, ...prev])
      }

      return true
    },
    [userId]
  )

  // Eliminar item favorito
  const removeFavoriteItem = useCallback(
    async (itemId: string): Promise<boolean> => {
      if (!userId) return false

      const supabase = createClient()

      const { error } = await supabase
        .from('user_favorite_items')
        .delete()
        .eq('id', itemId)

      if (error) {
        console.error('Error removing favorite item:', error)
        return false
      }

      setFavoriteItems((prev) => prev.filter((item) => item.id !== itemId))
      return true
    },
    [userId]
  )

  // Toggle lista favorita
  const toggleFavoriteList = useCallback(
    async (listId: string): Promise<boolean> => {
      if (!userId) return false

      const supabase = createClient()
      const isFavorite = favoriteLists.has(listId)

      if (isFavorite) {
        // Eliminar de favoritos
        const { error } = await supabase
          .from('user_favorite_lists')
          .delete()
          .eq('user_id', userId)
          .eq('list_id', listId)

        if (error) {
          console.error('Error removing favorite list:', error)
          return false
        }

        setFavoriteLists((prev) => {
          const newSet = new Set(prev)
          newSet.delete(listId)
          return newSet
        })
      } else {
        // Añadir a favoritos
        const { error } = await supabase.from('user_favorite_lists').insert({
          user_id: userId,
          list_id: listId,
        })

        if (error) {
          console.error('Error adding favorite list:', error)
          return false
        }

        setFavoriteLists((prev) => new Set(prev).add(listId))
      }

      return true
    },
    [userId, favoriteLists]
  )

  // Verificar si lista es favorita
  const isListFavorite = useCallback(
    (listId: string): boolean => {
      return favoriteLists.has(listId)
    },
    [favoriteLists]
  )

  // Añadir item a lista desde favorito (CON LÓGICA DE AGRUPACIÓN)
  const addItemToListFromFavorite = useCallback(
    async (favorite: UserFavoriteItem, listId: string): Promise<{ item: ListItem, action: 'created' | 'updated' } | null> => {
      if (!userId) return null

      const supabase = createClient()

      try {
        // 1. Buscar si ya existe un item con el mismo nombre en la lista (case insensitive)
        const { data: existingItems } = await supabase
          .from('list_items')
          .select('*')
          .eq('list_id', listId)
          .ilike('name', favorite.name)
          .limit(1)

        const existingItem = existingItems?.[0]

        if (existingItem) {
          // 2. Si existe, ACTUALIZAR: sumar cantidad y asegurar que está unchecked
          const newQuantity = (existingItem.quantity || 1) + (favorite.quantity || 1)
          
          const { data: updatedItem, error } = await supabase
            .from('list_items')
            .update({
              quantity: newQuantity,
              checked: false, // Lo devolvemos a "por comprar" si estaba completado
              checked_by: null,
              // Mantener categoría del favorito si el item no tenía
              category: existingItem.category === 'other' ? favorite.category : existingItem.category
            })
            .eq('id', existingItem.id)
            .select()
            .single()

          if (error) throw error
          return { item: updatedItem, action: 'updated' }
          
        } else {
          // 3. Si no existe, CREAR NUEVO
          // Obtener posición máxima
          const { data: items } = await supabase
            .from('list_items')
            .select('position')
            .eq('list_id', listId)
            .order('position', { ascending: false })
            .limit(1)

          const maxPosition = items?.[0]?.position ?? -1

          const { data: newItem, error } = await supabase
            .from('list_items')
            .insert({
              list_id: listId,
              name: favorite.name,
              quantity: favorite.quantity,
              unit: favorite.unit,
              category: favorite.category,
              added_by: userId,
              position: maxPosition + 1,
            })
            .select()
            .single()

          if (error) throw error
          return { item: newItem, action: 'created' }
        }
      } catch (error) {
        console.error('Error adding item from favorite:', error)
        return null
      }
    },
    [userId]
  )

  return {
    favoriteItems,
    favoriteLists,
    isLoading,
    addFavoriteItem,
    removeFavoriteItem,
    toggleFavoriteList,
    isListFavorite,
    addItemToListFromFavorite,
  }
}
