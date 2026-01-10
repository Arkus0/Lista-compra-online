'use client'

import { useEffect, useRef } from 'react'
import { AlertTriangle, Trash2, X, AlertCircle, Info } from 'lucide-react'
import { Button } from './Button'

type DialogVariant = 'danger' | 'warning' | 'info'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: DialogVariant
  isLoading?: boolean
}

const variantConfig: Record<DialogVariant, { icon: typeof AlertTriangle; iconBg: string; iconColor: string; buttonVariant: 'danger' | 'primary' | 'secondary' }> = {
  danger: {
    icon: Trash2,
    iconBg: 'bg-red-100 dark:bg-red-900/30',
    iconColor: 'text-danger',
    buttonVariant: 'danger',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    iconColor: 'text-amber-500',
    buttonVariant: 'primary',
  },
  info: {
    icon: Info,
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-info',
    buttonVariant: 'primary',
  },
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const config = variantConfig[variant]
  const Icon = config.icon

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) onClose()
    }

    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose, isLoading])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="absolute inset-0 confirm-overlay animate-in fade-in duration-200"
        onClick={() => !isLoading && onClose()}
      />

      {/* Dialog */}
      <div
        className="relative bg-card w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="alertdialog"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-description"
      >
        {/* Header with close button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-3 right-3 w-8 h-8 rounded-full hover:bg-secondary flex items-center justify-center transition-colors disabled:opacity-50"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4 text-muted" />
        </button>

        {/* Content */}
        <div className="pt-8 pb-6 px-6 text-center">
          <div className={`w-16 h-16 ${config.iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
            <Icon className={`w-8 h-8 ${config.iconColor}`} />
          </div>

          <h3 id="confirm-title" className="text-lg font-semibold text-foreground mb-2">
            {title}
          </h3>

          <p id="confirm-description" className="text-muted text-sm leading-relaxed">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 bg-secondary/30 border-t border-border-light">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            {cancelLabel}
          </Button>
          <Button
            variant={config.buttonVariant}
            onClick={onConfirm}
            isLoading={isLoading}
            className="flex-1"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
