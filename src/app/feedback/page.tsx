'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Send, MessageSquare, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export default function FeedbackPage() {
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isSent, setIsSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
        setMessage('')
        setEmail('')
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
    setMessage('')
    setEmail('')
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/"
            className="w-10 h-10 rounded-xl bg-secondary hover:bg-hover flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="font-bold text-lg">Buzón de Sugerencias</h1>
            <p className="text-xs text-muted">Ayúdanos a mejorar</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-2xl mx-auto px-4 py-6">
        {isSent ? (
          <Card className="p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">¡Gracias por tu sugerencia!</h2>
            <p className="text-muted mb-6">La revisaremos pronto y nos pondremos en contacto contigo si es necesario.</p>
            <Link href="/">
              <Button variant="primary">Volver al inicio</Button>
            </Link>
          </Card>
        ) : (
          <>
            {/* Info Card */}
            <Card className="p-6 mb-6 bg-primary/5 border-primary/20">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold mb-1">Tu opinión es importante</h2>
                  <p className="text-sm text-muted">
                    Cuéntanos qué te gustaría mejorar o qué funcionalidades te gustaría ver en la app.
                    También puedes reportar errores o problemas que hayas encontrado.
                  </p>
                </div>
              </div>
            </Card>

            {/* Form */}
            <Card className="p-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tu mensaje <span className="text-danger">*</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Escribe tu sugerencia, comentario o reporte de error aquí..."
                    className="w-full h-48 px-4 py-3 rounded-xl border-2 border-border bg-background text-foreground placeholder:text-muted-light focus:outline-none focus:border-primary transition-colors resize-none"
                    required
                    autoFocus
                  />
                  <p className="text-xs text-muted mt-1">
                    Mínimo 10 caracteres
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tu email (opcional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="w-full h-12 px-4 rounded-xl border-2 border-border bg-background text-foreground placeholder:text-muted-light focus:outline-none focus:border-primary transition-colors"
                  />
                  <p className="text-xs text-muted mt-1">
                    Para que podamos responderte si es necesario
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Link href="/" className="flex-1">
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full"
                    >
                      Cancelar
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    disabled={!message.trim() || message.trim().length < 10 || isSending}
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    {isSending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Enviar sugerencia
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Card>

            {/* Tips Card */}
            <Card className="mt-6 p-6 bg-secondary/30">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <span className="text-lg">💡</span>
                Consejos para una buena sugerencia
              </h3>
              <ul className="space-y-2 text-sm text-muted">
                <li className="flex gap-2">
                  <span>•</span>
                  <span>Sé específico sobre qué te gustaría mejorar</span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>Si es un error, describe los pasos para reproducirlo</span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>Incluye capturas de pantalla si es posible (adjúntalas en el email)</span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>Propón ideas de nuevas funcionalidades que te gustarían</span>
                </li>
              </ul>
            </Card>
          </>
        )}
      </main>
    </div>
  )
}
