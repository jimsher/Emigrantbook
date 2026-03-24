importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

firebase.initializeApp({
    apiKey: "AIzaSyDA1MD_juyLU26Nytxn7kzEcBkpVhS3rbk",
    projectId: "emigrantbook",
    appId: "1:138873748174:web:2d4422cdd62cd7e594ee9f"
});

const messaging = firebase.messaging();

// 1. Firebase ფონური შეტყობინებები
messaging.onBackgroundMessage(function(payload) {
    console.log('Firebase ფონური მესიჯი:', payload);

    // სერვის ვორკერში navigator.setAppBadge არ მუშაობს, ვიყენებთ self-ს
    if (self.setAppBadge) {
        self.setAppBadge(1).catch(e => {});
    }

    const notificationTitle = payload.notification ? payload.notification.title : 'Impact';
    const notificationOptions = {
        body: payload.notification ? payload.notification.body : 'ახალი შეტყობინება',
        icon: '/logo.png',
        badge: '/logo.png',
        vibrate: [200, 100, 200],
        tag: 'impact-msg', 
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
            data = { title: 'Impact', body: event.data.text() };
        }
    }

    const title = data.title || (data.notification ? data.notification.title : 'Impact');
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

// 4. სერვის ვორკერის მართვა
self.addEventListener('install', (e) => {
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(self.clients.claim());
});
