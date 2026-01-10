'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

export interface DropdownMenuItem {
  type: 'item' | 'submenu' | 'separator'
  label?: string
  icon?: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: 'default' | 'danger'
  className?: string
  items?: DropdownMenuItem[] // For submenu
}

interface DropdownMenuProps {
  trigger: React.ReactNode
  items: DropdownMenuItem[]
  align?: 'left' | 'right'
  className?: string
  onOpenChange?: (open: boolean) => void
}

export function DropdownMenu({
  trigger,
  items,
  align = 'right',
  className = '',
  onOpenChange
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState<{ top: number; left?: number; right?: number } | null>(null)
  const [showSubmenu, setShowSubmenu] = useState<number | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Calculate position when opening
  const handleToggle = () => {
    console.log('[DropdownMenu] handleToggle called, isOpen:', isOpen)
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const pos = {
        top: rect.bottom + 4,
        [align]: align === 'right' ? window.innerWidth - rect.right : rect.left
      }
      console.log('[DropdownMenu] Setting position:', pos)
      setPosition(pos)
    }
    const newState = !isOpen
    console.log('[DropdownMenu] Setting isOpen to:', newState)
    setIsOpen(newState)
    setShowSubmenu(null)
    onOpenChange?.(newState)
  }

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        menuRef.current?.contains(e.target as Node)
      ) {
        return
      }
      setIsOpen(false)
      setShowSubmenu(null)
      onOpenChange?.(false)
    }

    // Small delay to prevent immediate close
    const timeout = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 10)

    return () => {
      clearTimeout(timeout)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onOpenChange])

  // Close on escape
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
        setShowSubmenu(null)
        triggerRef.current?.focus()
        onOpenChange?.(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onOpenChange])

  const handleItemClick = (item: DropdownMenuItem) => {
    console.log('[DropdownMenu] handleItemClick called for:', item.label)
    if (item.disabled) {
      console.log('[DropdownMenu] Item is disabled, ignoring click')
      return
    }
    console.log('[DropdownMenu] Calling onClick handler')
    item.onClick?.()
    console.log('[DropdownMenu] Closing menu')
    setIsOpen(false)
    setShowSubmenu(null)
    onOpenChange?.(false)
  }

  const renderMenuItems = (items: DropdownMenuItem[], isSubmenu = false) => (
    <>
      {items.map((item, index) => {
        if (item.type === 'separator') {
          return <div key={index} role="separator" className="h-px bg-border-light my-1" />
        }

        if (item.type === 'submenu' && item.items) {
          return (
            <div key={index} className="relative">
              <button
                role="menuitem"
                aria-haspopup="menu"
                aria-expanded={showSubmenu === index}
                onClick={() => setShowSubmenu(showSubmenu === index ? null : index)}
                className="w-full px-3 py-2.5 text-left text-sm hover:bg-hover flex items-center gap-3"
              >
                {item.icon}
                <span className="flex-1">{item.label}</span>
              </button>
              {showSubmenu === index && (
                <div className="absolute left-full top-0 ml-1 w-48 bg-card border border-border rounded-xl shadow-xl z-[51] py-1 animate-in fade-in slide-in-from-left-2 duration-150">
                  {renderMenuItems(item.items, true)}
                </div>
              )}
            </div>
          )
        }

        return (
          <button
            key={index}
            role="menuitem"
            onClick={() => handleItemClick(item)}
            disabled={item.disabled}
            className={`w-full px-3 py-2.5 text-left text-sm hover:bg-hover flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed ${
              item.variant === 'danger' ? 'text-danger hover:bg-danger/10' : ''
            } ${item.className || ''}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        )
      })}
    </>
  )

  return (
    <>
      <button
        ref={triggerRef}
        onClick={handleToggle}
        className={className}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        {trigger}
      </button>

      {isOpen && position && typeof window !== 'undefined' && createPortal(
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" />

          {/* Menu */}
          <div
            ref={menuRef}
            role="menu"
            className="fixed w-52 bg-card border border-border rounded-xl shadow-2xl z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-150"
            style={position}
          >
            {renderMenuItems(items)}
          </div>
        </>,
        document.body
      )}
    </>
  )
}
