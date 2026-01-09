import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PurchaseHistory } from '@/lib/supabase/types'
import { CategoryId } from '@/lib/constants'

// Tipos para estadísticas
export interface ProductFrequency {
  name: string
  count: number
  lastPurchased: string
  category: CategoryId | null
  avgQuantity: number
}

export interface CategoryStats {
  category: CategoryId
  count: number
  percentage: number
}

export interface ShoppingInsight {
  type: 'warning' | 'info' | 'success'
  message: string
  icon: string
}

export interface ShoppingStats {
  // Estadísticas generales
  totalPurchases: number
  totalItemsPurchased: number
  mostFrequentProducts: ProductFrequency[]
  categoryDistribution: CategoryStats[]

  // Insights
  insights: ShoppingInsight[]

  // Historial reciente
  recentPurchases: PurchaseHistory[]

  // Estado
  isLoading: boolean
  error: string | null
}

export function useShoppingStats(userId: string | undefined, daysBack: number = 90): ShoppingStats {
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // Cargar historial de compras
  useEffect(() => {
    if (!userId) {
      setIsLoading(false)
      return
    }

    const loadPurchaseHistory = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - daysBack)

        const { data, error: fetchError } = await supabase
          .from('purchase_history')
          .select('*')
          .eq('user_id', userId)
          .gte('purchased_at', cutoffDate.toISOString())
          .order('purchased_at', { ascending: false })

        if (fetchError) throw fetchError

        setPurchaseHistory(data || [])
      } catch (err) {
        console.error('Error loading purchase history:', err)
        setError(err instanceof Error ? err.message : 'Error cargando historial')
      } finally {
        setIsLoading(false)
      }
    }

    loadPurchaseHistory()
  }, [userId, daysBack, supabase])

  // Calcular estadísticas
  const stats = useMemo(() => {
    // Productos más frecuentes
    const productMap = new Map<string, { count: number; lastPurchased: string; category: CategoryId | null; totalQuantity: number }>()

    purchaseHistory.forEach(purchase => {
      const existing = productMap.get(purchase.item_name)
      if (existing) {
        existing.count++
        existing.totalQuantity += purchase.quantity
        if (new Date(purchase.purchased_at) > new Date(existing.lastPurchased)) {
          existing.lastPurchased = purchase.purchased_at
        }
      } else {
        productMap.set(purchase.item_name, {
          count: 1,
          lastPurchased: purchase.purchased_at,
          category: purchase.category as CategoryId | null,
          totalQuantity: purchase.quantity
        })
      }
    })

    const mostFrequentProducts: ProductFrequency[] = Array.from(productMap.entries())
      .map(([name, data]) => ({
        name,
        count: data.count,
        lastPurchased: data.lastPurchased,
        category: data.category,
        avgQuantity: data.totalQuantity / data.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Distribución por categorías
    const categoryMap = new Map<string, number>()
    purchaseHistory.forEach(purchase => {
      if (purchase.category) {
        categoryMap.set(purchase.category, (categoryMap.get(purchase.category) || 0) + 1)
      }
    })

    const totalCategorized = Array.from(categoryMap.values()).reduce((sum, count) => sum + count, 0)
    const categoryDistribution: CategoryStats[] = Array.from(categoryMap.entries())
      .map(([category, count]) => ({
        category: category as CategoryId,
        count,
        percentage: (count / totalCategorized) * 100
      }))
      .sort((a, b) => b.count - a.count)

    // Generar insights
    const insights: ShoppingInsight[] = []

    // Insight 1: Producto que llevas tiempo sin comprar
    if (mostFrequentProducts.length > 0) {
      const oldestPurchase = mostFrequentProducts
        .filter(p => p.count >= 3) // Solo productos que compras habitualmente
        .sort((a, b) => new Date(a.lastPurchased).getTime() - new Date(b.lastPurchased).getTime())[0]

      if (oldestPurchase) {
        const daysSinceLastPurchase = Math.floor(
          (Date.now() - new Date(oldestPurchase.lastPurchased).getTime()) / (1000 * 60 * 60 * 24)
        )

        if (daysSinceLastPurchase > 21) {
          insights.push({
            type: 'info',
            message: `Llevas ${daysSinceLastPurchase} días sin comprar ${oldestPurchase.name}`,
            icon: '🕒'
          })
        }
      }
    }

    // Insight 2: Producto estrella
    if (mostFrequentProducts.length > 0 && mostFrequentProducts[0].count >= 5) {
      insights.push({
        type: 'success',
        message: `${mostFrequentProducts[0].name} es tu producto más comprado (${mostFrequentProducts[0].count} veces)`,
        icon: '⭐'
      })
    }

    // Insight 3: Categoría dominante
    if (categoryDistribution.length > 0 && categoryDistribution[0].percentage > 30) {
      insights.push({
        type: 'info',
        message: `El ${categoryDistribution[0].percentage.toFixed(0)}% de tus compras son de ${categoryDistribution[0].category}`,
        icon: '📊'
      })
    }

    // Insight 4: Compras recientes
    const recentDays = 7
    const recentCutoff = new Date()
    recentCutoff.setDate(recentCutoff.getDate() - recentDays)
    const recentCount = purchaseHistory.filter(p => new Date(p.purchased_at) >= recentCutoff).length

    if (recentCount > 0) {
      insights.push({
        type: 'info',
        message: `Has comprado ${recentCount} productos en los últimos ${recentDays} días`,
        icon: '🛒'
      })
    }

    return {
      totalPurchases: purchaseHistory.length,
      totalItemsPurchased: purchaseHistory.reduce((sum, p) => sum + p.quantity, 0),
      mostFrequentProducts,
      categoryDistribution,
      insights,
      recentPurchases: purchaseHistory.slice(0, 20)
    }
  }, [purchaseHistory])

  return {
    ...stats,
    isLoading,
    error
  }
}
