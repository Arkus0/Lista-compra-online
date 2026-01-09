'use client'

import { Bell, Search } from 'lucide-react'
import Link from 'next/link'
import ThemeToggle from '@/components/ui/ThemeToggle'

interface HeaderProps {
  title?: string
  showSearch?: boolean
}

export function Header({ title = 'ShoppyJuan', showSearch = false }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border-light">
      <div className="flex items-center justify-between px-4 h-14">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🛒</span>
          <h1 className="font-bold text-lg">{title}</h1>
        </Link>

        <div className="flex items-center gap-1">
          {showSearch && (
            <button className="w-10 h-10 rounded-xl hover:bg-secondary flex items-center justify-center transition-colors">
              <Search className="w-5 h-5 text-muted" />
            </button>
          )}
          <button className="w-10 h-10 rounded-xl hover:bg-secondary flex items-center justify-center transition-colors relative">
            <Bell className="w-5 h-5 text-muted" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
          </button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
