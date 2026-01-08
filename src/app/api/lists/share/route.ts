import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface ShoppingListData {
  id: string
  name: string
  owner_id: string
}

// Unirse a una lista compartida usando código
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { share_code } = body

  if (!share_code) {
    return NextResponse.json({ error: 'Share code is required' }, { status: 400 })
  }

  // Buscar la lista con ese código
  const { data, error: listError } = await supabase
    .from('shopping_lists')
    .select('*')
    .eq('share_code', share_code.toUpperCase())
    .single()

  if (listError || !data) {
    return NextResponse.json({ error: 'Invalid share code' }, { status: 404 })
  }

  const list = data as ShoppingListData

  // Verificar que no sea el propietario
  if (list.owner_id === user.id) {
    return NextResponse.json({ error: 'You are already the owner of this list' }, { status: 400 })
  }

  // Verificar que no sea ya colaborador
  const { data: existingCollab } = await supabase
    .from('list_collaborators')
    .select('*')
    .eq('list_id', list.id)
    .eq('user_id', user.id)
    .single()

  if (existingCollab) {
    return NextResponse.json({ error: 'You are already a collaborator on this list' }, { status: 400 })
  }

  // Añadir como colaborador
  const { data: collaborator, error: collabError } = await supabase
    .from('list_collaborators')
    .insert({
      list_id: list.id,
      user_id: user.id,
      role: 'editor',
    })
    .select()
    .single()

  if (collabError) {
    return NextResponse.json({ error: collabError.message }, { status: 500 })
  }

  return NextResponse.json({
    message: 'Successfully joined the list',
    list: {
      id: list.id,
      name: list.name,
    },
    collaborator,
  })
}

// Generar nuevo código de compartir
export async function PUT(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { list_id } = body

  if (!list_id) {
    return NextResponse.json({ error: 'List ID is required' }, { status: 400 })
  }

  // Verificar que el usuario es el propietario
  const { data, error: listError } = await supabase
    .from('shopping_lists')
    .select('*')
    .eq('id', list_id)
    .eq('owner_id', user.id)
    .single()

  if (listError || !data) {
    return NextResponse.json({ error: 'List not found or you are not the owner' }, { status: 404 })
  }

  // Generar nuevo código
  const newShareCode = Math.random().toString(36).substring(2, 8).toUpperCase()

  const { data: updatedList, error: updateError } = await supabase
    .from('shopping_lists')
    .update({ share_code: newShareCode })
    .eq('id', list_id)
    .select()
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({
    share_code: newShareCode,
    list: updatedList,
  })
}
