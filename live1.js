// --- კონფიგურაცია ---
// 1. Agora (ჩასვი შენი App ID)
const agoraAppId = "INSERT_YOUR_AGORA_APP_ID"; 
const channelName = "emigrantbook_battle_room";

// 2. Firebase (შენი ორიგინალი მონაცემები)
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
const storage = firebase.storage();

let agoraClient = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
let localTracks = { videoTrack: null, audioTrack: null };
let currentUser = null;
let currentBattleId = null;
let battleTimer = null; // ტაიმერის ცვლადი

// PK ქულების ლოგიკა
let scores = { host: 0, guest: 0 };

// --- 1. ავტორიზაცია და იუზერის ამოსაცნობი ---
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        document.getElementById('user-name').innerText = user.displayName || "Host";
        if (user.photoURL) document.getElementById('user-avatar').src = user.photoURL;
        
        // ავტომატურად ვიწყებთ ლაივს, როგორც Host
        startLiveStream();
    } else {
        window.location.href = "/login.html"; // თუ არაა შესული
    }
});

// --- 2. Agora ლაივის დაწყება ---
async function startLiveStream() {
    await agoraClient.setClientRole("host");
    await agoraClient.join(agoraAppId, channelName, null, currentUser.uid);
    
    localTracks.audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
    localTracks.videoTrack = await AgoraRTC.createCameraVideoTrack();
    
    // Tiktok style cropping (object-fit: cover) handled by CSS
    localTracks.videoTrack.play("local-player");
    await agoraClient.publish([localTracks.audioTrack, localTracks.videoTrack]);
    
    console.log("ლაივი დაიწყო!");
    
    // ვიწყებთ ბრძოლის ლოგიკის მოსმენას
    setupBattleSync();
}

// --- 3. PK ბრძოლის სინქრონიზაცია (Firebase) ---
function setupBattleSync() {
    // 3.1 მოსმენა ქულების ცვლილებაზე
    db.ref('live_battles/' + channelName + '/scores').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            scores.host = data.host || 0;
            scores.guest = data.guest || 0;
            updateScoreBar();
        }
    });

    // 3.2 მოსმენა სტუმრის შემოსვლაზე (Agora-ს მეშვეობით)
    agoraClient.on("user-published", async (user, mediaType) => {
        await agoraClient.subscribe(user, mediaType);
        if (mediaType === "video") {
            // Tiktok PK screen splitting handled by CSS (object-fit cover)
            user.videoTrack.play("remote-player");
        }
        if (mediaType === "audio") user.audioTrack.play();
    });

    // 3.3 მოსმენა ბრძოლის ტაიმერზე
    db.ref('live_battles/' + channelName + '/timer').on('value', (snapshot) => {
        const timeLeft = snapshot.val();
        if (timeLeft && timeLeft > 0) {
            console.log("ბრძოლის დასრულებამდე დარჩა: " + timeLeft);
            // აქ შეგიძლია ტაიმერი გამოაჩინო ეკრანზე
        }
    });
}

// --- 4. ქულების ბარის განახლება (Tiktok PK style) ---
function updateScoreBar() {
    const total = scores.host + scores.guest;
    let hostPercent = 50; // default
    if (total > 0) {
        hostPercent = (scores.host / total) * 100;
    }
    
    document.getElementById('score-blue-fill').style.width = hostPercent + '%';
    document.getElementById('score-pink-fill').style.width = (100 - hostPercent) + '%';
    document.getElementById('score-blue-text').innerText = scores.host;
    document.getElementById('score-pink-text').innerText = scores.guest;
}

// --- 5. საჩუქრების გაგზავნა (ბრძოლის ლოგიკა) ---
document.getElementById('gift-btn').onclick = () => {
    const panel = document.getElementById('gift-panel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
};

function sendGift(points, type) {
    if (!currentUser) return;
    
    // ქულის მომატება Firebase-ში ტრანზაქციით (უსაფრთხოებისთვის)
    const scoreRef = db.ref('live_battles/' + channelName + '/scores/host');
    scoreRef.transaction((currentScore) => {
        return (currentScore || 0) + points;
    });
    
    // ჩატში შეტყობინების გაგზავნა
    sendChatMessage(`🎁 აჩუქა ${type.toUpperCase()} (+${points})`);
    
    document.getElementById('gift-panel').style.display = 'none';
}

// --- 6. ჩატი და რეაქციები ---
document.getElementById('send-msg').onclick = () => {
    const input = document.getElementById('chat-input');
    if (input.value) {
        sendChatMessage(input.value);
        input.value = "";
    }
};

function sendChatMessage(text) {
    const msgData = {
        name: currentUser.displayName || "იუზერი",
        text: text,
        timestamp: Date.now()
    };
    db.ref('live_chats/' + channelName).push(msgData);
}

// ჩატის მოსმენა
db.ref('live_chats/' + channelName).limitToLast(10).on('child_added', (snapshot) => {
    const msg = snapshot.val();
    const list = document.getElementById('chat-list');
    const msgHtml = `<div class="chat-msg"><span class="user-name">${msg.name}:</span> ${msg.text}</div>`;
    list.insertAdjacentHTML('beforeend', msgHtml);
    list.scrollTop = list.scrollHeight; // Auto-scroll
});

// --- 7. გამოსვლა ---
document.getElementById('leave-btn').onclick = async () => {
    for (let trackName in localTracks) {
        let track = localTracks[trackName];
        if (track) {
            track.stop();
            track.close();
        }
    }
    await agoraClient.leave();
    window.location.href = "/"; // მთავარზე დაბრუნება
};

// PK ბრძოლის დაწყება (ტაიმერით)
document.getElementById('pk-btn').onclick = () => {
    const battleDuration = 300; // 5 წუთი
    db.ref('live_battles/' + channelName).set({
        status: "active",
        scores: { host: 0, guest: 0 },
        timer: battleDuration,
        timestamp: Date.now()
    });
    
    sendChatMessage("⚔️ PK ბრძოლა დაიწყო!");
    startBattleTimer(battleDuration);
};

// ბრძოლის ტაიმერის ფუნქცია
function startBattleTimer(duration) {
    let timeLeft = duration;
    clearInterval(battleTimer);
    battleTimer = setInterval(() => {
        timeLeft--;
        db.ref('live_battles/' + channelName + '/timer').set(timeLeft);
        if (timeLeft <= 0) {
            clearInterval(battleTimer);
            db.ref('live_battles/' + channelName).update({ status: "finished" });
            sendChatMessage("🏁 ბრძოლა დასრულდა!");
        }
    }, 1000);
}
