'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface JoinClientProps {
  listId: string
  userName: string
  listName: string
}

export function JoinClient({ listId, userName, listName }: JoinClientProps) {
  const router = useRouter()

  useEffect(() => {
    const sendNotification = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return

        // Enviar notificación de que se unió a la lista
        await fetch('/api/notifications/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            listId,
            listName,
            action: 'collaborator_joined',
            actorName: userName,
            excludeUserId: user.id,
          }),
        })
      } catch (error) {
        console.error('Error sending join notification:', error)
      }

      // Redirigir a la lista
      router.push(`/lists/${listId}`)
    }

    sendNotification()
  }, [listId, userName, listName, router])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted">Uniéndote a la lista...</p>
      </div>
    </div>
  )
}
