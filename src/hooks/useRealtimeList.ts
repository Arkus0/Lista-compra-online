'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { RealtimeChannel, RealtimePresenceState } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { ListItem, Profile, PresenceState, ListNote } from '@/lib/supabase/types'
import { useItemsActions } from '@/store/useStore'

interface UseRealtimeListOptions {
  listId: string
  user: Profile | null
  onNoteChange?: (payload: { eventType: string; note: ListNote }) => void
}

interface UseRealtimeListReturn {
  presenceUsers: PresenceState[]
  isConnected: boolean
}

export function useRealtimeList({
  listId,
  user,
  onNoteChange,
}: UseRealtimeListOptions): UseRealtimeListReturn {
  const [presenceUsers, setPresenceUsers] = useState<PresenceState[]>([])
  const [isConnected, setIsConnected] = useState(false)

  const supabaseRef = useRef(createClient())
  const channelRef = useRef<RealtimeChannel | null>(null)

  const { addItem, updateItem, removeItem } = useItemsActions()

  // Sincronizar presencia cuando cambia el estado
  const syncPresence = useCallback((state: RealtimePresenceState<PresenceState>) => {
    const users: PresenceState[] = []

    Object.values(state).forEach((presences) => {
      presences.forEach((presence) => {
        // Evitar duplicados y excluir al usuario actual
        if (presence.id !== user?.id && !users.find(u => u.id === presence.id)) {
          users.push(presence as PresenceState)
        }
      })
    })

    setPresenceUsers(users)
  }, [user?.id])

  useEffect(() => {
    if (!listId || !user) return

    const supabase = supabaseRef.current

    // Crear canal único para esta lista
    const channel = supabase.channel(`list-realtime-${listId}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    })

    // Suscribirse a cambios en items
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'list_items',
        filter: `list_id=eq.${listId}`,
      },
      (payload) => {
        switch (payload.eventType) {
          case 'INSERT':
            // Solo añadir si no es un item que nosotros creamos
            const newItem = payload.new as ListItem
            if (newItem.added_by !== user.id) {
              addItem(newItem)
            }
            break
          case 'UPDATE':
            updateItem(payload.new.id, payload.new as Partial<ListItem>)
            break
          case 'DELETE':
            removeItem(payload.old.id)
            break
        }
      }
    )

    // Suscribirse a cambios en notas
    if (onNoteChange) {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'list_notes',
          filter: `list_id=eq.${listId}`,
        },
        (payload) => {
          onNoteChange({
            eventType: payload.eventType,
            note: (payload.eventType === 'DELETE' ? payload.old : payload.new) as ListNote,
          })
        }
      )
    }

    // Configurar presence
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresenceState>()
        syncPresence(state)
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        // Usuario se unió
        console.log('User joined:', newPresences)
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        // Usuario se fue
        console.log('User left:', leftPresences)
      })

    // Suscribirse y trackear presencia
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setIsConnected(true)

        // Enviar nuestra presencia
        await channel.track({
          id: user.id,
          email: user.email,
          name: user.name,
          avatar_url: user.avatar_url,
          online_at: new Date().toISOString(),
        })
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        setIsConnected(false)
      }
    })

    channelRef.current = channel

    // Cleanup
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe()
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      setIsConnected(false)
      setPresenceUsers([])
    }
  }, [listId, user, addItem, updateItem, removeItem, syncPresence, onNoteChange])

  return {
    presenceUsers,
    isConnected,
  }
}
