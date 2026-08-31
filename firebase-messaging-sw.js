const CACHE_NAME = 'emigrantbook-cache-v5';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/logo2.png',
    '/supabase1.css'
];

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

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

function setBadgeNumber(count) {
    const num = parseInt(count) || 1;
    if (navigator.setAppBadge) {
        navigator.setAppBadge(num).catch(() => {});
    } else if (self.setAppBadge) {
        self.setAppBadge(num).catch(() => {});
    }
}

// 1. Firebase ფონური შეტყობინებები
messaging.onBackgroundMessage(function(payload) {
    const data = payload.data || {};
    const notification = payload.notification || {};

    const unreadCount = data.unread_count || data.badge || 1;
    setBadgeNumber(unreadCount);

    const title = notification.title || data.title || 'EmigrantBook';
    const body = notification.body || data.body || 'ახალი შეტყობინება!';
    const tag = data.tag || (data.type ? `eb-${data.type}` : 'eb-general');
    const targetUrl = data.url || (data.data && data.data.url) || '/';

    // მომხმარებლის ავატარი (თუ არ მოვიდა, ნაგულისხმევად გამოიყენებს საიტის ლოგოს)
    const userAvatar = notification.icon || data.avatar || data.senderAvatar || data.image || '/logo2.png';

    const options = {
        body: body,
        icon: userAvatar,
        badge: '/logo2.png',
        vibrate: [200, 100, 200],
        tag: tag,
        renotify: true,
        data: { url: targetUrl }
    };

    return self.registration.showNotification(title, options);
});

// 2. სტანდარტული Web Push
self.addEventListener('push', function(event) {
    let payload = {};
    if (event.data) {
        try {
            payload = event.data.json();
        } catch (e) {
            payload = { title: 'EmigrantBook', body: event.data.text() };
        }
    }

    const data = payload.data || payload;
    const notification = payload.notification || {};

    const unreadCount = data.unread_count || data.badge || 1;
    setBadgeNumber(unreadCount);

    const title = notification.title || data.title || 'EmigrantBook';
    const body = notification.body || data.body || 'ახალი შეტყობინება!';
    const targetUrl = data.url || (data.data && data.data.url) || '/';
    const tag = data.tag || (data.type ? `eb-${data.type}` : 'eb-general');

    // მომხმარებლის ავატარი (თუ არ მოვიდა, ნაგულისხმევად გამოიყენებს საიტის ლოგოს)
    const userAvatar = notification.icon || data.avatar || data.senderAvatar || data.image || '/logo2.png';

    const options = {
        body: body,
        icon: userAvatar,
        badge: '/logo2.png',
        vibrate: [200, 100, 200],
        tag: tag,
        renotify: true,
        data: { url: targetUrl }
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

// 3. ნოტიფიკაციაზე დაჭერა და ბეიჯის გასუფთავება
self.addEventListener('notificationclick', function(event) {
    event.notification.close();

    if (navigator.clearAppBadge) {
        navigator.clearAppBadge().catch(() => {});
    } else if (self.clearAppBadge) {
        self.clearAppBadge().catch(() => {});
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

// 4. ინსტალაცია
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
    );
});

// 5. გააქტიურება და ძველი ქეშის წაშლა
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

// 6. ქეშირება
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => response || fetch(event.request))
    );
});
