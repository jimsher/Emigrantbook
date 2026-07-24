// ქეშის ვერსია - ვცვლით v3-ზე, რომ ბრაუზერმა ძველი ქეში წაშალოს
const CACHE_NAME = 'emigrantbook-cache-v3';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/logo.png',
    '/supabase1.css'
];

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// განახლებული Firebase კონფიგურაცია (emigrantbook-4b7bd)
firebase.initializeApp({
    apiKey: "AIzaSyA6FGTJch13HCEGXeKEGDxGMEcqg3GPeb4",
    authDomain: "emigrantbook-4b7bd.firebaseapp.com",
    projectId: "emigrantbook-4b7bd",
    storageBucket: "emigrantbook-4b7bd.firebasestorage.app",
    messagingSenderId: "109907338554",
    appId: "1:109907338554:web:fde6c296d9ff56f6305c03",
    measurementId: "G-MRPP7G4H30"
});

const messaging = firebase.messaging();

// 1. Firebase ფონური შეტყობინებები
messaging.onBackgroundMessage(function(payload) {
    console.log('Firebase ფონური მესიჯი:', payload);

    if (self.setAppBadge) {
        self.setAppBadge(1).catch(e => {});
    }

    const notificationTitle = payload.notification ? payload.notification.title : 'Emigrantbook';
    const notificationOptions = {
        body: payload.notification ? payload.notification.body : 'ახალი შეტყობინება',
        icon: '/logo.png',
        badge: '/logo.png',
        vibrate: [200, 100, 200],
        tag: 'emigrantbook-msg', 
        renotify: true,
        data: { 
            url: (payload.data && payload.data.url) ? payload.data.url : '/' 
        }
    };
    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// 2. სტანდარტული Push
self.addEventListener('push', function(event) {
    if (self.setAppBadge) {
        self.setAppBadge(1).catch(e => {});
    }

    let data = {};
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data = { title: 'Emigrantbook', body: event.data.text() };
        }
    }

    const title = data.title || (data.notification ? data.notification.title : 'Emigrantbook');
    const options = {
        body: data.body || (data.notification ? data.notification.body : ''),
        icon: '/logo.png',
        badge: '/logo.png',
        data: { url: data.url || (data.data && data.data.url) || '/' }
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

// 3. ნოტიფიკაციაზე დაჭერის ლოგიკა
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    
    if (self.clearAppBadge) {
        self.clearAppBadge().catch(e => {});
    }

    const targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/';
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
            for (let client of windowClients) {
                if (client.url.includes(targetUrl) && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) return clients.openWindow(targetUrl);
        })
    );
});

// 4. სერვის ვორკერის ინსტალაცია და ქეშირება
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// 5. გააქტიურება და ძველი ქეშის წაშლა (წაშლის Impact-ის ძველ ქეშს)
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// 6. ფაილების მიწოდება ქეშიდან
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
