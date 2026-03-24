// --- EMIGRANTBOOK VIDEO CALL MODULE ---
const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
let localTracks = { videoTrack: null, audioTrack: null };
let micMuted = false;
let camMuted = false;

const AGORA_APP_ID = "7290502fac7f4feb82b021ccde79988a";
const AGORA_TOKEN = "007eJxTYJhrkzvFV3rSsuA7K2fvPRDIuUSKc2P4aQm1I++W7apOCk5WYDA3sjQwNTBKS0w2TzNJS02yMEoyMDJMTk5JNbe0tLBI9J95KLMhkJHh5sOLTIwMEAjiczPkZJalxheXFKUm5jIwAABD8iNp";
const FIXED_CHANNEL = "live_stream"; 

// 1. ზარის დაწყება (როცა შენ რეკავ)
async function requestVideoCall() {
    const targetUid = window.currentChatId;
    if (!targetUid) return alert("ჯერ აირჩიეთ ჩატი!");

    // ჯერ არ ვხსნით ვიდეო ეკრანს, ვავსებთ მხოლოდ სახელს
    db.ref('users/' + targetUid + '/name').once('value').then(snap => {
        const rName = document.getElementById('remote-name-display'); // შევუსაბამე შენს ბოლო HTML-ს
        if(rName) rName.innerText = snap.val() || "Emigrant";
    });

    await db.ref('video_calls/' + targetUid).set({
        callerUid: auth.currentUser.uid,
        callerName: typeof myName !== 'undefined' ? myName : "მომხმარებელი",
        channel: "live_stream",
        status: 'calling',
        ts: Date.now() // დროის შტამპი აუცილებელია
    });

    startVideoCall(); 
}

// 2. მთავარი ვიდეო ფუნქცია
async function startVideoCall() {
    const ui = document.getElementById('videoCallUI');
    if (!ui) return;

    ui.style.display = 'flex'; // მხოლოდ აქ იხსნება საუბრის ეკრანი
    
    try {
        const uid = Math.floor(Math.random() * 10000);
        await client.join(AGORA_APP_ID, FIXED_CHANNEL, AGORA_TOKEN, uid);
        
        localTracks.audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        localTracks.videoTrack = await AgoraRTC.createCameraVideoTrack();
        
        localTracks.videoTrack.play("local-video");
        await client.publish([localTracks.audioTrack, localTracks.videoTrack]);

        client.on("user-published", async (user, mediaType) => {
            await client.subscribe(user, mediaType);
            if (mediaType === "video") {
                const remoteLabel = document.getElementById('remote-label');
                if (remoteLabel) remoteLabel.innerText = "Connected";
                user.videoTrack.play("remote-video");
            }
            if (mediaType === "audio") user.audioTrack.play();
        });

    } catch (err) {
        console.error("Agora Error:", err);
        endVideoCall();
    }
}

// 3. შემოსული ზარის მოსმენა
const ringtone = document.getElementById('ringtone');

function listenForIncomingCalls(user) {
    db.ref(`video_calls/${user.uid}`).on('value', snap => {
        const call = snap.val();
        const now = Date.now();

        // ვამოწმებთ: არის თუ არა ზარი "calling" და არის თუ არა ის ახალი (ბოლო 30 წამში დაწყებული)
        if (call && call.status === 'calling' && (now - call.ts < 30000)) {
            const incomingUI = document.getElementById('incomingCallUI');
            if (incomingUI && incomingUI.style.display !== 'flex') {
                document.getElementById('incomingName').innerText = call.callerName;
                incomingUI.style.display = 'flex';
                
                if(ringtone) {
                    ringtone.play().catch(e => console.log("Ringtone blocked by browser"));
                }
                window.activeIncomingCall = call;
            }
        } else {
            // თუ ზარი აღარ არის ან ძველია, ვთიშავთ ყველაფერს
            stopRingtone();
            const incUI = document.getElementById('incomingCallUI');
            if(incUI) incUI.style.display = 'none';
        }
    });
}

function acceptIncomingCall() {
    stopRingtone();
    const call = window.activeIncomingCall;
    if (call) {
        db.ref(`video_calls/${auth.currentUser.uid}`).update({ status: 'accepted' });
    }
    document.getElementById('incomingCallUI').style.display = 'none';
    startVideoCall();
}

function rejectIncomingCall() {
    stopRingtone();
    db.ref(`video_calls/${auth.currentUser.uid}`).remove();
    document.getElementById('incomingCallUI').style.display = 'none';
}

function stopRingtone() {
    if (ringtone) {
        ringtone.pause();
        ringtone.currentTime = 0;
    }
}

// 4. ზარის დასრულება
async function endVideoCall() {
    if (localTracks.audioTrack) { localTracks.audioTrack.stop(); localTracks.audioTrack.close(); }
    if (localTracks.videoTrack) { localTracks.videoTrack.stop(); localTracks.videoTrack.close(); }
    localTracks = { videoTrack: null, audioTrack: null };

    await client.leave();
    document.getElementById('videoCallUI').style.display = 'none';
    stopRingtone();

    if (window.currentChatId) db.ref(`video_calls/${window.currentChatId}`).remove();
    if (auth.currentUser) db.ref(`video_calls/${auth.currentUser.uid}`).remove();
}

// 5. მართვის ღილაკები
function toggleMic() {
    micMuted = !micMuted;
    if (localTracks.audioTrack) localTracks.audioTrack.setEnabled(!micMuted);
    document.getElementById('micBtn').style.background = micMuted ? 'rgba(255, 77, 77, 0.6)' : 'rgba(255, 255, 255, 0.2)';
}

function toggleCam() {
    camMuted = !camMuted;
    if (localTracks.videoTrack) localTracks.videoTrack.setEnabled(!camMuted);
    document.getElementById('camBtn').style.background = camMuted ? 'rgba(255, 77, 77, 0.6)' : 'rgba(255, 255, 255, 0.2)';
}

function minimizeVideoCall() {
    const ui = document.getElementById('videoCallUI');
    if (!ui) return;
    if (ui.style.width !== '150px') {
        ui.style.width = '150px'; ui.style.height = '220px';
        ui.style.top = '80px'; ui.style.left = '20px';
        ui.style.borderRadius = '20px'; ui.style.border = '2px solid #d4af37';
    } else {
        ui.style.width = '100%'; ui.style.height = '100%';
        ui.style.top = '0'; ui.style.left = '0';
        ui.style.borderRadius = '0'; ui.style.border = 'none';
    }
}
