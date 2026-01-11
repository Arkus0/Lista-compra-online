'use client'

import { memo, useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ListTodo, Star, User, LucideIcon } from 'lucide-react'

interface NavItem {
  href: string
  icon: LucideIcon
  label: string
  badge?: number
}

const navItems: NavItem[] = [
  { href: '/', icon: Home, label: 'Inicio' },
  { href: '/lists', icon: ListTodo, label: 'Listas' },
  { href: '/favorites', icon: Star, label: 'Favoritos' },
  { href: '/profile', icon: User, label: 'Perfil' },
]

interface BottomNavProps {
  badges?: {
    lists?: number
    favorites?: number
  }
}

// Memoized NavItem component for better performance
const NavItemLink = memo(function NavItemLink({
  item,
  isActive,
  badgeCount,
}: {
  item: NavItem
  isActive: boolean
  badgeCount?: number
}) {
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      className={`
        relative flex flex-col items-center justify-center gap-0.5 px-4 py-2 min-w-[64px]
        rounded-xl transition-all duration-200 ripple
        ${isActive
          ? 'text-primary'
          : 'text-muted-light hover:text-muted active:scale-95'
        }
      `}
      aria-current={isActive ? 'page' : undefined}
      aria-label={item.label}
    >
      {/* Background indicator for active state */}
      {isActive && (
        <span className="absolute inset-x-2 inset-y-1 bg-primary/10 rounded-xl -z-10 animate-in fade-in zoom-in-90 duration-200" />
      )}

      {/* Icon with badge */}
      <span className="relative">
        <Icon
          className={`w-6 h-6 transition-transform duration-200 ${
            isActive ? 'scale-110' : ''
          }`}
          strokeWidth={isActive ? 2.5 : 2}
        />
        {badgeCount !== undefined && badgeCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center badge-bounce">
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        )}
      </span>

      {/* Label */}
      <span
        className={`text-[10px] font-medium tracking-wide transition-all duration-200 ${
          isActive ? 'font-semibold' : ''
        }`}
      >
        {item.label}
      </span>

      {/* Active dot indicator */}
      {isActive && (
        <span className="absolute -bottom-0.5 w-1 h-1 bg-primary rounded-full animate-in fade-in duration-300" />
      )}
    </Link>
  )
})

function BottomNavComponent({ badges }: BottomNavProps) {
  const pathname = usePathname()

  // Memoize badge lookup
  const badgeMap = useMemo(() => ({
    '/lists': badges?.lists,
    '/favorites': badges?.favorites,
  }), [badges?.lists, badges?.favorites])

  // Memoize active states calculation
  const activeStates = useMemo(() => {
    return navItems.map(item => ({
      item,
      isActive: pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href)),
      badgeCount: badgeMap[item.href as keyof typeof badgeMap],
    }))
  }, [pathname, badgeMap])

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border-light safe-area-inset z-50"
      role="navigation"
      aria-label="Navegación principal"
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {activeStates.map(({ item, isActive, badgeCount }) => (
          <NavItemLink
            key={item.href}
            item={item}
            isActive={isActive}
            badgeCount={badgeCount}
          />
        ))}
      </div>
    </nav>
  )
}

// Export memoized component
export const BottomNav = memo(BottomNavComponent)
