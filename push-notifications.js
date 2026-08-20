// push-notifications.js
const PUBLIC_VAPID_KEY = 'შენი_PUBLIC_VAPID_KEY_აქ'; // შეცვალე შენი საჯარო გასაღებით

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export async function initPushNotifications() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push Notifications არ არის მხარდაჭერილი ამ ბრაუზერში.');
        return;
    }

    try {
        // 1. რეგისტრაცია
        const register = await navigator.serviceWorker.register('/sw.js', { scope: '/' });

        // 2. ნებართვის შემოწმება/მოთხოვნა
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.log('ნებართვა უარყოფილია');
            return;
        }

        // 3. გამოწერა Push სერვისზე
        let subscription = await register.pushManager.getSubscription();
        if (!subscription) {
            subscription = await register.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
            });
        }

        // 4. სერვერზე გაგზავნა ბაზაში შესანახად
        await saveSubscriptionToServer(subscription);

    } catch (error) {
        console.error('Push ინიციალიზაციის შეცდომა:', error);
    }
}

async function saveSubscriptionToServer(subscription) {
    await fetch('/api/save-subscription', { // შენი ბექენდ ენდპოინტი
        method: 'POST',
        body: JSON.stringify(subscription),
        headers: {
            'Content-Type': 'application/json'
        }
    });
}
