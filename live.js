// --- JAVASCRIPT LOGIC ---
let liveClient = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
let liveTracks = { video: null, audio: null };
let currentLiveChannel = null;

function startLiveFunc() { toggleSideMenu(false); startLive(); }

async function startLive() {
    const appId = "7290502fac7f4feb82b021ccde79988a"; 
    const token = "007eJxTYLB6xlC05H7LAncx9mOfb0e4ZR370LxH7MZ6YwGd6+qMVqUKDOZGlgamBkZpicnmaSZpqUkWRkkGRobJySmp5paWFhaJ31PfZDYEMjKcnjqVmZEBAkF8boaczLLU+OKSotTEXAYGAD0AIxk=";
    currentLiveChannel = "live_stream"; 
    
    // UI ინიციალიზაცია (შენარჩუნებულია სახელები)
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
            document.getElementById('liveHostAva').src = host.photo || "https://ui-avatars.com/api/?name=" + host.name;
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

// ... ყველა სხვა ფუნქცია (sendLiveComment, endLive, animateHeart და ა.შ.) დატოვე უცვლელად ...
