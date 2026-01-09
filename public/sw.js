// Service Worker para Push Notifications - ShoppyJuan

const CACHE_NAME = 'shoppyjuan-v1'

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker')
  self.skipWaiting()
})

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activated')
  event.waitUntil(self.clients.claim())
})

// Recibir notificación push
self.addEventListener('push', (event) => {
  console.log('[SW] Push received')

  let data = {
    title: 'ShoppyJuan',
    body: 'Tienes una actualización en tu lista',
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: 'shoppyjuan-notification',
    data: {}
  }

  if (event.data) {
    try {
      const payload = event.data.json()
      data = { ...data, ...payload }
    } catch (e) {
      data.body = event.data.text()
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon.svg',
    badge: data.badge || '/icon.svg',
    tag: data.tag,
    data: data.data,
    vibrate: [100, 50, 100],
    requireInteraction: false,
    actions: data.actions || []
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Click en notificación
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked')
  event.notification.close()

  const data = event.notification.data || {}
  let url = '/'

  // Si hay una URL específica en los datos, usarla
  if (data.url) {
    url = data.url
  } else if (data.listId) {
    url = `/lists/${data.listId}`
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Buscar si ya hay una ventana abierta
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(url)
            return client.focus()
          }
        }
        // Si no hay ventana abierta, abrir una nueva
        if (self.clients.openWindow) {
          return self.clients.openWindow(url)
        }
      })
  )
})

// Cerrar notificación
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed')
})
