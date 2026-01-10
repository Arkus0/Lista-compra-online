'use client'

import { useEffect, useRef, ReactNode } from 'react'
import { X } from 'lucide-react'

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: ModalSize
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  footer?: ReactNode
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]',
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  footer,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<Element | null>(null)

  // Handle escape key and body scroll lock
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) onClose()
    }

    if (isOpen) {
      // Store previously focused element
      previousActiveElement.current = document.activeElement

      // Lock body scroll
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleEscape)

      // Don't force focus on the modal container to allow natural focus on form inputs
      // This prevents the textarea from being deselected when typing
    }

    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleEscape)

      // Restore focus to previous element
      if (previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus()
      }
    }
  }, [isOpen, onClose, closeOnEscape])

  if (!isOpen) return null

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === overlayRef.current) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Overlay backdrop with animation */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={handleOverlayClick}
        aria-hidden="true"
      />

      {/* Modal content with animation */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className={`
          relative bg-card w-full ${sizeClasses[size]} rounded-2xl shadow-xl overflow-hidden
          animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300
          focus:outline-none
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-light">
          <h3 id="modal-title" className="font-semibold text-lg text-foreground">
            {title}
          </h3>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl hover:bg-secondary flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5 text-muted" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto max-h-[calc(100vh-12rem)]">
          {children}
        </div>

        {/* Footer (optional) */}
        {footer && (
          <div className="p-4 border-t border-border-light bg-secondary/30">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
