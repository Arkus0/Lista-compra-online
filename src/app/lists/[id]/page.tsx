import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ShoppingListClient } from './ShoppingListClient'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ListPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  // Obtener la lista
  const { data: list, error } = await supabase
    .from('shopping_lists')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !list) {
    notFound()
  }

  // Verificar permisos (propietario o colaborador)
  const isOwner = list.owner_id === user.id
  if (!isOwner) {
    const { data: collaborator } = await supabase
      .from('list_collaborators')
      .select('*')
      .eq('list_id', id)
      .eq('user_id', user.id)
      .single()

    if (!collaborator) {
      notFound()
    }
  }

  // Obtener el perfil del usuario
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return <ShoppingListClient list={list} user={profile!} />
}
