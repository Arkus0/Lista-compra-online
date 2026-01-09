import { ListCardSkeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="min-h-screen pb-20">
      {/* Header skeleton */}
      <header className="p-4 flex items-center justify-between border-b border-gray-100 animate-pulse">
        <div className="h-8 w-32 bg-gray-200 rounded" />
        <div className="flex gap-2">
          <div className="w-10 h-10 bg-gray-200 rounded-xl" />
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Button skeleton */}
        <div className="h-12 bg-gray-200 rounded-xl animate-pulse" />

        {/* Section title */}
        <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />

        {/* List skeletons */}
        <div className="space-y-3">
          <ListCardSkeleton />
          <ListCardSkeleton />
          <ListCardSkeleton />
          <ListCardSkeleton />
        </div>
      </main>

      {/* Bottom nav skeleton */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-100 animate-pulse">
        <div className="flex justify-around items-center h-full px-6">
          <div className="w-12 h-12 bg-gray-200 rounded-xl" />
          <div className="w-12 h-12 bg-gray-200 rounded-xl" />
          <div className="w-12 h-12 bg-gray-200 rounded-xl" />
          <div className="w-12 h-12 bg-gray-200 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
