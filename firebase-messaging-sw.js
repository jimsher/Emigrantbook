importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

firebase.initializeApp({
  apiKey: "AIzaSyDA1MD_juyLU26Nytxn7kzEcBkpVhS3rbk",
  projectId: "emigrantbook",
  messagingSenderId: "138873748174",
  appId: "1:138873748174:web:2d4422cdd62cd7e594ee9f"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const data = payload.data;
  let title = payload.notification.title;
  let options = {
    body: payload.notification.body,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    data: data // აქ ინახება ინფორმაცია, თუ სად გადაიყვანოს იუზერი დაჭერისას
  };

  // თუ მოდის ვიდეო ზარი, შეტყობინება სხვანაირი უნდა იყოს
  if (data.type === "video_call") {
    title = "📞 შემომავალი ვიდეო ზარი!";
    options.vibrate = [200, 100, 200, 100, 200, 100, 200]; // ტელეფონის ვიბრაცია
    options.tag = 'call-notification';
    options.renotify = true;
  }

  self.registration.showNotification(title, options);
});

// როცა იუზერი აჭერს შეტყობინებას
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data.url || '/'; // თუ ვიდეო ზარია, გადაიყვანს ზარის გვერდზე
  
  event.waitUntil(
    clients.openWindow(targetUrl)
  );
});
