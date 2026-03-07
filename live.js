// --- EB-LIVE CORE ENGINE ---
let liveClient = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
let liveTracks = { video: null, audio: null };
let currentLiveChannel = null;

// აგორას კონფიგურაცია
const AGORA_APP_ID = "7290502fac7f4feb82b021ccde79988a";
const AGORA_TOKEN = "007eJxTYChdECCsELPkzo+dN3sDZshXu8ktK5mjVTrB5N4k7hMNH9cqMJgbWRqYGhilJSabp5mkpSZZGCUZGBkmJ6ekmltaWlgk5ixek9kQyMjwvTCWiZEBAkF8boaczLLU+OKSotTEXAYGAGRLI14=";

// 1. ლაივის დაწყება (მენიუდან გამოსაძახებელი)
async function startLive() {
    if (typeof toggleSideMenu === "function") toggleSideMenu(false); // მენიუს დახურვა
    
    currentLiveChannel = "live_" + auth.currentUser.uid;
    
    // UI-ს მომზადება
    const ui = document.getElementById('liveUI');
    ui.style.display = 'block';
    document.getElementById('liveHostName').innerText = myName;
    document.getElementById('liveHostAva').src = myPhoto;

    try {
        await liveClient.setClientRole("host");
        await liveClient.join(AGORA_APP_ID, currentLiveChannel, AGORA_TOKEN, auth.currentUser.uid);
        
        liveTracks.audio = await AgoraRTC.createMicrophoneAudioTrack();
        liveTracks.video = await AgoraRTC.createCameraVideoTrack();
        
        // ვიდეოს გაშვება
        liveTracks.video.play("remote-live-video");
        await liveClient.publish([liveTracks.audio, liveTracks.video]);

        // Firebase-ში რეგისტრაცია
        db.ref(`lives/${auth.currentUser.uid}`).set({
            hostId: auth.currentUser.uid,
            hostName: myName,
            hostPhoto: myPhoto,
            channel: currentLiveChannel,
            status: 'active',
            ts: Date.now()
        });

        listenToLiveChat(currentLiveChannel);
    } catch (e) {
        console.error("ლაივი ვერ დაიწყო:", e);
        endLive();
    }
}

// 2. ჩატის მოსმენა
function listenToLiveChat(channel) {
    const chatBox = document.getElementById('liveChatBox');
    chatBox.innerHTML = "";
    db.ref(`live_chats/${channel}`).off(); // წინა კავშირის გაწყვეტა
    
    db.ref(`live_chats/${channel}`).on('child_added', snap => {
        const msg = snap.val();
        const div = document.createElement('div');
        
        if(msg.name === "SYSTEM") {
            div.style = "background:rgba(212,175,55,0.1); padding:6px 10px; border-radius:10px; margin-bottom:5px; color:#d4af37; font-size:12px; font-weight:bold; text-align:center;";
            div.innerText = msg.text;
        } else {
            div.style = "background:rgba(255,255,255,0.1); padding:8px 12px; border-radius:15px; margin-bottom:6px; width:fit-content; border-left:3px solid #d4af37;";
            div.innerHTML = `<b style="color:#d4af37; font-size:11px;">${msg.name}:</b> <span style="color:white; font-size:13px;">${msg.text}</span>`;
        }
        
        chatBox.appendChild(div);
        chatBox.scrollTop = chatBox.scrollHeight;
    });
}

// 3. კომენტარის გაგზავნა
function sendLiveComment() {
    const inp = document.getElementById('liveMsgInp');
    if(!inp.value.trim() || !currentLiveChannel) return;
    db.ref(`live_chats/${currentLiveChannel}`).push({ name: myName, text: inp.value, ts: Date.now() });
    inp.value = "";
}

// 4. საჩუქრების პანელის მართვა
function toggleGiftPanel() {
    document.getElementById('giftPanel').classList.toggle('active');
}

// 5. ლაივის დასრულება
async function endLive() {
    if (liveTracks.video) { liveTracks.video.stop(); liveTracks.video.close(); }
    if (liveTracks.audio) { liveTracks.audio.stop(); liveTracks.audio.close(); }
    await liveClient.leave();
    
    document.getElementById('liveUI').style.display = 'none';
    
    if (currentLiveChannel && currentLiveChannel.includes(auth.currentUser.uid)) {
        db.ref(`lives/${auth.currentUser.uid}`).remove();
        db.ref(`live_chats/${currentLiveChannel}`).remove();
    }
}
