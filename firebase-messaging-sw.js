importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyDA1MD_juyLU26Nytxn7kzEcBkpVhS3rbk",
    authDomain: "emigrantbook.firebaseapp.com",
    databaseURL: "https://emigrantbook-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "emigrantbook",
    appId: "1:138873748174:web:2d4422cdd62cd7e594ee9f"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// ეს ფუნქცია იჭერს შეტყობინებას, როცა ბრაუზერი ჩაკეტილია
messaging.onBackgroundMessage((payload) => {
    console.log('შეტყობინება ფონურ რეჟიმში:', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: 'https://emigrantbook.com/1000084015-removebg-preview.png',
        vibrate: [200, 100, 200],
        tag: 'video-call',
        data: { url: '/' }
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});
