import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import webpush from 'web-push'

// Configurar VAPID keys
// En producción, estas deben estar en variables de entorno
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    'mailto:admin@shoppyjuan.com',
    vapidPublicKey,
    vapidPrivateKey
  )
}

interface NotificationPayload {
  listId: string
  listName: string
  action: 'item_added' | 'item_removed' | 'item_checked' | 'note_added' | 'collaborator_joined'
  actorName: string
  itemName?: string
  excludeUserId?: string // Usuario que realizó la acción (no notificar)
}

export async function POST(request: NextRequest) {
  try {
    if (!vapidPublicKey || !vapidPrivateKey) {
      return NextResponse.json(
        { error: 'Push notifications not configured' },
        { status: 500 }
      )
    }

    const payload: NotificationPayload = await request.json()
    const { listId, listName, action, actorName, itemName, excludeUserId } = payload

    const supabase = await createClient()

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Obtener todos los colaboradores de la lista (excepto el actor)
    const { data: collaborators } = await supabase
      .from('list_collaborators')
      .select('user_id')
      .eq('list_id', listId)
      .neq('user_id', excludeUserId || '')

    // Obtener el owner de la lista
    const { data: listData } = await supabase
      .from('shopping_lists')
      .select('owner_id')
      .eq('id', listId)
      .single()

    if (!listData) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }

    // Combinar colaboradores y owner
    const userIds = new Set<string>()
    collaborators?.forEach(c => userIds.add(c.user_id))
    if (listData.owner_id !== excludeUserId) {
      userIds.add(listData.owner_id)
    }

    if (userIds.size === 0) {
      return NextResponse.json({ success: true, sent: 0 })
    }

    // Guardar notificaciones en la base de datos para todos los usuarios
    const notificationsToInsert = Array.from(userIds).map(userId => ({
      user_id: userId,
      list_id: listId,
      type: action,
      actor_id: excludeUserId || null,
      actor_name: actorName,
      list_name: listName,
      item_name: itemName || null,
    }))

    await supabase.from('notifications').insert(notificationsToInsert)

    // Obtener suscripciones push de estos usuarios
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', Array.from(userIds))

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ success: true, sent: 0 })
    }

    // Verificar preferencias de notificaciones
    const { data: preferences } = await supabase
      .from('notification_preferences')
      .select('*')
      .in('user_id', Array.from(userIds))

    const preferencesMap = new Map(preferences?.map(p => [p.user_id, p]) || [])

    // Construir mensaje según la acción
    let title = listName
    let body = ''

    switch (action) {
      case 'item_added':
        body = `${actorName} añadió "${itemName}" a la lista`
        break
      case 'item_removed':
        body = `${actorName} eliminó "${itemName}" de la lista`
        break
      case 'item_checked':
        body = `${actorName} marcó "${itemName}" como comprado`
        break
      case 'note_added':
        body = `${actorName} dejó una nota en la lista`
        break
      case 'collaborator_joined':
        body = `${actorName} se unió a la lista colaborativa`
        break
    }

    const notificationPayload = JSON.stringify({
      title,
      body,
      icon: '/icon.svg',
      badge: '/icon.svg',
      tag: `list-${listId}-${Date.now()}`,
      data: {
        listId,
        url: `/lists/${listId}`,
      },
    })

    // Enviar notificaciones
    const results = await Promise.allSettled(
      subscriptions
        .filter(sub => {
          // Verificar preferencias del usuario
          const prefs = preferencesMap.get(sub.user_id)
          if (!prefs) return true // Si no hay preferencias, enviar por defecto

          switch (action) {
            case 'item_added':
              return prefs.items_added
            case 'item_removed':
              return prefs.items_removed
            case 'item_checked':
              return prefs.items_checked
            case 'note_added':
              return prefs.notes_added
            default:
              return true
          }
        })
        .map(async (sub) => {
          try {
            await webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: {
                  p256dh: sub.p256dh,
                  auth: sub.auth,
                },
              },
              notificationPayload
            )
            return { success: true, userId: sub.user_id }
          } catch (error: unknown) {
            // Si la suscripción ya no es válida, eliminarla
            if (error && typeof error === 'object' && 'statusCode' in error) {
              const pushError = error as { statusCode: number }
              if (pushError.statusCode === 404 || pushError.statusCode === 410) {
                await supabase
                  .from('push_subscriptions')
                  .delete()
                  .eq('id', sub.id)
              }
            }
            return { success: false, userId: sub.user_id, error }
          }
        })
    )

    const sent = results.filter(
      (r) => r.status === 'fulfilled' && r.value.success
    ).length

    return NextResponse.json({ success: true, sent })
  } catch (error) {
    console.error('Error sending push notification:', error)
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    )
  }
}
