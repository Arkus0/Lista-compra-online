import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { AuthForm } from '@/components/auth/AuthForm'

interface AuthPageProps {
  searchParams: Promise<{ confirmed?: string; error?: string }>
}

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const { confirmed, error } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Solo redirigir si hay usuario Y no viene de confirmación de email
  if (user && confirmed !== 'true') {
    redirect('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-primary/5 to-background">
      <Suspense fallback={<div>Cargando...</div>}>
        <AuthForm confirmed={confirmed === 'true'} authError={error} />
      </Suspense>
    </div>
  )
}
