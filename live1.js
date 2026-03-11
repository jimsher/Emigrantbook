// --- 1. Firebase კონფიგურაცია (შენი ორიგინალი მონაცემები) ---
const firebaseConfig = { 
  apiKey: "AIzaSyDA1MD_juyLU26Nytxn7kzEcBkpVhS3rbk", 
  authDomain: "emigrantbook.firebaseapp.com", 
  databaseURL: "https://emigrantbook-default-rtdb.europe-west1.firebasedatabase.app", 
  projectId: "emigrantbook", 
  storageBucket: "emigrantbook.firebasestorage.app",
  appId: "1:138873748174:web:2d4422cdd62cd7e594ee9f" 
};

// ინიციალიზაცია
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();
const auth = firebase.auth();

// --- 2. გლობალური ცვლადები ---
const agoraAppId = "ჯერ_ცარიელია"; // აქ მერე ჩაწერ
const channelName = "emigrantbook_battle_room";

let agoraClient = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
let localTracks = { videoTrack: null, audioTrack: null };
let currentUser = null;
let battleTimer = null;
let scores = { host: 0, guest: 0 };

// --- 3. ავტორიზაციის კონტროლი ---
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        document.getElementById('user-name').innerText = user.displayName || "Host";
        if (user.photoURL) document.getElementById('user-avatar').src = user.photoURL;
        console.log("სისტემაში ხართ!");
    } else {
        console.log("გთხოვთ გაიაროთ ავტორიზაცია");
    }
});

// --- 4. PK ბრძოლის ღილაკი (BATTLE START) ---
document.getElementById('pk-btn').onclick = () => {
    const duration = 300; // 5 წუთი
    const startTime = Date.now();

    // Firebase-ში ბრძოლის დაწყება
    db.ref('live_battles/' + channelName).set({
        status: "active",
        scores: { host: 0, guest: 0 },
        timer: duration,
        startTime: startTime
    });

    sendChatMessage("⚔️ ბრძოლა დაიწყო! გვიგულშემატკივრეთ!");
    startLocalTimer(duration);
};

// --- 5. საჩუქრების ღილაკი (GIFT LOGIC) ---
// ეს ფუნქცია პირდაპირ HTML-დანაც იმუშავებს: onclick="sendGift(100, 'Rose')"
window.sendGift = function(points, type) {
    if (!currentUser) return alert("გაიარეთ ავტორიზაცია საჩუქრისთვის");

    // ქულების მომატება ბაზაში ტრანზაქციით
    const scoreRef = db.ref('live_battles/' + channelName + '/scores/host');
    scoreRef.transaction((current) => (current || 0) + points);

    sendChatMessage(`🎁 აჩუქა ${type.toUpperCase()} (+${points})`);
    
    // საჩუქრების პანელის დახურვა
    document.getElementById('gift-panel').style.display = 'none';
};

// საჩუქრების პანელის გამოჩენა/დამალვა
document.getElementById('gift-btn').onclick = () => {
    const panel = document.getElementById('gift-panel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
};

// --- 6. ჩატის ღილაკი და შეტყობინებები ---
document.getElementById('send-msg').onclick = () => {
    const input = document.getElementById('chat-input');
    if (input.value.trim() !== "") {
        sendChatMessage(input.value);
        input.value = "";
    }
};

// Enter-ზე გაგზავნა
document.getElementById('chat-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && e.target.value.trim() !== "") {
        sendChatMessage(e.target.value);
        e.target.value = "";
    }
});

function sendChatMessage(text) {
    if (!currentUser) return;
    db.ref('live_chats/' + channelName).push({
        name: currentUser.displayName || "მომხმარებელი",
        text: text,
        timestamp: Date.now()
    });
}

// ჩატის რეალურ დროში მოსმენა
db.ref('live_chats/' + channelName).limitToLast(20).on('child_added', (snapshot) => {
    const msg = snapshot.val();
    const chatList = document.getElementById('chat-list');
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-msg';
    msgDiv.innerHTML = `<span class="user-name">${msg.name}:</span> ${msg.text}`;
    chatList.appendChild(msgDiv);
    chatList.scrollTop = chatList.scrollHeight;
});

// --- 7. ქულების და ბარის სინქრონიზაცია ---
db.ref('live_battles/' + channelName + '/scores').on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
        scores.host = data.host || 0;
        scores.guest = data.guest || 0;
        
        const total = scores.host + scores.guest;
        let hostPercent = 50;
        if (total > 0) hostPercent = (scores.host / total) * 100;

        document.getElementById('score-blue-fill').style.width = hostPercent + '%';
        document.getElementById('score-pink-fill').style.width = (100 - hostPercent) + '%';
        document.getElementById('score-blue-text').innerText = scores.host;
        document.getElementById('score-pink-text').innerText = scores.guest;
    }
});

// --- 8. ტაიმერის ფუნქცია ---
function startLocalTimer(duration) {
    let timeLeft = duration;
    clearInterval(battleTimer);
    battleTimer = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
            clearInterval(battleTimer);
            db.ref('live_battles/' + channelName).update({ status: "finished" });
            sendChatMessage("🏁 ბრძოლა დასრულდა!");
        }
    }, 1000);
}

// --- 9. გამოსვლის ღილაკი ---
document.getElementById('leave-btn').onclick = async () => {
    if (localTracks.videoTrack) {
        localTracks.videoTrack.stop();
        localTracks.videoTrack.close();
    }
    await agoraClient.leave();
    window.location.href = "/";
};
