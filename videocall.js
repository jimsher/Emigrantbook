// --- EMIGRANTBOOK VIDEO CALL MODULE ---
const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
let localTracks = { videoTrack: null, audioTrack: null };
let micMuted = false;
let camMuted = false;

// კონფიგურაცია - ერთი და იგივე მონაცემები ორივე მხარისთვის
const AGORA_APP_ID = "7290502fac7f4feb82b021ccde79988a";
const AGORA_TOKEN = "007eJxTYJhrkzvFV3rSsuA7K2fvPRDIuUSKc2P4aQm1I++W7apOCk5WYDA3sjQwNTBKS0w2TzNJS02yMEoyMDJMTk5JNbe0tLBI9J95KLMhkJHh5sOLTIwMEAjiczPkZJalxheXFKUm5jIwAABD8iNp";

const FIXED_CHANNEL = "live_stream"; 

// 1. ზარის დაწყება (როცა შენ რეკავ)
async function requestVideoCall() {
    const targetUid = window.currentChatId;
    if (!targetUid) return alert("ჯერ აირჩიეთ ჩატი!");

    // UI-ს მომზადება (კამერის ჩართვამდე)
    const ui = document.getElementById('videoCallUI');
    if(ui) ui.style.display = 'flex';

    // ბაზიდან სახელის ამოღება, რომ "ლევანი" არ ეწეროს
    db.ref('users/' + targetUid + '/name').once('value').then(snap => {
        const rName = document.getElementById('remote-name');
        if(rName) rName.innerText = snap.val() || "Emigrant";
    });

    // შენი ორიგინალი Firebase ლოგიკა
    await db.ref('video_calls/' + targetUid).set({
        callerUid: auth.currentUser.uid,
        callerName: typeof myName !== 'undefined' ? myName : "მომხმარებელი",
        channel: "live_stream",
        status: 'calling',
        ts: Date.now()
    });

    startVideoCall(); // ეს რთავს აგორას და კამერას
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

        // სხვისი ვიდეოს გამოჩენა
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
        alert("ვიდეო ზარი ვერ შედგა. შეამოწმეთ კამერა ან ტოკენი.");
        endVideoCall();
    }
}

// 3. შემოსული ზარის მოსმენა (ეს უნდა იდოს auth.onAuthStateChanged-ში)
// 2. listenForIncomingCalls-ში (როცა გირეკავენ)
function listenForIncomingCalls(user) {
    db.ref(`video_calls/${user.uid}`).on('value', snap => {
        const call = snap.val();
        if (call && call.status === 'calling') {
            // აქ ვსვამთ იმის სახელს ვინც გვირეკავს
            document.getElementById('remote-name').innerText = call.callerName;
            
            if (confirm(`${call.callerName} გირეკავთ...`)) {
                // ... შენი accepted ლოგიკა ...
            }
        }
    });
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

// 5. მართვის ღილაკები
function toggleMic() {
    micMuted = !micMuted;
    if (localTracks.audioTrack) localTracks.audioTrack.setEnabled(!micMuted);
    document.getElementById('micBtn').style.background = micMuted ? '#ff4d4d' : '#333';
}

function toggleCam() {
    camMuted = !camMuted;
    if (localTracks.videoTrack) localTracks.videoTrack.setEnabled(!camMuted);
    document.getElementById('camBtn').style.background = camMuted ? '#ff4d4d' : '#333';
}

function minimizeVideoCall() {
    const ui = document.getElementById('videoCallUI');
    if (!ui) return;
    if (ui.style.width === '100%') {
        ui.style.width = '150px'; ui.style.height = '220px';
        ui.style.top = '80px'; ui.style.left = '20px';
        ui.style.borderRadius = '20px'; ui.style.border = '2px solid #d4af37';
    } else {
        ui.style.width = '100%'; ui.style.height = '100%';
        ui.style.top = '0'; ui.style.left = '0';
        ui.style.borderRadius = '0'; ui.style.border = 'none';
    }
}


















// 1. ფუნქცია პასუხისთვის (მწვანე ღილაკი)
async function acceptCall() {
    // ბაზაში ვცვლით სტატუსს, რომ იუზერმა უპასუხა
    if (window.activeIncomingCall) {
        await db.ref(`video_calls/${auth.currentUser.uid}`).update({ 
            status: 'accepted' 
        });
    }

    // ვმალავთ ამ ფანჯარას
    document.getElementById('incomingCallModal').style.display = 'none';

    // ვრთავთ შენს ორიგინალ ვიდეო ფუნქციას
    startVideoCall();
}

// 2. ფუნქცია უარყოფისთვის (წითელი ღილაკი)
function declineCall() {
    // ბაზიდან ვშლით ზარის მოთხოვნას
    db.ref(`video_calls/${auth.currentUser.uid}`).remove();
    
    // ვმალავთ ფანჯარას
    document.getElementById('incomingCallModal').style.display = 'none';
}
