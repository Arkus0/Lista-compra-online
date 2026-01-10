import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { SuperModeClient } from './SuperModeClient'

interface Props {
  params: Promise<{ id: string }>
}

export default async function SuperModePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

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

  // Verificar permisos
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

  return <SuperModeClient list={list} user={profile!} />
}
