import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ShoppingListClient } from './ShoppingListClient'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ListPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  // Ejecutar auth check primero
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  // Ejecutar queries en paralelo para mayor velocidad
  const [listResult, profileResult] = await Promise.all([
    supabase
      .from('shopping_lists')
      .select('*')
      .eq('id', id)
      .single(),
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
  ])

  const list = listResult.data
  const profile = profileResult.data

  if (listResult.error || !list) {
    notFound()
  }

  // Verificar permisos (propietario o colaborador)
  const isOwner = list.owner_id === user.id
  if (!isOwner) {
    const { data: collaborator } = await supabase
      .from('list_collaborators')
      .select('id')
      .eq('list_id', id)
      .eq('user_id', user.id)
      .single()

    if (!collaborator) {
      notFound()
    }
  }

  return <ShoppingListClient list={list} user={profile!} />
}
