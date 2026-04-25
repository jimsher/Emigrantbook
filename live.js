let liveClient = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
let liveTracks = { video: null, audio: null };
let currentLiveChannel = null;

function startLiveFunc() { toggleSideMenu(false); startLive(); }

async function startLive() {
    const appId = "7290502fac7f4feb82b021ccde79988a"; 
    const token = "007eJxTYLB6xlC05H7LAncx9mOfb0e4ZR370LxH7MZ6YwGd6+qMVqUKDOZGlgamBkZpicnmaSZpqUkWRkkGRobJySmp5paWFhaJ31PfZDYEMjKcnjqVmZEBAkF8boaczLLU+OKSotTEXAYGAD0AIxk=";
    
    currentLiveChannel = "live_stream"; 
    
    // UI ინიციალიზაცია
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
                updateLiveLayout(true);
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
            hostId: auth.currentUser.uid, hostName: myName, hostPhoto: myPhoto, channel: currentLiveChannel, status: 'active', ts: Date.now() 
        });

        listenToLiveChat(currentLiveChannel);
        updateViewerCount(currentLiveChannel, 'join');
        listenToViewers(currentLiveChannel);
        listenToLikes(currentLiveChannel);
        listenForRequests(currentLiveChannel);
    } catch (e) { console.error(e); }
}

async function joinLive(hostUid, channelName) {
    const appId = "7290502fac7f4feb82b021ccde79988a"; 
    const token = "007eJxTYLB6xlC05H7LAncx9mOfb0e4ZR370LxH7MZ6YwGd6+qMVqUKDOZGlgamBkZpicnmaSZpqUkWRkkGRobJySmp5paWFhaJ31PfZDYEMjKcnjqVmZEBAkF8boaczLLU+OKSotTEXAYGAD0AIxk=";
    currentLiveChannel = channelName;
    
    document.getElementById('liveUI').style.display = 'flex';
    if(document.getElementById('activeLivesModal')) document.getElementById('activeLivesModal').style.display = 'none';
    
    const reqBtn = document.getElementById('requestJoinBtn');
    if(reqBtn) reqBtn.style.display = 'block';

    db.ref(`users/${hostUid}`).once('value', snap => {
        const host = snap.val();
        if(host) {
            document.getElementById('liveHostName').innerText = host.name;
            document.getElementById('liveHostAva').src = host.photo;
        }
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
    } catch (e) { console.log(e); }
}


function listenToLiveChat(channel) {
    const chatBox = document.getElementById('liveChatBox');
    db.ref(`live_chats/${channel}`).on('child_added', snap => {
        const msg = snap.val();
        const div = document.createElement('div');
        div.style = "display:flex; align-items:flex-start; gap:8px; margin-bottom:6px; background:rgba(0,0,0,0.4); padding:6px 12px; border-radius:15px; width:fit-content;";
        div.innerHTML = `<img src="${msg.photo}" style="width:28px; height:28px; border-radius:50%;"><div style="color:white; font-size:13px;"><b style="color:var(--gold); font-size:11px; display:block;">${msg.name}</b>${msg.text}</div>`;
        chatBox.appendChild(div);
        chatBox.scrollTop = chatBox.scrollHeight;
    });
}


function sendLiveComment() {
    const inp = document.getElementById('liveMsgInp');
    if(!inp || !inp.value.trim() || !currentLiveChannel) return;
    db.ref(`live_chats/${currentLiveChannel}`).push({ name: myName, photo: myPhoto, text: inp.value, ts: Date.now() });
    inp.value = "";
}

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

async function endLive() {
    if (currentLiveChannel) {
        // 1. მაყურებლების რაოდენობის განახლება (გასვლა)
        updateViewerCount(currentLiveChannel, 'leave');

        // 2. ჩატის ისტორიის წაშლა ბაზიდან
        db.ref(`live_chats/${currentLiveChannel}`).remove();

        // 3. ლაიქების და სხვა მეტამონაცემების განულება
        db.ref(`lives_meta/${currentLiveChannel}`).remove();
        
        // 4. თუ სტუმრის მოთხოვნები იყო, მათი გასუფთავება
        db.ref(`live_requests/${currentLiveChannel}`).remove();

        // 5. ეკრანიდან (UI) კომენტარების ფიზიკურად წაშლა
        const chatBox = document.getElementById('liveChatBox');
        if (chatBox) chatBox.innerHTML = "";
        
        // 6. ლაიქების მთვლელის ვიზუალური განულება
        const likeCountEl = document.getElementById('liveLikeCount');
        if (likeCountEl) likeCountEl.innerText = "0";
    }

    // აგორას ტრეკების გათიშვა (შენი ორიგინალი კოდი)
    if (liveTracks.video) { liveTracks.video.stop(); liveTracks.video.close(); liveTracks.video = null; }
    if (liveTracks.audio) { liveTracks.audio.stop(); liveTracks.audio.close(); liveTracks.audio = null; }
    
    await liveClient.leave();
    document.getElementById('liveUI').style.display = 'none';
    currentLiveChannel = null;
}

function sendLiveHeart() {
    if(!currentLiveChannel) return;
    animateHeart();
    db.ref(`lives_meta/${currentLiveChannel}/likes`).transaction(c => (c || 0) + 1);
}

function animateHeart() {
    const container = document.getElementById('live-video-container');
    const heart = document.createElement('i');
    heart.className = "fas fa-heart";
    heart.style = `position:absolute; right:20px; bottom:100px; color:hsl(${Math.random()*360},100%,70%); font-size:24px; transition:all 1.5s ease-out; z-index:100; pointer-events:none;`;
    container.appendChild(heart);
    setTimeout(() => { heart.style.bottom = "400px"; heart.style.opacity = "0"; }, 50);
    setTimeout(() => heart.remove(), 1500);
}

function toggleGiftPanel() { 
    const p = document.getElementById('giftPanel'); 
    p.style.display = p.style.display === 'none' ? 'block' : 'none'; 
}

function listenToViewers(channel) {
    db.ref(`lives_meta/${channel}/viewers`).on('value', snap => {
        const viewers = snap.val() || {};
        const count = Object.keys(viewers).length;
        
        // რაოდენობის განახლება
        const countEl = document.getElementById('vCount');
        if(countEl) countEl.innerText = count;

        // ავატარების განახლება (ზუსტად ფოტოს სტილში)
        const avDiv = document.getElementById('viewerAvatars');
        if(avDiv) {
            avDiv.innerHTML = "";
            Object.values(viewers).slice(-1).forEach(v => {
                // ბოლო შემოსულის ფოტო ოქროსფერი კანტით (როგორც ფოტოზეა 20+)
                avDiv.innerHTML += `<div style="position:relative;"><img src="${v.photo}" style="width:28px; height:28px; border-radius:50%; border:1.5px solid #d4af37; object-fit:cover;"><span style="position:absolute; bottom:-2px; right:-2px; background:rgba(0,0,0,0.6); color:white; font-size:7px; padding:1px 2px; border-radius:4px;">20+</span></div>`;
            });
        }
    });
}

function listenToLikes(channel) {
    db.ref(`lives_meta/${channel}/likes`).on('value', snap => {
        document.getElementById('liveLikeCount').innerText = snap.val() || 0;
    });
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

function acceptGuest() { db.ref(`live_requests/${currentLiveChannel}`).update({ status: 'accepted' }); }
function rejectGuest() { db.ref(`live_requests/${currentLiveChannel}`).remove(); }

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
        const audio = await AgoraRTC.createMicrophoneAudioTrack();
        const video = await AgoraRTC.createCameraVideoTrack();
        updateLiveLayout(true);
        video.play("guest-remote-video");
        await liveClient.publish([audio, video]);
    } catch (e) { console.log(e); }
}

