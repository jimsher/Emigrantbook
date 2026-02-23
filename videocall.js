// --- VIDEO CALL MODULE ---
const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
let localTracks = { videoTrack: null, audioTrack: null };

// 1. ზარის დაწყება
async function startVideoCall(existingChannel = null) {
    const appId = "7290502fac7f4feb82b021ccde79988a"; 
    const token = "007eJxTYFgrtKl5zZcZTp8DF9l9v9mSfkjWouDEm/el4ZFBlzfvZWFQYDA3sjQwNTBKS0w2TzNJS02yMEoyMDJMTk5JNbe0tLBI7N4wJ7MhkJFBO7KfhZEBAkF8boaczLLU+OKSotTEXAYGAN4zJBQ=";
    const channel = "live_stream"; 
    const ui = document.getElementById('videoCallUI');
    
    ui.style.display = 'flex'; 
    ui.style.zIndex = "200000";

    try {
        const uid = Math.floor(Math.random() * 10000);
        await client.join(appId, channel, token, uid);
        
        localTracks.audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        localTracks.videoTrack = await AgoraRTC.createCameraVideoTrack();
        
        localTracks.videoTrack.play("local-video");
        await client.publish([localTracks.audioTrack, localTracks.videoTrack]);

        // თუ ჩვენ ვიწყებთ ზარს, ბაზაში ვაგზავნით მოთხოვნას
        if (!existingChannel) {
            db.ref(`video_calls/${currentChatId}`).set({ 
                callerName: myName, 
                callerPhoto: myPhoto, 
                callerUid: auth.currentUser.uid, 
                channel: channel, 
                status: 'calling', 
                ts: Date.now() 
            });
        }
    } catch (err) { 
        console.error("Video Call Error:", err);
        endVideoCall(); 
    }
}

// 2. ზარის დასრულება
async function endVideoCall() {
    if (localTracks.audioTrack) { 
        localTracks.audioTrack.stop(); 
        localTracks.audioTrack.close(); 
    }
    if (localTracks.videoTrack) { 
        localTracks.videoTrack.stop(); 
        localTracks.videoTrack.close(); 
    }
    localTracks = { videoTrack: null, audioTrack: null };
    
    await client.leave();
    document.getElementById('videoCallUI').style.display = 'none';
    
    // ბაზიდან ვშლით ზარის ჩანაწერს
    if(currentChatId) db.ref(`video_calls/${currentChatId}`).remove();
    if(auth.currentUser) db.ref(`video_calls/${auth.currentUser.uid}`).remove();
}

// 3. ფანჯრის დაპატარავება/გადიდება
function minimizeVideoCall() {
    const ui = document.getElementById('videoCallUI');
    if(ui.style.width === '100%') {
        ui.style.width = '140px'; 
        ui.style.height = '200px'; 
        ui.style.top = '70px'; 
        ui.style.left = '10px'; 
        ui.style.borderRadius = '15px'; 
        ui.style.border = '2px solid var(--gold)';
    } else {
        ui.style.width = '100%'; 
        ui.style.height = '100%'; 
        ui.style.top = '0'; 
        ui.style.left = '0'; 
        ui.style.borderRadius = '0'; 
        ui.style.border = 'none';
    }
}

// 4. შემოსული ზარის მოსმენა (ეს ფუნქცია გამოიძახე auth.onAuthStateChanged-ში)
function listenForIncomingCalls(user) {
    db.ref(`video_calls/${user.uid}`).on('value', snap => {
        const call = snap.val();
        if (call && call.status === 'calling') {
            if (confirm(`${call.callerName} გირეკავთ ვიდეო ზარით. უპასუხებთ?`)) {
                currentChatId = call.callerUid; 
                startVideoCall(call.channel);
                db.ref(`video_calls/${user.uid}`).update({ status: 'accepted' });
            } else {
                db.ref(`video_calls/${user.uid}`).remove();
            }
        }
    });
}
