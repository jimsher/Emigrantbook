self.addEventListener('install', (e) => {
    console.log('Service Worker: Installed');
});

self.addEventListener('fetch', (e) => {
    // ეს საჭიროა რომ ბრაუზერმა PWA-დ ჩაგვთვალოს
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});








// შ3ტყობინ3ბის მოსვლა აპლიკაციაზე
self.addEventListener('push', function(event) {
    const data = event.data ? event.data.json() : { title: 'Impact Token', body: 'ახალი სიახლე გაქვს!' };

    const options = {
        body: data.body,
        icon: '/logo.png', // შენი ლოგო
        badge: '/logo.png', // პატარა იკონკა ზედა ზოლისთვის
        vibrate: [100, 50, 100],
        data: {
            url: '/' // სად გადავიდეს დაჭერისას
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// შეტყობინებაზე დაჭერისას საიტის გახსნა
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});
