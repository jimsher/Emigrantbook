import AgoraRTC from "agora-rtc-sdk-ng";

let client = null;
let localAudioTrack = null; 
let localVideoTrack = null; 

// ჩასვი შენი მონაცემები აქ:
let appId = "INSERT_YOUR_APP_ID"; 
let channel = "emigrant_channel"; // არხის სახელი
let token = null; // თუ ტესტავ, დატოვე null
let uid = 0; 

function initializeClient() {
    // რეჟიმი შევცვალეთ "live"-ზე
    client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
    
    // აქ ვწყვეტთ: თუ შენ ხარ ადმინი, ხარ "host", თუ სხვა - "audience"
    // მომავალში აქ საიტის ლოგიკას მივაბამთ
    client.setClientRole("host"); 

    setupEventListeners();
}

function setupEventListeners() {
    client.on("user-published", async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        if (mediaType === "video") {
            displayRemoteVideo(user);
        }
        if (mediaType === "audio") {
            user.audioTrack.play();
        }
    });

    client.on("user-unpublished", (user) => {
        const container = document.getElementById(user.uid.toString());
        if (container) container.remove();
    });
}

async function joinChannel() {
    try {
        await client.join(appId, channel, token, uid);
        localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        localVideoTrack = await AgoraRTC.createCameraVideoTrack();
        
        // ვიდეოს ჩვენება ეკრანზე
        displayLocalVideo();
        
        // ეთერში გაშვება
        await client.publish([localAudioTrack, localVideoTrack]);
        console.log("ლაივი დაიწყო!");
    } catch (error) {
        console.error("შეცდომა:", error);
    }
}

function displayLocalVideo() {
    const container = document.createElement("div");
    container.id = "local-player";
    container.style.width = "100%";
    container.style.height = "400px";
    container.style.borderRadius = "10px";
    document.getElementById("video-display-area").append(container);
    localVideoTrack.play(container);
}

// ... დანარჩენი ფუნქციები (leaveChannel და ა.შ.) უცვლელია
