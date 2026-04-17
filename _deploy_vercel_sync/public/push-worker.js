// Push Notification Worker Script
// Handles push notification display and interaction

(function() {
  'use strict'

  // Register service worker
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('[Push Worker] Service Worker registered:', registration.scope)
          
          // Check for updates every hour
          setInterval(() => {
            registration.update()
          }, 60 * 60 * 1000)
        })
        .catch((error) => {
          console.error('[Push Worker] Service Worker registration failed:', error)
        })
    })

    // Handle service worker updates
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[Push Worker] Service Worker updated')
      window.location.reload()
    })
  }

  // Notification permission helper
  window.requestNotificationPermission = async function() {
    if (!('Notification' in window)) {
      console.warn('[Push Worker] Notifications not supported')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }

    return false
  }

  // Subscribe to push notifications
  window.subscribeToPush = async function(vapidPublicKey) {
    try {
      const registration = await navigator.serviceWorker.ready
      
      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription()
      
      if (!subscription) {
        // Request permission
        const hasPermission = await window.requestNotificationPermission()
        if (!hasPermission) {
          throw new Error('Notification permission denied')
        }

        // Subscribe
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        })
      }

      return subscription
    } catch (error) {
      console.error('[Push Worker] Subscribe error:', error)
      throw error
    }
  }

  // Unsubscribe from push notifications
  window.unsubscribeFromPush = async function() {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      
      if (subscription) {
        await subscription.unsubscribe()
        return true
      }
      
      return false
    } catch (error) {
      console.error('[Push Worker] Unsubscribe error:', error)
      throw error
    }
  }

  // Get current subscription
  window.getPushSubscription = async function() {
    try {
      const registration = await navigator.serviceWorker.ready
      return await registration.pushManager.getSubscription()
    } catch (error) {
      console.error('[Push Worker] Get subscription error:', error)
      return null
    }
  }

  // Show local notification (for testing)
  window.showLocalNotification = async function(title, options = {}) {
    try {
      const hasPermission = await window.requestNotificationPermission()
      if (!hasPermission) {
        throw new Error('Notification permission denied')
      }

      const registration = await navigator.serviceWorker.ready
      await registration.showNotification(title, {
        body: options.body || 'Notification body',
        icon: options.icon || '/icon-192x192.png',
        badge: options.badge || '/badge-72x72.png',
        image: options.image,
        tag: options.tag || 'local-notification',
        requireInteraction: options.requireInteraction || false,
        data: options.data || {},
        actions: options.actions || []
      })

      return true
    } catch (error) {
      console.error('[Push Worker] Show notification error:', error)
      throw error
    }
  }

  // Utility function
  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  console.log('[Push Worker] Push notification worker loaded')
})()
