// ვერსიის შეცვლით (v1 -> v2) აიძულებ განახლებას!
const CACHE_NAME = 'impact-cache-v2'; 
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/logo.png'
];

importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

firebase.initializeApp({
    apiKey: "AIzaSyDA1MD_juyLU26Nytxn7kzEcBkpVhS3rbk",
    projectId: "emigrantbook",
    appId: "1:138873748174:web:2d4422cdd62cd7e594ee9f"
});

const messaging = firebase.messaging();

// ინსტალაციისას ფაილების ქეშირება
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// აქტივაციისას ძველი ქეშის წაშლა (ეს გააშავებს ქვედა ზოლს!)
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('ძველი ქეში წაიშალა:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Firebase ფონური შეტყობინებები (დატოვე როგორც გაქვს)
messaging.onBackgroundMessage(function(payload) {
    const notificationTitle = payload.notification ? payload.notification.title : 'Impact';
    const notificationOptions = {
        body: payload.notification ? payload.notification.body : 'ახალი შეტყობინება',
        icon: '/logo.png',
        badge: '/logo.png',
        data: { url: (payload.data && payload.data.url) ? payload.data.url : '/' }
    };
    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Push და Notification Click ივენთები (დატოვე როგორც გაქვს ქვემოთ)
self.addEventListener('push', function(event) { /* შენი ძველი კოდი */ });
self.addEventListener('notificationclick', function(event) { /* შენი ძველი კოდი */ });
