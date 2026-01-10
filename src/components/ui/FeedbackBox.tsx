'use client'

import { useState } from 'react'
import { MessageSquare, Send, X, CheckCircle } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from './Button'

interface FeedbackBoxProps {
  variant?: 'button' | 'card'
}

export function FeedbackBox({ variant = 'button' }: FeedbackBoxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isSent, setIsSent] = useState(false)

  const handleSubmit = async () => {
    if (!message.trim()) return

    setIsSending(true)

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message.trim(),
          email: email.trim() || 'No proporcionado'
        })
      })

      if (response.ok) {
        setIsSent(true)
        setTimeout(() => {
          setIsOpen(false)
          setMessage('')
          setEmail('')
          setIsSent(false)
        }, 2000)
      } else {
        // Fallback to mailto
        openMailto()
      }
    } catch {
      // Fallback to mailto
      openMailto()
    } finally {
      setIsSending(false)
    }
  }

  const openMailto = () => {
    const subject = encodeURIComponent('Sugerencia - Lista de Compras')
    const body = encodeURIComponent(`${message}\n\nEmail de contacto: ${email || 'No proporcionado'}`)
    window.location.href = `mailto:juanjosemova@outlook.es?subject=${subject}&body=${body}`
    setIsOpen(false)
    setMessage('')
    setEmail('')
  }

  if (variant === 'card') {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
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

        <FeedbackModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          message={message}
          setMessage={setMessage}
          email={email}
          setEmail={setEmail}
          isSending={isSending}
          isSent={isSent}
          onSubmit={handleSubmit}
        />
      </>
    )
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 text-sm text-primary font-medium hover:underline"
      >
        <MessageSquare className="w-4 h-4" />
        Sugerencias
      </button>

      <FeedbackModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        message={message}
        setMessage={setMessage}
        email={email}
        setEmail={setEmail}
        isSending={isSending}
        isSent={isSent}
        onSubmit={handleSubmit}
      />
    </>
  )
}

function FeedbackModal({
  isOpen,
  onClose,
  message,
  setMessage,
  email,
  setEmail,
  isSending,
  isSent,
  onSubmit
}: {
  isOpen: boolean
  onClose: () => void
  message: string
  setMessage: (v: string) => void
  email: string
  setEmail: (v: string) => void
  isSending: boolean
  isSent: boolean
  onSubmit: () => void
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Buzón de sugerencias">
      {isSent ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <p className="font-semibold text-green-600">¡Gracias por tu sugerencia!</p>
          <p className="text-sm text-muted-foreground mt-1">La revisaremos pronto</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Cuéntanos qué te gustaría mejorar o qué funcionalidades te gustaría ver en la app.
          </p>

          <div>
            <label className="block text-sm font-medium mb-1.5">Tu mensaje *</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe tu sugerencia aquí..."
              className="w-full h-32 px-4 py-3 rounded-xl border-2 border-border bg-input-bg text-foreground placeholder:text-muted-light focus:outline-none focus:border-primary transition-colors resize-none"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Tu email (opcional)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Para que podamos responderte"
              className="w-full h-10 px-4 rounded-xl border-2 border-border bg-input-bg text-foreground placeholder:text-muted-light focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={onSubmit}
              disabled={!message.trim() || isSending}
              className="flex-1 flex items-center justify-center gap-2"
            >
              {isSending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Enviar
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
