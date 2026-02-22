// --- VIDEO CALL MODULE (videocall.js) ---
const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
let localTracks = { videoTrack: null, audioTrack: null };

async function startVideoCall(existingChannel = null) {
    // ვიღებთ მონაცემებს გლობალური ფანჯრიდან
    const database = window.db;
    const targetUid = window.currentChatId;

    if (!database) {
        alert("Firebase connection error!");
        return;
    }

    if (!targetUid && !existingChannel) {
        alert("ჯერ აირჩიეთ ჩატი!");
        return;
    }

    const appId = "7290502fac7f4feb82b021ccde79988a"; 
    const token = "007eJxTYHjuUsbf/kPswi7dW9OuT2ywvjBtv5XPYkdtPofrzS5ztX4oMJgbWRqYGhilJSabp5mkpSZZGCUZGBkmJ6ekmltaWlgkMk/ryWwIZGRotNBnYmSAQBCfmyEnsyw1vrikKDUxl4EBAEnPIfQ=";
    const channel = existingChannel || "live_stream_" + Math.floor(Math.random() * 1000); 

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

        // ზარის მოთხოვნის გაგზავნა
        if (!existingChannel) {
            database.ref(`video_calls/${targetUid}`).set({ 
                callerName: window.myName || "User", 
                callerPhoto: window.myPhoto || "", 
                callerUid: window.auth.currentUser.uid, 
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

async function endVideoCall() {
    if (localTracks.audioTrack) { localTracks.audioTrack.stop(); localTracks.audioTrack.close(); }
    if (localTracks.videoTrack) { localTracks.videoTrack.stop(); localTracks.videoTrack.close(); }
    localTracks = { videoTrack: null, audioTrack: null };
    
    await client.leave();
    document.getElementById('videoCallUI').style.display = 'none';
    
    if(window.currentChatId) window.db.ref(`video_calls/${window.currentChatId}`).remove();
    if(window.auth.currentUser) window.db.ref(`video_calls/${window.auth.currentUser.uid}`).remove();
}

function minimizeVideoCall() {
    const ui = document.getElementById('videoCallUI');
    if(ui.style.width === '100%') {
        ui.style.width = '140px'; ui.style.height = '200px'; ui.style.top = '70px'; ui.style.left = '10px'; ui.style.borderRadius = '15px'; ui.style.border = '2px solid var(--gold)';
    } else {
        ui.style.width = '100%'; ui.style.height = '100%'; ui.style.top = '0'; ui.style.left = '0'; ui.style.borderRadius = '0'; ui.style.border = 'none';
    }
}

function listenForIncomingCalls(user) {
    window.db.ref(`video_calls/${user.uid}`).on('value', snap => {
        const call = snap.val();
        if (call && call.status === 'calling') {
            if (confirm(`${call.callerName} გირეკავთ ვიდეო ზარით. უპასუხებთ?`)) {
                window.currentChatId = call.callerUid; 
                startVideoCall(call.channel);
                window.db.ref(`video_calls/${user.uid}`).update({ status: 'accepted' });
            } else {
                window.db.ref(`video_calls/${user.uid}`).remove();
            }
        }
    });
}
