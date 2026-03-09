// --- TIKTOK STYLE LIVE LOGIC (ORIGINAL + ALL ENHANCEMENTS) ---
let liveClient = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
let liveTracks = { video: null, audio: null };
let currentLiveChannel = null;

function startLiveFunc() { toggleSideMenu(false); startLive(); }

async function startLive() {
    const appId = "7290502fac7f4feb82b021ccde79988a"; 
    const token = "007eJxTYFDJP/duoW3yN8XylY8bWr7rbXTL+KSruK1XPTwjWp/d+IgCg7mRpYGpgVFaYrJ5mklaapKFUZKBkWFyckqquaWlhUXi+etrMxsCGRnOPk1nZGSAQBCfmyEnsyw1vrikKDUxl4EBAF9gI4E=";
    
    currentLiveChannel = "live_stream"; 
    
    document.getElementById('liveUI').style.display = 'flex';
    document.getElementById('liveHostName').innerText = myName;
    document.getElementById('liveHostAva').src = myPhoto;

    try {
        await liveClient.leave(); 
        await liveClient.setClientRole("host");
        await new Promise(resolve => setTimeout(resolve, 500)); 

        await liveClient.join(appId, currentLiveChannel, token, auth.currentUser.uid);

        // --- [მნიშვნელოვანი ჩამატება]: სტუმრის გამოჩენის ლოგიკა ---
        liveClient.on("user-published", async (user, mediaType) => {
            await liveClient.subscribe(user, mediaType);
            if (mediaType === "video") {
                // ჰოსტის ეკრანზეც იყოფა სივრცე, როცა სტუმარი შემოდის
                const singleZone = document.getElementById('single-screen-zone');
                const splitZone = document.getElementById('split-screen-zone');
                if(singleZone && splitZone) {
                    singleZone.style.display = 'none';
                    splitZone.style.display = 'flex';
                }
                // სტუმრის ვიდეოს ვუშვებთ სპეციალურ ID-ში
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
        // დამატებულია: მაყურებლების ლოგიკა
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
            div.style = "background:rgba(212,175,55,0.2); padding:8px 12px; border-radius:10px; margin-bottom:5px; border:1px solid var(--gold); text-align:center;";
            div.innerHTML = `<span style="color:var(--gold); font-size:13px; font-weight:bold;">${msg.text}</span>`;
        } else {
            // TikTok სტილი: ავატარი + შეტყობინება
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

        // ზედა ზოლში ავატარების გამოჩენა
        const avDiv = document.getElementById('viewerAvatars');
        if(avDiv) {
            avDiv.innerHTML = "";
            Object.values(viewers).slice(-3).forEach(v => {
                avDiv.innerHTML += `<img src="${v.photo}" style="width:24px; height:24px; border-radius:50%; border:1px solid white; margin-left:-8px; background:#000;">`;
            });
        }
    });
}

// --- ლაივის დასრულება და შეერთება ---
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
    }
    currentLiveChannel = null;
}



        async function joinLive(hostUid, channelName) {
    const appId = "7290502fac7f4feb82b021ccde79988a"; 
    const token = "007eJxTYFDJP/duoW3yN8XylY8bWr7rbXTL+KSruK1XPTwjWp/d+IgCg7mRpYGpgVFaYrJ5mklaapKFUZKBkWFyckqquaWlhUXi+etrMxsCGRnOPk1nZGSAQBCfmyEnsyw1vrikKDUxl4EBAF9gI4E=";
    currentLiveChannel = channelName;
    
    // UI-ს მომზადება
    document.getElementById('liveUI').style.display = 'flex';
    if(document.getElementById('activeLivesModal')) document.getElementById('activeLivesModal').style.display = 'none';
    
    // [ჩამატებული]: მაყურებელს ვუჩვენებთ ხელის აწევის ღილაკს
    const reqBtn = document.getElementById('requestJoinBtn');
    if(reqBtn) reqBtn.style.display = 'block';

    db.ref(`users/${hostUid}`).once('value', snap => {
        const host = snap.val();
        if(host) {
            document.getElementById('liveHostName').innerText = host.name;
            document.getElementById('liveHostAva').src = host.photo || "https://ui-avatars.com/api/?name=" + host.name;
        }
    });

    // --- ახალი ლოგიკა: ჰოსტის სტატუსის კონტროლი ---
    db.ref(`lives/${hostUid}`).on('value', snap => {
        if (!snap.exists()) {
            showLiveEndedUI();
        }
    });
    // ------------------------------------------

    try {
        await liveClient.leave(); 
        await liveClient.setClientRole("audience");
        await liveClient.join(appId, channelName, token, auth.currentUser.uid);
        
        updateViewerCount(channelName, 'join');
        listenToViewers(channelName);
        listenToLikes(channelName);
        
        // [ჩამატებული]: ვუსმენთ ჰოსტის პასუხს ჩართვის მოთხოვნაზე
        listenForResponse(channelName);

        liveClient.on("user-published", async (user, mediaType) => {
    await liveClient.subscribe(user, mediaType);
    if (mediaType === "video") {
        if (user.uid !== hostUid) {
            // სტუმარია - ვყოფთ ეკრანს ტიკტოკ სტილზე
            const singleZone = document.getElementById('single-screen-zone');
            const splitZone = document.getElementById('split-screen-zone');
            if(singleZone && splitZone) {
                singleZone.style.display = 'none';
                splitZone.style.display = 'flex';
            }
            user.videoTrack.play("guest-remote-video");
        } else {
            // ჰოსტია - დიდ ეკრანზე (ან ზედა ნახევარში)
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
    // 1. ჯერ ვთიშავთ Firebase-ის მსმენელს, რომ სულ არ იტრიალოს
    if (currentLiveChannel) {
        db.ref(`lives_meta/${currentLiveChannel}/viewers`).off();
    }

    // 2. გამოვიტანოთ შეტყობინება ჩატში
    const chatBox = document.getElementById('liveChatBox');
    if (chatBox) {
        const div = document.createElement('div');
        div.style = "background:rgba(255,0,0,0.6); padding:10px; border-radius:12px; margin-bottom:10px; color:white; text-align:center; font-weight:bold;";
        div.innerHTML = "⚠️ ჰოსტმა დაასრულა ლაივი";
        chatBox.appendChild(div);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    // 3. 2 წამში ავტომატურად ვხურავთ ლაივის ინტერფეისს
    setTimeout(() => {
        endLive(); // შენი ორიგინალი ფუნქცია, რომელიც ასუფთავებს UI-ს და აგორას
    }, 2500);
}







// --- ტიკ-ტოკ ეფექტები (გულები და საჩუქრები) ---
function sendLiveHeart() {
    if(!currentLiveChannel || !auth.currentUser) return;

    // 1. ლოკალური ანიმაცია (მაყურებლის ეკრანზე)
    animateHeart();

    // 2. Firebase-ში ლაიქების რაოდენობის გაზრდა (ატომურად)
    // hostUid-ს ვიღებთ ჩენელის სახელიდან
    const hostUid = currentLiveChannel.replace("live_", "");
    
    // ვიყენებთ transaction-ს, რომ რამდენიმე მომხმარებლის ერთდროული ლაიქი სწორად დაითვალოს
    db.ref(`lives_meta/${currentLiveChannel}/likes`).transaction(currentLikes => {
        return (currentLikes || 0) + 1;
    });

    // 3. (Optional) ჩატში შეტყობინების გაშვება (მხოლოდ სისტემური)
    // db.ref(`live_chats/${currentLiveChannel}`).push({ name: "SYSTEM", text: `❤️ ${myName}-მა მოიწონა ლაივი`, ts: Date.now() });
}

// დამხმარე ფუნქცია ლოკალური ანიმაციისთვის (გამოყოფილი, რომ ჰოსტმაც გამოიყენოს)
function animateHeart() {
    const container = document.getElementById('live-video-container');
    if(!container) return;
    const heart = document.createElement('i');
    heart.className = "fas fa-heart"; 
    
    // შემთხვევითი ფერი და პოზიცია (TikTok სტილი)
    const randomColor = `hsl(${Math.random()*360},100%,70%)`;
    const randomX = (Math.random() - 0.5) * 50; // -25px-დან 25px-მდე
    
    heart.style = `
        position:absolute; 
        right:20px; 
        bottom:100px; 
        color:${randomColor}; 
        font-size:24px; 
        transition:all 1.5s ease-out; 
        z-index:100; 
        pointer-events:none;
        text-shadow: 0 0 5px rgba(0,0,0,0.5);
    `;
    container.appendChild(heart);
    
    // ანიმაციის დაწყება
    setTimeout(() => { 
        heart.style.bottom = "400px"; // ადის ზემოთ
        heart.style.transform = `translateX(${randomX}px) scale(1.5)`; // იზრდება და იხრება
        heart.style.opacity = "0"; // ქრება
    }, 50);
    
    setTimeout(() => heart.remove(), 1500);
}


function listenToLikes(channel) {
    if(!channel) return;

    // ვუსმენთ 'lives_meta/CHANNEL/likes' ველს
    db.ref(`lives_meta/${channel}/likes`).on('value', snap => {
        const likeCount = snap.val() || 0;
        
        // 1. განახლდეს მთვლელი HTML-ში
        const countEl = document.getElementById('liveLikeCount');
        if(countEl) {
            countEl.innerText = likeCount;
        }

        // 2. გამოვაჩინოთ გულის ანიმაცია (TikTok სტილი)
        // იმისათვის, რომ ანიმაცია ლამაზად გამოჩნდეს, გამოვიძახოთ ლოკალური animateHeart
        // (შენიშვნა: თუ ლაიქები ძალიან სწრაფად მოდის, ანიმაციები შეიძლება გადაიფაროს)
        animateHeart();
    });
}








function toggleGiftPanel() { 
    const p = document.getElementById('giftPanel'); 
    p.style.display = p.style.display === 'none' ? 'block' : 'none'; 
}

function sendGift(emoji, price, giftName) {
    if (myAkho < price) { alert("ბალანსი!"); if(typeof openWalletUI === "function") openWalletUI(); return; }
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

// --- სტილები და აქტიური ლაივების სია ---
const styleSheet = document.createElement("style");
styleSheet.innerText = "@keyframes gift-pop-up { 0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; } 20% { transform: translate(-50%, -50%) scale(1.5); opacity: 1; } 100% { transform: translate(-50%, -200%) scale(1); opacity: 0; } }";
document.head.appendChild(styleSheet);

function listenToActiveLives() {
    const floatBtn = document.getElementById('liveFloatingBtn');
    const lastAva = document.getElementById('lastLiveAva');
    const modalList = document.getElementById('modalLivesList');

    db.ref('lives').on('value', snap => {
        const lives = snap.val(); 
        if(modalList) modalList.innerHTML = "";

        if (!lives || Object.keys(lives).length === 0) { 
            if(floatBtn) floatBtn.style.display = 'none'; 
            return; 
        }

        if(floatBtn) floatBtn.style.display = 'block';

        const liveEntries = Object.entries(lives);
        const lastLive = liveEntries[liveEntries.length - 1][1];

        if(lastAva) lastAva.src = lastLive.hostPhoto || 'https://ui-avatars.com/api/?name=' + lastLive.hostName;

        // აქ ვამატებთ დაჭერის ფუნქციას მთავარ მცურავ ღილაკზეც (ბოლო ლაივისთვის)
        if(floatBtn) {
            floatBtn.onclick = () => {
                const lastUid = liveEntries[liveEntries.length - 1][0];
                joinLive(lastUid, lastLive.channel);
            };
        }

        liveEntries.forEach(([uid, data]) => {
            const item = document.createElement('div');
            // დავამატე cursor:pointer რომ მიხვდნენ რომ დაჭერადია
            item.style = "display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.05); padding:10px; border-radius:15px; margin-bottom:10px; cursor:pointer;";
            
            // ეს არის მთავარი ცვლილება: მთლიან ბლოკზე (ფოტოზეც) დაჭერა ააქტიურებს შესვლას
            item.onclick = (e) => {
                // თუ პირდაპირ ღილაკს დააჭირა, ორჯერ რომ არ გამოიძახოს
                joinLive(uid, data.channel);
                closeActiveLivesModal();
            };

            item.innerHTML = `
                <div style="display:flex; align-items:center; gap:12px;">
                    <img src="${data.hostPhoto}" style="width:45px; height:45px; border-radius:50%; border:1px solid var(--gold);">
                    <b style="color:white;">${data.hostName}</b>
                </div>
                <button style="background:var(--gold); border:none; padding:7px 15px; border-radius:10px; font-weight:900; pointer-events:none;">WATCH</button>
            `;
            
            if(modalList) modalList.appendChild(item);
        });
    });
}
listenToActiveLives();

// --- სქროლის ლოგიკა ---
const feed = document.getElementById('main-feed');
let isScrolling = false;
if(feed) {
    feed.addEventListener('wheel', (e) => {
        e.preventDefault();
        if (isScrolling) return;
        isScrolling = true;
        const direction = e.deltaY > 0 ? 1 : -1;
        const scrollAmount = window.innerHeight * direction;
        feed.scrollBy({ top: scrollAmount, behavior: 'smooth' });
        setTimeout(() => { isScrolling = false; }, 500);
    }, { passive: false });
}














// ფოლოვერის დამატება ლაივში
function followHostLive(hostUid) {
    // თუ საკუთარ თავს აჭერ ან სისტემა არაა მზად, გაჩერდეს
    if(!auth.currentUser || !hostUid || hostUid === auth.currentUser.uid || hostUid === "stream") return;

    console.log("Following host:", hostUid);

    // 1. ვარსკვლავების ანიმაცია (ვიზუალური ეფექტი)
    const hostImg = document.getElementById('liveHostAva');
    for(let i=0; i<8; i++) {
        const star = document.createElement('i');
        star.className = "fas fa-star";
        star.style = `
            position: absolute; 
            left: ${hostImg.getBoundingClientRect().left + 20}px; 
            top: ${hostImg.getBoundingClientRect().top + 20}px; 
            color: #d4af37; 
            font-size: 15px; 
            z-index: 100000; 
            transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            pointer-events: none;
        `;
        document.body.appendChild(star);

        setTimeout(() => {
            const angle = Math.random() * Math.PI * 2;
            const dist = 50 + Math.random() * 50;
            star.style.transform = `translate(${Math.cos(angle)*dist}px, ${Math.sin(angle)*dist}px) scale(0)`;
            star.style.opacity = "0";
        }, 10);

        setTimeout(() => star.remove(), 800);
    }

    // 2. ბაზაში ჩაწერა
    db.ref(`followers/${hostUid}/${auth.currentUser.uid}`).set(true);
    db.ref(`following/${auth.currentUser.uid}/${hostUid}`).set(true);

    // 3. შეტყობინება ჩატში
    if(currentLiveChannel) {
        db.ref(`live_chats/${currentLiveChannel}`).push({
            name: "SYSTEM",
            text: `✨ ${myName} დაგაფოლოვათ!`,
            ts: Date.now()
        });
    }

    // 4. ღილაკის ვიზუალის შეცვლა
    const btn = document.getElementById('followHostBtn');
    if(btn) {
        btn.innerText = "Following";
        btn.style.background = "rgba(255,255,255,0.3)";
        btn.style.color = "white";
    }
}


















// ლაივში დამატების ფუნქცია
let currentGuestUid = null;

// 1. მაყურებელი აგზავნის მოთხოვნას
function sendJoinRequest() {
    if(!currentLiveChannel) return;
    const hostUid = currentLiveChannel.replace("live_", "");
    
    db.ref(`live_requests/${currentLiveChannel}`).set({
        uid: auth.currentUser.uid,
        name: myName,
        photo: myPhoto,
        status: 'pending'
    });
    alert("მოთხოვნა გაიგზავნა!");
}

// 2. ჰოსტი უსმენს მოთხოვნებს (ეს ჩასვი startLive-ის ბოლოში)
function listenForRequests(channel) {
    db.ref(`live_requests/${channel}`).on('value', snap => {
        const req = snap.val();
        if(req && req.status === 'pending') {
            currentGuestUid = req.uid;
            document.getElementById('guestRequestPanel').style.display = 'block';
            document.getElementById('reqUserName').innerText = req.name;
        } else {
            document.getElementById('guestRequestPanel').style.display = 'none';
        }
    });
}

// 3. ჰოსტი ათანხმებს მოთხოვნას
function acceptGuest() {
    db.ref(`live_requests/${currentLiveChannel}`).update({ status: 'accepted' });
    document.getElementById('guestRequestPanel').style.display = 'none';
}

function rejectGuest() {
    db.ref(`live_requests/${currentLiveChannel}`).remove();
}

// 4. მაყურებელი უსმენს პასუხს (ეს ჩასვი joinLive-ის ბოლოში)
function listenForResponse(channel) {
    db.ref(`live_requests/${channel}`).on('value', snap => {
        const req = snap.val();
        if(req && req.uid === auth.currentUser.uid && req.status === 'accepted') {
            startGuestStreaming(); // თუ დაეთანხმა, იწყებს მაუწყებლობას
            db.ref(`live_requests/${channel}`).remove(); // ვასუფთავებთ მოთხოვნას
        }
    });
}








// ლაივში დამატება კამერის გამოჩენა
async function startGuestStreaming() {
    try {
        console.log("სტუმარი იწყებს მაუწყებლობას...");
        
        // --- დაზღვევა: თუ წინა მცდელობიდან ტრეკები დარჩა, ვასუფთავებთ რომ შეცდომა არ ამოაგდოს ---
        if (liveTracks.guestVideo) {
            try {
                await liveClient.unpublish([liveTracks.guestAudio, liveTracks.guestVideo]);
                liveTracks.guestVideo.close();
                liveTracks.guestAudio.close();
            } catch(e) { console.log("Cleaning tracks..."); }
        }
        // -----------------------------------------------------------------------------------

        // 1. როლის შეცვლა (აუცილებელია, რომ მაყურებელი გახდეს ჰოსტი)
        await liveClient.setClientRole("host");
        
        // 2. კამერის და მიკროფონის ჩართვა
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        const videoTrack = await AgoraRTC.createCameraVideoTrack();

        // 3. UI-ს გადართვა ტიკტოკ სტილზე (გაყოფა)
        const singleZone = document.getElementById('single-screen-zone');
        const splitZone = document.getElementById('split-screen-zone');
        
        if(singleZone && splitZone) {
            singleZone.style.display = 'none';
            splitZone.style.display = 'flex'; 
        }

        // 4. სტუმარმა საკუთარი თავი უნდა დაინახოს თავის ნახევარში
        videoTrack.play("guest-remote-video");

        // 5. ტრეკების გამოქვეყნება (რომ ჰოსტმა დაინახოს)
        await liveClient.publish([audioTrack, videoTrack]);
        
        console.log("TikTok style split screen active! ✅");

        // 6. (Optional) შევინახოთ ტრეკები, რომ მერე გავთიშოთ
        liveTracks.guestAudio = audioTrack;
        liveTracks.guestVideo = videoTrack;

    } catch (e) { 
        console.error("Guest Stream Error:", e); 
        alert("კამერის ჩართვა ვერ მოხერხდა: " + e.message);
    }
}
















// ეს ფუნქცია გამოიძახე როცა სტუმარს ათანხმებ (acceptGuest) ან როცა სტუმარი ერთვება
function updateLiveLayout(isSplit) {
    const hostWrap = document.getElementById('host-video-wrapper');
    const guestBox = document.getElementById('guest-video-box');

    if (isSplit) {
        // ეკრანის გაყოფა 50/50-ზე
        hostWrap.style.width = "50%";
        guestBox.style.display = "block";
        setTimeout(() => { guestBox.style.width = "50%"; }, 10);
    } else {
        // დაბრუნება სრულ ეკრანზე
        hostWrap.style.width = "100%";
        guestBox.style.width = "0%";
        setTimeout(() => { guestBox.style.display = "none"; }, 400);
    }
}
