'use client'

import { LucideIcon } from 'lucide-react'
import { Button } from './Button'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
    icon?: LucideIcon
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className = ''
}: EmptyStateProps) {
  return (
    <div className={`empty-state ${className}`}>
      <div className="empty-state-icon">
        <Icon className="w-10 h-10" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted text-sm max-w-xs mb-6">{description}</p>

      {action && (
        <Button
          onClick={action.onClick}
          leftIcon={action.icon && <action.icon className="w-4 h-4" />}
          className="mb-2"
        >
          {action.label}
        </Button>
      )}

      {secondaryAction && (
        <button
          onClick={secondaryAction.onClick}
          className="text-sm text-muted hover:text-primary transition-colors"
        >
          {secondaryAction.label}
        </button>
      )}
    </div>
  )
}
