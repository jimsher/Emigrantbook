// --- სრული ვიდეო ზარის ლოგიკა (გასწორებული) ---
const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
let localTracks = { videoTrack: null, audioTrack: null };
let micMuted = false;
let camMuted = false;

// მუდმივები - დარწმუნდი, რომ ტოკენი აღებულია ზუსტად ამ არხის სახელზე: "live_stream"
const AGORA_APP_ID = "7290502fac7f4feb82b021ccde79988a";
const AGORA_TOKEN = "007eJxTYNjw1J2jY5H35PN35lyqcL/8ze5Q3U+jLTZfHlux7FNbdGK3AoO5kaWBqYFRWmKyeZpJWmqShVGSgZFhcnJKqrmlpYVFYsThOZkNgYwMPWo8DIxQCOJzM+RklqXGF5cUpSbmMjAAACBWJKo=";
const FIXED_CHANNEL = "live_stream"; 

// 1. ზარის მოთხოვნის გაგზავნა
async function requestVideoCall() {
    const targetUid = window.currentChatId;
    if (!targetUid) return alert("აირჩიეთ ჩატი!");

    console.log("Calling to:", targetUid);

    // Firebase-ში ზარის დაფიქსირება - ვიყენებთ ფიქსირებულ არხს ტოკენის გამო
    await db.ref(`video_calls/${targetUid}`).set({
        callerUid: auth.currentUser.uid,
        callerName: myName,
        callerPhoto: myPhoto,
        channel: FIXED_CHANNEL, 
        status: 'calling',
        ts: Date.now()
    });

    // ჩვენთან ვიდეოს ჩართვა
    startVideoCall(FIXED_CHANNEL);
}

// 2. მთავარი Agora ფუნქცია
async function startVideoCall(channelName) {
    const ui = document.getElementById('videoCallUI');
    if (!ui) return;

    ui.style.display = 'flex';
    ui.style.width = '100%';
    ui.style.height = '100%';
    ui.style.position = 'fixed';
    ui.style.zIndex = '9999999';

    try {
        // შემთხვევითი UID მომხმარებლისთვის
        const uid = Math.floor(Math.random() * 10000);
        
        // Agora-ში შესვლა (ვიყენებთ FIXED_CHANNEL-ს და ტოკენს)
        await client.join(AGORA_APP_ID, FIXED_CHANNEL, AGORA_TOKEN, uid);
        
        // ხმის და ვიდეოს შექმნა
        localTracks.audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        localTracks.videoTrack = await AgoraRTC.createCameraVideoTrack();
        
        // ჩვენი თავის ჩვენება
        localTracks.videoTrack.play("local-video");
        
        // გასაჯაროება
        await client.publish([localTracks.audioTrack, localTracks.videoTrack]);

        // სხვისი გამოჩენის ლოგიკა
        client.on("user-published", async (user, mediaType) => {
            await client.subscribe(user, mediaType);
            if (mediaType === "video") {
                const remoteLabel = document.getElementById('remote-label');
                if (remoteLabel) remoteLabel.innerText = "Connected";
                user.videoTrack.play("remote-video");
            }
            if (mediaType === "audio") {
                user.audioTrack.play();
            }
        });

        client.on("user-left", (user) => {
            alert("მომხმარებელი გავიდა ზარიდან");
            endVideoCall();
        });

    } catch (err) {
        console.error("Agora Error:", err);
        // თუ აქ დაწერა "Invalid Token", ნიშნავს რომ ტოკენს ვადა გაუვიდა
        alert("ზარი ვერ შედგა. შესაძლოა ტოკენის ვადა ამოიწურა.");
        endVideoCall();
    }
}

// 3. ზარის დასრულება
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
    
    const ui = document.getElementById('videoCallUI');
    if (ui) ui.style.display = 'none';

    // Firebase-დან წაშლა
    const targetUid = window.currentChatId;
    if (targetUid) db.ref(`video_calls/${targetUid}`).remove();
    if (auth.currentUser) db.ref(`video_calls/${auth.currentUser.uid}`).remove();
}

// 4. კონტროლერები
function toggleMic() {
    micMuted = !micMuted;
    if (localTracks.audioTrack) {
        localTracks.audioTrack.setEnabled(!micMuted);
        document.getElementById('micBtn').style.background = micMuted ? '#ff4d4d' : '#333';
    }
}

function toggleCam() {
    camMuted = !camMuted;
    if (localTracks.videoTrack) {
        localTracks.videoTrack.setEnabled(!camMuted);
        document.getElementById('camBtn').style.background = camMuted ? '#ff4d4d' : '#333';
    }
}

function minimizeVideoCall() {
    const ui = document.getElementById('videoCallUI');
    if (!ui) return;
    if (ui.style.width === '100%') {
        ui.style.width = '150px';
        ui.style.height = '220px';
        ui.style.top = '80px';
        ui.style.left = '20px';
        ui.style.borderRadius = '20px';
        ui.style.overflow = 'hidden';
        ui.style.border = '2px solid #d4af37';
    } else {
        ui.style.width = '100%';
        ui.style.height = '100%';
        ui.style.top = '0';
        ui.style.left = '0';
        ui.style.borderRadius = '0';
        ui.style.border = 'none';
    }
}
