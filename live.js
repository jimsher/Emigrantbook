let liveClient = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
let liveTracks = { video: null, audio: null };
let currentLiveChannel = null;
let currentHostUid = null; 

// --- საჩუქრების ბიბლიოთეკა (აქ ჩაამატე ახალი საჩუქრები) ---
const liveGiftsLibrary = [
    { 
        id: "rose", 
        name: "Rose", 
        price: 1, 
        img: "https://cdn.jsdelivr.net/gh/jimsher/Emigrantbook@main/kocna1.gif", 
        sound: "https://github.com/jimsher/Emigrantbook/blob/main/u_edtmwfwu7c-pop-331049.mp3" 
    },
    { 
        id: "rose", 
        name: "Rose", 
        price: 1, 
        img: "https://cdn.jsdelivr.net/gh/jimsher/Emigrantbook@main/gulis-feirverki.gif",
        sound: "https://github.com/jimsher/Emigrantbook/blob/main/u_edtmwfwu7c-pop-331049.mp3" 
    }
];

function startLiveFunc() { toggleSideMenu(false); startLive(); }

async function startLive() {
    const appId = "258897e8fb5f4dd089b761eca6568b24"; 
    const token = null; 
    
    currentLiveChannel = "live_" + auth.currentUser.uid; 
    currentHostUid = auth.currentUser.uid;
    window.currentLiveHostUid = auth.currentUser.uid;

    document.getElementById('liveUI').style.display = 'flex';
    document.getElementById('liveHostName').innerText = myName;
    document.getElementById('liveHostAva').src = myPhoto;

    try {
        await liveClient.leave(); 
        await liveClient.setClientRole("host");
        await new Promise(resolve => setTimeout(resolve, 500)); 

        await liveClient.join(appId, currentLiveChannel, token, auth.currentUser.uid);
        
        registerLiveInDatabase(currentLiveChannel, myName);

        liveClient.on("user-published", async (user, mediaType) => {
            await liveClient.subscribe(user, mediaType);
            if (mediaType === "video") {
                window.currentGuest = user;
                updateLiveLayout(true);
                if (liveTracks.video) liveTracks.video.play("remote-live-video");
                user.videoTrack.play("guest-remote-video");
            }
            if (mediaType === "audio") {
                user.audioTrack.play();
            }
        });

        // 🎯 აქ გასწორდა: როცა სტუმარი გადის, ლაივი არ იშლება ბაზიდან!
        liveClient.on("user-left", (user) => {
            console.log("მომხმარებელი გავიდა:", user.uid);
            if (window.currentGuest && user.uid === window.currentGuest.uid) {
                window.currentGuest = null;
                updateLiveLayout(false);
                if (liveTracks.video) liveTracks.video.play("remote-live-video");
            }
        });
        
        liveTracks.audio = await AgoraRTC.createMicrophoneAudioTrack();
        liveTracks.video = await AgoraRTC.createCameraVideoTrack();
        
        liveTracks.video.play("remote-live-video");
        
        await new Promise(resolve => setTimeout(resolve, 500));
        await liveClient.publish([liveTracks.audio, liveTracks.video]);

        listenToLiveChat(currentLiveChannel);
        updateViewerCount(currentLiveChannel, 'join');
        listenToViewers(currentLiveChannel);
        listenToLikes(currentLiveChannel);
        listenForRequests(currentLiveChannel);
        listenForGuestStatus(currentLiveChannel);
        listenToGifts(currentLiveChannel);

    } catch (e) { console.error(e); }
}

