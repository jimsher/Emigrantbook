// --- TIKTOK STYLE LIVE LOGIC (FULL & RESTORED) ---
let liveClient = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
let liveTracks = { video: null, audio: null };
let currentLiveChannel = null;

function startLiveFunc() { toggleSideMenu(false); startLive(); }

async function startLive() {
    const appId = "7290502fac7f4feb82b021ccde79988a"; 
    const token = "007eJxTYChdECCsELPkzo+dN3sDZshXu8ktK5mjVTrB5N4k7hMNH9cqMJgbWRqYGhilJSabp5mkpSZZGCUZGBkmJ6ekmltaWlgk5ixek9kQyMjwvTCWiZEBAkF8boaczLLU+OKSotTEXAYGAGRLI14=";
    
    currentLiveChannel = "live_stream"; 
    document.getElementById('liveUI').style.display = 'flex';
    document.getElementById('liveHostName').innerText = myName;
    document.getElementById('liveHostAva').src = myPhoto;

    try {
        await liveClient.leave(); 
        await liveClient.setClientRole("host");
        await new Promise(resolve => setTimeout(resolve, 500)); 

        await liveClient.join(appId, currentLiveChannel, token, auth.currentUser.uid);
        
        liveTracks.audio = await AgoraRTC.createMicrophoneAudioTrack();
        liveTracks.video = await AgoraRTC.createCameraVideoTrack();
        
        liveTracks.video.play("remote-live-video");
        
        await new Promise(resolve => setTimeout(resolve, 500));
        await liveClient.publish([liveTracks.audio, liveTracks.video]);

        db.ref(`lives/${auth.currentUser.uid}`).set({ 
            hostId: auth.currentUser.uid, 
            hostName: myName, 
            hostPhoto: myPhoto, 
            channel: currentLiveChannel, 
            status: 'active', 
            ts: Date.now() 
        });

        listenToLiveChat(currentLiveChannel);
        // დამატებულია: მაყურებლების მოსმენა
        if (typeof listenToViewers === "function") listenToViewers(currentLiveChannel);
        
        console.log("Live started successfully ✅");
    } catch (e) { 
        console.error("Agora Error:", e);
    }
}

function listenToLiveChat(channel) {
    const chatBox = document.getElementById('liveChatBox');
    chatBox.innerHTML = "";
    db.ref(`live_chats/${channel}`).off(); 

    db.ref(`live_chats/${channel}`).on('child_added', snap => {
        const msg = snap.val();
        const div = document.createElement('div');
        if(msg.name === "SYSTEM") {
            div.style = "background:rgba(212,175,55,0.2); padding:8px 12px; border-radius:10px; margin-bottom:5px; border:1px solid var(--gold); text-align:center;";
            div.innerHTML = `<span style="color:var(--gold); font-size:13px; font-weight:bold;">${msg.text}</span>`;
        } else {
            // დამატებულია ავატარი კომენტარებში
            div.style = "display:flex; align-items:center; gap:8px; background:rgba(0,0,0,0.4); padding:6px 12px; border-radius:15px; margin-bottom:5px; width:fit-content; border-left:3px solid var(--gold);";
            div.innerHTML = `
                <img src="${msg.photo || 'https://ui-avatars.com/api/?name='+msg.name}" style="width:24px; height:24px; border-radius:50%; object-fit:cover;">
                <b style="color:var(--gold); font-size:11px;">${msg.name}:</b> 
                <span style="color:white; font-size:13px;">${msg.text}</span>`;
        }
        chatBox.appendChild(div);
        chatBox.scrollTop = chatBox.scrollHeight;
    });
}

function sendLiveComment() {
    const inp = document.getElementById('liveMsgInp');
    if(!inp.value.trim() || !currentLiveChannel) return;
    db.ref(`live_chats/${currentLiveChannel}`).push({ 
        name: myName, 
        photo: myPhoto, // ფოტოც იგზავნება
        text: inp.value, 
        ts: Date.now() 
    });
    inp.value = "";
}

