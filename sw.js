// ქეშის ვერსია - განახლებულია v4-ზე, რომ ბრაუზერმა მომენტალურად განაახლოს SW
const CACHE_NAME = 'emigrantbook-cache-v4';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/logo1.png',
    '/supabase1.css'
];

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Firebase კონფიგურაცია (emigrantbook-4b7bd)
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

// დამხმარე ფუნქცია: აპლიკაციის აიკონზე წითელი ციფრის (ბეიჯის) დაყენება
function updateAppBadge(count) {
    const badgeNumber = parseInt(count) || 1;
    if (navigator.setAppBadge) {
        navigator.setAppBadge(badgeNumber).catch(() => {});
    } else if (self.setAppBadge) {
        self.setAppBadge(badgeNumber).catch(() => {});
    }
}

// 1. Firebase ფონური შეტყობინებები (მესიჯები, პოსტები, ჯგუფები)
messaging.onBackgroundMessage(function(payload) {
    console.log('Firebase შემოსული მესიჯი:', payload);

    const data = payload.data || {};
    const notification = payload.notification || {};

    // ბეიჯის რაოდენობის აღება (თუ სერვერი აგზავნის unread_count-ს)
    const unreadCount = data.unread_count || data.badge || 1;
    updateAppBadge(unreadCount);

    const notificationTitle = notification.title || data.title || 'EmigrantBook';
    const notificationBody = notification.body || data.body || 'ახალი შეტყობინება!';

    // ტეგის დინამიკური მინიჭება (რომ მესიჯმა პოსტის ნოთიფიკაცია არ წაშალოს)
    const notificationTag = data.tag || (data.type ? `eb-${data.type}` : 'eb-general');

    const notificationOptions = {
        body: notificationBody,
        icon: '/logo1.png',
        badge: '/logo1.png',
        vibrate: [200, 100, 200],
        tag: notificationTag,
        renotify: true,
        data: {
            url: data.url || '/'
        }
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// 2. სტანდარტული Web Push ივენთი
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
    updateAppBadge(unreadCount);

    const title = notification.title || data.title || 'EmigrantBook';
    const body = notification.body || data.body || 'ახალი სიახლე EmigrantBook-ზე';
    const targetUrl = data.url || (data.data && data.data.url) || '/';
    const notificationTag = data.tag || (data.type ? `eb-${data.type}` : 'eb-general');

    const options = {
        body: body,
        icon: '/logo1.png',
        badge: '/logo1.png',
        vibrate: [200, 100, 200],
        tag: notificationTag,
        renotify: true,
        data: { url: targetUrl }
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

// 3. ნოტიფიკაციაზე დაჭერის ლოგიკა (პირდაპირ იმ გვერდზე გადაყვანა)
self.addEventListener('notificationclick', function(event) {
    event.notification.close();

    // ბეიჯის გასუფთავება
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

// 4. სერვის ვორკერის ინსტალაცია
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// 5. გააქტიურება და ძველი ქეშის (v3) წაშლა
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

// 6. ქეშიდან ფაილების მიწოდება
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
