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
const agoraAppId = "7290502fac7f4feb82b021ccde79988a"; 
const agoraToken = "აქ_ჩასვი_შენი_ტოკენი"; // <-- ჩაწერე აგორას კონსოლიდან აღებული ტოკენი აქ
const channelName = "emigrantbook_battle_room";

let agoraClient = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
let localTracks = { videoTrack: null, audioTrack: null };
let currentUser = null;
let battleTimer = null;
let scores = { host: 0, guest: 0 };

// --- დამხმარე ფუნქცია: რეალური იუზერის ამოცნობა ბაზიდან ---
async function getRealUser(uid) {
    const snap = await db.ref('users/' + uid).once('value');
    const data = snap.val();
    return {
        name: data?.username || auth.currentUser.displayName || "სტუმარი",
        avatar: data?.profilePic || auth.currentUser.photoURL || "https://emigrantbook.com/default-avatar.png"
    };
}

// --- 3. ავტორიზაციის კონტროლი ---
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        
        // ვიღებთ რეალურ მონაცემებს
        const userData = await getRealUser(user.uid);

        // UI-ს განახლება (ავატარი და სახელი ზემოთ)
        document.getElementById('user-name').innerText = userData.name;
        document.getElementById('user-avatar').src = userData.avatar;

        // TikTok სტილის "შემოუერთდა" შეტყობინება
        db.ref('live_chats/' + channelName).push({
            name: userData.name,
            type: "join",
            timestamp: Date.now()
        });

        console.log("სისტემაშია რეალური მომხმარებელი: " + user.uid);
        startLiveStream();
    } else {
        window.location.href = "/login.html";
    }
});

// --- 4. PK ბრძოლის ღილაკი (BATTLE START) ---
document.getElementById('pk-btn').onclick = () => {
    const duration = 300; 
    const startTime = Date.now();

    db.ref('live_battles/' + channelName).set({
        status: "active",
        scores: { host: 0, guest: 0 },
        timer: duration,
        startTime: startTime
    });

    sendChatMessage("⚔️ ბრძოლა დაიწყო!");
    startLocalTimer(duration);
};

// --- 5. საჩუქრების ღილაკი (GIFT LOGIC) ---
window.sendGift = async function(points, type) {
    if (!currentUser) return;
    const userData = await getRealUser(currentUser.uid);
    
    const scoreRef = db.ref('live_battles/' + channelName + '/scores/host');
    scoreRef.transaction((current) => (current || 0) + points);

    db.ref('live_chats/' + channelName).push({
        name: userData.name,
        text: `🎁 აჩუქა ${type.toUpperCase()} (+${points})`,
        type: "gift",
        timestamp: Date.now()
    });
    
    document.getElementById('gift-panel').style.display = 'none';
};

document.getElementById('gift-btn').onclick = () => {
    const panel = document.getElementById('gift-panel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
};

// --- 6. ჩატის ღილაკი და შეტყობინებები ---
document.getElementById('send-msg').onclick = async () => {
    const input = document.getElementById('chat-input');
    if (input.value.trim() !== "") {
        await sendChatMessage(input.value);
        input.value = "";
    }
};

document.getElementById('chat-input').addEventListener('keypress', async (e) => {
    if (e.key === 'Enter' && e.target.value.trim() !== "") {
        await sendChatMessage(e.target.value);
        e.target.value = "";
    }
});

async function sendChatMessage(text) {
    if (!currentUser) return;
    const userData = await getRealUser(currentUser.uid);
    db.ref('live_chats/' + channelName).push({
        name: userData.name,
        text: text,
        timestamp: Date.now()
    });
}

// ჩატის რეალურ დროში მოსმენა (TikTok დიზაინით)
db.ref('live_chats/' + channelName).limitToLast(20).on('child_added', (snapshot) => {
    const msg = snapshot.val();
    const chatList = document.getElementById('chat-list');
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-msg';

    if (msg.type === "join") {
        msgDiv.innerHTML = `<span style="color: #ffcc00; font-weight: bold;">✨ ${msg.name}</span> შემოუერთდა`;
    } else if (msg.type === "gift") {
        msgDiv.innerHTML = `<span style="color: #ff00cc; font-weight: bold;">🎁 ${msg.name}:</span> ${msg.text}`;
    } else {
        msgDiv.innerHTML = `<span style="color: #00d2ff; font-weight: bold;">${msg.name}:</span> ${msg.text}`;
    }

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

// --- 10. Agora-ს ჩართვა (ტოკენის მხარდაჭერით) ---
async function startLiveStream() {
    try {
        await agoraClient.setClientRole("host");
        // აქ დავამატეთ agoraToken - null-ის ნაცვლად
        await agoraClient.join(agoraAppId, channelName, agoraToken, currentUser.uid);
        
        localTracks.audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        localTracks.videoTrack = await AgoraRTC.createCameraVideoTrack();
        
        localTracks.videoTrack.play("local-player");
        await agoraClient.publish([localTracks.audioTrack, localTracks.videoTrack]);
        
        console.log("ლაივი წარმატებით დაიწყო ტოკენით!");
    } catch (e) { 
        console.log("Agora error:", e); 
        alert("ლაივი ვერ დაიწყო. შეამოწმე ტოკენი ან კამერის ნებართვა.");
    }
}
