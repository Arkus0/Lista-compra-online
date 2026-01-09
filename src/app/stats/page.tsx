import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ShoppingStats } from '@/components/stats/ShoppingStats'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Estadísticas - ShoppyJuan',
  description: 'Ve tus estadísticas y patrones de compra'
}

export default async function StatsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link
              href="/lists"
              className="w-10 h-10 rounded-lg hover:bg-secondary flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">Estadísticas de Compras</h1>
              <p className="text-sm text-muted">Analiza tus patrones y tendencias</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <ShoppingStats />
      </main>
    </div>
  )
}