function loadActiveLives() {
    const activeLivesContainer = document.getElementById('activeLivesList'); 
    activeLivesContainer.innerHTML = "<p style='color:white; text-align:center;'>ლაივების ძებნა...</p>";
    db.ref('lives_active').on('value', (snapshot) => {
        activeLivesContainer.innerHTML = ""; 
        if (!snapshot.exists()) {
            activeLivesContainer.innerHTML = "<p style='color:gray; text-align:center;'>ამჟამად აქტიური ლაივები არ არის.</p>";
            return;
        }
        snapshot.forEach((childSnapshot) => {
            const live = childSnapshot.val();
            const liveCard = `
            <div class="live-item" onclick="joinLive('${live.channel}')">
            <img src="${live.hostPhoto || 'default-avatar.png'}" style="width:40px; height:40px; border-radius:50%; margin-right:10px;">
             <strong>${live.host}</strong>
            </div>
            `;
            activeLivesContainer.innerHTML += liveCard;
        });
    });
}

async function joinLive(channelName) {
    const appId = "258897e8fb5f4dd089b761eca6568b24"; 
    const token = null; 
    currentLiveChannel = channelName;

    document.getElementById('liveUI').style.display = 'flex';
    if(document.getElementById('activeLivesModal')) document.getElementById('activeLivesModal').style.display = 'none';

    db.ref(`lives_active/${channelName}`).once('value', snap => {
        const liveData = snap.val();
        if(liveData) {
            currentHostUid = liveData.uid || liveData.hostId;
            window.currentLiveHostUid = currentHostUid;
            
            document.getElementById('liveHostName').innerText = liveData.host;
            document.getElementById('liveHostAva').src = liveData.hostPhoto || 'default-avatar.png';

            db.ref(`followers/${currentHostUid}/${auth.currentUser.uid}`).once('value', followSnap => {
                const followBtn = document.getElementById('liveFollowBtn'); 
                if (followBtn) {
                    if (followSnap.exists() || currentHostUid === auth.currentUser.uid) {
                        followBtn.style.display = 'none'; 
                    } else {
                        followBtn.style.display = 'flex'; 
                    }
                }
            });
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
        listenToLiveChat(channelName);
        listenForGuestStatus(channelName);
        listenToGifts(channelName);

        liveClient.on("user-published", async (user, mediaType) => {
            await liveClient.subscribe(user, mediaType);
            if (mediaType === "video") {
                if (user.uid == currentHostUid) {
                    user.videoTrack.play("remote-live-video");
                } else {
                    updateLiveLayout(true);
                    user.videoTrack.play("guest-remote-video");
                    
                    const hostUser = liveClient.remoteUsers.find(u => u.uid == currentHostUid);
                    if (hostUser && hostUser.videoTrack) hostUser.videoTrack.play("remote-live-video");
                }
            }
            if (mediaType === "audio") user.audioTrack.play();
        });

        // 🎯 აქაც გასწორდა მაყურებლისთვის: რომ სტუმრის გასვლამ ჰოსტი არ გათიშოს
        liveClient.on("user-left", (user) => {
            if (user.uid != currentHostUid) {
                updateLiveLayout(false);
                const hostUser = liveClient.remoteUsers.find(u => u.uid == currentHostUid);
                if (hostUser && hostUser.videoTrack) hostUser.videoTrack.play("remote-live-video");
            } else {
                endLive(); 
            }
        });

    } catch (e) { console.log(e); }
}

function listenToLiveChat(channel) {
    const chatBox = document.getElementById('liveChatBox');
    if(!chatBox) return;
    db.ref(`live_chats/${channel}`).off(); 
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
    const container = document.getElementById('live-video-container');
    const guestBox = document.getElementById('guest-video-box');
    if (!container) return;

    if (isSplit) {
        container.classList.add('split-mode');
        container.style.top = "15%";
        container.style.height = "40vh";
        if(guestBox) guestBox.style.display = "block";
    } else {
        container.classList.remove('split-mode');
        container.style.top = "0";
        container.style.height = "100vh";
        if(guestBox) guestBox.style.display = "none";
    }
}

async function endLive() {
    // 🎯 მხოლოდ ჰოსტს შეუძლია ბაზიდან ლაივის წაშლა!
    if (currentLiveChannel && auth.currentUser.uid === currentHostUid) {
        db.ref(`live_chats/${currentLiveChannel}`).remove();
        db.ref(`lives_meta/${currentLiveChannel}`).remove();
        db.ref(`live_requests/${currentLiveChannel}`).remove();
        db.ref(`lives_active/${currentLiveChannel}`).remove();
        db.ref(`live_gifts/${currentLiveChannel}`).remove();
    }
    
    if (currentLiveChannel) updateViewerCount(currentLiveChannel, 'leave');

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
    if(!container) return;
    const heart = document.createElement('i');
    heart.className = "fas fa-heart";
    heart.style = `position:absolute; right:20px; bottom:100px; color:hsl(${Math.random()*360},100%,70%); font-size:24px; transition:all 1.5s ease-out; z-index:100; pointer-events:none;`;
    container.appendChild(heart);
    setTimeout(() => { heart.style.bottom = "400px"; heart.style.opacity = "0"; }, 50);
    setTimeout(() => heart.remove(), 1500);
}

function renderLiveGifts() {
    const grid = document.getElementById('giftGrid');
    if (!grid) return;
    grid.innerHTML = ""; 

    liveGiftsLibrary.forEach(gift => {
        const card = document.createElement('div');
        card.className = "gift-card";
        card.onclick = () => sendGift(gift.name, gift.img, gift.price);
        
        card.innerHTML = `
            <div class="gift-img-container">
                <img src="${gift.img}" alt="${gift.name}" onerror="this.src='img/gift-default.png'">
            </div>
            <div class="gift-name">${gift.name}</div>
            <div class="gift-price"><i class="fas fa-coins"></i> ${gift.price}</div>
        `;
        grid.appendChild(card);
    });
}

function toggleGiftPanel() { 
    const p = document.getElementById('giftPanel'); 
    if(p) {
        if (p.style.display === 'none' || p.style.display === '') {
            p.style.display = 'block';
            renderLiveGifts();
        } else {
            p.style.display = 'none';
        }
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
            Object.values(viewers).slice(-1).forEach(v => {
                avDiv.innerHTML += `<div style="position:relative;"><img src="${v.photo}" style="width:28px; height:28px; border-radius:50%; border:1.5px solid #d4af37; object-fit:cover;"></div>`;
            });
        }
    });
}

