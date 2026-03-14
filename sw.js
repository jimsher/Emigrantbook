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
    const notificationTitle = payload.notification.title || 'Impact';
    const notificationOptions = {
        body: payload.notification.body,
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

// 2. სტანდარტული Push (სარეზერვო, თუ Firebase-ის გარეთ მოდის რამე)
self.addEventListener('push', function(event) {
    if (event.data) {
        try {
            const data = event.data.json();
            const options = {
                body: data.body || data.notification?.body,
                icon: '/logo.png',
                badge: '/logo.png',
                data: { url: data.url || (data.data && data.data.url) || '/' }
            };
            event.waitUntil(self.registration.showNotification(data.title || 'Impact', options));
        } catch (e) {
            // თუ JSON არ არის, ტექსტად გამოვიტანოთ
            event.waitUntil(self.registration.showNotification('Impact', { body: event.data.text() }));
        }
    }
});

// 3. ნოტიფიკაციაზე დაჭერის ერთიანი ლოგიკა
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    const targetUrl = event.notification.data.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
            // თუ საიტი უკვე ღიაა, უბრალოდ ფოკუსი მოახდინოს
            for (let client of windowClients) {
                if (client.url.includes(targetUrl) && 'focus' in client) {
                    return client.focus();
                }
            }
            // თუ დაკეტილია, გახსნას ახალი
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
