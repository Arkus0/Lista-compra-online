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
  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Si el perfil no existe, crearlo (puede pasar si el trigger falló)
  if (!profile) {
    const { data: newProfile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuario',
      })
      .select()
      .single()

    if (profileError) {
      console.error('Error creando perfil:', profileError)
      // Crear un perfil temporal para evitar el error
      profile = {
        id: user.id,
        email: user.email || '',
        name: user.email?.split('@')[0] || 'Usuario',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    } else {
      profile = newProfile
    }
  }

  return <ShoppingListClient list={list} user={profile} />
}