function updateViewerCount(channel, action) {
    const vRef = db.ref(`lives_meta/${channel}/viewers/${auth.currentUser.uid}`);
    action === 'join' ? vRef.set({ name: myName, photo: myPhoto }) : vRef.remove();
}







// ფანჯრის გაღება-დაკეტვა
function toggleViewerList(show) {
    const modal = document.getElementById('viewerListModal');
    if (show) {
        modal.style.display = 'block';
        setTimeout(() => { modal.style.bottom = '0'; }, 10);
        renderFullViewerList(); // განაახლე სია გახსნისას
    } else {
        modal.style.bottom = '-100%';
        setTimeout(() => { modal.style.display = 'none'; }, 400);
    }
}

// რეალურ დროში მაყურებლების სიის გენერაცია
function renderFullViewerList() {
    if (!currentLiveChannel) return;
    
    db.ref(`lives_meta/${currentLiveChannel}/viewers`).on('value', snap => {
        const viewers = snap.val() || {};
        const container = document.getElementById('viewerListContent');
        const countFull = document.getElementById('vCountFull');
        
        if (countFull) countFull.innerText = Object.keys(viewers).length;
        if (!container) return;
        
        container.innerHTML = "";
        
        Object.entries(viewers).forEach(([uid, v]) => {
            const row = document.createElement('div');
            row.style = "display:flex; align-items:center; justify-content:space-between; margin-bottom:15px; padding:5px;";
            row.innerHTML = `
                <div style="display:flex; align-items:center; gap:12px;">
                    <img src="${v.photo}" style="width:40px; height:40px; border-radius:50%; border:1px solid rgba(255,255,255,0.1); object-fit:cover;">
                    <div>
                        <b style="color:white; font-size:14px; display:block;">${v.name}</b>
                        <small style="color:rgba(255,255,255,0.5); font-size:11px;">Зритель</small>
                    </div>
                </div>
                <button onclick="viewUserProfile('${uid}')" style="background:rgba(255,255,255,0.1); border:none; color:white; padding:5px 12px; border-radius:8px; font-size:12px;">Профиль</button>
            `;
            container.appendChild(row);
        });
    });
}
