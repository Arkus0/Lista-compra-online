'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/client'
import { revalidateListsCache } from '@/app/actions'

export default function NewListPage() {
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      // Verificar si el perfil existe, si no, crearlo
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!profile) {
        // Crear perfil si no existe (puede pasar si el trigger falló)
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email || '',
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuario',
          })

        if (profileError) {
          console.error('Error creando perfil:', profileError)
          throw new Error(`Error al crear perfil: ${profileError.message}`)
        }
      }

      // Generar código de compartir único
      const shareCode = Math.random().toString(36).substring(2, 8).toUpperCase()

      const { data, error: insertError } = await supabase
        .from('shopping_lists')
        .insert({
          name: name.trim(),
          owner_id: user.id,
          share_code: shareCode,
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error creando lista:', insertError)
        throw new Error(`Error al crear lista: ${insertError.message}`)
      }

      if (!data) throw new Error('No se pudo crear la lista')

      // Revalidar caché para que las páginas de listas se actualicen
      await revalidateListsCache()

      // Usar replace para que no quede /lists/new en el historial
      router.replace(`/lists/${data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la lista')
    } finally {
      setIsLoading(false)
    }
  }

  const suggestedNames = [
    'Compra semanal',
    'Cena del viernes',
    'Fiesta cumpleaños',
    'Despensa básica',
  ]

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-gray-100">
        <div className="flex items-center gap-3 px-4 h-14">
          <Link
            href="/lists"
            className="w-10 h-10 rounded-xl hover:bg-secondary flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-bold text-lg">Nueva lista</h1>
        </div>
      </header>

      <main className="p-4">
        <Card variant="elevated">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Crear nueva lista</h2>
            <p className="text-gray-500 mt-1">
              Dale un nombre a tu lista de la compra
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              label="Nombre de la lista"
              placeholder="Ej: Compra semanal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />

            {/* Suggestions */}
            <div>
              <p className="text-sm text-gray-500 mb-2">Sugerencias:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedNames.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setName(suggestion)}
                    className="px-3 py-1.5 rounded-full bg-secondary text-sm hover:bg-secondary/80 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-danger/10 text-danger text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
              disabled={!name.trim()}
            >
              Crear lista
            </Button>
          </form>
        </Card>
      </main>
    </div>
  )
}
