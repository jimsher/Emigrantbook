// --- EB-LIVE MASTER CONTROLLER ---
const agoraAppId = "7290502fac7f4feb82b021ccde79988a";
const agoraToken = "007eJxTYChdECCsELPkzo+dN3sDZshXu8ktK5mjVTrB5N4k7hMNH9cqMJgbWRqYGhilJSabp5mkpSZZGCUZGBkmJ6ekmltaWlgk5ixek9kQyMjwvTCWiZEBAkF8boaczLLU+OKSotTEXAYGAGRLI14=";

let clientEB = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
let tracksEB = { video: null, audio: null };
let activeChannel = null;

// 1. ლაივის დაწყება
async function initLiveBroadcast() {
    if (typeof toggleSideMenu === "function") toggleSideMenu(false); // მენიუს დახურვა
    
    activeChannel = "live_" + auth.currentUser.uid;
    
    // UI-ს მომზადება
    const liveWin = document.getElementById('liveUI');
    liveWin.style.display = 'block';
    document.getElementById('liveHostName').innerText = myName;
    document.getElementById('liveHostAva').src = myPhoto;

    try {
        await clientEB.setClientRole("host");
        await clientEB.join(agoraAppId, activeChannel, agoraToken, auth.currentUser.uid);
        
        tracksEB.audio = await AgoraRTC.createMicrophoneAudioTrack();
        tracksEB.video = await AgoraRTC.createCameraVideoTrack();
        
        // ვიდეოს გაშვება
        tracksEB.video.play("remote-live-video");
        await clientEB.publish([tracksEB.audio, tracksEB.video]);

        // Firebase რეგისტრაცია
        db.ref(`lives/${auth.currentUser.uid}`).set({
            hostId: auth.currentUser.uid,
            hostName: myName,
            hostPhoto: myPhoto,
            channel: activeChannel,
            status: 'active',
            ts: firebase.database.ServerValue.TIMESTAMP
        });

        startChatListener(activeChannel);
    } catch (err) {
        console.error("Live failed:", err);
        terminateLive();
    }
}

// 2. ჩატი (Real-time Firebase)
function startChatListener(channel) {
    const chatFeed = document.getElementById('liveChatBox');
    chatFeed.innerHTML = "";
    db.ref(`live_chats/${channel}`).off(); 
    
    db.ref(`live_chats/${channel}`).on('child_added', snap => {
        const data = snap.val();
        const msgDiv = document.createElement('div');
        msgDiv.style = "background:rgba(0,0,0,0.3); padding:7px 12px; border-radius:15px; color:#fff; font-size:13px; width:fit-content; border-left:3px solid #d4af37;";
        msgDiv.innerHTML = `<b style="color:#d4af37; font-size:11px;">${data.name}:</b> ${data.text}`;
        chatFeed.appendChild(msgDiv);
        chatFeed.scrollTop = chatFeed.scrollHeight;
    });
}

// 3. კომენტარის გაგზავნა
function postLiveComment() {
    const input = document.getElementById('liveMsgInp');
    if(!input.value.trim() || !activeChannel) return;
    db.ref(`live_chats/${activeChannel}`).push({ name: myName, text: input.value, ts: Date.now() });
    input.value = "";
}

// 4. საჩუქრების პანელი
function openGifts() { document.getElementById('giftPanel').classList.add('active'); }
function closeGifts() { document.getElementById('giftPanel').classList.remove('active'); }

// 5. საჩუქრის გაგზავნა (ბალანსის შემოწმებით)
function processGift(emoji, cost, name) {
    if (myAkho < cost) { alert("ბალანსი არ გაქვთ!"); return; }
    
    const hostUid = activeChannel.replace("live_", "");
    spendAkho(cost, `Gift: ${name}`);
    earnAkho(hostUid, cost, `Gift: ${name}`);
    
    db.ref(`live_chats/${activeChannel}`).push({ name: "SYSTEM", text: `🎁 ${myName}-მა გაჩუქა ${name}`, ts: Date.now() });
    closeGifts();
}

// 6. ლაივის დასრულება
async function terminateLive() {
    if (tracksEB.video) { tracksEB.video.stop(); tracksEB.video.close(); }
    if (tracksEB.audio) { tracksEB.audio.stop(); tracksEB.audio.close(); }
    await clientEB.leave();
    
    document.getElementById('liveUI').style.display = 'none';
    if (activeChannel && activeChannel.includes(auth.currentUser.uid)) {
        db.ref(`lives/${auth.currentUser.uid}`).remove();
    }
}
</script>
