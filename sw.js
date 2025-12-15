// Service Worker - كافتيريا الخير
const CACHE_NAME = 'khairy-gold-v3.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;800;900&family=Tajawal:wght@300;400;500;700;800&display=swap',
  'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=800&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1571575173700-afb9492e6a50?w=800&h=600&fit=crop&q=80'
];

// Install Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ Cache opened');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Strategy: Cache First, then Network
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip Chrome extensions
  if (event.request.url.startsWith('chrome-extension://')) return;

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached response if found
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        // Make network request
        return fetch(fetchRequest).then(response => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Cache the new response
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(() => {
          // If network fails and no cache, show offline page
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('/index.html');
          }
        });
      })
  );
});

// Handle Background Sync
self.addEventListener('sync', event => {
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOrders());
  }
});

// Handle Push Notifications
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'لديك طلب جديد!',
    icon: 'https://cdn-icons-png.flaticon.com/512/3082/3082383.png',
    badge: 'https://cdn-icons-png.flaticon.com/512/3082/3082383.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'عرض الطلب',
        icon: 'https://cdn-icons-png.flaticon.com/512/3082/3082383.png'
      },
      {
        action: 'close',
        title: 'إغلاق',
        icon: 'https://cdn-icons-png.flaticon.com/512/3082/3082383.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('كافتيريا الخير 🏆', options)
  );
});

// Handle Notification Click
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Sync orders function
async function syncOrders() {
  try {
    const db = await openDB();
    const orders = await db.getAll('orders');
    
    for (const order of orders) {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(order)
      });

      if (response.ok) {
        await db.delete('orders', order.id);
      }
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
}
