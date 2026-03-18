// --- TIKTOK STYLE LIVE LOGIC (ORIGINAL + ALL ENHANCEMENTS) ---
let liveClient = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
let liveTracks = { video: null, audio: null, guestAudio: null, guestVideo: null };
let currentLiveChannel = null;

function startLiveFunc() { toggleSideMenu(false); startLive(); }

async function startLive() {
    const appId = "7290502fac7f4feb82b021ccde79988a"; 
    const token = "007eJxTYND7Vv9skqb6pJtskQsWqz0L/uaxTsjSO0Ttb7zkzh+9M1oUGMyNLA1MDYzSEpPN00zSUpMsjJIMjAyTk1NSzS0tLSwSTYx3ZzYEMjKIHl3AzMgAgSA+N0NOZllqfHFJUWpiLgMDADHQIjI=";
    
    currentLiveChannel = "live_stream"; 
    
    document.getElementById('liveUI').style.display = 'flex';
    document.getElementById('liveHostName').innerText = myName;
    document.getElementById('liveHostAva').src = myPhoto;

    try {
        await liveClient.leave(); 
        await liveClient.setClientRole("host");
        await new Promise(resolve => setTimeout(resolve, 500)); 

        await liveClient.join(appId, currentLiveChannel, token, auth.currentUser.uid);

        liveClient.on("user-published", async (user, mediaType) => {
            await liveClient.subscribe(user, mediaType);
            if (mediaType === "video") {
                const singleZone = document.getElementById('single-screen-zone');
                const splitZone = document.getElementById('split-screen-zone');
                if(singleZone && splitZone) {
                    singleZone.style.width = '50%';
                    splitZone.style.display = 'block';
                    splitZone.style.width = '50%';
                }
                user.videoTrack.play("guest-remote-video");
            }
            if (mediaType === "audio") user.audioTrack.play();
        });
        
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
        updateViewerCount(currentLiveChannel, 'join');
        listenToViewers(currentLiveChannel);
        listenToLikes(currentLiveChannel);
        listenForRequests(currentLiveChannel);
        listenToGifts(currentLiveChannel); // 👈 აი ეს აკლდა, რომ საჩუქრები გამოჩენილიყო

        console.log("Live started successfully ✅");
    } catch (e) { 
        console.error("Agora Error:", e);
        alert("შეცდომა ლაივის დაწყებისას: " + e.message);
    }
}

// --- ჩატის ლოგიკა (ავატარებით) ---
function listenToLiveChat(channel) {
    const chatBox = document.getElementById('liveChatBox');
    if(!chatBox) return;
    chatBox.innerHTML = "";
    db.ref(`live_chats/${channel}`).off(); 
    db.ref(`live_chats/${channel}`).on('child_added', snap => {
        const msg = snap.val();
        const div = document.createElement('div');
        if(msg.name === "SYSTEM") {
            div.style = "background:rgba(212,175,55,0.2); padding:8px 12px; border-radius:10px; margin-bottom:5px; border:1px solid var(--gold); text-align:center;";
            div.innerHTML = `<span style="color:var(--gold); font-size:13px; font-weight:bold;">${msg.text}</span>`;
        } else {
            div.style = "display:flex; align-items:flex-start; gap:8px; margin-bottom:6px; background:rgba(0,0,0,0.4); padding:6px 12px; border-radius:15px; width:fit-content; border-left:3px solid var(--gold);";
            div.innerHTML = `
                <img src="${msg.photo || 'https://ui-avatars.com/api/?name='+msg.name}" style="width:28px; height:28px; border-radius:50%; border:1px solid rgba(255,255,255,0.2);">
                <div>
                    <b style="color:var(--gold); font-size:11px; display:block;">${msg.name}</b>
                    <span style="color:white; font-size:13px;">${msg.text}</span>
                </div>`;
        }
        chatBox.appendChild(div);
        chatBox.scrollTop = chatBox.scrollHeight;
    });
}

function sendLiveComment() {
    const inp = document.getElementById('liveMsgInp');
    if(!inp || !inp.value.trim() || !currentLiveChannel) return;
    db.ref(`live_chats/${currentLiveChannel}`).push({ 
        name: myName, 
        photo: myPhoto, 
        text: inp.value, 
        ts: Date.now() 
    });
    inp.value = "";
}

// --- მაყურებლების მთვლელი ---
function updateViewerCount(channel, action) {
    if(!auth.currentUser) return;
    const vRef = db.ref(`lives_meta/${channel}/viewers/${auth.currentUser.uid}`);
    if(action === 'join') {
        vRef.set({ name: myName, photo: myPhoto });
    } else {
        vRef.remove();
    }
}

