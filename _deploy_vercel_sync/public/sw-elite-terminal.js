/**
 * Service Worker - Elite Terminal Push Notifications
 * Handles background notifications with audio beeps
 */

self.addEventListener('install', (event) => {
  console.log('[SW] Elite Terminal Service Worker installed')
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('[SW] Elite Terminal Service Worker activated')
  event.waitUntil(self.clients.claim())
})

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received')

  if (!event.data) return

  try {
    const data = event.data.json()
    const { title, body, priority, audioFrequency } = data

    const options = {
      body,
      icon: '/icons/elite-terminal-icon.png',
      badge: '/icons/elite-badge.png',
      vibrate: getPriorityVibration(priority),
      tag: `elite-${priority}`,
      requireInteraction: priority === 'P10',
      data: {
        priority,
        audioFrequency: audioFrequency || 880,
        timestamp: Date.now(),
        url: '/admin-portal-v14-secure'
      }
    }

    event.waitUntil(
      self.registration.showNotification(title, options)
    )

    // Play audio beep (if browser supports)
    playNotificationBeep(audioFrequency || 880)
  } catch (error) {
    console.error('[SW] Push notification error:', error)
  }
})

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked')

  event.notification.close()

  const urlToOpen = event.notification.data?.url || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if window is already open
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus()
          }
        }
        // Open new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen)
        }
      })
  )
})

// Get vibration pattern based on priority
function getPriorityVibration(priority) {
  const patterns = {
    P10: [100, 50, 100, 50, 100, 50, 100], // Critical: Long pattern
    P9: [50, 50, 50, 50, 50], // Urgent: Medium pattern
    P8: [30, 30, 30], // High: Short pattern
    P7: [20] // Medium: Single vibration
  }
  return patterns[priority] || [20]
}

// Play audio beep (limited support in service workers)
function playNotificationBeep(frequency) {
  // Note: Audio playback in service workers is limited
  // This is a placeholder for future implementation
  console.log(`[SW] Audio beep requested: ${frequency} Hz`)
  
  // Attempt to send message to active clients to play audio
  self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    .then((clientList) => {
      clientList.forEach((client) => {
        client.postMessage({
          type: 'PLAY_AUDIO_BEEP',
          frequency
        })
      })
    })
}

// Handle messages from clients
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data)

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