function listenToLikes(channel) {
    db.ref(`lives_meta/${channel}/likes`).on('value', snap => {
        const el = document.getElementById('liveLikeCount');
        if(el) el.innerText = snap.val() || 0;
    });
}

function listenForRequests(channel) {
    db.ref(`live_requests/${channel}`).on('value', snap => {
        const req = snap.val();
        const panel = document.getElementById('guestRequestPanel');
        const nameEl = document.getElementById('reqUserName');
        if(req && req.status === 'pending') {
            if (panel && nameEl) {
                nameEl.innerText = req.name;
                panel.style.display = 'block';
            }
        } else {
            if (panel) panel.style.display = 'none';
        }
    });
}

function acceptGuest() {
    if (!currentLiveChannel) return;
    db.ref(`live_requests/${currentLiveChannel}`).update({ status: 'accepted' }).then(() => {
        document.getElementById('guestRequestPanel').style.display = 'none';
    });
}

function rejectGuest() {
    if (!currentLiveChannel) return;
    db.ref(`live_requests/${currentLiveChannel}`).remove().then(() => {
        document.getElementById('guestRequestPanel').style.display = 'none';
    });
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
        liveTracks.audio = await AgoraRTC.createMicrophoneAudioTrack();
        liveTracks.video = await AgoraRTC.createCameraVideoTrack();
        
        updateLiveLayout(true);
        liveTracks.video.play("guest-remote-video");
        
        await liveClient.publish([liveTracks.audio, liveTracks.video]);
        
        const controls = document.getElementById('guest-cam-controls');
        if(controls) controls.style.display = 'block';

    } catch (e) { console.log(e); }
}

function updateViewerCount(channel, action) {
    const vRef = db.ref(`lives_meta/${channel}/viewers/${auth.currentUser.uid}`);
    action === 'join' ? vRef.set({ name: myName, photo: myPhoto }) : vRef.remove();
}

