// --- EB PRO LIVE ENGINE ---
const EB_APP_ID = "7290502fac7f4feb82b021ccde79988a";
const EB_TOKEN = "007eJxTYChdECCsELPkzo+dN3sDZshXu8ktK5mjVTrB5N4k7hMNH9cqMJgbWRqYGhilJSabp5mkpSZZGCUZGBkmJ6ekmltaWlgk5ixek9kQyMjwvTCWiZEBAkF8boaczLLU+OKSotTEXAYGAGRLI14=";

let ebClient = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
let ebTracks = { video: null, audio: null };
let ebChannel = null;

// 1. ლაივის დაწყება
async function startLiveBroadcast() {
    console.log("Starting Live...");
    if (typeof toggleSideMenu === "function") toggleSideMenu(false);
    
    ebChannel = "live_" + auth.currentUser.uid;
    
    // UI-ს გამოჩენა
    const ui = document.getElementById('ebLiveMainUI');
    ui.style.display = 'block';
    document.getElementById('ebHostNameDisplay').innerText = myName;
    document.getElementById('ebHostAvatar').src = myPhoto;

    try {
        await ebClient.setClientRole("host");
        await ebClient.join(EB_APP_ID, ebChannel, EB_TOKEN, auth.currentUser.uid);
        
        ebTracks.audio = await AgoraRTC.createMicrophoneAudioTrack();
        ebTracks.video = await AgoraRTC.createCameraVideoTrack();
        
        // ვიდეოს გაშვება სწორ ID-ზე
        await ebTracks.video.play("ebRemoteVideo");
        await ebClient.publish([ebTracks.audio, ebTracks.video]);

        // Firebase-ში ჩაწერა
        db.ref(`lives/${auth.currentUser.uid}`).set({
            hostId: auth.currentUser.uid,
            hostName: myName,
            hostPhoto: myPhoto,
            channel: ebChannel,
            status: 'active',
            ts: firebase.database.ServerValue.TIMESTAMP
        });

        initEBChatListener(ebChannel);
    } catch (err) {
        console.error("Agora Join Failed:", err);
        stopLiveBroadcast();
    }
}

// 2. ჩატის მოსმენა
function initEBChatListener(channelId) {
    const feed = document.getElementById('ebLiveChatFeed');
    feed.innerHTML = "";
    db.ref(`live_chats/${channelId}`).on('child_added', snap => {
        const msg = snap.val();
        const div = document.createElement('div');
        div.className = "eb-msg-item";
        div.innerHTML = `<b style="color:#d4af37; font-size:11px;">${msg.name}:</b> ${msg.text}`;
        feed.appendChild(div);
        feed.scrollTop = feed.scrollHeight;
    });
}

// 3. კომენტარის გაგზავნა
function sendEBLiveComment() {
    const inp = document.getElementById('ebLiveMessageInput');
    if(!inp.value.trim() || !ebChannel) return;
    db.ref(`live_chats/${ebChannel}`).push({ name: myName, text: inp.value, ts: Date.now() });
    inp.value = "";
}

// 4. საჩუქრების პანელი
function toggleEBGiftPanel() { document.getElementById('ebGiftPanel').classList.toggle('active'); }

function processEBGift(emoji, price, name) {
    if (myAkho < price) { alert("ბალანსი არ გაქვთ!"); return; }
    const hostUid = ebChannel.replace("live_", "");
    spendAkho(price, `Gift: ${name}`);
    earnAkho(hostUid, price, `Gift: ${name}`);
    db.ref(`live_chats/${ebChannel}`).push({ name: "SYSTEM", text: `🎁 ${myName}-მა გაჩუქა ${name}`, ts: Date.now() });
    toggleEBGiftPanel();
}

// 5. ლაივის დასრულება
async function stopLiveBroadcast() {
    if (ebTracks.video) { ebTracks.video.stop(); ebTracks.video.close(); }
    if (ebTracks.audio) { ebTracks.audio.stop(); ebTracks.audio.close(); }
    await ebClient.leave();
    document.getElementById('ebLiveMainUI').style.display = 'none';
    if (ebChannel && ebChannel.includes(auth.currentUser.uid)) {
        db.ref(`lives/${auth.currentUser.uid}`).remove();
    }
}
