// --- EMIGRANTBOOK VIDEO CALL MODULE ---
const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
let localTracks = { videoTrack: null, audioTrack: null };
let micMuted = false;
let camMuted = false;

const AGORA_APP_ID = "7290502fac7f4feb82b021ccde79988a";
const AGORA_TOKEN = "007eJxTYJhrkzvFV3rSsuA7K2fvPRDIuUSKc2P4aQm1I++W7apOCk5WYDA3sjQwNTBKS0w2TzNJS02yMEoyMDJMTk5JNbe0tLBI9J95KLMhkJHh5sOLTIwMEAjiczPkZJalxheXFKUm5jIwAABD8iNp";
const FIXED_CHANNEL = "live_stream"; 

// 1. ზარის დაწყება
async function requestVideoCall() {
    const targetUid = window.currentChatId;
    if (!targetUid) return alert("ჯერ აირჩიეთ ჩატი!");

    document.getElementById('videoCallUI').style.display = 'flex';
    document.getElementById('answerBtn').style.display = 'none'; // რადგან ჩვენ ვრეკავთ, პასუხი არ გვჭირდება

    db.ref('users/' + targetUid + '/name').once('value').then(snap => {
        document.getElementById('remote-name').innerText = snap.val() || "Emigrant";
    });

    await db.ref('video_calls/' + targetUid).set({
        callerUid: auth.currentUser.uid,
        callerName: typeof myName !== 'undefined' ? myName : "მომხმარებელი",
        channel: "live_stream",
        status: 'calling',
        ts: Date.now()
    });

    startVideoCall();
}

// 2. მთავარი ვიდეო ფუნქცია
async function startVideoCall() {
    const ui = document.getElementById('videoCallUI');
    if (!ui) return;
    ui.style.display = 'flex';
    
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
                document.getElementById('remote-label').innerText = "Connected";
                user.videoTrack.play("remote-video");
            }
            if (mediaType === "audio") user.audioTrack.play();
        });
    } catch (err) {
        endVideoCall();
    }
}

// 3. შემოსული ზარის მოსმენა (აქ ჩავასწორე!)
function listenForIncomingCalls(user) {
    db.ref(`video_calls/${user.uid}`).on('value', snap => {
        const call = snap.val();
        if (call && call.status === 'calling') {
            // ვაჩვენებთ შენს დიზაინს confirm-ის ნაცვლად
            document.getElementById('videoCallUI').style.display = 'flex';
            document.getElementById('remote-name').innerText = call.callerName;
            document.getElementById('answerBtn').style.display = 'flex'; // ვაჩენთ მწვანე ღილაკს
            
            // ვინახავთ ზარის ინფორმაციას
            window.currentIncomingCall = call;
        } else if (!call) {
            // თუ მეორე მხარემ გათიშა, ვმალავთ UI-ს
            document.getElementById('videoCallUI').style.display = 'none';
        }
    });
}

// ფუნქცია მწვანე ღილაკისთვის
function acceptIncomingCall() {
    if (window.currentIncomingCall) {
        db.ref(`video_calls/${auth.currentUser.uid}`).update({ status: 'accepted' });
        document.getElementById('answerBtn').style.display = 'none'; // ვმალავთ პასუხის ღილაკს, რადგან უკვე ვსაუბრობთ
        startVideoCall();
    }
}

// 4. ზარის დასრულება
async function endVideoCall() {
    if (localTracks.audioTrack) { localTracks.audioTrack.stop(); localTracks.audioTrack.close(); }
    if (localTracks.videoTrack) { localTracks.videoTrack.stop(); localTracks.videoTrack.close(); }
    localTracks = { videoTrack: null, audioTrack: null };

    await client.leave();
    document.getElementById('videoCallUI').style.display = 'none';

    if (window.currentChatId) db.ref(`video_calls/${window.currentChatId}`).remove();
    if (auth.currentUser) db.ref(`video_calls/${auth.currentUser.uid}`).remove();
}

// 5. მართვის ღილაკები (toggleMic, toggleCam, minimizeVideoCall უცვლელია...)
function toggleMic() {
    micMuted = !micMuted;
    if (localTracks.audioTrack) localTracks.audioTrack.setEnabled(!micMuted);
    document.getElementById('micBtn').style.background = micMuted ? '#ff4d4d' : 'rgba(255,255,255,0.2)';
}

function toggleCam() {
    camMuted = !camMuted;
    if (localTracks.videoTrack) localTracks.videoTrack.setEnabled(!camMuted);
    document.getElementById('camBtn').style.background = camMuted ? '#ff4d4d' : 'rgba(255,255,255,0.2)';
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
