'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, ShoppingBag, Star, Package, ArrowRight, Loader2, Clock, TrendingUp, SearchX } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { searchProducts, CommonProduct, CATEGORIES, CategoryId } from '@/lib/constants'
import { UserFavoriteItem, ShoppingList } from '@/lib/supabase/types'
import { normalizeText } from '@/lib/utils'
import { useDebouncedValue } from '@/hooks/useDebounce'

interface SearchResult {
  type: 'list' | 'favorite' | 'product' | 'recent'
  id: string
  name: string
  category?: string
  subtitle?: string
  href?: string
}

interface GlobalSearchProps {
  userId?: string
  placeholder?: string
}

export function GlobalSearch({ userId, placeholder = 'Buscar listas, favoritos, productos...' }: GlobalSearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [lists, setLists] = useState<ShoppingList[]>([])
  const [favorites, setFavorites] = useState<UserFavoriteItem[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Load lists and favorites on mount
  useEffect(() => {
    if (!userId) return

    const loadData = async () => {
      const [listsResult, favoritesResult] = await Promise.all([
        supabase
          .from('shopping_lists')
          .select('id, name, updated_at')
          .eq('owner_id', userId)
          .order('updated_at', { ascending: false })
          .limit(50),
        supabase
          .from('user_favorite_items')
          .select('*')
          .eq('user_id', userId)
          .limit(100)
      ])

      if (listsResult.data) setLists(listsResult.data as ShoppingList[])
      if (favoritesResult.data) setFavorites(favoritesResult.data as UserFavoriteItem[])
    }

    loadData()

    // Load recent searches from localStorage
    const saved = localStorage.getItem('recentSearches')
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved))
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, [userId, supabase])

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Debounced query for search
  const debouncedQuery = useDebouncedValue(query, 200)

  // Search logic - runs when debouncedQuery changes
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    const normalizedQuery = normalizeText(debouncedQuery)
    const searchResults: SearchResult[] = []

    // Search in lists
    lists.forEach(list => {
      if (normalizeText(list.name).includes(normalizedQuery)) {
        searchResults.push({
          type: 'list',
          id: list.id,
          name: list.name,
          subtitle: 'Lista de compras',
          href: `/lists/${list.id}`
        })
      }
    })

    // Search in favorites
    favorites.forEach(fav => {
      if (normalizeText(fav.name).includes(normalizedQuery)) {
        searchResults.push({
          type: 'favorite',
          id: fav.id,
          name: fav.name,
          category: fav.category || undefined,
          subtitle: 'Favorito'
        })
      }
    })

    // Search in common products (already uses normalizeText internally)
    const productMatches = searchProducts(debouncedQuery, 5)
    productMatches.forEach(product => {
      // Avoid duplicates with favorites
      if (!searchResults.some(r => r.type === 'favorite' && r.name.toLowerCase() === product.name.toLowerCase())) {
        searchResults.push({
          type: 'product',
          id: `product-${product.name}`,
          name: product.name,
          category: product.category,
          subtitle: CATEGORIES[product.category]?.label || 'Producto'
        })
      }
    })

    setResults(searchResults.slice(0, 10))
    setIsLoading(false)
  }, [debouncedQuery, lists, favorites])

  // Show loading indicator while typing
  useEffect(() => {
    if (query.trim() && query !== debouncedQuery) {
      setIsLoading(true)
    }
  }, [query, debouncedQuery])

  // Manual search for recent clicks
  const performSearch = useCallback((searchQuery: string) => {
    setQuery(searchQuery)
  }, [])

  const handleOpen = () => {
    setIsOpen(true)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const handleClose = () => {
    setIsOpen(false)
    setQuery('')
    setResults([])
  }

  const saveRecentSearch = (term: string) => {
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('recentSearches', JSON.stringify(updated))
  }

  const handleResultClick = (result: SearchResult) => {
    if (query.trim()) {
      saveRecentSearch(query.trim())
    }
    handleClose()
  }

  const handleRecentClick = (term: string) => {
    setQuery(term)
    performSearch(term)
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem('recentSearches')
  }

  const getResultIcon = (type: string, category?: string) => {
    switch (type) {
      case 'list':
        return <ShoppingBag className="w-5 h-5 text-primary" />
      case 'favorite':
        return <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
      case 'product':
        if (category && CATEGORIES[category as CategoryId]) {
          const CategoryIcon = CATEGORIES[category as CategoryId].icon
          return <CategoryIcon className={`w-5 h-5 ${CATEGORIES[category as CategoryId].color.split(' ')[0]}`} />
        }
        return <Package className="w-5 h-5 text-muted" />
      case 'recent':
        return <Clock className="w-5 h-5 text-muted" />
      default:
        return <Package className="w-5 h-5 text-muted" />
    }
  }

  // Popular suggestions when no search
  const popularSuggestions = ['Leche', 'Pan', 'Huevos', 'Fruta', 'Carne']

  return (
    <div ref={panelRef} className="relative">
      {/* Search trigger */}
      {!isOpen ? (
        <button
          onClick={handleOpen}
          className="w-full flex items-center gap-3 px-4 py-3 bg-secondary rounded-xl text-muted-foreground hover:bg-secondary/80 transition-colors text-left"
        >
          <Search className="w-5 h-5" />
          <span className="text-sm">{placeholder}</span>
        </button>
      ) : (
        <div className="relative">
          {/* Search input */}
          <div className="flex items-center gap-2 px-4 py-3 bg-secondary rounded-xl border-2 border-primary">
            <Search className="w-5 h-5 text-primary" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="flex-1 bg-transparent focus:outline-none text-foreground placeholder:text-muted-foreground"
              autoComplete="off"
            />
            {isLoading && <Loader2 className="w-5 h-5 text-muted animate-spin" />}
            <button onClick={handleClose} className="p-1 hover:bg-hover rounded-lg">
              <X className="w-5 h-5 text-muted" />
            </button>
          </div>

          {/* Results panel */}
          <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50 max-h-[60vh] overflow-y-auto">
            {results.length > 0 ? (
              <div className="py-2">
                <div className="px-3 py-1.5 text-xs font-medium text-muted uppercase tracking-wider">
                  Resultados
                </div>
                {results.map((result) => (
                  result.href ? (
                    <Link
                      key={result.id}
                      href={result.href}
                      onClick={() => handleResultClick(result)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                        {getResultIcon(result.type, result.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{result.name}</p>
                        <p className="text-xs text-muted">{result.subtitle}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted" />
                    </Link>
                  ) : (
                    <div
                      key={result.id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors cursor-default"
                    >
                      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                        {getResultIcon(result.type, result.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{result.name}</p>
                        <p className="text-xs text-muted">{result.subtitle}</p>
                      </div>
                    </div>
                  )
                ))}
              </div>
            ) : query.trim() && !isLoading ? (
              <div className="py-8 flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                  <SearchX className="w-6 h-6 text-muted" />
                </div>
                <div className="text-center">
                  <p className="text-foreground font-medium text-sm">Sin resultados</p>
                  <p className="text-muted text-xs mt-1">No encontramos nada para "{query}"</p>
                </div>
                <button
                  onClick={() => setQuery('')}
                  className="text-xs text-primary hover:underline mt-1"
                >
                  Limpiar búsqueda
                </button>
              </div>
            ) : (
              <div className="py-2">
                {/* Recent searches */}
                {recentSearches.length > 0 && (
                  <div className="mb-2">
                    <div className="px-3 py-1.5 flex items-center justify-between">
                      <span className="text-xs font-medium text-muted uppercase tracking-wider">Búsquedas recientes</span>
                      <button onClick={clearRecentSearches} className="text-xs text-primary hover:underline">
                        Limpiar
                      </button>
                    </div>
                    {recentSearches.map((term, i) => (
                      <button
                        key={i}
                        onClick={() => handleRecentClick(term)}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-secondary/50 transition-colors text-left"
                      >
                        <Clock className="w-4 h-4 text-muted" />
                        <span className="text-sm text-foreground">{term}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Popular suggestions */}
                <div>
                  <div className="px-3 py-1.5 flex items-center gap-1 text-xs font-medium text-muted uppercase tracking-wider">
                    <TrendingUp className="w-3 h-3" />
                    Sugerencias populares
                  </div>
                  <div className="px-3 py-2 flex flex-wrap gap-2">
                    {popularSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => {
                          setQuery(suggestion)
                          performSearch(suggestion)
                        }}
                        className="px-3 py-1.5 bg-secondary rounded-full text-sm text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
