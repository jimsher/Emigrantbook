// --- TIKTOK STYLE LIVE LOGIC ---
let liveClient = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
let liveTracks = { video: null, audio: null };
let currentLiveChannel = null;

async function startLive() {
    const appId = "7290502fac7f4feb82b021ccde79988a"; 
    const token = "007eJxTYLB6xlC05H7LAncx9mOfb0e4ZR370LxH7MZ6YwGd6+qMVqUKDOZGlgamBkZpicnmaSZpqUkWRkkGRobJySmp5paWFhaJ31PfZDYEMjKcnjqVmZEBAkF8boaczLLU+OKSotTEXAYGAD0AIxk=";
    currentLiveChannel = "live_stream"; 
    
    // UI ინიციალიზაცია (ზედმეტი სტილების გარეშე)
    document.getElementById('liveUI').style.display = 'flex';
    document.getElementById('liveHostName').innerText = myName;
    document.getElementById('liveHostAva').src = myPhoto;

    try {
        await liveClient.leave(); 
        await liveClient.setClientRole("host");
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
        
        await liveClient.publish([liveTracks.audio, liveTracks.video]);

        db.ref(`lives/${auth.currentUser.uid}`).set({ 
            hostId: auth.currentUser.uid, hostName: myName, hostPhoto: myPhoto, 
            channel: currentLiveChannel, status: 'active', ts: Date.now() 
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
    document.getElementById('requestJoinBtn').style.display = 'block';

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
        div.style = "display:flex; align-items:flex-start; gap:8px; margin-bottom:6px; background:rgba(0,0,0,0.3); padding:6px 12px; border-radius:15px; width:fit-content; max-width:90%;";
        div.innerHTML = `
            <img src="${msg.photo}" style="width:28px; height:28px; border-radius:50%;">
            <div>
                <b style="color:#d4af37; font-size:11px; display:block;">${msg.name}</b>
                <span style="color:white; font-size:13px;">${msg.text}</span>
            </div>`;
        chatBox.appendChild(div);
        chatBox.scrollTop = chatBox.scrollHeight;
    });
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

function sendLiveComment() {
    const inp = document.getElementById('liveMsgInp');
    if(!inp.value.trim()) return;
    db.ref(`live_chats/${currentLiveChannel}`).push({ 
        name: myName, photo: myPhoto, text: inp.value, ts: Date.now() 
    });
    inp.value = "";
}

async function endLive() {
    if(currentLiveChannel) updateViewerCount(currentLiveChannel, 'leave');
    if (liveTracks.video) { liveTracks.video.stop(); liveTracks.video.close(); }
    await liveClient.leave();
    document.getElementById('liveUI').style.display = 'none';
    currentLiveChannel = null;
}
