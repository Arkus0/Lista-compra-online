'use client'

import Link from 'next/link'
import { MessageSquare } from 'lucide-react'

interface FeedbackBoxProps {
  variant?: 'button' | 'card'
}

export function FeedbackBox({ variant = 'button' }: FeedbackBoxProps) {
  if (variant === 'card') {
    return (
      <Link href="/feedback">
        <button
          className="w-full p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl border border-primary/20 hover:border-primary/40 transition-all flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-medium">¿Tienes sugerencias?</p>
            <p className="text-sm text-muted-foreground">Cuéntanos cómo mejorar la app</p>
          </div>
        </button>
      </Link>
    )
  }

  return (
    <Link href="/feedback">
      <button
        className="flex items-center gap-2 text-sm text-primary font-medium hover:underline"
      >
        <MessageSquare className="w-4 h-4" />
        Sugerencias
      </button>
    </Link>
  )
}
