<div id="liveUI" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:#000; z-index:99999; font-family: sans-serif; overflow: hidden;">
    
    <div id="live-video-container" style="width:100%; height:100%; background:#111; position:absolute; top:0; left:0; overflow: hidden; display: flex; flex-direction: row; align-items: center; justify-content: center; z-index: 1;">
        <div id="host-video-wrapper" style="width: 100%; height: 100%; position: relative; background: #000; transition: all 0.4s ease;">
            <div id="remote-live-video" style="width:100%; height:100%; object-fit: cover;"></div>
        </div>
        <div id="guest-video-box" style="display:none; width: 0%; height: 100%; position: relative; background: #000; border-left: 2px solid var(--gold); transition: all 0.4s ease;">
            <div id="guest-remote-video" style="width:100%; height:100%; object-fit: cover;"></div>
        </div>
    </div>

    <div id="guestRequestPanel" style="display:none; position:absolute; top:85px; left:15px; background:rgba(0,0,0,0.85); padding:10px; border-radius:12px; border:1px solid #3498db; z-index:1001; color:white; backdrop-filter: blur(10px);">
        <small id="reqUserName" style="font-weight: bold; color: #3498db;"></small> <span style="font-size: 11px;">-ს უნდა ჩართვა</span>
        <div style="margin-top:5px; display:flex; gap:5px;">
            <button onclick="acceptGuest()" style="background:#2ecc71; border:none; border-radius:5px; padding:4px 10px; color:white; font-size:11px; cursor:pointer; font-weight: bold;">ჩართვა</button>
            <button onclick="rejectGuest()" style="background:#e74c3c; border:none; border-radius:5px; padding:4px 10px; color:white; font-size:11px; cursor:pointer; font-weight: bold;">X</button>
        </div>
    </div>

    <div style="position:absolute; top:20px; left:15px; right:15px; display:flex; justify-content:space-between; align-items:center; z-index: 100;">
        <div style="display:flex; align-items:center; gap:8px; background:rgba(0,0,0,0.4); padding:4px 12px 4px 4px; border-radius:30px; backdrop-filter: blur(10px); border: 0.5px solid rgba(255,255,255,0.2); cursor: pointer;" 
             onclick="followHostLive(currentLiveChannel ? currentLiveChannel.replace('live_', '') : '')">
            <img id="liveHostAva" src="" style="width:36px; height:36px; border-radius:50%; border:1.5px solid var(--gold); object-fit: cover;">
            <div style="overflow: hidden; max-width: 100px;"> 
                <b id="liveHostName" style="color:white; font-size:12px; display:block; white-space: nowrap; text-overflow: ellipsis;">Host</b>
                <div style="display: flex; align-items: center; gap: 4px; color:rgba(255,255,255,0.8); font-size:10px;">
                    <small id="liveViewerCountDisplay"><i class="fas fa-eye" style="color: var(--gold);"></i> <span id="vCount">0</span></small>
                    <span style="color: rgba(255,255,255,0.5);">|</span>
                    <small id="liveLikeCountDisplay"><i class="fas fa-heart" style="color: #ff4d4d;"></i> <span id="liveLikeCount">0</span></small>
                </div>
            </div>
            <button id="followHostBtn" style="background:var(--gold); border:none; border-radius:20px; padding:6px 12px; font-size:11px; font-weight:900; margin-left:5px; cursor: pointer;">Follow</button>
        </div>
        <div id="viewerAvatars" style="display:flex; gap:-10px; align-items:center;"></div>
    </div>

    <div id="liveChatBox" style="position:absolute; bottom:90px; left:15px; width:75%; max-height:240px; overflow-y:auto; display:flex; flex-direction:column; gap:8px; z-index: 50; pointer-events:auto; mask-image: linear-gradient(to top, black 80%, transparent 100%);"></div>
    
    <div style="position:absolute; bottom:20px; left:0; width:100%; padding:0 15px; display:flex; gap:10px; align-items: center; z-index: 100;">
        <div style="flex:1; position: relative;">
            <input type="text" id="liveMsgInp" style="width:100%; background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.2); border-radius:25px; padding:12px 20px; color:white; outline:none; backdrop-filter: blur(10px);" placeholder="თქვი რამე...">
        </div>
        
        <button onclick="sendLiveComment()" style="background:var(--gold); border:none; width:45px; height:45px; border-radius:50%; color:black; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(212,175,55,0.3); cursor: pointer;">
            <i class="fas fa-paper-plane"></i>
        </button>

        <div style="display:flex; gap:12px; align-items: center;">
            <div id="requestJoinBtn" class="live-action-btn" onclick="sendJoinRequest()" style="display:none; cursor: pointer;"><i class="fas fa-hand-paper" style="color:#3498db; font-size:28px;"></i></div>
            <div class="live-action-btn" onclick="sendLiveHeart()" style="cursor: pointer;"><i class="fas fa-heart" style="color:#ff4d4d; font-size:32px;"></i></div>
            <div class="live-action-btn" onclick="toggleGiftPanel()" style="cursor: pointer;"><i class="fas fa-gift" style="color:var(--gold); font-size:32px;"></i></div>
            <div class="live-action-btn" onclick="shareLive()" style="cursor: pointer;"><i class="fas fa-share" style="color:white; font-size:28px;"></i></div>
            <div class="live-action-btn" onclick="endLive()" style="cursor: pointer;"><i class="fas fa-times-circle" style="color:rgba(255,255,255,0.6); font-size:28px;"></i></div>
        </div>
    </div>

    <div id="giftPanel" style="display:none; position:absolute; bottom:0; left:0; width:100%; background:rgba(15,15,15,0.98); border-top:1px solid rgba(212,175,55,0.5); padding:25px 20px; border-radius:25px 25px 0 0; z-index:100000; backdrop-filter: blur(20px);"></div>
