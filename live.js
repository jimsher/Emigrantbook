let liveClient = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
let liveTracks = { video: null, audio: null };
let currentLiveChannel = null;

function startLiveFunc() { toggleSideMenu(false); startLive(); }

async function startLive() {
    const appId = "7290502fac7f4feb82b021ccde79988a"; 
    const token = "007eJxTYPglo7PwnK/blzcd8ZsuPzDfzxm9WaOoyGL5Tcm5K05qpV9RYDA3sjQwNTBKS0w2TzNJS02yMEoyMDJMTk5JNbe0tLBILN79NrMhkJFh5vswBkYoBPG5GXIyy1Lji0uKUhNzGRgA0ggktw==";
    
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

        // --- აქ ჩავსვი და გამოვიყენე შენი კოდის რეალური ცვლადები (currentLiveChannel და myName) ---
        registerLiveInDatabase(currentLiveChannel, myName);

        // ... startLive-ის შიგნით user-published ნაწილი შეცვალე ასე:
liveClient.on("user-published", async (user, mediaType) => {
    await liveClient.subscribe(user, mediaType);
    if (mediaType === "video") {
        window.currentGuest = user;
        updateLiveLayout(true);
        
        // შენი ვიდეო (ჰოსტის) რომ არ გაქრეს
        if (liveTracks.video) liveTracks.video.play("remote-live-video");
        
        // სტუმრის ვიდეო
        user.videoTrack.play("guest-remote-video");
    }
    if (mediaType === "audio") user.audioTrack.play();
});

liveClient.on("user-left", () => {
    updateLiveLayout(false);
    if (liveTracks.video) liveTracks.video.play("remote-live-video");
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


function loadActiveLives() {
    const activeLivesContainer = document.getElementById('activeLivesList'); // ეს ID უნდა გქონდეს მოდალში
    activeLivesContainer.innerHTML = "<p style='color:white; text-align:center;'>ლაივების ძებნა...</p>";

    db.ref('lives_active').once('value', (snapshot) => {
        activeLivesContainer.innerHTML = ""; // ვასუფთავებთ კონტეინერს
        
        if (!snapshot.exists()) {
            activeLivesContainer.innerHTML = "<p style='color:gray; text-align:center;'>ამჟამად აქტიური ლაივები არ არის.</p>";
            return;
        }

        snapshot.forEach((childSnapshot) => {
            const live = childSnapshot.val();
            
            // ვქმნით ლაივის ბარათს (როგორც TikTok-ზეა)
            // loadActiveLives ფუნქციის შიგნით, სადაც liveCard იქმნება:
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



async function joinLive(channelName) { // ამოვიღოთ hostUid პარამეტრი, რადგან ბაზიდან წამოვიღებთ
    const appId = "7290502fac7f4feb82b021ccde79988a"; 
    const token = "007eJxTYPglo7PwnK/blzcd8ZsuPzDfzxm9WaOoyGL5Tcm5K05qpV9RYDA3sjQwNTBKS0w2TzNJS02yMEoyMDJMTk5JNbe0tLBILN79NrMhkJFh5vswBkYoBPG5GXIyy1Lji0uKUhNzGRgA0ggktw==";
    currentLiveChannel = channelName;
    
    document.getElementById('liveUI').style.display = 'flex';
    if(document.getElementById('activeLivesModal')) document.getElementById('activeLivesModal').style.display = 'none';

    // წამოვიღოთ ჰოსტის მონაცემები პირდაპირ აქტიური ლაივიდან
    db.ref(`lives_active/${channelName}`).once('value', snap => {
        const liveData = snap.val();
        if(liveData) {
            document.getElementById('liveHostName').innerText = liveData.host;
            document.getElementById('liveHostAva').src = liveData.hostPhoto || 'default-avatar.png';
        }
    });

    try {
        await liveClient.leave(); 
        await liveClient.setClientRole("audience");
        await liveClient.join(appId, channelName, token, auth.currentUser.uid);
        
        // დანარჩენი შენი კოდი უცვლელია...
        updateViewerCount(channelName, 'join');
        listenToViewers(channelName);
        listenToLikes(channelName);
        listenForResponse(channelName);

        liveClient.on("user-published", async (user, mediaType) => {
            await liveClient.subscribe(user, mediaType);
            if (mediaType === "video") {
                // აქ შევცვალოთ: თუ ვიდეო არის ჰოსტის, გაუშვი დიდ ეკრანზე
                user.videoTrack.play("remote-live-video");
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
    const container = document.getElementById('live-video-container');
    const guestBox = document.getElementById('guest-video-box');
    const hostWrap = document.getElementById('host-video-wrapper');

    if (isSplit) {
        // სტუმარი შემოვიდა
        container.classList.add('split-mode');
        container.style.top = "15%"; // აიწია მაღლა
        container.style.height = "40vh"; // დაპატარავდა სიმაღლეში
        
        guestBox.style.display = "block";
    } else {
        // სტუმარი გავიდა (ჩვეულებრივი რეჟიმი)
        container.classList.remove('split-mode');
        container.style.top = "0";
        container.style.height = "100vh"; // ისევ მთლიანი ეკრანი
        
        guestBox.style.display = "none";
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

        // --- დამატებული ნაწილი: მაყურებლების UI-ს გასუფთავება ---
        const vCountEl = document.getElementById('vCount');
        if (vCountEl) vCountEl.innerText = "0";

        const avDiv = document.getElementById('viewerAvatars');
        if (avDiv) avDiv.innerHTML = "";
        // -----------------------------------------------------
    }

    // აგორას ტრეკების გათიშვა
    if (liveTracks.video) { liveTracks.video.stop(); liveTracks.video.close(); liveTracks.video = null; }
    if (liveTracks.audio) { liveTracks.audio.stop(); liveTracks.audio.close(); liveTracks.audio = null; }
    
    await liveClient.leave();
    document.getElementById('liveUI').style.display = 'none';
    currentLiveChannel = null;
    
    // დამატებითი უსაფრთხოება: თუ სტუმარი იყო ჩართული, მისი ლეიაუტიც დავაბრუნოთ
    if (typeof updateLiveLayout === "function") {
        updateLiveLayout(false);
    }
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
        // თუ მოთხოვნა არსებობს და სტატუსი არის 'pending' (მოლოდინში)
        if(req && req.status === 'pending') {
            const panel = document.getElementById('guestRequestPanel');
            const nameEl = document.getElementById('reqUserName');
            
            if (panel && nameEl) {
                nameEl.innerText = req.name;
                panel.style.display = 'block'; // ვაჩვენებთ პანელს ჰოსტს
            }
        } else {
            // თუ მოთხოვნა წაიშალა ან სტატუსი შეიცვალა, ვმალავთ პანელს
            const panel = document.getElementById('guestRequestPanel');
            if (panel) panel.style.display = 'none';
        }
    });
}






// ჰოსტი აჭერს "მიღებას"
function acceptGuest() {
    if (!currentLiveChannel) return;
    
    db.ref(`live_requests/${currentLiveChannel}`).update({
        status: 'accepted'
    }).then(() => {
        document.getElementById('guestRequestPanel').style.display = 'none';
    });
}

// ჰოსტი აჭერს "უარყოფას"
function rejectGuest() {
    if (!currentLiveChannel) return;
    
    // უბრალოდ ვშლით მოთხოვნას
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










// ეს ფუნქცია ლაივს ხილვადს ხდის ყველასთვის
function registerLiveInDatabase(channelName, hostNickname) {
    const liveRef = db.ref(`lives_active/${channelName}`);
    liveRef.set({
        channel: channelName,
        host: hostNickname,
        hostPhoto: myPhoto,
        startTime: Date.now(),
        viewers: 1,
        status: "online"
    });

    // თუ ჰოსტი ინტერნეტს გათიშავს ან "გავარდება", ლაივი ავტომატურად წაიშალოს
    liveRef.onDisconnect().remove();
}










function openActiveLivesModal() {
    document.getElementById('active_lives_modal').style.display = 'block';
    loadActiveLives(); // აქ იძახებს ბაზიდან წამოღების ფუნქციას, რომელიც წეღან დავწერეთ
}

function closeActiveLivesModal() {
    document.getElementById('active_lives_modal').style.display = 'none';
}
















function sendJoinRequest() {
    // ვამოწმებთ, საერთოდ ვართ თუ არა ლაივში
    if (!currentLiveChannel) {
        console.error("არხი არ არის განსაზღვრული");
        return;
    }

    const guestUid = auth.currentUser.uid;
    
    // მოთხოვნის გაგზავნა ბაზაში
    // ვიყენებთ შენს ორიგინალ სტრუქტურას: live_requests / არხის_სახელი
    db.ref(`live_requests/${currentLiveChannel}`).set({
        uid: guestUid,
        name: myName, // შენი ცვლადი
        photo: myPhoto, // შენი ცვლადი
        status: 'pending',
        ts: Date.now()
    }).then(() => {
        alert("მოთხოვნა გაიგზავნა! დაელოდეთ ჰოსტის პასუხს.");
        
        // გაგზავნის შემდეგ ღილაკი დავმალოთ, რომ ბევრჯერ არ დააჭიროს
        document.getElementById('requestJoinBtn').style.display = 'none';
    }).catch(e => {
        console.error("შეცდომა მოთხოვნისას:", e);
    });
}