function toggleViewerList(show) {
    const modal = document.getElementById('viewerListModal');
    if (show) {
        modal.style.display = 'block';
        setTimeout(() => { modal.style.bottom = '0'; }, 10);
        renderFullViewerList();
    } else {
        modal.style.bottom = '-100%';
        setTimeout(() => { modal.style.display = 'none'; }, 400);
    }
}

function renderFullViewerList() {
    if (!currentLiveChannel) return;
    db.ref(`lives_meta/${currentLiveChannel}/viewers`).on('value', snap => {
        const viewers = snap.val() || {};
        const container = document.getElementById('viewerListContent');
        if (!container) return;
        container.innerHTML = "";
        Object.entries(viewers).forEach(([uid, v]) => {
            const row = document.createElement('div');
            row.style = "display:flex; align-items:center; justify-content:space-between; margin-bottom:15px; padding:5px;";
            row.innerHTML = `<div style="display:flex; align-items:center; gap:12px;"><img src="${v.photo}" style="width:40px; height:40px; border-radius:50%; object-fit:cover;"><div><b style="color:white; font-size:14px; display:block;">${v.name}</b></div></div><button onclick="viewUserProfile('${uid}')" style="background:rgba(255,255,255,0.1); border:none; color:white; padding:5px 12px; border-radius:8px; font-size:12px;">Профиль</button>`;
            container.appendChild(row);
        });
    });
}

function registerLiveInDatabase(channelName, hostNickname) {
    const liveRef = db.ref(`lives_active/${channelName}`);
    const liveData = { 
        channel: channelName, 
        host: hostNickname, 
        hostPhoto: myPhoto, 
        startTime: Date.now(), 
        status: "online", 
        uid: auth.currentUser.uid 
    };
    liveRef.set(liveData);
    if (channelName === "live_" + auth.currentUser.uid) {
        liveRef.onDisconnect().remove();
    }
}

function openActiveLivesModal() {
    const modal = document.getElementById('active_lives_modal');
    if(modal) modal.style.display = 'block';
    loadActiveLives();
}

function closeActiveLivesModal() {
    const modal = document.getElementById('active_lives_modal');
    if(modal) modal.style.display = 'none';
}

function sendJoinRequest() {
    if (!currentLiveChannel) return;
    db.ref(`live_requests/${currentLiveChannel}`).set({ 
        uid: auth.currentUser.uid, 
        name: myName, 
        photo: myPhoto, 
        status: 'pending', 
        ts: Date.now() 
    }).then(() => {
        alert("მოთხოვნა გაიგზავნა!");
    });
}

function followHost() {
    if (!currentLiveChannel) return;
    db.ref(`lives_active/${currentLiveChannel}`).once('value', snap => {
        const liveData = snap.val();
        if (liveData) {
            const hostId = liveData.uid;
            db.ref(`followers/${hostId}/${auth.currentUser.uid}`).set(true).then(() => {
                db.ref(`following/${auth.currentUser.uid}/${hostId}`).set(true);
                const btn = document.getElementById('liveFollowBtn');
                if(btn) btn.style.display = 'none';
                alert("წარმატებით გამოიწერეთ!");
            });
        }
    });
}

let guestCamEnabled = true;

window.toggleGuestCamera = async function() {
    if (!liveTracks.video) {
        console.error("ვიდეო ტრეკი არ არსებობს!");
        return; 
    }
    const camIcon = document.getElementById('camIcon');
    if (guestCamEnabled) {
        await liveTracks.video.setEnabled(false);
        guestCamEnabled = false;
        if(camIcon) camIcon.className = "fas fa-video-slash";
        db.ref(`lives_active/${currentLiveChannel}/guest_status`).set({
            showPhoto: true,
            photoUrl: myPhoto 
        });
    } else {
        await liveTracks.video.setEnabled(true);
        guestCamEnabled = true;
        if(camIcon) camIcon.className = "fas fa-video";
        db.ref(`lives_active/${currentLiveChannel}/guest_status`).set({
            showPhoto: false
        });
    }
}

