import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Rutas que no necesitan verificación de sesión
const publicRoutes = ['/auth', '/auth/callback', '/join']

// Rutas que son assets estáticos (no necesitan middleware)
const isStaticAsset = (pathname: string) => {
  return pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // archivos con extensión
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip para assets estáticos - no necesitan auth check
  if (isStaticAsset(pathname)) {
    return NextResponse.next()
  }

  // Para rutas públicas, solo pasar sin verificar auth
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Solo verificar sesión para rutas protegidas
  // Esto evita llamadas innecesarias a Supabase en cada request
  if (!isPublicRoute) {
    const { data: { user } } = await supabase.auth.getUser()

    // Si no hay usuario y no es ruta pública, redirigir a auth
    if (!user) {
      const redirectUrl = new URL('/auth', request.url)
      return NextResponse.redirect(redirectUrl)
    }
  }

  return supabaseResponse
}
