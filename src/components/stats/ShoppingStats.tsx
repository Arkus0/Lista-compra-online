'use client'

import { useState } from 'react'
import { TrendingUp, ShoppingBag, Calendar, PieChart, Star, Clock, Info } from 'lucide-react'
import { useShoppingStats } from '@/hooks/useShoppingStats'
import { useUser } from '@/store/useStore'
import { CATEGORIES } from '@/lib/constants'
import { Card } from '@/components/ui/Card'

export function ShoppingStats() {
  const user = useUser()
  const [daysBack, setDaysBack] = useState(90)
  const stats = useShoppingStats(user?.id, daysBack)

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted">Inicia sesión para ver tus estadísticas</p>
      </div>
    )
  }

  if (stats.isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-secondary rounded-xl animate-pulse" />
        <div className="h-48 bg-secondary rounded-xl animate-pulse" />
        <div className="h-64 bg-secondary rounded-xl animate-pulse" />
      </div>
    )
  }

  if (stats.error) {
    return (
      <div className="text-center py-12">
        <p className="text-danger">Error: {stats.error}</p>
      </div>
    )
  }

  if (stats.totalPurchases === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingBag className="w-16 h-16 text-muted mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Sin historial de compras</h3>
        <p className="text-muted">Empieza a marcar productos como comprados para ver tus estadísticas</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con selector de período */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Mis Estadísticas</h2>
        <select
          value={daysBack}
          onChange={(e) => setDaysBack(Number(e.target.value))}
          className="px-4 py-2 rounded-lg border border-border bg-background text-sm"
        >
          <option value={30}>Últimos 30 días</option>
          <option value={90}>Últimos 90 días</option>
          <option value={180}>Últimos 6 meses</option>
          <option value={365}>Último año</option>
        </select>
      </div>

      {/* Insights destacados */}
      {stats.insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.insights.map((insight, idx) => (
            <Card
              key={idx}
              className={`p-4 ${
                insight.type === 'warning'
                  ? 'border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10'
                  : insight.type === 'success'
                  ? 'border-l-4 border-green-500 bg-green-50 dark:bg-green-900/10'
                  : 'border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{insight.icon}</span>
                <p className="text-sm font-medium">{insight.message}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted">Total de compras</p>
              <p className="text-2xl font-bold">{stats.totalPurchases}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted">Productos comprados</p>
              <p className="text-2xl font-bold">{stats.totalItemsPurchased}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted">Período</p>
              <p className="text-2xl font-bold">{daysBack}d</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Productos más frecuentes */}
      {stats.mostFrequentProducts.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-semibold">Productos más comprados</h3>
          </div>
          <div className="space-y-3">
            {stats.mostFrequentProducts.slice(0, 5).map((product, idx) => {
              const CategoryIcon = product.category && CATEGORIES[product.category]
                ? CATEGORIES[product.category].icon
                : ShoppingBag
              const categoryColor = product.category && CATEGORIES[product.category]
                ? CATEGORIES[product.category].color
                : 'text-gray-600 bg-gray-50'

              const daysSinceLastPurchase = Math.floor(
                (Date.now() - new Date(product.lastPurchased).getTime()) / (1000 * 60 * 60 * 24)
              )

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-10 h-10 rounded-full ${categoryColor} flex items-center justify-center`}>
                      <CategoryIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{product.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted">
                        <span>{product.count} veces</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          hace {daysSinceLastPurchase}d
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      {[...Array(Math.min(5, product.count))].map((_, i) => (
                        <div
                          key={i}
                          className="w-2 h-2 rounded-full bg-amber-500"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Distribución por categorías */}
      {stats.categoryDistribution.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold">Distribución por categorías</h3>
          </div>
          <div className="space-y-3">
            {stats.categoryDistribution.map((cat, idx) => {
              const categoryConfig = CATEGORIES[cat.category]
              if (!categoryConfig) return null

              const CategoryIcon = categoryConfig.icon

              return (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg ${categoryConfig.color} flex items-center justify-center`}>
                        <CategoryIcon className="w-4 h-4" />
                      </div>
                      <span className="font-medium">{categoryConfig.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted">{cat.count} productos</span>
                      <span className="font-semibold">{cat.percentage.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Historial reciente */}
      {stats.recentPurchases.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-green-500" />
            <h3 className="text-lg font-semibold">Compras recientes</h3>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {stats.recentPurchases.map((purchase, idx) => {
              const purchaseDate = new Date(purchase.purchased_at)
              const isToday = new Date().toDateString() === purchaseDate.toDateString()
              const isYesterday =
                new Date(Date.now() - 86400000).toDateString() === purchaseDate.toDateString()

              let dateStr = purchaseDate.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short'
              })
              if (isToday) dateStr = 'Hoy'
              if (isYesterday) dateStr = 'Ayer'

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-medium">{purchase.item_name}</div>
                    {purchase.quantity > 1 && (
                      <span className="text-xs text-muted">
                        ×{purchase.quantity}
                        {purchase.unit}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <span>{purchase.list_name}</span>
                    <span>•</span>
                    <span>{dateStr}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Info adicional */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-900/10 border-blue-200">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-900 dark:text-blue-100">
            <p className="font-medium mb-1">Cómo funcionan las estadísticas</p>
            <p className="text-blue-700 dark:text-blue-200">
              Cada vez que marcas un producto como comprado, se guarda en tu historial personal.
              Usa estas estadísticas para optimizar tus compras y detectar patrones.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
