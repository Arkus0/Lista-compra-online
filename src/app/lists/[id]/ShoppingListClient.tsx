'use client'

import { useEffect, lazy, Suspense } from 'react'
import { ShoppingList as ShoppingListType, Profile } from '@/lib/supabase/types'
import { useSetCurrentList, useSetUser } from '@/store/useStore'

// Lazy load del componente pesado ShoppingList
const ShoppingList = lazy(() =>
  import('@/components/shopping/ShoppingList').then(mod => ({ default: mod.ShoppingList }))
)

// Skeleton para loading
const ShoppingListSkeleton = () => (
  <div className="flex flex-col h-full">
    {/* Header skeleton */}
    <header className="p-4 border-b border-gray-100 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-200" />
          <div className="space-y-2">
            <div className="h-5 bg-gray-200 rounded w-32" />
            <div className="h-3 bg-gray-200 rounded w-20" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="w-10 h-10 bg-gray-200 rounded-xl" />
          <div className="w-10 h-10 bg-gray-200 rounded-xl" />
          <div className="w-10 h-10 bg-gray-200 rounded-xl" />
        </div>
      </div>
      <div className="h-2 bg-gray-200 rounded-full" />
      <div className="h-3 bg-gray-200 rounded w-24 mt-1" />
    </header>

    {/* Items skeleton */}
    <div className="flex-1 p-4 space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 animate-pulse">
          <div className="w-5 h-5 bg-gray-200 rounded" />
          <div className="w-6 h-6 bg-gray-200 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/4" />
          </div>
          <div className="flex gap-1">
            <div className="w-7 h-7 bg-gray-200 rounded-lg" />
            <div className="w-8 h-7 bg-gray-200 rounded" />
            <div className="w-7 h-7 bg-gray-200 rounded-lg" />
          </div>
        </div>
      ))}
    </div>

    {/* Bottom form skeleton */}
    <div className="p-4 border-t border-gray-100 animate-pulse">
      <div className="flex gap-3">
        <div className="w-12 h-12 bg-gray-200 rounded-xl" />
        <div className="flex-1 h-12 bg-gray-200 rounded-xl" />
        <div className="w-12 h-12 bg-gray-200 rounded-xl" />
      </div>
    </div>
  </div>
)

interface Props {
  list: ShoppingListType
  user: Profile
}

export function ShoppingListClient({ list, user }: Props) {
  // Usar selectores optimizados
  const setCurrentList = useSetCurrentList()
  const setUser = useSetUser()

  useEffect(() => {
    setCurrentList(list)
    setUser(user)

    // Cleanup al desmontar
    return () => {
      setCurrentList(null)
    }
  }, [list, user, setCurrentList, setUser])

  return (
    <div className="h-screen flex flex-col">
      <Suspense fallback={<ShoppingListSkeleton />}>
        <ShoppingList list={list} />
      </Suspense>
    </div>
  )
}
