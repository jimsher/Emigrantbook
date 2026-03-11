// 1. სულ თავში (იმპორტები)
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

// 2. Firebase-ის ჩართვა (კონფიგურაცია)
firebase.initializeApp({
  apiKey: "AIzaSyDA1MD_juyLU26Nytxn7kzEcBkpVhS3rbk",
  projectId: "emigrantbook",
  appId: "1:138873748174:web:2d4422cdd62cd7e594ee9f"
});

const messaging = firebase.messaging();

// 3. შენი PWA ლოგიკა (Install, Activate, Fetch)
self.addEventListener('install', (e) => {
    console.log('SW Installed');
    self.skipWaiting();
});

// ... და ასე შემდეგ შენი კოდი ბოლომდე

















// 1. ინსტალაცია და მომენტალური გააქტიურება
self.addEventListener('install', (e) => {
    console.log('Service Worker: Installed ✅');
    self.skipWaiting(); // აიძულებს ახალ ვერსიას ეგრევე ჩაენაცვლოს ძველს
});

self.addEventListener('activate', (e) => {
    console.log('Service Worker: Activated 🚀');
    return self.clients.claim(); // ეგრევე იღებს კონტროლს ყველა ღია ტაბზე
});

// 2. ფეჩი (საჭიროა PWA სტატუსისთვის)
self.addEventListener('fetch', (e) => {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});

// 3. შეტყობინების მოსვლა (Push) - დაცული ვერსია
self.addEventListener('push', function(event) {
    let data = { title: 'Impact Store', body: 'ახალი შეტყობინება თქვენთვის! 🔔' };

    try {
        if (event.data) {
            // ვამოწმებთ, JSON-ია თუ უბრალო ტექსტი
            const payload = event.data.text();
            try {
                data = JSON.parse(payload);
            } catch (e) {
                data.body = payload; // თუ JSON არ არის, ტექსტად ჩავსვამთ
            }
        }
    } catch (err) {
        console.error("Push მონაცემების წაკითხვის შეცდომა:", err);
    }

    const options = {
        body: data.body,
        icon: '/logo.png',
        badge: '/logo.png',
        vibrate: [200, 100, 200],
        tag: 'order-update', // ერთნაირი მესიჯები რომ არ დაგროვდეს
        renotify: true,
        data: {
            url: data.url || '/' 
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// 4. მესიჯზე დაჭერის ლოგიკა
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(windowClients => {
            // თუ აპლიკაცია უკვე ღიაა, უბრალოდ მასზე გადავიდეს
            for (var i = 0; i < windowClients.length; i++) {
                var client = windowClients[i];
                if (client.url === event.notification.data.url && 'focus' in client) {
                    return client.focus();
                }
            }
            // თუ დაკეტილია, გახსნას ახალი ფანჯარა
            if (clients.openWindow) {
                return clients.openWindow(event.notification.data.url);
            }
        })
    );
});
