import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function getOrigin(request: Request): string {
  // Prioridad: env var > x-forwarded-host > request.url
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }

  const forwardedHost = request.headers.get('x-forwarded-host')
  if (forwardedHost) {
    const proto = request.headers.get('x-forwarded-proto') ?? 'https'
    return `${proto}://${forwardedHost}`
  }

  return new URL(request.url).origin
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type') // 'signup' para confirmación de email
  const next = searchParams.get('next') ?? '/'
  const origin = getOrigin(request)

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Si es confirmación de email, redirigir a auth con mensaje
      if (type === 'signup') {
        return NextResponse.redirect(`${origin}/auth?confirmed=true`)
      }
      return NextResponse.redirect(`${origin}${next}`)
    }

    // Manejo de errores específicos
    const errorMessage = error.message.includes('expired')
      ? 'El enlace ha expirado. Solicita uno nuevo.'
      : 'No se pudo autenticar'

    return NextResponse.redirect(
      `${origin}/auth?error=${encodeURIComponent(errorMessage)}`
    )
  }

  return NextResponse.redirect(`${origin}/auth?error=Código+no+proporcionado`)
}
