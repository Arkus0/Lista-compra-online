'use client'

import { Search, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ThemeToggle from '@/components/ui/ThemeToggle'
import dynamic from 'next/dynamic'

const NotificationButton = dynamic(
  () => import('@/components/notifications/NotificationButton').then(mod => ({ default: mod.NotificationButton })),
  { ssr: false }
)

interface HeaderProps {
  title?: string
  showSearch?: boolean
  showBack?: boolean
}

export function Header({ title = 'ShoppyJuan', showSearch = false, showBack = false }: HeaderProps) {
  const router = useRouter()

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border-light">
      <div className="flex items-center justify-between px-4 h-14">
        {showBack ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-xl hover:bg-secondary flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-muted" />
            </button>
            <h1 className="font-bold text-lg">{title}</h1>
          </div>
        ) : (
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🛒</span>
            <h1 className="font-bold text-lg">{title}</h1>
          </Link>
        )}

        <div className="flex items-center gap-1">
          {showSearch && (
            <button className="w-10 h-10 rounded-xl hover:bg-secondary flex items-center justify-center transition-colors">
              <Search className="w-5 h-5 text-muted" />
            </button>
          )}
          <NotificationButton />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
