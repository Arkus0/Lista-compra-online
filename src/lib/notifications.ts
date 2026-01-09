// Utility para enviar notificaciones push
// Solo enviar cuando el usuario termina de interactuar (debounce)

type NotificationAction = 'item_added' | 'item_removed' | 'item_checked' | 'note_added'

interface PendingNotification {
  listId: string
  listName: string
  action: NotificationAction
  actorName: string
  itemName?: string
  excludeUserId?: string
}

// Debounce de 3 segundos para agrupar notificaciones
const DEBOUNCE_MS = 3000
const pendingNotifications: Map<string, NodeJS.Timeout> = new Map()

export async function sendPushNotification(
  notification: PendingNotification
): Promise<void> {
  const key = `${notification.listId}-${notification.action}`

  // Cancelar notificación pendiente si existe
  const existing = pendingNotifications.get(key)
  if (existing) {
    clearTimeout(existing)
  }

  // Programar nueva notificación con debounce
  const timeout = setTimeout(async () => {
    pendingNotifications.delete(key)

    try {
      await fetch('/api/notifications/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notification),
      })
    } catch (error) {
      console.error('Error sending push notification:', error)
    }
  }, DEBOUNCE_MS)

  pendingNotifications.set(key, timeout)
}

// Cancelar todas las notificaciones pendientes (útil al desmontar componente)
export function cancelPendingNotifications(): void {
  pendingNotifications.forEach((timeout) => clearTimeout(timeout))
  pendingNotifications.clear()
}
