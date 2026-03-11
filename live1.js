// --- კონფიგურაცია ---
// 1. Agora (ჩასვი შენი App ID)
const agoraAppId = "INSERT_YOUR_AGORA_APP_ID"; 
const channelName = "emigrantbook_battle_room";

// 2. Firebase (ჩასვი შენი Config მონაცემები Firebase Console-დან)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "emigrantbook.firebaseapp.com",
    databaseURL: "https://emigrantbook-default-rtdb.firebaseio.com",
    projectId: "emigrantbook",
    storageBucket: "emigrantbook.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// ინიციალიზაცია
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();

let agoraClient = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
let localTracks = { videoTrack: null, audioTrack: null };
let currentUser = null;
let currentBattleId = null;

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
    
    // ქულის მომატება Firebase-ში (მაგალითად მასპინძელს ვჩუქნით)
    const newHostScore = scores.host + points;
    db.ref('live_battles/' + channelName + '/scores').update({ host: newHostScore });
    
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

// PK ბრძოლის დაწყების დემო (მაგალითად, ადმინი იწყებს)
document.getElementById('pk-btn').onclick = () => {
    db.ref('live_battles/' + channelName).set({
        status: "active",
        scores: { host: 0, guest: 0 },
        timestamp: Date.now()
    });
    sendChatMessage("⚔️ PK ბრძოლა დაიწყო!");
};