</div>


// --- JAVASCRIPT - შენი სრული ორიგინალი ლოგიკა ---
let liveClient = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
let liveTracks = { video: null, audio: null };
let currentLiveChannel = null;

function **startLiveFunc**() { toggleSideMenu(false); startLive(); }

async function **startLive**() {
    const appId = "7290502fac7f4feb82b021ccde79988a"; 
    const token = "007eJxTYLB6xlC05H7LAncx9mOfb0e4ZR370LxH7MZ6YwGd6+qMVqUKDOZGlgamBkZpicnmaSZpqUkWRkkGRobJySmp5paWFhaJ31PfZDYEMjKcnjqVmZEBAkF8boaczLLU+OKSotTEXAYGAD0AIxk=";
    
    currentLiveChannel = "live_stream"; 
    
    // ამოღებულია setAttribute, რომ სრულ ეკრანზე დარჩეს
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
        console.log("Live started ✅");
    } catch (e) { console.error(e); }
}

async function **joinLive**(hostUid, channelName) {
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

function **listenToLiveChat**(channel) {
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

function **sendLiveComment**() {
    const inp = document.getElementById('liveMsgInp');
    if(!inp.value.trim() || !currentLiveChannel) return;
    db.ref(`live_chats/${currentLiveChannel}`).push({ name: myName, photo: myPhoto, text: inp.value, ts: Date.now() });
    inp.value = "";
}

function **updateLiveLayout**(isSplit) {
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

async function **endLive**() {
    if(currentLiveChannel) updateViewerCount(currentLiveChannel, 'leave');
    if (liveTracks.video) { liveTracks.video.stop(); liveTracks.video.close(); }
    if (liveTracks.audio) { liveTracks.audio.stop(); liveTracks.audio.close(); }
    await liveClient.leave();
    document.getElementById('liveUI').style.display = 'none';
    currentLiveChannel = null;
}

function **sendLiveHeart**() {
    if(!currentLiveChannel) return;
    animateHeart();
    db.ref(`lives_meta/${currentLiveChannel}/likes`).transaction(c => (c || 0) + 1);
}

function **animateHeart**() {
    const container = document.getElementById('live-video-container');
    const heart = document.createElement('i');
    heart.className = "fas fa-heart";
    heart.style = `position:absolute; right:20px; bottom:100px; color:hsl(${Math.random()*360},100%,70%); font-size:24px; transition:all 1.5s ease-out; z-index:100; pointer-events:none;`;
    container.appendChild(heart);
    setTimeout(() => { heart.style.bottom = "400px"; heart.style.opacity = "0"; }, 50);
    setTimeout(() => heart.remove(), 1500);
}

function **toggleGiftPanel**() { 
    const p = document.getElementById('giftPanel'); 
    p.style.display = p.style.display === 'none' ? 'block' : 'none'; 
}

function **listenToViewers**(channel) {
    db.ref(`lives_meta/${channel}/viewers`).on('value', snap => {
        const viewers = snap.val() || {};
        document.getElementById('vCount').innerText = Object.keys(viewers).length;
        const avDiv = document.getElementById('viewerAvatars');
        avDiv.innerHTML = "";
        Object.values(viewers).slice(-3).forEach(v => {
            avDiv.innerHTML += `<img src="${v.photo}" style="width:24px; height:24px; border-radius:50%; border:1px solid white; margin-left:-8px;">`;
        });
    });
}

function **listenToLikes**(channel) {
    db.ref(`lives_meta/${channel}/likes`).on('value', snap => {
        document.getElementById('liveLikeCount').innerText = snap.val() || 0;
    });
}

function **listenForRequests**(channel) {
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

function **acceptGuest**() { db.ref(`live_requests/${currentLiveChannel}`).update({ status: 'accepted' }); }
function **rejectGuest**() { db.ref(`live_requests/${currentLiveChannel}`).remove(); }

function **listenForResponse**(channel) {
    db.ref(`live_requests/${channel}`).on('value', snap => {
        const req = snap.val();
        if(req && req.uid === auth.currentUser.uid && req.status === 'accepted') {
            startGuestStreaming();
            db.ref(`live_requests/${channel}`).remove();
        }
    });
}

async function **startGuestStreaming**() {
    try {
        await liveClient.setClientRole("host");
        const audio = await AgoraRTC.createMicrophoneAudioTrack();
        const video = await AgoraRTC.createCameraVideoTrack();
        updateLiveLayout(true);
        video.play("guest-remote-video");
        await liveClient.publish([audio, video]);
    } catch (e) { console.log(e); }
}

function **updateViewerCount**(channel, action) {
    const vRef = db.ref(`lives_meta/${channel}/viewers/${auth.currentUser.uid}`);
    action === 'join' ? vRef.set({ name: myName, photo: myPhoto }) : vRef.remove();
}
