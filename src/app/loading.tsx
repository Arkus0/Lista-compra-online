import { HomePageSkeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="min-h-screen pb-20">
      {/* Header skeleton */}
      <header className="p-4 flex items-center justify-between border-b border-gray-100 animate-pulse">
        <div className="h-8 w-32 bg-gray-200 rounded" />
        <div className="flex gap-2">
          <div className="w-10 h-10 bg-gray-200 rounded-xl" />
          <div className="w-10 h-10 bg-gray-200 rounded-xl" />
        </div>
      </header>
      <HomePageSkeleton />
    </div>
  )
}
