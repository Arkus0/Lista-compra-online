'use client'

import { memo } from 'react'

interface SkeletonProps {
  className?: string
}

// Skeleton base
export const Skeleton = memo(function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  )
})

// Skeleton para cards de listas
export const ListCardSkeleton = memo(function ListCardSkeleton() {
  return (
    <div className="p-4 rounded-2xl border border-gray-100 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
        <div className="w-8 h-8 bg-gray-200 rounded-lg" />
      </div>
    </div>
  )
})

// Skeleton para la página de inicio
export const HomePageSkeleton = memo(function HomePageSkeleton() {
  return (
    <div className="p-4 space-y-6 animate-pulse">
      {/* Welcome section */}
      <div className="space-y-2">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <div className="h-20 bg-gray-200 rounded-2xl" />
        <div className="h-20 bg-gray-200 rounded-2xl" />
      </div>

      {/* Recent lists */}
      <div className="space-y-3">
        <div className="h-6 bg-gray-200 rounded w-1/4" />
        <ListCardSkeleton />
        <ListCardSkeleton />
        <ListCardSkeleton />
      </div>
    </div>
  )
})

// Skeleton para página de listas
export const ListsPageSkeleton = memo(function ListsPageSkeleton() {
  return (
    <div className="p-4 space-y-6 animate-pulse">
      <div className="h-12 bg-gray-200 rounded-xl" />
      <div className="space-y-3">
        <div className="h-6 bg-gray-200 rounded w-1/4" />
        <ListCardSkeleton />
        <ListCardSkeleton />
        <ListCardSkeleton />
        <ListCardSkeleton />
      </div>
    </div>
  )
})

// Skeleton para formulario de autenticación
export const AuthFormSkeleton = memo(function AuthFormSkeleton() {
  return (
    <div className="w-full max-w-md mx-auto p-6 rounded-2xl border border-gray-100 animate-pulse">
      <div className="flex flex-col items-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gray-200 mb-4" />
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
      </div>
      <div className="space-y-4">
        <div className="h-12 bg-gray-200 rounded-xl" />
        <div className="h-12 bg-gray-200 rounded-xl" />
        <div className="h-12 bg-gray-200 rounded-xl" />
      </div>
    </div>
  )
})