function listenToViewers(channel) {
    db.ref(`lives_meta/${channel}/viewers`).on('value', snap => {
        const viewers = snap.val() || {};
        const count = Object.keys(viewers).length;
        const countEl = document.getElementById('vCount');
        if(countEl) countEl.innerText = count;

        const avDiv = document.getElementById('viewerAvatars');
        if(avDiv) {
            avDiv.innerHTML = "";
            Object.values(viewers).slice(-3).forEach(v => {
                avDiv.innerHTML += `<img src="${v.photo}" style="width:24px; height:24px; border-radius:50%; border:1px solid white; margin-left:-8px; background:#000;">`;
            });
        }
    });
}

// --- ლაივის დასრულება ---
async function endLive() {
    if(currentLiveChannel) updateViewerCount(currentLiveChannel, 'leave');
    if (liveTracks.video) { liveTracks.video.stop(); liveTracks.video.close(); liveTracks.video = null; }
    if (liveTracks.audio) { liveTracks.audio.stop(); liveTracks.audio.close(); liveTracks.audio = null; }
    await liveClient.leave();
    document.getElementById('liveUI').style.display = 'none';
    if (currentLiveChannel === "live_stream" || currentLiveChannel === "live_" + auth.currentUser.uid) {
        db.ref(`lives/${auth.currentUser.uid}`).remove();
        db.ref(`live_chats/${currentLiveChannel}`).remove();
        db.ref(`lives_meta/${currentLiveChannel}`).remove();
        db.ref(`live_gifts/${currentLiveChannel}`).remove(); // ვასუფთავებთ საჩუქრებსაც
    }
    currentLiveChannel = null;
}

// --- ლაივში შეერთება ---
async function joinLive(hostUid, channelName) {
    const appId = "7290502fac7f4feb82b021ccde79988a"; 
    const token = "007eJxTYFDJP/duoW3yN8XylY8bWr7rbXTL+KSruK1XPTwjWp/d+IgCg7mRpYGpgVFaYrJ5mklaapKFUZKBkWFyckqquaWlhUXi+etrMxsCGRnOPk1nZGSAQBCfmyEnsyw1vrikKDUxl4EBAF9gI4E=";
    currentLiveChannel = channelName;
    
    document.getElementById('liveUI').style.display = 'flex';
    const reqBtn = document.getElementById('requestJoinBtn');
    if(reqBtn) reqBtn.style.display = 'block';

    db.ref(`lives/${hostUid}`).on('value', snap => {
        if (!snap.exists()) showLiveEndedUI();
    });

    try {
        await liveClient.leave(); 
        await liveClient.setClientRole("audience");
        await liveClient.join(appId, channelName, token, auth.currentUser.uid);
        
        updateViewerCount(channelName, 'join');
        listenToViewers(channelName);
        listenToLikes(channelName);
        listenToGifts(channelName); // 👈 მაყურებელსაც უნდა ჰქონდეს ჩართული საჩუქრების ხილვა
        listenForResponse(channelName);
        listenToLiveChat(channelName);

        liveClient.on("user-published", async (user, mediaType) => {
            await liveClient.subscribe(user, mediaType);
            if (mediaType === "video") {
                if (user.uid !== hostUid) {
                    const singleZone = document.getElementById('single-screen-zone');
                    const splitZone = document.getElementById('split-screen-zone');
                    if(singleZone && splitZone) {
                        singleZone.style.width = '50%';
                        splitZone.style.display = 'block';
                        splitZone.style.width = '50%';
                    }
                    user.videoTrack.play("guest-remote-video");
                } else {
                    user.videoTrack.play("remote-live-video");
                }
            }
            if (mediaType === "audio") user.audioTrack.play();
        });
    } catch (e) { console.log(e); }
}

function showLiveEndedUI() {
    if (currentLiveChannel) db.ref(`lives_meta/${currentLiveChannel}/viewers`).off();
    const chatBox = document.getElementById('liveChatBox');
    if (chatBox) {
        const div = document.createElement('div');
        div.style = "background:rgba(255,0,0,0.6); padding:10px; border-radius:12px; margin-bottom:10px; color:white; text-align:center; font-weight:bold;";
        div.innerHTML = "⚠️ ჰოსტმა დაასრულა ლაივი";
        chatBox.appendChild(div);
        chatBox.scrollTop = chatBox.scrollHeight;
    }
    setTimeout(() => { endLive(); }, 2500);
}

