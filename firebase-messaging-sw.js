importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// ახალი Firebase პროექტის კონფიგურაცია (emigrantbook-4b7bd)
firebase.initializeApp({
  apiKey: "AIzaSyA6FGTJch13HCEGXeKEGDxGMEcqg3GPeb4",
  authDomain: "emigrantbook-4b7bd.firebaseapp.com",
  projectId: "emigrantbook-4b7bd",
  storageBucket: "emigrantbook-4b7bd.firebasestorage.app",
  messagingSenderId: "109907338554",
  appId: "1:109907338554:web:fde6c296d9ff56f6305c03"
});

const messaging = firebase.messaging();

// ფონურ რეჟიმში შეტყობინების მიღება
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background payload:', payload);

  const data = payload.data || {};
  let title = (payload.notification && payload.notification.title) ? payload.notification.title : 'Emigrantbook';
  let bodyText = (payload.notification && payload.notification.body) ? payload.notification.body : 'ახალი შეტყობინება!';

  let options = {
    body: bodyText,
    icon: '/logo.png',
    badge: '/logo.png',
    data: data,
    vibrate: [200, 100, 200]
  };

  // თუ მოდის ვიდეო ზარი
  if (data.type === "video_call") {
    title = "📞 შემომავალი ვიდეო ზარი!";
    options.vibrate = [200, 100, 200, 100, 200, 100, 200];
    options.tag = 'call-notification';
    options.renotify = true;
  }

  self.registration.showNotification(title, options);
});

// როცა მომხმარებელი აჭერს შეტყობინების ბანერს
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // თუ ჩანართი უკვე ღიაა, უბრალოდ იმ ჩანართზე გადაიყვანოს
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      // თუ ღია არ არის, გახსნას ახალ ფანჯარაში
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
