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
const agoraToken = "007eJxTYPB/MDWs88rPCInZChNLf+4RTfT/WCFRKRYpfL10H/+KM8sUGMyNLA1MDYzSEpPN00zSUpMsjJIMjAyTk1NSzS0tLSwS51ZuzGwIZGQ49uArKyMDBIL43Aw5mWWp8cUlRamJuQwMAIJjJCI="; 
const channelName = "live_stream";

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
        const userData = await getRealUser(user.uid);
        document.getElementById('user-name').innerText = userData.name;
        document.getElementById('user-avatar').src = userData.avatar;

        db.ref('live_sessions/' + channelName).once('value').then((snapshot) => {
            const session = snapshot.val();
            let label = "შემოუერთდა";
            if (!session || session.hostUid === user.uid) {
                label = "დაიწყო ლაივი 🎥";
                db.ref('live_sessions/' + channelName).set({
                    hostUid: user.uid,
                    hostName: userData.name,
                    startTime: Date.now()
                });
            }
            db.ref('live_chats/' + channelName).push({
                name: userData.name,
                type: "join",
                text: label,
                timestamp: Date.now()
            });
        });
        startLiveStream();
    } else {
        window.location.href = "/login.html";
    }
});

// --- 4. PK ბრძოლის ღილაკი ---
document.getElementById('pk-btn').onclick = () => {
    const duration = 300; 
    db.ref('live_battles/' + channelName).set({
        status: "active", scores: { host: 0, guest: 0 }, timer: duration, startTime: Date.now()
    });
    sendChatMessage("⚔️ ბრძოლა დაიწყო!");
    startLocalTimer(duration);
};

// --- 5. საჩუქრების ღილაკი ---
window.sendGift = async function(points, type) {
    if (!currentUser) return;
    const userData = await getRealUser(currentUser.uid);
    db.ref('live_battles/' + channelName + '/scores/host').transaction((c) => (c || 0) + points);
    db.ref('live_chats/' + channelName).push({
        name: userData.name, text: `🎁 აჩუქა ${type.toUpperCase()} (+${points})`, type: "gift", timestamp: Date.now()
    });
    document.getElementById('gift-panel').style.display = 'none';
};

document.getElementById('gift-btn').onclick = () => {
    const panel = document.getElementById('gift-panel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
};

// --- 6. ჩატი ---
document.getElementById('send-msg').onclick = async () => {
    const input = document.getElementById('chat-input');
    if (input.value.trim() !== "") { await sendChatMessage(input.value); input.value = ""; }
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
    db.ref('live_chats/' + channelName).push({ name: userData.name, text: text, timestamp: Date.now() });
}

db.ref('live_chats/' + channelName).limitToLast(20).on('child_added', (snapshot) => {
    const msg = snapshot.val();
    const chatList = document.getElementById('chat-list');
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-msg';
    if (msg.type === "join") msgDiv.innerHTML = `<span style="color: #ffcc00; font-weight: bold;">✨ ${msg.name}</span> ${msg.text || "შემოუერთდა"}`;
    else if (msg.type === "gift") msgDiv.innerHTML = `<span style="color: #ff00cc; font-weight: bold;">🎁 ${msg.name}:</span> ${msg.text}`;
    else msgDiv.innerHTML = `<span style="color: #00d2ff; font-weight: bold;">${msg.name}:</span> ${msg.text}`;
    chatList.appendChild(msgDiv);
    chatList.scrollTop = chatList.scrollHeight;
});

// --- 7. ქულების სინქრონიზაცია ---
db.ref('live_battles/' + channelName + '/scores').on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
        const total = (data.host || 0) + (data.guest || 0);
        let hostPercent = total > 0 ? (data.host / total) * 100 : 50;
        document.getElementById('score-blue-fill').style.width = hostPercent + '%';
        document.getElementById('score-pink-fill').style.width = (100 - hostPercent) + '%';
        document.getElementById('score-blue-text').innerText = data.host || 0;
        document.getElementById('score-pink-text').innerText = data.guest || 0;
    }
});

// --- 8. ტაიმერი ---
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

// --- 9. გამოსვლა ---
document.getElementById('leave-btn').onclick = async () => {
    if (localTracks.videoTrack) { localTracks.videoTrack.stop(); localTracks.videoTrack.close(); }
    if (currentUser) { db.ref('live_sessions/' + channelName).remove(); }
    await agoraClient.leave();
    window.location.href = "/";
};

// --- 10. Agora ჩართვა და ეკრანის გაყოფის მართვა ---
async function startLiveStream() {
    try {
        await agoraClient.setClientRole("host");
        await agoraClient.join(agoraAppId, channelName, agoraToken, currentUser.uid);
        
        localTracks.audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        localTracks.videoTrack = await AgoraRTC.createCameraVideoTrack();
        localTracks.videoTrack.play("local-player");
        await agoraClient.publish([localTracks.audioTrack, localTracks.videoTrack]);

        // სტუმრის შემოსვლის ავტომატური კონტროლი
        agoraClient.on("user-published", async (user, mediaType) => {
            await agoraClient.subscribe(user, mediaType);
            if (mediaType === "video") {
                // ვამატებთ CSS კლასს, რომ ეკრანი გაიყოს
                document.getElementById('video-container').classList.add('split-screen');
                user.videoTrack.play("remote-player");
            }
            if (mediaType === "audio") { user.audioTrack.play(); }
        });

        agoraClient.on("user-unpublished", () => {
            // ვაშორებთ კლასს, რომ ეკრანი ისევ გაერთიანდეს
            document.getElementById('video-container').classList.remove('split-screen');
        });

    } catch (e) { console.log("Agora error:", e); }
}