// --- ტიკ-ტოკ ეფექტები (გულები) ---
function sendLiveHeart() {
    if(!currentLiveChannel || !auth.currentUser) return;
    animateHeart();
    db.ref(`lives_meta/${currentLiveChannel}/likes`).transaction(c => (c || 0) + 1);
}

function animateHeart() {
    const container = document.getElementById('live-video-container');
    if(!container) return;
    const heart = document.createElement('i');
    heart.className = "fas fa-heart"; 
    const randomColor = `hsl(${Math.random()*360},100%,70%)`;
    const randomX = (Math.random() - 0.5) * 50;
    heart.style = `position:absolute; right:20px; bottom:100px; color:${randomColor}; font-size:24px; transition:all 1.5s ease-out; z-index:100; pointer-events:none;`;
    container.appendChild(heart);
    setTimeout(() => { 
        heart.style.bottom = "400px"; 
        heart.style.transform = `translateX(${randomX}px) scale(1.5)`; 
        heart.style.opacity = "0"; 
    }, 50);
    setTimeout(() => heart.remove(), 1500);
}

function listenToLikes(channel) {
    db.ref(`lives_meta/${channel}/likes`).on('value', snap => {
        const countEl = document.getElementById('liveLikeCount');
        if(countEl) countEl.innerText = snap.val() || 0;
        animateHeart();
    });
}

// --- საჩუქრების აღდგენილი ლოგიკა ---
function listenToGifts(channel) {
    db.ref(`live_gifts/${channel}`).on('child_added', snap => {
        const gift = snap.val();
        if(!gift || Date.now() - gift.ts > 10000) return; 
        showGiftBigAnimation(gift.emoji, gift.senderName, gift.giftName);
    });
}

function sendGift(emoji, price, giftName) {
    if (myAkho < price) { alert("ბალანსი არ გყოფნის!"); return; }
    const hostUid = currentLiveChannel.replace("live_", "");
    
    spendAkho(price, `Gift: ${giftName}`);
    earnAkho(hostUid, price, `Live Gift: ${giftName}`);
    
    db.ref(`live_gifts/${currentLiveChannel}`).push({
        emoji: emoji, senderName: myName, giftName: giftName, ts: Date.now()
    });

    db.ref(`live_chats/${currentLiveChannel}`).push({ 
        name: "SYSTEM", text: `🎁 ${myName}-მა გაჩუქა ${giftName}`, ts: Date.now() 
    });
    
    toggleGiftPanel();
}

function showGiftBigAnimation(emoji, sender, giftName) {
    const container = document.getElementById('live-video-container');
    if(!container) return;
    const giftEl = document.createElement('div');
    giftEl.style = "position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); font-size:100px; z-index:100001; animation: giftPop 2.5s ease-out forwards; pointer-events:none; text-align:center;";
    giftEl.innerHTML = `
        <div>${emoji}</div>
        <div style="font-size:14px; background:rgba(212,175,55,0.9); color:black; padding:5px 15px; border-radius:20px; font-weight:bold;">
            ${sender} გამოგზავნა ${giftName}
        </div>`;
    container.appendChild(giftEl);
    setTimeout(() => giftEl.remove(), 2500);
}

function toggleGiftPanel() { 
    const p = document.getElementById('giftPanel'); 
    if(p) p.style.display = p.style.display === 'none' ? 'block' : 'none'; 
}

// --- ანიმაციების სტილი ---
const styleTag = document.createElement("style");
styleTag.innerText = `
    @keyframes giftPop { 
        0% { transform: translate(-50%, -50%) scale(0); opacity: 0; } 
        20% { transform: translate(-50%, -50%) scale(1.5); opacity: 1; } 
        100% { transform: translate(-50%, -200%) scale(1); opacity: 0; } 
    }
`;
document.head.appendChild(styleTag);

// --- ფოლოვერის და მაუწყებლობის მოთხოვნის ლოგიკა ---
function sendJoinRequest() {
    if(!currentLiveChannel) return;
    db.ref(`live_requests/${currentLiveChannel}`).set({ uid: auth.currentUser.uid, name: myName, photo: myPhoto, status: 'pending' });
    alert("მოთხოვნა გაიგზავნა!");
}

function listenForRequests(channel) {
    db.ref(`live_requests/${channel}`).on('value', snap => {
        const req = snap.val();
        if(req && req.status === 'pending') {
            document.getElementById('guestRequestPanel').style.display = 'block';
            document.getElementById('reqUserName').innerText = req.name;
        } else {
            document.getElementById('guestRequestPanel').style.display = 'none';
        }
    });
}
// ... (დანარჩენი ფუნქციები - acceptGuest, startGuestStreaming და ა.შ. იგივეა)
