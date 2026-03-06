self.addEventListener('install', (e) => {
    console.log('Service Worker: Installed');
});

self.addEventListener('fetch', (e) => {
    // ეს საჭიროა რომ ბრაუზერმა PWA-დ ჩაგვთვალოს
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});








// შ3ტყობინ3ბის მოსვლა აპლიკაციაზე
self.addEventListener('push', function(event) {
    let data = { title: 'Impact Store', body: 'ახალი შეტყობინება!' };
    
    if (event.data) {
        data = event.data.json();
    }

    const options = {
        body: data.body,
        icon: '/logo.png', // შენი ლოგო
        badge: '/logo.png', // პატარა იკონკა ზედა ზოლისთვის
        vibrate: [200, 100, 200], // ტელეფონის ვიბრაცია
        data: {
            url: '/' // სად გადავიდეს დაჭერისას
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// როცა მომხმარებელი მესიჯს დააჭერს, აპლიკაცია გაიხსნას
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});
