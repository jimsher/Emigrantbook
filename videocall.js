         // --- VIDEO CALL MODULE (videocall.js) ---
const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
let localTracks = { videoTrack: null, audioTrack: null };

async function startVideoCall(existingChannel = null) {
    // ვიყენებთ window.db-ს, რომ ნებისმიერ დროს მიწვდეს
    const database = window.db || (typeof db !== 'undefined' ? db : null);
    if (!database) return console.error("Database not found!");

    const appId = "7290502fac7f4feb82b021ccde79988a"; 
    const token = "007eJxTYHjuUsbf/kPswi7dW9OuT2ywvjBtv5XPYkdtPofrzS5ztX4oMJgbWRqYGhilJSabp5mkpSZZGCUZGBkmJ6ekmltaWlgkMk/ryWwIZGRotNBnYmSAQBCfmyEnsyw1vrikKDUxl4EBAEnPIfQ=";
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

        if (!existingChannel) {
            database.ref(`video_calls/${window.currentChatId}`).set({ 
                callerName: window.myName || "User", 
                callerPhoto: window.myPhoto || "", 
                callerUid: firebase.auth().currentUser.uid, 
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
    const database = window.db || (typeof db !== 'undefined' ? db : null);
    if (localTracks.audioTrack) { localTracks.audioTrack.stop(); localTracks.audioTrack.close(); }
    if (localTracks.videoTrack) { localTracks.videoTrack.stop(); localTracks.videoTrack.close(); }
    localTracks = { videoTrack: null, audioTrack: null };
    
    await client.leave();
    document.getElementById('videoCallUI').style.display = 'none';
    
    if(database) {
        if(window.currentChatId) database.ref(`video_calls/${window.currentChatId}`).remove();
        if(firebase.auth().currentUser) database.ref(`video_calls/${firebase.auth().currentUser.uid}`).remove();
    }
}

function minimizeVideoCall() {
    const ui = document.getElementById('videoCallUI');
    if(ui.style.width === '100%') {
        ui.style.width = '140px'; ui.style.height = '200px'; ui.style.top = '70px'; ui.style.left = '10px'; ui.style.borderRadius = '15px'; ui.style.border = '2px solid var(--gold)';
    } else {
        ui.style.width = '100%'; ui.style.height = '100%'; ui.style.top = '0'; ui.style.left = '0'; ui.style.borderRadius = '0'; ui.style.border = 'none';
    }
}

// ეს ფუნქცია უკვე აღარ გამოიყენებს გლობალურ db-ს პირდაპირ
function listenForIncomingCalls(user) {
    const database = window.db || (typeof db !== 'undefined' ? db : null);
    if(!database) {
        setTimeout(() => listenForIncomingCalls(user), 1000); // დაველოდოთ ბაზას
        return;
    }
    database.ref(`video_calls/${user.uid}`).on('value', snap => {
        const call = snap.val();
        if (call && call.status === 'calling') {
            if (confirm(`${call.callerName} გირეკავთ ვიდეო ზარით. უპასუხებთ?`)) {
                window.currentChatId = call.callerUid; 
                startVideoCall(call.channel);
                database.ref(`video_calls/${user.uid}`).update({ status: 'accepted' });
            } else {
                database.ref(`video_calls/${user.uid}`).remove();
            }
        }
    });
}
