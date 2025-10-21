// Enhanced Service Worker for Cloudflare Drop PWA with iOS Support
const CACHE_NAME = 'cloudflare-drop-v2'
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/web/main.tsx',
  '/logo.png',
  '/logo.svg',
  '/manifest.json',
  '/apple-touch-icon.png'
]

// iOS-specific cache strategies
const IOS_CACHE_FIRST_URLS = [
  '/manifest.json',
  '/apple-touch-icon.png',
  '/logo.png',
  '/logo.svg'
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets for iOS PWA')
        return cache.addAll(STATIC_CACHE_URLS)
      })
      .then(() => {
        console.log('Service Worker installed successfully')
        return self.skipWaiting()
      })
      .catch(error => {
        console.error('Service Worker installation failed:', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service Worker activated')
        return self.clients.claim()
      })
  )
})

// Enhanced fetch event with iOS-specific handling
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return
  }

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith('http')) {
    return
  }

  // Skip range requests (common on iOS)
  if (event.request.headers.get('range')) {
    return
  }

  // iOS-specific cache-first strategy for certain resources
  if (IOS_CACHE_FIRST_URLS.some(url => event.request.url.includes(url))) {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            return response
          }
          return fetch(event.request)
            .then(fetchResponse => {
              const responseToCache = fetchResponse.clone()
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache)
                })
              return fetchResponse
            })
        })
        .catch(() => {
          console.log('Network and cache failed for:', event.request.url)
        })
    )
    return
  }

  // Default network-first strategy
  event.respondWith(
    fetch(event.request)
      .then((fetchResponse) => {
        // Don't cache API responses or large files
        if (
          event.request.url.includes('/api/') ||
          event.request.url.includes('/files/') ||
          fetchResponse.status !== 200 ||
          !fetchResponse.headers.get('content-type')
        ) {
          return fetchResponse
        }

        // Clone the response
        const responseToCache = fetchResponse.clone()

        // Cache the response
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache)
          })

        return fetchResponse
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(event.request)
          .then(response => {
            if (response) {
              return response
            }
            // Return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/') || new Response('Offline', { status: 503 })
            }
          })
      })
  )
})

// iOS doesn't support background sync, so provide fallback
if (self.registration.sync) {
  self.addEventListener('sync', (event) => {
    if (event.tag === 'file-upload-sync') {
      event.waitUntil(
        console.log('Background sync triggered for file upload')
      )
    }
  })
}

// Enhanced push notifications for iOS
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()
    
    const options = {
      body: data.body || 'File sharing update',
      icon: '/apple-touch-icon.png',
      badge: '/apple-touch-icon.png',
      tag: 'file-notification',
      requireInteraction: false,
      vibrate: [200, 100, 200], // iOS supports basic vibration
      actions: [
        {
          action: 'view',
          title: 'View',
          icon: '/apple-touch-icon.png'
        }
      ]
    }

    event.waitUntil(
      self.registration.showNotification(data.title || 'Cloudflare Drop', options)
    )
  }
})

// Enhanced notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const urlToOpen = event.action === 'view' ? '/' : '/'

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function(clientList) {
      // Check if app is already open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i]
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus()
        }
      }
      // If not open, open new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})

// iOS-specific message handling
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