function listenForGuestStatus(channel) {
    db.ref(`lives_active/${channel}/guest_status`).on('value', snap => {
        const status = snap.val();
        const guestImg = document.getElementById('guest-static-photo');
        const guestVid = document.getElementById('guest-remote-video');
        if (status && status.showPhoto) {
            if (guestImg) {
                guestImg.src = status.photoUrl;
                guestImg.style.display = 'block';
            }
            if (guestVid) guestVid.style.opacity = '0';
        } else {
            if (guestImg) guestImg.style.display = 'none';
            if (guestVid) guestVid.style.opacity = '1';
        }
    });
}

function listenForActiveLivesStatus() {
    const liveBtn = document.querySelector('.live-nav-button');
    if (!liveBtn) return;
    db.ref('lives_active').on('value', (snapshot) => {
        if (snapshot.exists() && snapshot.numChildren() > 0) {
            liveBtn.classList.add('is-live');
        } else {
            liveBtn.classList.remove('is-live');
        }
    });
}
listenForActiveLivesStatus();

window.sendGift = async function(giftName, giftImg, price) {
    if (!currentLiveChannel) return;
    const user = auth.currentUser;
    const hostUid = window.currentLiveHostUid;

    if (!hostUid) return alert("მასპინძლის ID ვერ მოიძებნა!");
    if (user.uid === hostUid) return alert("საკუთარ თავს ვერ აჩუქებთ!");

    const userBalanceRef = db.ref(`users/${user.uid}/akho`); 
    
    userBalanceRef.once('value').then(async (snap) => {
        let currentBalance = snap.val() || 0;

        if (currentBalance < price) {
            alert(`ბალანსი არ არის საკმარისი! გაქვს: ${currentBalance.toFixed(2)} AKHO`);
            return;
        }

        await userBalanceRef.set(currentBalance - price);
        db.ref(`users/${hostUid}/gift_balance`).transaction(c => (c || 0) + price);

        db.ref(`received_gifts/${hostUid}`).push({
            giftUrl: giftImg,
            price: price,
            fromName: myName,
            fromPhoto: myPhoto,
            timestamp: Date.now()
        });

        const giftData = {
            giftImage: giftImg,
            giftSound: liveGiftsLibrary.find(g => g.img === giftImg)?.sound || "",
            ts: Date.now()
        };
        db.ref(`live_gifts/${currentLiveChannel}`).push(giftData);
        
        if (typeof toggleGiftPanel === "function") toggleGiftPanel();
    }).catch(e => {
        console.error("Firebase Gift Error:", e);
    });
}

function listenToGifts(channel) {
    db.ref(`live_gifts/${channel}`).on('child_added', (snap) => {
        const gift = snap.val();
        if (!gift || (Date.now() - gift.ts > 10000)) return; 
        showMainGiftAnimation(gift);
    });
}

function showMainGiftAnimation(gift) {
    const container = document.getElementById('liveUI');
    if (!container) return;

    if (gift.giftSound) {
        const audio = new Audio(gift.giftSound);
        audio.volume = 0.5;
        audio.play().catch(e => console.log("Audio play error:", e));
    }

    const animDiv = document.createElement('div');
    animDiv.style = `
        position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
        z-index: 10000; pointer-events: none;
    `;
    
    animDiv.innerHTML = `
        <img src="${gift.giftImage}" style="width: 220px; height: 220px; object-fit: contain; animation: giftPopIn 0.6s ease-out; filter: drop-shadow(0 0 20px rgba(255,215,0,0.5));">
    `;

    container.appendChild(animDiv);

    setTimeout(() => {
        animDiv.style.opacity = '0';
        animDiv.style.transition = 'opacity 1s';
        setTimeout(() => animDiv.remove(), 1000);
    }, 4000);
}
