'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, ArrowLeft, X, Loader2 } from 'lucide-react'
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
  onSearch?: (query: string) => void
  searchPlaceholder?: string
}

export function Header({
  title = 'ShoppyJuan',
  showSearch = false,
  showBack = false,
  onSearch,
  searchPlaceholder = 'Buscar...',
}: HeaderProps) {
  const router = useRouter()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Focus input when search opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isSearchOpen])

  // Handle search with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (onSearch && searchQuery.length > 0) {
      setIsSearching(true)
      searchTimeoutRef.current = setTimeout(() => {
        onSearch(searchQuery)
        setIsSearching(false)
      }, 300)
    } else if (onSearch && searchQuery.length === 0) {
      onSearch('')
      setIsSearching(false)
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery, onSearch])

  const handleCloseSearch = () => {
    setSearchQuery('')
    setIsSearchOpen(false)
    onSearch?.('')
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCloseSearch()
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border-light">
      <div className="flex items-center justify-between px-4 h-14">
        {/* Left side: Back button or Logo */}
        {isSearchOpen ? (
          // Search mode: show search input
          <div className="flex-1 flex items-center gap-2 animate-in fade-in slide-in-from-left-4 duration-200">
            <button
              onClick={handleCloseSearch}
              className="w-10 h-10 rounded-xl hover:bg-secondary flex items-center justify-center transition-colors flex-shrink-0"
              aria-label="Cerrar búsqueda"
            >
              <ArrowLeft className="w-5 h-5 text-muted" />
            </button>
            <div className="relative flex-1">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder={searchPlaceholder}
                className="w-full h-10 pl-4 pr-10 bg-secondary rounded-xl text-foreground placeholder:text-muted-light focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                aria-label="Buscar"
              />
              {isSearching ? (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-light animate-spin" />
              ) : searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full hover:bg-hover flex items-center justify-center"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="w-4 h-4 text-muted" />
                </button>
              ) : (
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-light pointer-events-none" />
              )}
            </div>
          </div>
        ) : (
          // Normal mode
          <>
            {showBack ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.back()}
                  className="w-10 h-10 rounded-xl hover:bg-secondary flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  aria-label="Volver atrás"
                >
                  <ArrowLeft className="w-5 h-5 text-muted" />
                </button>
                <h1 className="font-bold text-lg text-foreground truncate max-w-[180px]">{title}</h1>
              </div>
            ) : (
              <Link
                href="/"
                className="flex items-center gap-2 hover:opacity-80 transition-opacity focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg"
                aria-label="Ir al inicio"
              >
                <span className="text-2xl" role="img" aria-hidden="true">🛒</span>
                <h1 className="font-bold text-lg text-foreground">{title}</h1>
              </Link>
            )}

            {/* Right side: Actions */}
            <div className="flex items-center gap-1">
              {showSearch && (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="w-10 h-10 rounded-xl hover:bg-secondary flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  aria-label="Abrir búsqueda"
                >
                  <Search className="w-5 h-5 text-muted" />
                </button>
              )}
              <NotificationButton />
              <ThemeToggle />
            </div>
          </>
        )}
      </div>

      {/* Search results hint */}
      {isSearchOpen && searchQuery.length > 0 && (
        <div className="px-4 pb-2 text-xs text-muted animate-in fade-in duration-200">
          {isSearching ? (
            <span>Buscando...</span>
          ) : (
            <span>Mostrando resultados para &quot;{searchQuery}&quot;</span>
          )}
        </div>
      )}
    </header>
  )
}