async function endLive() {
    if (liveTracks.video) { liveTracks.video.stop(); liveTracks.video.close(); liveTracks.video = null; }
    if (liveTracks.audio) { liveTracks.audio.stop(); liveTracks.audio.close(); liveTracks.audio = null; }
    await liveClient.leave();
    document.getElementById('liveUI').style.display = 'none';
    if (currentLiveChannel === "live_stream" || currentLiveChannel === "live_" + auth.currentUser.uid) {
        db.ref(`lives/${auth.currentUser.uid}`).remove();
        db.ref(`live_chats/${currentLiveChannel}`).remove();
    }
    currentLiveChannel = null;
}

async function joinLive(hostUid, channelName) {
    const appId = "7290502fac7f4feb82b021ccde79988a"; 
    const token = "007eJxTYChdECCsELPkzo+dN3sDZshXu8ktK5mjVTrB5N4k7hMNH9cqMJgbWRqYGhilJSabp5mkpSZZGCUZGBkmJ6ekmltaWlgk5ixek9kQyMjwvTCWiZEBAkF8boaczLLU+OKSotTEXAYGAGRLI14=";
    currentLiveChannel = channelName;
    document.getElementById('liveUI').style.display = 'flex';
    document.getElementById('activeLivesModal').style.display = 'none';
    db.ref(`users/${hostUid}`).once('value', snap => {
        const host = snap.val();
        if(host) {
            document.getElementById('liveHostName').innerText = host.name;
            document.getElementById('liveHostAva').src = host.photo || "https://ui-avatars.com/api/?name=" + host.name;
        }
    });
    try {
        await liveClient.leave(); 
        await liveClient.setClientRole("audience");
        await liveClient.join(appId, channelName, token, auth.currentUser.uid);
        liveClient.on("user-published", async (user, mediaType) => {
            await liveClient.subscribe(user, mediaType);
            if (mediaType === "video") user.videoTrack.play("remote-live-video");
            if (mediaType === "audio") user.audioTrack.play();
        });
        listenToLiveChat(channelName);
        listenToViewers(channelName);
        db.ref(`live_chats/${channelName}`).push({ name: "SYSTEM", text: `👋 ${myName} შემოვიდა`, ts: Date.now() });
    } catch (e) { console.log(e); }
}

// --- შენი ეფექტების ფუნქციები (არაფერია შეცვლილი) ---
function sendLiveHeart() {
    const container = document.getElementById('live-video-container');
    if(!container) return;
    const heart = document.createElement('i');
    heart.className = "fas fa-heart"; 
    heart.style = `position:absolute; right:20px; bottom:150px; color:hsl(${Math.random()*360},100%,50%); font-size:24px; transition:all 1s ease-out; z-index:100; pointer-events:none;`;
    container.appendChild(heart);
    setTimeout(() => { 
        heart.style.bottom = "400px"; 
        heart.style.right = (Math.random()*100)+"px"; 
        heart.style.opacity = "0"; 
    }, 50);
    setTimeout(() => heart.remove(), 1000);
}

function toggleGiftPanel() { 
    const p = document.getElementById('giftPanel'); 
    p.style.display = p.style.display === 'none' ? 'block' : 'none'; 
}

function sendGift(emoji, price, giftName) {
    if (myAkho < price) { alert("ბალანსი!"); return; }
    const hostUid = currentLiveChannel.replace("live_", "");
    spendAkho(price, `Gift: ${giftName}`); 
    earnAkho(hostUid, price, `Gift: ${giftName}`);
    db.ref(`live_chats/${currentLiveChannel}`).push({ name: "SYSTEM", text: `🎁 ${myName}-მა გაჩუქა ${giftName}`, ts: Date.now() });
    showGiftAnimation(emoji); 
    toggleGiftPanel();
}

function showGiftAnimation(emoji) {
    const container = document.getElementById('live-video-container');
    if(!container) return;
    const giftEl = document.createElement('div');
    giftEl.style = "position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); font-size:100px; z-index:100001; animation:gift-pop-up 2s ease-out forwards; pointer-events:none;";
    giftEl.innerText = emoji; 
    container.appendChild(giftEl);
    setTimeout(() => giftEl.remove(), 2000);
}

// მაყურებლების მთვლელი
function listenToViewers(channel) {
    db.ref(`lives_meta/${channel}/viewers`).on('value', snap => {
        const count = snap.numChildren();
        const countEl = document.getElementById('vCount');
        if(countEl) countEl.innerText = count;
    });
}
// ... აქ გააგრძელე შენი listenToActiveLives და სქროლის ლოგიკა ...
