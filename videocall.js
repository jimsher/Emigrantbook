        // --- სრული ვიდეო ზარის ლოგიკა ---
const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
let localTracks = { videoTrack: null, audioTrack: null };
let micMuted = false;
let camMuted = false;

// 1. ზარის მოთხოვნის გაგზავნა (როცა ღილაკს აჭერ ჩატში)
async function requestVideoCall() {
    const targetUid = window.currentChatId;
    if (!targetUid) return alert("აირჩიეთ ჩატი!");

    // უნიკალური ოთახის სახელი
    const channelName = "call_" + auth.currentUser.uid + "_" + Date.now();
    
    // Firebase-ში ზარის დაფიქსირება
    await db.ref(`video_calls/${targetUid}`).set({
        callerUid: auth.currentUser.uid,
        callerName: myName,
        callerPhoto: myPhoto,
        channel: channelName,
        status: 'calling',
        ts: Date.now()
    });

    // ჩვენთან ვიდეოს ჩართვა
    startVideoCall(channelName);
}

// 2. მთავარი Agora ფუნქცია
async function startVideoCall(channelName) {
    const appId = "7290502fac7f4feb82b021ccde79988a"; 
const token = "007eJxTYNjw1J2jY5H35PN35lyqcL/8ze5Q3U+jLTZfHlux7FNbdGK3AoO5kaWBqYFRWmKyeZpJWmqShVGSgZFhcnJKqrmlpYVFYsThOZkNgYwMPWo8DIxQCOJzM+RklqXGF5cUpSbmMjAAACBWJKo="; // null-ის ნაცვლად
const channel = "live_stream"; // დარწმუნდი რომ აქაც იგივე სახელი წერია რაც აგორაში ჩაწერე
    
    const ui = document.getElementById('videoCallUI');
    ui.style.display = 'flex';
    ui.style.width = '100%';
    ui.style.height = '100%';

    try {
        const uid = Math.floor(Math.random() * 10000);
        
        // Agora-ში შესვლა
        await client.join(appId, channelName, token, uid);
        
        // ხმის და ვიდეოს შექმნა
        localTracks.audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        localTracks.videoTrack = await AgoraRTC.createCameraVideoTrack();
        
        // ჩვენი თავის ჩვენება
        localTracks.videoTrack.play("local-video");
        
        // გასაჯაროება (სხვამ რომ დაგვინახოს)
        await client.publish([localTracks.audioTrack, localTracks.videoTrack]);

        // --- სხვისი გამოჩენის ლოგიკა (Event Listener) ---
        client.on("user-published", async (user, mediaType) => {
            await client.subscribe(user, mediaType);
            console.log("სხვა მომხმარებელი შემოვიდა:", user.uid);
            
            if (mediaType === "video") {
                document.getElementById('remote-label').innerText = "Connected";
                user.videoTrack.play("remote-video");
            }
            if (mediaType === "audio") {
                user.audioTrack.play();
            }
        });

        // როცა სხვა მომხმარებელი გადის
        client.on("user-left", (user) => {
            document.getElementById('remote-label').innerText = "Partner left";
            alert("ზარი დასრულდა");
            endVideoCall();
        });

    } catch (err) {
        console.error("ზარის შეცდომა:", err);
        alert("კამერასთან წვდომა უარყოფილია");
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
    document.getElementById('videoCallUI').style.display = 'none';

    // Firebase-დან წაშლა (ორივე მხრიდან)
    const targetUid = window.currentChatId;
    if (targetUid) db.ref(`video_calls/${targetUid}`).remove();
    db.ref(`video_calls/${auth.currentUser.uid}`).remove();
}

// 4. მიკროფონის და კამერის მართვა
function toggleMic() {
    micMuted = !micMuted;
    localTracks.audioTrack.setEnabled(!micMuted);
    document.getElementById('micBtn').style.background = micMuted ? '#ff4d4d' : '#333';
}

function toggleCam() {
    camMuted = !camMuted;
    localTracks.videoTrack.setEnabled(!camMuted);
    document.getElementById('camBtn').style.background = camMuted ? '#ff4d4d' : '#333';
}

// 5. ზარის შემცირება (Picture in Picture ეფექტი)
function minimizeVideoCall() {
    const ui = document.getElementById('videoCallUI');
    if (ui.style.width === '100%') {
        ui.style.width = '150px';
        ui.style.height = '220px';
        ui.style.top = '80px';
        ui.style.left = '20px';
        ui.style.borderRadius = '20px';
        ui.style.overflow = 'hidden';
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
