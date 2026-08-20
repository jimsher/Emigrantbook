// js/firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging.js";

const firebaseConfig = {
    apiKey: "AIzaSyA6FGTJch13HCEGXeKEGDxGMEcqg3GPeb4",
    authDomain: "emigrantbook-4b7bd.firebaseapp.com",
    projectId: "emigrantbook-4b7bd",
    storageBucket: "emigrantbook-4b7bd.firebasestorage.app",
    messagingSenderId: "109907338554",
    appId: "1:109907338554:web:fde6c296d9ff56f6305c03",
    measurementId: "G-MRPP7G4H30"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Push ნებართვის მოთხოვნა და Token-ის აღება
export async function requestNotificationPermission() {
    try {
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
            // ვარეგისტრირებთ შენს არსებულ sw.js ფაილს
            const registration = await navigator.serviceWorker.register('/sw.js');
            
            // ვიღებთ მოწყობილობის FCM Token-ს
            const currentToken = await getToken(messaging, {
                serviceWorkerRegistration: registration
            });

            if (currentToken) {
                console.log('FCM Token მიღებულია:', currentToken);
                // აქ შეგიძლია ტოკენი შეინახო შენს ბაზაში/Supabase-ში
                return currentToken;
            } else {
                alert('ტოკენის გენერაცია ვერ მოხერხდა.');
            }
        } else {
            alert('შეტყობინებების ნებართვა დაბლოკილია.');
        }
    } catch (error) {
        console.error('Push შეცდომა:', error);
        alert('შეცდომა: ' + error.message);
    }
    return null;
}

// შეტყობინების მიღება მაშინ, როცა საიტი ღია გაქვს ეკრანზე
onMessage(messaging, (payload) => {
    navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(payload.notification.title || 'Emigrantbook', {
            body: payload.notification.body || 'ახალი შეტყობინება',
            icon: '/logo1.png',
            badge: '/logo1.png',
            data: { url: (payload.data && payload.data.url) ? payload.data.url : '/' }
        });
    });
});
