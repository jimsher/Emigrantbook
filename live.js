// --- TIKTOK STYLE LIVE LOGIC (OPTIMIZED FOR NEW DESIGN) ---
let liveClient = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
let liveTracks = { video: null, audio: null };
let currentLiveChannel = null;

function startLiveFunc() { toggleSideMenu(false); startLive(); }

async function startLive() {
    const appId = "7290502fac7f4feb82b021ccde79988a"; 
    const token = "007eJxTYLB6xlC05H7LAncx9mOfb0e4ZR370LxH7MZ6YwGd6+qMVqUKDOZGlgamBkZpicnmaSZpqUkWRkkGRobJySmp5paWFhaJ31PfZDYEMjKcnjqVmZEBAkF8boaczLLU+OKSotTEXAYGAD0AIxk=";
    
    currentLiveChannel = "live_stream"; 
    
    // --- შესწორება: აქ აღარ ვიყენებთ setAttribute-ს, რომელიც დიზაინს მიბნევდა ---
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
                updateLiveLayout(true); // ეკრანის გაყოფა ტიკტოკის სტილში
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
            div.style = "background:rgba(212,175,55,0.2); padding:6px 12px; border-radius:12px; margin-bottom:5px; border:1px solid #d4af37; text-align:center; font-size:12px; color:#d4af37;";
            div.innerHTML = `<b>${msg.text}</b>`;
        } else {
            // TikTok სტილი: ავატარი + შეტყობინება
            div.style = "display:flex; align-items:flex-start; gap:8px; margin-bottom:6px; background:rgba(0,0,0,0.3); padding:6px 12px; border-radius:15px; width:fit-content; max-width:90%;";
            div.innerHTML = `
                <img src="${msg.photo || 'https://ui-avatars.com/api/?name='+msg.name}" style="width:28px; height:28px; border-radius:50%; border:1px solid rgba(255,255,255,0.2);">
                <div>
                    <b style="color:#d4af37; font-size:11px; display:block;">${msg.name}</b>
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

// --- მაყურებლების მთვლელის ლოგიკა ---
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
                avDiv.innerHTML += `<img src="${v.photo}" style="width:24px; height:24px; border-radius:50%; border:1px solid white; margin-left:-8px; background:#000; object-fit:cover;">`;
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
        db.ref(`live_requests/${currentLiveChannel}`).remove();
    }
    currentLiveChannel = null;
}

// --- ლაივზე შეერთება (Audience) ---
async function joinLive(hostUid, channelName) {
    const appId = "7290502fac7f4feb82b021ccde79988a"; 
    const token = "007eJxTYLB6xlC05H7LAncx9mOfb0e4ZR370LxH7MZ6YwGd6+qMVqUKDOZGlgamBkZpicnmaSZpqUkWRkkGRobJySmp5paWFhaJ31PfZDYEMjKcnjqVmZEBAkF8boaczLLU+OKSotTEXAYGAD0AIxk=";
    currentLiveChannel = channelName;
    
    // UI-ს მომზადება - შესწორებულია
    document.getElementById('liveUI').style.display = 'flex';
    if(document.getElementById('activeLivesModal')) document.getElementById('activeLivesModal').style.display = 'none';
    
    const reqBtn = document.getElementById('requestJoinBtn');
    if(reqBtn) reqBtn.style.display = 'block';

    db.ref(`users/${hostUid}`).once('value', snap => {
        const host = snap.val();
        if(host) {
            document.getElementById('liveHostName').innerText = host.name;
            document.getElementById('liveHostAva').src = host.photo || "https://ui-avatars.com/api/?name=" + host.name;
        }
    });

    db.ref(`lives/${hostUid}`).on('value', snap => {
        if (!snap.exists()) { showLiveEndedUI(); }
    });

    try {
        await liveClient.leave(); 
        await liveClient.setClientRole("audience");
        await liveClient.join(appId, channelName, token, auth.currentUser.uid);
        
        updateViewerCount(channelName, 'join');
        listenToViewers(channelName);
        listenToLikes(channelName);
        listenForResponse(channelName);

        liveClient.on("user-published", async (user, mediaType) => {
            await liveClient.subscribe(user, mediaType);
            if (mediaType === "video") {
                if (user.uid !== hostUid) {
                    updateLiveLayout(true);
                    user.videoTrack.play("guest-remote-video");
                } else {
                    user.videoTrack.play("remote-live-video");
                }
            }
            if (mediaType === "audio") user.audioTrack.play();
        });

        listenToLiveChat(channelName);
        db.ref(`live_chats/${channelName}`).push({ name: "SYSTEM", text: `👋 ${myName} შემოვიდა`, ts: Date.now() });
    } catch (e) { console.log(e); }
}

function showLiveEndedUI() {
    if (currentLiveChannel) { db.ref(`lives_meta/${currentLiveChannel}/viewers`).off(); }
    const chatBox = document.getElementById('liveChatBox');
    if (chatBox) {
        const div = document.createElement('div');
        div.style = "background:rgba(255,0,0,0.5); padding:10px; border-radius:12px; margin-bottom:10px; color:white; text-align:center; font-weight:bold;";
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
    db.ref(`lives_meta/${currentLiveChannel}/likes`).transaction(currentLikes => {
        return (currentLikes || 0) + 1;
    });
}

function animateHeart() {
    const container = document.getElementById('live-video-container');
    if(!container) return;
    const heart = document.createElement('i');
    heart.className = "fas fa-heart"; 
    const randomColor = `hsl(${Math.random()*360},100%,70%)`;
    const randomX = (Math.random() - 0.5) * 60; 
    
    heart.style = `position:absolute; right:30px; bottom:100px; color:${randomColor}; font-size:24px; transition:all 1.5s ease-out; z-index:100; pointer-events:none; text-shadow: 0 0 5px rgba(0,0,0,0.5);`;
    container.appendChild(heart);
    
    setTimeout(() => { 
        heart.style.bottom = "400px"; 
        heart.style.transform = `translateX(${randomX}px) scale(1.8)`; 
        heart.style.opacity = "0"; 
    }, 50);
    setTimeout(() => heart.remove(), 1500);
}

function listenToLikes(channel) {
    if(!channel) return;
    db.ref(`lives_meta/${channel}/likes`).on('value', snap => {
        const likeCount = snap.val() || 0;
        const countEl = document.getElementById('liveLikeCount');
        if(countEl) { countEl.innerText = likeCount; }
        // ჰოსტისთვისაც რომ გამოჩნდეს ანიმაცია როცა სხვები ალაიქებენ
        if(snap.exists()) animateHeart();
    });
}

// --- ეკრანის გაყოფის ლოგიკა ---
function updateLiveLayout(isSplit) {
    const hostWrap = document.getElementById('host-video-wrapper');
    const guestBox = document.getElementById('guest-video-box');

    if (isSplit) {
        hostWrap.style.width = "50%";
        guestBox.style.display = "block";
        setTimeout(() => { guestBox.style.width = "50%"; }, 10);
    } else {
        hostWrap.style.width = "100%";
        guestBox.style.width = "0%";
        setTimeout(() => { guestBox.style.display = "none"; }, 400);
    }
}

// --- მოთხოვნების ლოგიკა ---
function sendJoinRequest() {
    if(!currentLiveChannel) return;
    db.ref(`live_requests/${currentLiveChannel}`).set({
        uid: auth.currentUser.uid,
        name: myName,
        photo: myPhoto,
        status: 'pending'
    });
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

function acceptGuest() {
    db.ref(`live_requests/${currentLiveChannel}`).update({ status: 'accepted' });
    document.getElementById('guestRequestPanel').style.display = 'none';
}

function rejectGuest() {
    db.ref(`live_requests/${currentLiveChannel}`).remove();
}

function listenForResponse(channel) {
    db.ref(`live_requests/${channel}`).on('value', snap => {
        const req = snap.val();
        if(req && req.uid === auth.currentUser.uid && req.status === 'accepted') {
            startGuestStreaming();
            db.ref(`live_requests/${channel}`).remove();
        }
    });
}

async function startGuestStreaming() {
    try {
        await liveClient.setClientRole("host");
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        const videoTrack = await AgoraRTC.createCameraVideoTrack();

        updateLiveLayout(true);
        videoTrack.play("guest-remote-video");
        await liveClient.publish([audioTrack, videoTrack]);

        liveTracks.guestAudio = audioTrack;
        liveTracks.guestVideo = videoTrack;
    } catch (e) { console.error(e); }
}

// დანარჩენი ფუნქციები (followHostLive, toggleGiftPanel, sendGift და ა.შ.) 
// დატოვე ისე, როგორც გაქვს, ისინი დიზაინს არ უშლიან ხელს.
