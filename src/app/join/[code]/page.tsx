import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { XCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { JoinClient } from './JoinClient'

interface Props {
  params: Promise<{ code: string }>
}

export default async function JoinPage({ params }: Props) {
  const { code } = await params
  const supabase = await createClient()
  
  // 1. Verificar autenticación
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    // Si no está logueado, redirigir a login y luego volver aquí
    redirect(`/auth?next=/join/${code}`)
  }

  // 2. Intentar unirse usando la función RPC segura
  const { data: result, error } = await supabase
    .rpc('join_list_by_code', { share_code_input: code })

  if (error) {
    console.error('Error joining list:', error)
    return <ErrorState message="Ocurrió un error al intentar unirse a la lista." />
  }

  const response = result as { success: boolean, list_id?: string, message?: string }

  // 3. Si éxito, obtener datos del usuario y la lista para enviar notificación
  if (response.success && response.list_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single()

    const { data: list } = await supabase
      .from('shopping_lists')
      .select('name')
      .eq('id', response.list_id)
      .single()

    const userName = profile?.name || user.email?.split('@')[0] || 'Usuario'
    const listName = list?.name || 'Lista'

    // Usar componente cliente para enviar notificación y redirigir
    return <JoinClient listId={response.list_id} userName={userName} listName={listName} />
  }

  // 4. Si falló (código inválido, etc), mostrar error
  return <ErrorState message={response.message || 'No se pudo unir a la lista.'} />
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="max-w-sm w-full p-6 text-center space-y-4 shadow-xl">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-500">
          <XCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">No se pudo unir</h2>
        <p className="text-gray-500">{message}</p>
        <Link href="/">
           <Button className="w-full mt-2">Ir al inicio</Button>
        </Link>
      </Card>
    </div>
  )
}
