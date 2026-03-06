self.addEventListener('install', (e) => {
    console.log('Service Worker: Installed');
});

self.addEventListener('fetch', (e) => {
    // ეს საჭიროა რომ ბრაუზერმა PWA-დ ჩაგვთვალოს
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
